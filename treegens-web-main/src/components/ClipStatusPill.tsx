'use client'

import {
  HiCheckCircle,
  HiClock,
  HiOutlineCheckCircle,
  HiShieldCheck,
  HiXCircle,
} from 'react-icons/hi'
import { VideoStatus } from '@/types'

type Props = { status: string }

/** Matches mobile `Status` chip styling */
export function ClipStatusPill({ status }: Props) {
  const normalized = status.toLowerCase()
  const pending =
    normalized === 'pending' ||
    normalized === 'pending_review' ||
    normalized === VideoStatus.PENDING

  if (pending) {
    return (
      <span className="inline-flex items-center gap-1 rounded-2xl bg-amber-100 px-2.5 py-1.5 text-xs font-medium text-amber-900">
        <HiClock className="h-4 w-4 shrink-0" aria-hidden />
        In review
      </span>
    )
  }
  if (normalized === 'approved' || normalized === VideoStatus.APPROVED) {
    return (
      <span className="inline-flex items-center gap-1 rounded-2xl bg-blue-100 px-2.5 py-1.5 text-xs font-medium text-blue-900">
        <HiCheckCircle className="h-4 w-4 shrink-0" aria-hidden />
        Approved
      </span>
    )
  }
  if (normalized === 'rejected' || normalized === VideoStatus.REJECTED) {
    return (
      <span className="inline-flex items-center gap-1 rounded-2xl bg-red-100 px-2.5 py-1.5 text-xs font-medium text-red-800">
        <HiXCircle className="h-4 w-4 shrink-0" aria-hidden />
        Rejected
      </span>
    )
  }
  if (normalized === 'voted') {
    return (
      <span className="inline-flex items-center gap-1 rounded-2xl bg-purple-100 px-2.5 py-1.5 text-xs font-medium text-purple-900">
        <HiShieldCheck className="h-4 w-4 shrink-0" aria-hidden />
        Voted
      </span>
    )
  }
  if (normalized === VideoStatus.QUEUED) {
    return (
      <span className="inline-flex items-center gap-1 rounded-2xl bg-blue-100 px-2.5 py-1.5 text-xs font-medium text-blue-900">
        <HiOutlineCheckCircle className="h-4 w-4 shrink-0" aria-hidden />
        Queued
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-2xl bg-amber-100 px-2.5 py-1.5 text-xs font-medium text-amber-900">
      <HiClock className="h-4 w-4 shrink-0" aria-hidden />
      In review
    </span>
  )
}
