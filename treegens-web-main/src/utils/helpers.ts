import { getPublicApiUrl } from '@/config/publicApiUrl'
import { VideoType } from '@/services/videoService'
import { ISubmissionGroup, IUserProfile, IVideo, VideoStatus } from '@/types'

export const isDevelopment = process.env.NEXT_PUBLIC_NODE_ENV === 'development'

const baseURL = getPublicApiUrl()
const VIDEOS_CACHE_KEY = 'treegens_videos'
const USER_CACHE_KEY = 'treegens_cached_user'

export const truncateAddress = (address?: string) => {
  if (!address) return ''
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}

export const getVideoTypeText = (type: VideoType) => {
  switch (type) {
    case VideoType.LAND:
      return 'Land'
    case VideoType.PLANT:
      return 'Plant'
    default:
      return 'Video'
  }
}

export const getVideoTypeColor = (type: VideoType) => {
  switch (type) {
    case VideoType.LAND:
      return 'text-blue-600 bg-blue-50'
    case VideoType.PLANT:
      return 'text-green-600 bg-green-50'
    default:
      return 'text-gray-600 bg-gray-50'
  }
}

export const getVideoStatusColor = (status: VideoStatus) => {
  switch (status) {
    case VideoStatus.APPROVED:
      return 'text-green-500 bg-green-50'
    case VideoStatus.REJECTED:
      return 'text-red-500 bg-red-50'
    case VideoStatus.PENDING:
      return 'text-yellow-500 bg-yellow-50'
    case VideoStatus.QUEUED:
      return 'text-blue-500 bg-blue-50'
    default:
      return 'text-gray-500 bg-gray-50'
  }
}

export const getVideoStatusText = (status: VideoStatus) => {
  switch (status) {
    case VideoStatus.APPROVED:
      return 'Approved'
    case VideoStatus.REJECTED:
      return 'Rejected'
    case VideoStatus.PENDING:
      return 'Pending Review'
    case VideoStatus.QUEUED:
      return 'Queued (Offline)'
    default:
      return 'Unknown'
  }
}

export const isBackendHealthy = async (): Promise<boolean> => {
  try {
    const response = await fetch(`${baseURL}/health`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      signal: AbortSignal.timeout(5000),
    })
    if (response.ok) {
      const healthData = await response.json()
      console.log('[isOnline] Health check passed:', healthData.status)
      return true
    } else {
      console.log('[isOnline] Health check failed:', response.status)
      return false
    }
  } catch (e) {
    console.log('[isOnline] Health check error:', e)
    return false
  }
}

export const cacheVideos = (videos: IVideo[]) => {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(VIDEOS_CACHE_KEY, JSON.stringify(videos))
  } catch (e) {
    console.warn('Failed to cache submissions', e)
  }
}

export const readCachedVideos = (): IVideo[] | null => {
  if (typeof window === 'undefined') return null
  try {
    const cached = localStorage.getItem(VIDEOS_CACHE_KEY)
    return cached ? JSON.parse(cached) : null
  } catch {
    return null
  }
}

export const removeCachedVideos = () => {
  if (typeof window === 'undefined') return
  try {
    localStorage.removeItem(VIDEOS_CACHE_KEY)
  } catch (e) {
    console.warn('Failed to remove cached videos', e)
  }
}

export const setNeverShowPWA = () => {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem('pwa.neverShowInstall', '1')
  } catch (e) {
    console.warn('Failed to set never show PWA', e)
  }
}

export const getNeverShowPWA = () => {
  if (typeof window === 'undefined') return false
  try {
    return localStorage.getItem('pwa.neverShowInstall') === '1'
  } catch {
    return false
  }
}

export const removeNeverShowPWA = () => {
  if (typeof window === 'undefined') return
  try {
    localStorage.removeItem('pwa.neverShowInstall')
  } catch (e) {
    console.warn('Failed to remove never show PWA', e)
  }
}

export const cacheUser = (user: IUserProfile) => {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(USER_CACHE_KEY, JSON.stringify(user))
  } catch (e) {
    console.warn('Failed to cache user', e)
  }
}

export const readCachedUser = (): IUserProfile | null => {
  if (typeof window === 'undefined') return null
  try {
    const cached = localStorage.getItem(USER_CACHE_KEY)
    return cached ? JSON.parse(cached) : null
  } catch {
    return null
  }
}

export const removeCachedUser = () => {
  if (typeof window === 'undefined') return
  try {
    localStorage.removeItem(USER_CACHE_KEY)
  } catch (e) {
    console.warn('Failed to remove cached user', e)
  }
}

export const wait = (ms: number) =>
  new Promise(resolve => setTimeout(resolve, ms))

export const groupVideosBySubmissionId = (
  videos: IVideo[],
): ISubmissionGroup[] => {
  const groups: { [key: string]: ISubmissionGroup } = {}

  videos.forEach(video => {
    const submissionId = video.submissionId || '1' // Default to '1' if no submissionId

    if (!groups[submissionId]) {
      groups[submissionId] = {
        submissionId,
        createdAt: video.createdAt,
        location: video.gpsCoordinates
          ? `${video.gpsCoordinates.latitude}, ${video.gpsCoordinates.longitude}`
          : '',
      }
    }

    if (video.type === VideoType.LAND) {
      groups[submissionId].landVideo = video
    } else if (video.type === VideoType.PLANT) {
      groups[submissionId].plantVideo = video
      groups[submissionId].treesPlanted = video.treesPlanted
      groups[submissionId].treetype = video.treetype
    }

    // Keep the earliest createdAt for the group
    if (new Date(video.createdAt) < new Date(groups[submissionId].createdAt)) {
      groups[submissionId].createdAt = video.createdAt
    }
  })

  return Object.values(groups).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  )
}
