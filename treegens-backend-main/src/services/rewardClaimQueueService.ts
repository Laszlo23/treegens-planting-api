import { randomUUID } from 'crypto'
import mongoose from 'mongoose'
import RewardClaimJob from '../models/RewardClaimJob'
import {
  RewardClaimType,
  getRewardClaimQueue,
} from '../queues/rewardClaimQueue'

export function buildRewardClaimIdempotencyKey(
  submissionId: string,
  walletAddress: string,
  claimType: RewardClaimType,
): string {
  return `${submissionId}:${walletAddress.toLowerCase()}:${claimType}`
}

export function isClaimJobFinalStatus(status: string): boolean {
  return status === 'completed' || status === 'failed'
}

class RewardClaimQueueService {
  async enqueueOrReuseClaimJob(input: {
    submissionId: string
    walletAddress: string
    claimType: RewardClaimType
  }) {
    const walletAddress = input.walletAddress.toLowerCase()
    const idempotencyKey = buildRewardClaimIdempotencyKey(
      input.submissionId,
      walletAddress,
      input.claimType,
    )

    const payloadBase = {
      submissionId: input.submissionId,
      walletAddress,
      claimType: input.claimType,
    }

    let existing = await RewardClaimJob.findOne({ idempotencyKey })
    if (existing && !isClaimJobFinalStatus(existing.status)) {
      return { job: existing, created: false }
    }

    // Prior job finished: reuse the same row (same idempotency key) with a new Bull jobId.
    if (existing && isClaimJobFinalStatus(existing.status)) {
      const newJobId = randomUUID()
      const updated = await RewardClaimJob.findOneAndUpdate(
        {
          _id: existing._id,
          status: { $in: ['completed', 'failed'] },
        },
        {
          $set: {
            jobId: newJobId,
            status: 'queued',
            attempts: 0,
            queuedAt: new Date(),
            txHashes: [],
          },
          $unset: {
            startedAt: 1,
            completedAt: 1,
            lastError: 1,
            result: 1,
          },
        },
        { new: true },
      )
      if (updated) {
        const payload = { jobId: newJobId, ...payloadBase }
        await getRewardClaimQueue().add('claim', payload, { jobId: newJobId })
        return { job: updated, created: true }
      }
      existing = await RewardClaimJob.findOne({ idempotencyKey })
      if (existing && !isClaimJobFinalStatus(existing.status)) {
        return { job: existing, created: false }
      }
    }

    const jobId = randomUUID()
    const payload = { jobId, ...payloadBase }

    try {
      const doc = await RewardClaimJob.create({
        jobId,
        idempotencyKey,
        submissionId: new mongoose.Types.ObjectId(input.submissionId),
        walletAddress,
        claimType: input.claimType,
        status: 'queued',
        attempts: 0,
        queuedAt: new Date(),
      })
      try {
        await getRewardClaimQueue().add('claim', payload, { jobId })
      } catch (queueErr) {
        await RewardClaimJob.deleteOne({ _id: doc._id })
        throw queueErr
      }
      return { job: doc, created: true }
    } catch (err: any) {
      if (err?.code === 11000) {
        const dup = await RewardClaimJob.findOne({ idempotencyKey })
        if (dup && !isClaimJobFinalStatus(dup.status)) {
          return { job: dup, created: false }
        }
      }
      throw err
    }
  }

  async getClaimJob(jobId: string) {
    return RewardClaimJob.findOne({ jobId })
  }

  /** True if this wallet has at least one claim job for the submission that is not completed. */
  async hasActiveClaimJobForSubmissionWallet(
    submissionId: string,
    walletAddress: string,
  ): Promise<boolean> {
    if (!mongoose.Types.ObjectId.isValid(submissionId)) {
      return false
    }
    const w = walletAddress.toLowerCase()
    const sid = new mongoose.Types.ObjectId(submissionId)
    const n = await RewardClaimJob.countDocuments({
      submissionId: sid,
      walletAddress: w,
      status: { $ne: 'completed' },
    })
    return n > 0
  }
}

export default RewardClaimQueueService
