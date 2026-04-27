import { listSubmissions } from '@/services/app'
import { getRewardStatus } from '@/services/rewardService'
import type { ISubmissionDoc, IVideo } from '@/types'
import { VideoStatus } from '@/types'
import { formatWeiToMgro } from '@/utils/formatWeiToMgro'
import {
  submissionDocToPlanterGroup,
  type PlanterSubmissionGroup,
} from '@/utils/submissionPlanterGroup'
import { getVerifierRewardFromStatus } from '@/utils/verifierRewardSlice'

export type VerifierBadge = 'pending' | 'voted' | 'approved'

export type VerifierSubmissionRow = {
  group: PlanterSubmissionGroup
  badge: VerifierBadge
  claimMgro?: number
  claimSubmissionId?: string
}

function hasUserVotedOnVideo(
  video: IVideo | undefined,
  verifierWallet: string | undefined,
): boolean {
  if (!video || !verifierWallet) return false
  const votes = video.votes
  if (!Array.isArray(votes)) return false
  const wallet = verifierWallet.toLowerCase()
  return votes.some(v => v.voterWalletAddress?.toLowerCase() === wallet)
}

function hasUserVotedYesOnVideo(
  video: IVideo | undefined,
  verifierWallet: string | undefined,
): boolean {
  if (!video || !verifierWallet) return false
  const votes = video.votes
  if (!Array.isArray(votes)) return false
  const wallet = verifierWallet.toLowerCase()
  return votes.some(
    v => v.voterWalletAddress?.toLowerCase() === wallet && v.vote === 'yes',
  )
}

function submissionFullyApproved(group: PlanterSubmissionGroup): boolean {
  const representative = group.plantVideo || group.landVideo
  return representative?.status === VideoStatus.APPROVED
}

function verifierNeedsVote(
  group: PlanterSubmissionGroup,
  verifierWallet: string | undefined,
): boolean {
  const representative = group.plantVideo || group.landVideo
  return (
    !!representative &&
    representative.status === VideoStatus.PENDING &&
    !hasUserVotedOnVideo(representative, verifierWallet)
  )
}

/**
 * Pending review queue + verifier inbox (approved, voted yes, claim not completed).
 */
export async function loadVerifierSubmissionRows(
  verifierWallet: string,
  opts?: { page?: number; limit?: number },
): Promise<VerifierSubmissionRow[]> {
  const page = opts?.page ?? 1
  const limit = opts?.limit ?? 100

  const [modRes, inboxRes] = await Promise.all([
    listSubmissions({
      scope: 'moderation',
      status: 'pending',
      page,
      limit,
    }),
    listSubmissions({
      scope: 'verifier_inbox',
      page,
      limit,
    }),
  ])

  const byId = new Map<string, VerifierSubmissionRow>()

  const moderationSubs = (modRes.data.data.submissions || []) as (
    | ISubmissionDoc
    | (ISubmissionDoc & Record<string, unknown>)
  )[]
  for (const submission of moderationSubs) {
    const group = submissionDocToPlanterGroup(
      submission as ISubmissionDoc & Record<string, unknown>,
    )
    if (!group.landVideo || !group.plantVideo) continue
    if (!submissionFullyApproved(group)) {
      const badge: VerifierBadge = verifierNeedsVote(group, verifierWallet)
        ? 'pending'
        : 'voted'
      byId.set(group.submissionId, { group, badge })
    }
  }

  const inboxSubs = (inboxRes.data.data.submissions || []) as (
    | ISubmissionDoc
    | (ISubmissionDoc & Record<string, unknown>)
  )[]
  for (const submission of inboxSubs) {
    const group = submissionDocToPlanterGroup(
      submission as ISubmissionDoc & Record<string, unknown>,
    )
    if (!group.plantVideo) continue
    if (!hasUserVotedYesOnVideo(group.plantVideo, verifierWallet)) continue

    const sid = group.submissionId
    try {
      const rewardRes = await getRewardStatus(sid)
      const verifierSlice = getVerifierRewardFromStatus(rewardRes.data.data)
      if (!verifierSlice) continue
      if (verifierSlice.displayState === 'COMPLETED') continue

      const pendingWei = verifierSlice.pendingClaimAmountWei || '0'
      const claimMgro =
        formatWeiToMgro(pendingWei) ||
        formatWeiToMgro(verifierSlice.totalRewardWei)

      byId.set(sid, {
        group,
        badge: 'approved',
        claimMgro,
        claimSubmissionId: sid,
      })
    } catch {
      continue
    }
  }

  return [...byId.values()].sort(
    (a, b) =>
      new Date(b.group.createdAt).getTime() -
      new Date(a.group.createdAt).getTime(),
  )
}
