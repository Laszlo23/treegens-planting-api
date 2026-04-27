import type { ClaimEnqueueResponse, RewardStatusResponse } from '@/types/reward'
import { axiosInstance } from './axiosInstance'

export function getRewardStatus(submissionId: string) {
  return axiosInstance.get<RewardStatusResponse>(
    `/api/rewards/status/${encodeURIComponent(submissionId)}`,
  )
}

export function claimReward(submissionId: string) {
  return axiosInstance.post<ClaimEnqueueResponse>('/api/rewards/claim', {
    submissionId,
  })
}
