'use client'

import Image from 'next/image'
import Link from 'next/link'
import { Tooltip } from '@/components/ui/Tooltip'
import { useState } from 'react'
import { HiPlay } from 'react-icons/hi2'
import VideoModal from '@/components/Modals/VideoModal'
import { ClipStatusPill } from '@/components/ClipStatusPill'
import { SubmissionStatusBadges } from '@/components/submission-detail/SubmissionStatusBadges'
import { VideoType } from '@/services/videoService'
import { IVideo } from '@/types'
import { ipfsGatewayUrl } from '@/utils/ipfsGatewayUrl'
import type { PlanterSubmissionBadge } from '@/utils/planterSubmissionBadge'
import { formatTimeAgo } from '@/utils/timeAgo'

export interface SubmissionCardProps {
  video: IVideo
  /** When set, the whole card links to this URL (submission detail). No in-card video controls so the surface is one tap target. */
  detailHref?: string
  status?: string
  statusMeta?: PlanterSubmissionBadge | null
  rewardClaimDisplay?: boolean | null
}

function formatTreeCount(n: number): string {
  if (n >= 1_000_000)
    return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1).replace(/\.0$/, '')}k`
  return String(n)
}

export default function SubmissionCard({
  video,
  detailHref,
  status,
  statusMeta = null,
  rewardClaimDisplay = null,
}: SubmissionCardProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isVideoLoading, setIsVideoLoading] = useState(false)
  const [isVideoError, setIsVideoError] = useState(false)

  const ipfsVideoUrl = ipfsGatewayUrl(video.videoCID) ?? ''

  const showTrees =
    video.type === VideoType.PLANT &&
    (video.treesPlanted != null ||
      (video.treetype && video.treetype.trim() !== ''))

  const treesText = (() => {
    if (!showTrees) return ''
    const count =
      video.treesPlanted != null && video.treesPlanted > 0
        ? formatTreeCount(video.treesPlanted)
        : ''
    const type = video.treetype?.trim() || ''
    return [count, type].filter(Boolean).join(' ')
  })()

  const locationText =
    video.reverseGeocode ||
    `${video.gpsCoordinates.latitude.toFixed(4)}, ${video.gpsCoordinates.longitude.toFixed(4)}`

  const timestamp = formatTimeAgo(video.createdAt)

  const cardClassName =
    'w-full rounded-2xl bg-white p-3 shadow-sm shadow-black/10'

  const mediaBlock = (
    <>
      <div className="relative w-full overflow-hidden rounded-xl bg-[#f3f4f6]">
        <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-[#f3f4f6]">
          <video
            className="relative z-[2] h-full w-full cursor-pointer object-cover"
            preload="metadata"
            onLoadStart={() => {
              setIsVideoLoading(true)
              setIsVideoError(false)
            }}
            onLoadedData={() => setIsVideoLoading(false)}
            onError={() => {
              setIsVideoLoading(false)
              setIsVideoError(true)
            }}
            onClick={detailHref ? undefined : () => setIsModalOpen(true)}
            muted
            playsInline
            controls={!detailHref}
          >
            <source src={ipfsVideoUrl} type="video/mp4" />
            Your browser does not support the video tag.
          </video>

          {showTrees && treesText ? (
            <div className="pointer-events-none absolute right-2 top-2 z-[3] flex max-w-[min(92%,280px)] flex-row items-center gap-1.5 rounded-full bg-black/50 px-2 py-1.5">
              <Image src="/img/tree.svg" alt="" width={14} height={14} />
              <span
                className="truncate text-xs font-semibold capitalize text-white"
                title={treesText}
              >
                {treesText}
              </span>
            </div>
          ) : null}

          {isVideoLoading && (
            <div className="absolute inset-0 z-[4] flex items-center justify-center bg-gray-100/80">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-blue-500" />
            </div>
          )}

          {isVideoError && (
            <div className="absolute inset-0 z-[4] flex flex-col items-center justify-center bg-gray-100 text-gray-500">
              <HiPlay className="mb-2 h-12 w-12 opacity-50" />
              <span className="text-sm">Failed to load video</span>
              {!detailHref ? (
                <button
                  type="button"
                  onClick={() => setIsModalOpen(true)}
                  className="mt-2 text-xs text-blue-500 hover:text-blue-600"
                >
                  Try again
                </button>
              ) : (
                <span className="mt-2 text-xs text-blue-600">
                  Open submission to retry
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="mt-2 flex flex-row items-start justify-between gap-2 px-0.5">
        <div className="min-w-0 max-w-[70%] flex-1">
          <p className="text-xs font-semibold text-[#1a1510]">{timestamp}</p>
          {video.reverseGeocode ? (
            <Tooltip content={<span>{video.reverseGeocode}</span>}>
              <p className="truncate text-xs text-[#5c534a] underline">
                {locationText}
              </p>
            </Tooltip>
          ) : (
            <p className="truncate text-xs text-[#5c534a]">{locationText}</p>
          )}
        </div>
        <div className="mt-0.5 shrink-0">
          {statusMeta || rewardClaimDisplay !== null ? (
            <SubmissionStatusBadges
              rewardClaimDisplay={rewardClaimDisplay}
              statusMeta={statusMeta}
            />
          ) : (
            <ClipStatusPill status={status ?? String(video.status)} />
          )}
        </div>
      </div>
    </>
  )

  return (
    <>
      {detailHref ? (
        <Link href={detailHref} className={`${cardClassName} block`}>
          {mediaBlock}
        </Link>
      ) : (
        <div className={cardClassName}>{mediaBlock}</div>
      )}

      {!detailHref && (
        <VideoModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          videoUrl={ipfsVideoUrl}
          video={video}
        />
      )}
    </>
  )
}
