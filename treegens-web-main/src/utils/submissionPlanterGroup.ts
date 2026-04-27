import { submissionDocToVideos } from '@/services/submissionApiMappers'
import { VideoType } from '@/services/videoService'
import type { ISubmissionDoc, IVideo, SubmissionStatus, Vote } from '@/types'

/** Planter submission detail — mirrors `mobile/utils/submissionAdapter` `SubmissionGroup`. */
export type PlanterSubmissionGroup = {
  submissionId: string
  userWalletAddress: string
  createdAt: string
  location?: string
  landVideo?: IVideo
  plantVideo?: IVideo
  submissionStatus: SubmissionStatus
  votes: Vote[]
}

export function submissionDocToPlanterGroup(
  doc: ISubmissionDoc & Record<string, unknown>,
): PlanterSubmissionGroup {
  const videos = submissionDocToVideos(
    doc as Parameters<typeof submissionDocToVideos>[0],
  )
  const landVideo = videos.find(v => v.type === VideoType.LAND)
  const plantVideo = videos.find(v => v.type === VideoType.PLANT)
  const location =
    plantVideo?.reverseGeocode || landVideo?.reverseGeocode || undefined
  return {
    submissionId: String(doc._id),
    userWalletAddress: doc.userWalletAddress,
    createdAt: doc.createdAt,
    location,
    landVideo,
    plantVideo,
    submissionStatus: doc.status,
    votes: doc.votes ?? [],
  }
}
