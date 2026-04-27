import type { RewardStatusProjection } from '@/types/reward'

export function rewardScheduleFullyClaimed(
  rs: RewardStatusProjection,
): boolean {
  if (!rs.scheduleCompleted) return false
  if (rs.verifier != null && !rs.verifier.scheduleCompleted) return false
  return true
}
