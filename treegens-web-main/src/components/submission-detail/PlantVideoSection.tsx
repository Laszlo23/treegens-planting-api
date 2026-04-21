'use client'

import Image from 'next/image'
import Link from 'next/link'
import { HiOutlineVideoCamera } from 'react-icons/hi'
import type { IVideo, MlVerificationSummary } from '@/types'
import { AiVerificationBadge } from '@/components/submission-detail/AiVerificationBadge'

type Props = {
  submissionId: string
  plantVideo?: IVideo
  plantVideoUrl: string | null
  locationText: string
  timeAgo: string
  mlVerification?: MlVerificationSummary | null
}

export function PlantVideoSection({
  submissionId,
  plantVideo,
  plantVideoUrl,
  locationText,
  timeAgo,
  mlVerification,
}: Props) {
  const completeHref = `/submissions/create/${encodeURIComponent(submissionId)}`

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-row items-center justify-between gap-1">
        <h2 className="text-lg font-bold text-gray-900">Plant</h2>
        {plantVideo ? (
          <div className="flex flex-row items-center gap-1">
            <Image src="/img/tree.svg" alt="" width={14} height={14} />
            <span className="text-sm font-semibold capitalize text-gray-800">
              {plantVideo.treesPlanted}
              {plantVideo.treetype?.trim()
                ? ` ${plantVideo.treetype.trim()}`
                : ''}
            </span>
          </div>
        ) : null}
      </div>
      {!plantVideo ? (
        <div className="flex flex-col items-center">
          <p className="text-center text-lg text-gray-600">
            No plant video uploaded yet for this submission.
          </p>
          <Link
            href={completeHref}
            className="mt-2 rounded-full bg-lime-green-2 px-3 py-2 text-base font-semibold text-brown-3"
          >
            Complete submission
          </Link>
        </div>
      ) : (
        <>
          <div className="overflow-hidden rounded-2xl bg-[#f3f4f6]">
            {plantVideoUrl ? (
              <video
                className="aspect-video w-full object-cover"
                controls
                preload="metadata"
                muted
                playsInline
              >
                <source src={plantVideoUrl} type="video/mp4" />
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
        </>
      )}
    </div>
  )
}
