import type { RewardStatusProjection } from '@/types/reward'

/** Verifier MGRO row: standalone verifier role or nested `verifier` on planter response. */
export function getVerifierRewardFromStatus(
  reward: RewardStatusProjection | null,
): {
  totalRewardWei: string
  claimedAmountWei: string
  pendingClaimAmountWei: string
  canClaim: boolean
  displayState: RewardStatusProjection['displayState']
  scheduleCompleted: boolean
} | null {
  if (!reward) return null
  if (reward.role === 'verifier') {
    return {
      totalRewardWei: reward.totalRewardWei,
      claimedAmountWei: reward.claimedAmountWei,
      pendingClaimAmountWei: reward.pendingClaimAmountWei,
      canClaim: reward.canClaim,
      displayState: reward.displayState,
      scheduleCompleted: reward.scheduleCompleted,
    }
  }
  const verifierSlice = reward.verifier
  if (!verifierSlice) return null
  return {
    totalRewardWei: verifierSlice.totalRewardWei,
    claimedAmountWei: verifierSlice.claimedAmountWei,
    pendingClaimAmountWei: verifierSlice.pendingClaimAmountWei,
    canClaim: verifierSlice.canClaim,
    displayState: verifierSlice.displayState,
    scheduleCompleted: verifierSlice.scheduleCompleted,
  }
}
