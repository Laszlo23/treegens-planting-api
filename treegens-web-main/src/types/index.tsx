import { VideoType } from '@/services/videoService'

export interface IPlantCard {
  image: string
  date: Date
  title: string
  status: string
}

export interface ISubmission {
  id: string
  user: IUser
  status: string
  location: string
  date: Date
  treesMounted: number
}

export interface IUser {
  id: number
  name: string
  address: string
}

export interface ILeaderboardItem {
  id: number
  name: string
  address: string
  treesMounted: number
}

// API response types for leaderboard
export interface ILeaderboardUser {
  _id: string
  walletAddress: string
  name?: string
  treesPlanted: number
  videoCount: number
  createdAt: string
  rank: number
}

export interface ILeaderboardResponse {
  message: string
  data: {
    users: ILeaderboardUser[]
    pagination: {
      page: number
      limit: number
      total: number
      pages: number
    }
  }
}

export interface IUserProfile {
  _id: string
  walletAddress: string
  name?: string
  ensName?: string
  phone?: number
  experience?: string
  /** MGRO claimed (wei), as returned by the API */
  tokensClaimed?: string | number
  treesPlanted?: number
  // Verifier related fields
  isVerifier?: boolean
  verifierSince?: string
  createdAt: string
  updatedAt: string
}

export enum VideoStatus {
  REJECTED = 'rejected',
  PENDING = 'pending',
  APPROVED = 'approved',
  QUEUED = 'queued', // FE only
}

export interface IGpsCoordinates {
  latitude: number
  longitude: number
}

/** ML check stored per land/plant clip (from FastAPI /internal/verify-video via Node). */
export type MlVerificationSummary = {
  aggregatePass?: boolean
  modelVersion?: string
  verifiedAt?: string
  error?: string
  /** From model.confidence_summary (deduped count). */
  uniqueTreeEstimate?: number
  /** Raw detection count before dedupe. */
  totalTreeDetections?: number
  /** Frames/images evaluated from the clip. */
  imagesEvaluated?: number
}

export interface Vote {
  voterWalletAddress: string
  vote: 'yes' | 'no'
  reasons: string[]
  createdAt: string
}

export interface IVideo {
  gpsCoordinates: IGpsCoordinates
  _id: string
  userWalletAddress: string
  originalFilename: string
  ipfsHash: string
  videoCID: string
  type: VideoType
  status: VideoStatus
  uploadTimestamp: string
  createdAt: string
  updatedAt: string
  submissionId?: string
  treesPlanted?: number
  treetype?: string
  votes?: Vote[]
  reverseGeocode?: string
  mlVerification?: MlVerificationSummary
}

export interface IModerationVideo extends IVideo {
  yesCount: number
  noCount: number
  totalVotes: number
  votes: Vote[]
}

export interface IModerationListResponse {
  message: string
  data: {
    videos: IModerationVideo[]
    pagination: { page: number; limit: number; total: number; pages: number }
  }
}

export interface IVerifierRequestResponse {
  message: string
  data: {
    eligible: boolean
    balanceWei: string
    balanceTokens: number
  }
}

export interface IVerifierCheckResponse {
  message: string
  data: {
    isVerifier: boolean
  }
}

export interface IVideoVoteResponse {
  message: string
  data: {
    videoId: string
    status: string
    yesCount: number
    totalVotes: number
    votes: Vote[]
  }
}

export interface ICreateUserRequest {
  walletAddress: string
  name?: string
  ensName?: string
  phone?: number
  experience?: string
}

export interface ICreateUserResponse {
  message: string
  data: {
    user: IUserProfile
    action: 'created' | 'updated'
  }
}

export interface IGetUserResponse {
  message: string
  data: IUserProfile
}

export interface IVerifierWarningBanner {
  shouldShow: boolean
  warningCount: number
  messageVariant: 'first' | 'again'
  submissionId?: string
  submissionOwnerWalletAddress?: string
  healthCheckId?: string
  warnedAt?: string
}

export interface IVerifierWarningBannerResponse {
  message: string
  data: IVerifierWarningBanner
}

export interface IUserVideosResponse {
  data: {
    videos: IVideo[]
    totalPages: number
    currentPage: number
    totalVideos: number
    hasLandVideo: boolean
    hasPlantVideo: boolean
  }
  message: string
}

// Submission related types
export interface ISubmissionGroup {
  submissionId: string
  landVideo?: IVideo
  plantVideo?: IVideo
  location?: string
  createdAt: string
  treesPlanted?: number
  treetype?: string
}

export type SubmissionStatus =
  | 'draft'
  | 'awaiting_plant'
  | 'pending_review'
  | 'approved'
  | 'rejected'

export interface ISubmissionDoc {
  _id: string
  userWalletAddress: string
  status: SubmissionStatus
  reviewedAt?: string
  treesPlanted?: number
  planterRewardClaimedWei?: string
  /** Backend may expose tree type on submission */
  treeType?: string
  votes?: Vote[]
  createdAt: string
  updatedAt: string
}

export interface IMySubmissionsResponse {
  message: string
  data: {
    submissions: ISubmissionDoc[]
    totalPages: number
    currentPage: number
    totalSubmissions: number
    hasLandClip?: boolean
    hasPlantClip?: boolean
  }
}

export type HealthCheckStatus = 'pending_review' | 'approved' | 'rejected'

export interface IHealthCheckDoc {
  _id: string
  submissionId: string
  checkpointIndex: number
  treesAlive: number
  distanceMeters: number
  videoCID?: string
  publicUrl?: string
  status: HealthCheckStatus
  votes?: Array<{
    voterWalletAddress: string
    vote: 'yes' | 'no'
    reasons?: string[]
  }>
  uploadedAt?: string
  createdAt?: string
  updatedAt?: string
}
