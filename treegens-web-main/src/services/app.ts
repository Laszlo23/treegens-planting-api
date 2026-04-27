import {
  IGetUserResponse,
  ILeaderboardResponse,
  IModerationListResponse,
  IMySubmissionsResponse,
  ISubmissionDoc,
  IUserVideosResponse,
  IVerifierWarningBannerResponse,
  IVerifierCheckResponse,
  IVerifierRequestResponse,
  IVideo,
  IVideoVoteResponse,
} from '../types'
import { axiosInstance } from './axiosInstance'
import {
  submissionDocToModerationVideos,
  submissionDocToVideos,
} from './submissionApiMappers'

export function getCurrentUser(): Promise<{ data: IGetUserResponse }> {
  return axiosInstance.get('/api/users/me')
}

export function getVerifierWarningBanner(): Promise<{
  data: IVerifierWarningBannerResponse
}> {
  return axiosInstance.get('/api/users/me/verifier-warning-banner')
}

/** Profile updates (backend: PATCH /api/users/me). */
export function patchCurrentUserProfile(body: {
  name?: string
  phone?: string
  experience?: string
}) {
  return axiosInstance.patch<IGetUserResponse>('/api/users/me', body)
}

/** Maps submission documents to legacy `IVideo[]` for existing UI. */
export async function getUserVideos(): Promise<{ data: IUserVideosResponse }> {
  const res = await axiosInstance.get<IMySubmissionsResponse>(
    '/api/submissions/my-submissions',
  )
  const envelope = res.data
  const inner = envelope.data
  const subs = inner.submissions || []
  const videos: IVideo[] = subs.flatMap(s => submissionDocToVideos(s as never))
  videos.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  )
  return {
    data: {
      message: envelope.message,
      data: {
        videos,
        totalPages: inner.totalPages,
        currentPage: inner.currentPage,
        totalVideos: videos.length,
        hasLandVideo: Boolean(inner.hasLandClip),
        hasPlantVideo: Boolean(inner.hasPlantClip),
      },
    },
  }
}

export async function getVideosByUserAndSubmission(
  _userWalletAddress: string,
  submissionId: string,
): Promise<{ data: { message: string; data: { videos: IVideo[] } } }> {
  const res = await axiosInstance.get(
    `/api/submissions/${encodeURIComponent(submissionId)}`,
  )
  const doc = res.data.data as Record<string, unknown>
  const videos = submissionDocToVideos(doc as never)
  return {
    data: {
      message: res.data.message,
      data: { videos },
    },
  }
}

// Leaderboard API endpoints (backend returns a plain array in `data`)
export async function getLeaderboard(
  page: number = 1,
  limit: number = 10,
  userWalletAddress?: string,
): Promise<{ data: ILeaderboardResponse }> {
  const params = new URLSearchParams()
  params.set('page', String(page))
  params.set('limit', String(limit))
  if (userWalletAddress) params.set('userWalletAddress', userWalletAddress)
  const res = await axiosInstance.get<{
    message: string
    data: Array<{
      walletAddress: string
      name?: string
      treesPlanted: number
      createdAt: string
    }>
  }>(`/api/users/leaderboard/trees-planted?${params.toString()}`)
  const rows = res.data.data || []
  const offset = (page - 1) * limit
  const users = rows.map((u, i) => ({
    _id: u.walletAddress,
    walletAddress: u.walletAddress,
    name: u.name,
    treesPlanted: u.treesPlanted,
    videoCount: 0,
    createdAt: u.createdAt,
    rank: offset + i + 1,
  }))
  const hasMore = rows.length >= limit
  return {
    data: {
      message: res.data.message,
      data: {
        users,
        pagination: {
          page,
          limit,
          total: hasMore ? page * limit + 1 : offset + rows.length,
          pages: hasMore ? page + 1 : page,
        },
      },
    },
  }
}

// Moderation APIs (verifiers only) — uses submission moderation scope
export async function listModerationVideos(params?: {
  minYes?: number
  minNo?: number
  maxVotes?: number
  status?: 'pending' | 'approved' | 'rejected'
  page?: number
  limit?: number
}): Promise<{ data: IModerationListResponse }> {
  const query = new URLSearchParams()
  query.set('scope', 'moderation')
  if (params?.minYes !== undefined) query.set('minYes', String(params.minYes))
  if (params?.minNo !== undefined) query.set('minNo', String(params.minNo))
  if (params?.maxVotes !== undefined)
    query.set('maxVotes', String(params.maxVotes))
  if (params?.status) query.set('status', params.status)
  if (params?.page !== undefined) query.set('page', String(params.page))
  if (params?.limit !== undefined) query.set('limit', String(params.limit))
  const qs = query.toString()
  const res = await axiosInstance.get<{
    message: string
    data: {
      submissions: Record<string, unknown>[]
      pagination: {
        page: number
        limit: number
        total: number
        pages: number
      }
    }
  }>(`/api/submissions?${qs}`)
  const { submissions = [], pagination } = res.data.data
  const videos = submissions.flatMap(s =>
    submissionDocToModerationVideos(s as never),
  )
  return {
    data: {
      message: res.data.message,
      data: {
        videos,
        pagination,
      },
    },
  }
}

export function voteOnSubmission(
  submissionId: string,
  vote: 'yes' | 'no',
  reasons?: string[],
) {
  const payload: { vote: 'yes' | 'no'; reasons?: string[] } = { vote }
  if (Array.isArray(reasons) && reasons.length > 0) {
    payload.reasons = reasons
  }
  return axiosInstance.post<IVideoVoteResponse>(
    `/api/submissions/${encodeURIComponent(submissionId)}/vote`,
    payload,
  )
}

/** @deprecated Use voteOnSubmission — votes apply to the whole submission */
export function voteOnVideo(
  submissionId: string,
  vote: 'yes' | 'no',
  reasons?: string[],
) {
  return voteOnSubmission(submissionId, vote, reasons)
}

// Verifier request
export function requestVerifierStatus(walletAddress: string) {
  return axiosInstance.post<IVerifierRequestResponse>(
    '/api/users/verifier/request',
    { walletAddress },
  )
}

export function checkVerifierStatus(walletAddress: string) {
  return axiosInstance.post<IVerifierCheckResponse>(
    '/api/users/verifier/check',
    { walletAddress },
  )
}

export function getMySubmissions(params?: { page?: number; limit?: number }) {
  const query = new URLSearchParams()
  if (params?.page !== undefined) query.set('page', String(params.page))
  if (params?.limit !== undefined) query.set('limit', String(params.limit))
  const qs = query.toString()
  return axiosInstance.get<IMySubmissionsResponse>(
    `/api/submissions/my-submissions${qs ? `?${qs}` : ''}`,
  )
}

export function getSubmissionById(submissionId: string) {
  return axiosInstance.get<{ message: string; data: ISubmissionDoc }>(
    `/api/submissions/${encodeURIComponent(submissionId)}`,
  )
}

export function listSubmissions(params?: {
  scope?: 'moderation' | 'verifier_inbox'
  status?: string
  page?: number
  limit?: number
}) {
  const query = new URLSearchParams()
  if (params?.scope) query.set('scope', params.scope)
  if (params?.status) query.set('status', params.status)
  if (params?.page !== undefined) query.set('page', String(params.page))
  if (params?.limit !== undefined) query.set('limit', String(params.limit))
  const qs = query.toString()
  return axiosInstance.get<{
    message: string
    data: {
      submissions: ISubmissionDoc[]
      pagination?: { total: number; page: number; pages: number; limit: number }
    }
  }>(`/api/submissions${qs ? `?${qs}` : ''}`)
}
