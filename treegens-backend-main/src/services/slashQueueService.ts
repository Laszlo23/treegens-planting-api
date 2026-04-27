import { randomUUID } from 'crypto'
import mongoose from 'mongoose'
import SlashJob from '../models/SlashJob'
import { getSlashQueue } from '../queues/slashQueue'

export function buildSlashIdempotencyKey(
  submissionId: string,
  walletAddress: string,
): string {
  return `${submissionId}:${walletAddress.toLowerCase()}:slash`
}

export function isSlashJobFinalStatus(status: string): boolean {
  return status === 'completed' || status === 'failed'
}

class SlashQueueService {
  async enqueueOrReuseSlashJob(input: {
    submissionId: string
    walletAddress: string
    reason?: string
  }) {
    const walletAddress = input.walletAddress.toLowerCase()
    const reason = input.reason || 'minority_vote'
    const activeForWallet = await SlashJob.findOne({
      walletAddress,
      status: { $nin: ['completed', 'failed'] },
    })
    if (activeForWallet) {
      return { job: activeForWallet, created: false }
    }
    const idempotencyKey = buildSlashIdempotencyKey(
      input.submissionId,
      walletAddress,
    )
    const payloadBase = {
      submissionId: input.submissionId,
      walletAddress,
      reason,
    }

    let existing = await SlashJob.findOne({ idempotencyKey })
    if (existing && !isSlashJobFinalStatus(existing.status)) {
      return { job: existing, created: false }
    }

    if (existing && isSlashJobFinalStatus(existing.status)) {
      const newJobId = randomUUID()
      const updated = await SlashJob.findOneAndUpdate(
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
            reason,
          },
          $unset: {
            startedAt: 1,
            completedAt: 1,
            lastError: 1,
            txHash: 1,
          },
        },
        { new: true },
      )
      if (updated) {
        const payload = { jobId: newJobId, ...payloadBase }
        await getSlashQueue().add('slash', payload, { jobId: newJobId })
        return { job: updated, created: true }
      }
      existing = await SlashJob.findOne({ idempotencyKey })
      if (existing && !isSlashJobFinalStatus(existing.status)) {
        return { job: existing, created: false }
      }
    }

    const jobId = randomUUID()
    const payload = { jobId, ...payloadBase }

    try {
      const doc = await SlashJob.create({
        jobId,
        idempotencyKey,
        submissionId: new mongoose.Types.ObjectId(input.submissionId),
        walletAddress,
        reason,
        status: 'queued',
        attempts: 0,
        queuedAt: new Date(),
      })
      try {
        await getSlashQueue().add('slash', payload, { jobId })
      } catch (queueErr) {
        await SlashJob.deleteOne({ _id: doc._id })
        throw queueErr
      }
      return { job: doc, created: true }
    } catch (err: any) {
      if (err?.code === 11000) {
        const dup = await SlashJob.findOne({ idempotencyKey })
        if (dup && !isSlashJobFinalStatus(dup.status)) {
          return { job: dup, created: false }
        }
      }
      throw err
    }
  }
}

export default SlashQueueService
