'use client'

import type { MlVerificationSummary } from '@/types'
import { AiVerificationBadge } from '@/components/submission-detail/AiVerificationBadge'
import { HiOutlineVideoCamera } from 'react-icons/hi'

type Props = {
  videoUrl: string | null
  locationText: string
  timeAgo: string
  mlVerification?: MlVerificationSummary | null
}

export function LandVideoSection({
  videoUrl,
  locationText,
  timeAgo,
  mlVerification,
}: Props) {
  return (
    <div className="flex flex-col gap-2">
      <h2 className="text-lg font-bold text-gray-900">Land</h2>
      <div className="overflow-hidden rounded-2xl bg-[#f3f4f6]">
        {videoUrl ? (
          <video
            className="aspect-video w-full object-cover"
            controls
            preload="metadata"
            muted
            playsInline
          >
            <source src={videoUrl} type="video/mp4" />
          </video>
        ) : (
          <div className="flex aspect-video w-full items-center justify-center">
            <HiOutlineVideoCamera className="h-7 w-7 text-gray-400" />
          </div>
        )}
      </div>
      <AiVerificationBadge summary={mlVerification} />
      <div className="flex flex-row items-start justify-between gap-2">
        <p className="max-w-[70%] text-sm text-[#5c534a]">{locationText}</p>
        <p className="shrink-0 text-sm text-[#8a8278]">{timeAgo}</p>
      </div>
    </div>
  )
}
