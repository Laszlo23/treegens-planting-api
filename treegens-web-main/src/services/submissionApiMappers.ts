import { VideoType } from '@/services/videoService'
import type { IModerationVideo, IVideo, MlVerificationSummary, Vote } from '@/types'
import { VideoStatus } from '@/types'

const OID_RE = /^[a-fA-F0-9]{24}$/

export function isValidSubmissionObjectId(id: string | undefined): boolean {
  return Boolean(id && OID_RE.test(id))
}

function submissionStatusToVideoStatus(status: string): VideoStatus {
  switch (status) {
    case 'pending_review':
      return VideoStatus.PENDING
    case 'approved':
      return VideoStatus.APPROVED
    case 'rejected':
      return VideoStatus.REJECTED
    default:
      return VideoStatus.PENDING
  }
}

type ClipLike = {
  uploaded?: boolean
  originalFilename?: string
  videoCID?: string
  gpsCoordinates?: { latitude?: number; longitude?: number }
  reverseGeocode?: string
  uploadedAt?: string
  mlVerification?: MlVerificationSummary & { verifiedAt?: string | Date }
}

type SubmissionLike = {
  _id: string
  userWalletAddress?: string
  status?: string
  createdAt?: string
  updatedAt?: string
  treesPlanted?: number
  treeType?: string
  votes?: Vote[]
  land?: ClipLike
  plant?: ClipLike
  yesCount?: number
  noCount?: number
  totalVotes?: number
}

function clipToVideo(
  submission: SubmissionLike,
  slot: 'land' | 'plant',
): IVideo | null {
  const sid = String(submission._id)
  const clip = (slot === 'land' ? submission.land : submission.plant) as
    | ClipLike
    | undefined
  if (!clip?.uploaded) return null
  const gps = clip.gpsCoordinates || {}
  const mlRaw = clip.mlVerification
  const mlVerification: MlVerificationSummary | undefined = mlRaw
    ? {
        aggregatePass: mlRaw.aggregatePass,
        modelVersion: mlRaw.modelVersion,
        error: mlRaw.error,
        verifiedAt: mlRaw.verifiedAt
          ? String(mlRaw.verifiedAt)
          : undefined,
      }
    : undefined
  return {
    _id: `${sid}-${slot}`,
    userWalletAddress: String(submission.userWalletAddress || ''),
    originalFilename: clip.originalFilename || '',
    ipfsHash: clip.videoCID || '',
    videoCID: clip.videoCID || '',
    type: slot === 'land' ? VideoType.LAND : VideoType.PLANT,
    status: submissionStatusToVideoStatus(String(submission.status || '')),
    uploadTimestamp: String(clip.uploadedAt || submission.updatedAt || ''),
    createdAt: String(submission.createdAt || ''),
    updatedAt: String(submission.updatedAt || ''),
    gpsCoordinates: {
      latitude: Number(gps.latitude ?? 0),
      longitude: Number(gps.longitude ?? 0),
    },
    submissionId: sid,
    treesPlanted: slot === 'plant' ? submission.treesPlanted : undefined,
    treetype: slot === 'plant' ? submission.treeType : undefined,
    votes: submission.votes,
    reverseGeocode: clip.reverseGeocode,
    mlVerification,
  }
}

/** Land + plant clips as the legacy `IVideo[]` shape used by the UI. */
export function submissionDocToVideos(submission: SubmissionLike): IVideo[] {
  const land = clipToVideo(submission, 'land')
  const plant = clipToVideo(submission, 'plant')
  return [land, plant].filter(Boolean) as IVideo[]
}

/** Moderation list rows include vote counts on the submission document. */
export function submissionDocToModerationVideos(
  submission: SubmissionLike,
): IModerationVideo[] {
  const counts = {
    yesCount: submission.yesCount ?? 0,
    noCount: submission.noCount ?? 0,
    totalVotes: submission.totalVotes ?? 0,
  }
  const land = clipToVideo(submission, 'land')
  const plant = clipToVideo(submission, 'plant')
  const out: IModerationVideo[] = []
  if (land)
    out.push({
      ...land,
      ...counts,
      votes: land.votes ?? [],
    })
  if (plant)
    out.push({
      ...plant,
      ...counts,
      votes: plant.votes ?? [],
    })
  return out
}
