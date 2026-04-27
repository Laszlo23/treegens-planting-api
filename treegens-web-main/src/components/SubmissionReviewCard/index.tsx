'use client'

import { useRouter } from 'next/navigation'
import { FC, useMemo } from 'react'
import { ClipStatusPill } from '@/components/ClipStatusPill'
import { RewardClaimStatusPill } from '@/components/submission-detail/RewardClaimStatusPill'
import { buildReviewSubmissionPath } from '@/config/appConfig'
import { ISubmissionGroup, VideoStatus } from '@/types'
import { formatGeocodeParts } from '@/utils/formatGeocode'
import { formatTimeAgo } from '@/utils/timeAgo'
import type { VerifierBadge } from '@/utils/verifierModeration'

interface SubmissionReviewCardProps {
  group: ISubmissionGroup
  verifierBadge?: VerifierBadge
  verifierRewardClaimed?: boolean | null
}

function submissionIdLabel(id: string) {
  if (!id) return '#…'
  const s = String(id)
  return s.length > 8 ? `\u0023…${s.slice(-4)}` : `\u0023${s}`
}

function truncateWallet(address: string) {
  if (!address || address.length < 12) return address || ''
  return `${address.slice(0, 5)}...${address.slice(-4)}`
}

function resolveStatus(group: ISubmissionGroup): string {
  const s = group.plantVideo?.status ?? group.landVideo?.status
  return s ? String(s) : VideoStatus.PENDING
}

/** Verifier moderation queue row (text summary, navigates to review flow). */
export const SubmissionReviewCard: FC<SubmissionReviewCardProps> = ({
  group,
  verifierBadge,
  verifierRewardClaimed,
}) => {
  const router = useRouter()
  const baseVideo = group.landVideo || group.plantVideo
  const userWalletAddress = baseVideo?.userWalletAddress || ''
  const submissionId = group.submissionId || '0'

  const location =
    group.plantVideo?.reverseGeocode || group.landVideo?.reverseGeocode || ''

  const treeCount = group.treesPlanted ?? group.plantVideo?.treesPlanted ?? 0
  const treeType = (group.treetype || group.plantVideo?.treetype || '').trim()

  const walletShort = truncateWallet(userWalletAddress)
  const pillStatus = verifierBadge || resolveStatus(group)

  const atLine = useMemo(() => {
    if (!location?.trim()) return 'at Unknown location'
    const { cityState, country } = formatGeocodeParts(location)
    const tail = country ? `${cityState}, ${country}` : cityState
    return `at ${tail}`
  }, [location])

  const timeAgo = useMemo(
    () => formatTimeAgo(group.createdAt),
    [group.createdAt],
  )

  const headline = `${walletShort} planted ${treeCount}${treeType ? ` ${treeType}` : ''}`

  return (
    <div className="rounded-2xl bg-white shadow-sm shadow-black/10">
      <button
        type="button"
        className="w-full cursor-pointer px-4 py-3.5 text-left transition-opacity hover:opacity-95 active:opacity-95"
        onClick={() =>
          router.push(
            buildReviewSubmissionPath(userWalletAddress, submissionId),
          )
        }
      >
        <div className="mb-2 flex flex-row items-center justify-between gap-2">
          <span
            className="font-bold text-[#5c534a]"
            style={{ fontSize: '15px' }}
          >
            {submissionIdLabel(submissionId)}
          </span>
          <span className="max-w-[58%] flex flex-wrap items-center justify-end">
            {typeof verifierRewardClaimed === 'boolean' ? (
              <RewardClaimStatusPill claimed={verifierRewardClaimed} />
            ) : (
              <ClipStatusPill status={pillStatus} />
            )}
          </span>
        </div>

        <p
          className="font-semibold capitalize text-[#1a1510]"
          style={{ fontSize: '15px' }}
        >
          {headline}
        </p>
        <p
          className="text-[#5c534a]"
          style={{ fontSize: '13px', lineHeight: 1.35 }}
        >
          {atLine}
        </p>
        <p className="mt-0.5 text-[#8a8278]" style={{ fontSize: '13px' }}>
          {timeAgo}
        </p>
      </button>
    </div>
  )
}
