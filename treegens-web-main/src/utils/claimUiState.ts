import type { RewardStatusProjection } from '@/types/reward'

export type ClaimFooterVariant = 'claim' | 'queue' | 'wait'

export function planterClaimFooterState(
  rewardStatus: RewardStatusProjection | null,
  canClaimRaw: boolean,
): { variant: ClaimFooterVariant } {
  const active = Boolean(rewardStatus?.activeClaimJob)
  if (active) {
    return { variant: 'queue' }
  }
  if (canClaimRaw) {
    return { variant: 'claim' }
  }
  return { variant: 'wait' }
}

/**
 * Verifier review screen: same rules as planter using verifier claim eligibility.
 */
export function verifierClaimFooterState(
  rewardStatus: RewardStatusProjection | null,
  verifierCanClaim: boolean,
): { variant: ClaimFooterVariant } {
  const active = Boolean(rewardStatus?.activeClaimJob)
  if (active) {
    return { variant: 'queue' }
  }
  if (verifierCanClaim) {
    return { variant: 'claim' }
  }
  return { variant: 'wait' }
}
