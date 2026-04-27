import type { IconType } from 'react-icons'
import {
  IoCheckmarkCircle,
  IoCloseCircle,
  IoDocumentTextOutline,
  IoHourglassOutline,
  IoTimeOutline,
} from 'react-icons/io5'
import type { PlanterSubmissionGroup } from '@/utils/submissionPlanterGroup'

export type PlanterSubmissionBadge = {
  label: string
  Icon: IconType
  color: string
}

type BadgeInput = Pick<
  PlanterSubmissionGroup,
  'submissionStatus' | 'landVideo' | 'plantVideo'
>

export function getPlanterSubmissionBadge(
  group: BadgeInput,
): PlanterSubmissionBadge {
  const { submissionStatus: s, landVideo, plantVideo } = group
  const hasLand = Boolean(landVideo)
  const hasPlant = Boolean(plantVideo)

  if (s === 'rejected') {
    return { label: 'Rejected', Icon: IoCloseCircle, color: '#dc2626' }
  }
  if (s === 'approved') {
    return { label: 'Approved', Icon: IoCheckmarkCircle, color: '#1d4ed8' }
  }
  if (s === 'draft' || s === 'awaiting_plant' || !hasLand || !hasPlant) {
    return { label: 'Draft', Icon: IoDocumentTextOutline, color: '#64748b' }
  }
  if (s === 'pending_review') {
    return { label: 'In review', Icon: IoTimeOutline, color: '#d97706' }
  }
  const v = plantVideo?.status || landVideo?.status
  if (v === 'queued') {
    return { label: 'Queued', Icon: IoHourglassOutline, color: '#d97706' }
  }
  return { label: 'Draft', Icon: IoDocumentTextOutline, color: '#64748b' }
}
