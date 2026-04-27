import type { IVideo } from '@/types'
import { ipfsGatewayUrl } from '@/utils/ipfsGatewayUrl'

export function getSubmissionDetailVideoUrl(video?: IVideo): string | null {
  if (!video) return null
  const cid = video.videoCID || video.ipfsHash
  return ipfsGatewayUrl(cid)
}

export function formatTimeLeft(ms: number): string {
  if (ms <= 0) return '00:00:00'
  const totalSeconds = Math.floor(ms / 1000)
  const h = String(Math.floor(totalSeconds / 3600)).padStart(2, '0')
  const m = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, '0')
  const s = String(totalSeconds % 60).padStart(2, '0')
  return `${h}:${m}:${s}`
}
