import type { IHealthCheckDoc } from '@/types'
import { axiosInstance } from './axiosInstance'

export function listHealthChecksForSubmission(submissionId: string) {
  return axiosInstance.get<{
    message: string
    data: { healthChecks: IHealthCheckDoc[] }
  }>(`/api/submissions/${encodeURIComponent(submissionId)}/health-checks`)
}

export function getHealthCheck(submissionId: string, healthCheckId: string) {
  return axiosInstance.get<{
    message: string
    data: { healthCheck: IHealthCheckDoc }
  }>(
    `/api/submissions/${encodeURIComponent(submissionId)}/health-checks/${encodeURIComponent(healthCheckId)}`,
  )
}

export function listHealthCheckModeration(page = 1, limit = 20) {
  return axiosInstance.get<{
    message: string
    data: {
      healthChecks: IHealthCheckDoc[]
      pagination: {
        page: number
        limit: number
        total: number
        pages: number
      }
    }
  }>(`/api/submissions/health-checks/moderation?page=${page}&limit=${limit}`)
}

export function voteOnHealthCheck(
  submissionId: string,
  healthCheckId: string,
  vote: 'yes' | 'no',
  reasons?: string[],
) {
  return axiosInstance.post(
    `/api/submissions/${encodeURIComponent(submissionId)}/health-checks/${encodeURIComponent(healthCheckId)}/vote`,
    { vote, reasons },
  )
}

export function uploadHealthCheckVideo(
  submissionId: string,
  payload: {
    videoFile: File
    latitude: number
    longitude: number
    treesAlive: number
    reverseGeocode?: string
  },
  opts?: { onUploadProgress?: (percent: number) => void },
) {
  const formData = new FormData()
  formData.append('video', payload.videoFile)
  formData.append('latitude', String(payload.latitude))
  formData.append('longitude', String(payload.longitude))
  formData.append('treesAlive', String(payload.treesAlive))
  if (payload.reverseGeocode?.trim()) {
    formData.append('reverseGeocode', payload.reverseGeocode.trim())
  }

  return axiosInstance.post(
    `/api/submissions/${encodeURIComponent(submissionId)}/health-checks`,
    formData,
    {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: evt => {
        if (!opts?.onUploadProgress) return
        const total = evt.total ?? evt.loaded
        const percent = total ? Math.round((evt.loaded * 100) / total) : 0
        opts.onUploadProgress(percent)
      },
    },
  )
}
