import mongoose from 'mongoose'
import User from '../models/User'
import VerifierWarning from '../models/VerifierWarning'
import SlashQueueService from './slashQueueService'

const slashQueueService = new SlashQueueService()

export async function applyPenaltyForMinorityVote(input: {
  submissionId: string
  walletAddress: string
  vote: 'yes' | 'no'
  majorityVote: 'yes' | 'no'
  healthCheckId?: mongoose.Types.ObjectId
}) {
  const walletAddress = input.walletAddress.toLowerCase()
  const user = await User.findOne({ walletAddress }).select(
    'verifierWarningCount',
  )
  if (!user) {
    return { walletAddress, action: 'skipped' as const }
  }

  const warningCount = Number(user.verifierWarningCount || 0)
  if (warningCount >= 2) {
    const { created } = await slashQueueService.enqueueOrReuseSlashJob({
      submissionId: input.submissionId,
      walletAddress,
    })
    return {
      walletAddress,
      action: created ? ('slash_queued' as const) : ('slash_reused' as const),
    }
  }

  const doc: Record<string, unknown> = {
    walletAddress,
    submissionId: new mongoose.Types.ObjectId(input.submissionId),
    vote: input.vote,
    majorityVote: input.majorityVote,
  }
  if (input.healthCheckId) {
    doc.healthCheckId = input.healthCheckId
  }

  try {
    await VerifierWarning.create(doc)
  } catch (error: any) {
    if (error?.code === 11000) {
      return { walletAddress, action: 'warning_exists' as const }
    }
    throw error
  }

  await User.updateOne({ walletAddress }, { $inc: { verifierWarningCount: 1 } })
  return { walletAddress, action: 'warning_added' as const }
}

type VoteLike = { voterWalletAddress: string; vote: 'yes' | 'no' }

export async function applyMinorityPenaltiesForVotes(
  submissionId: string,
  votes: VoteLike[],
  majorityVote: 'yes' | 'no',
  healthCheckId?: mongoose.Types.ObjectId,
) {
  const losingVote: 'yes' | 'no' = majorityVote === 'yes' ? 'no' : 'yes'
  const minorityVotes = votes.filter(v => v.vote === losingVote)
  const processed = new Set<string>()
  const results: Array<{ walletAddress: string; action: string }> = []

  for (const vote of minorityVotes) {
    const walletAddress = vote.voterWalletAddress.toLowerCase()
    if (processed.has(walletAddress)) continue
    processed.add(walletAddress)
    const result = await applyPenaltyForMinorityVote({
      submissionId,
      walletAddress,
      vote: vote.vote,
      majorityVote,
      healthCheckId,
    })
    results.push(result)
  }

  return results
}
