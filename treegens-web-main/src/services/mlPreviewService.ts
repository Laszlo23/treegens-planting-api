import { axiosInstance } from '@/services/axiosInstance'

export type MlFramePreviewData = {
  modelVersion: string
  totalTreeDetections: number
  uniqueTreeEstimate: number
  stub: boolean
  aggregatePass: boolean
  metadata: {
    geoOk: boolean
    timeOk: boolean
    geoMessage?: string | null
    timeMessage?: string | null
  }
}

/**
 * Single JPEG frame to Node API → FastAPI /internal/verify-frame (advisory count during recording).
 */
export async function postMlFramePreview(
  imageBlob: Blob,
  latitude: number,
  longitude: number,
): Promise<MlFramePreviewData> {
  const formData = new FormData()
  formData.append('image', imageBlob, 'frame.jpg')
  formData.append('latitude', String(latitude))
  formData.append('longitude', String(longitude))
  const response = await axiosInstance.post<{
    message: string
    data: MlFramePreviewData
  }>('/api/submissions/ml-preview', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  if (!response.data?.data) {
    throw new Error('Unexpected ML preview response')
  }
  return response.data.data
}
