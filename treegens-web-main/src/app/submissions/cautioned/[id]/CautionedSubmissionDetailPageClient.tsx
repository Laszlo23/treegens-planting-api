'use client'

import { LandVideoSection } from '@/components/submission-detail/LandVideoSection'
import { PlantVideoSection } from '@/components/submission-detail/PlantVideoSection'
import { RejectionFeedbackFooter } from '@/components/submission-detail/RejectionFeedbackFooter'
import { SubmissionStatusBadges } from '@/components/submission-detail/SubmissionStatusBadges'
import { Spinner } from '@/components/ui/Spinner'
import { getSubmissionById } from '@/services/app'
import type { ISubmissionDoc } from '@/types'
import { formatGeocodeParts } from '@/utils/formatGeocode'
import { getPlanterSubmissionBadge } from '@/utils/planterSubmissionBadge'
import { getSubmissionDetailVideoUrl } from '@/utils/submissionDetailVideo'
import {
  submissionDocToPlanterGroup,
  type PlanterSubmissionGroup,
} from '@/utils/submissionPlanterGroup'
import { formatTimeAgo } from '@/utils/timeAgo'
import { useParams, useRouter } from 'next/navigation'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { HiArrowLeft, HiArrowPath } from 'react-icons/hi2'

export default function CautionedSubmissionDetailPageClient() {
  const params = useParams()
  const id = typeof params.id === 'string' ? params.id : ''
  const router = useRouter()

  const [loading, setLoading] = useState(true)
  const [group, setGroup] = useState<PlanterSubmissionGroup | null>(null)
  const [error, setError] = useState('')
  const [refreshing, setRefreshing] = useState(false)

  const load = useCallback(
    async (isRefresh = false) => {
      if (!id) {
        setError('Invalid submission')
        setLoading(false)
        setRefreshing(false)
        return
      }

      if (isRefresh) setRefreshing(true)
      else setLoading(true)
      setError('')

      try {
        const res = await getSubmissionById(id)
        const doc = res.data.data as ISubmissionDoc & Record<string, unknown>
        setGroup(submissionDocToPlanterGroup(doc))
      } catch (e) {
        console.error('Failed to load submission details', e)
        setError('Failed to load submission')
      } finally {
        if (isRefresh) setRefreshing(false)
        else setLoading(false)
      }
    },
    [id],
  )

  useEffect(() => {
    void load(false)
  }, [load])

  const onRefresh = useCallback(() => load(true), [load])

  const landVideo = group?.landVideo
  const plantVideo = group?.plantVideo
  const landVideoUrl = useMemo(
    () => getSubmissionDetailVideoUrl(landVideo),
    [landVideo],
  )
  const plantVideoUrl = useMemo(
    () => getSubmissionDetailVideoUrl(plantVideo),
    [plantVideo],
  )
  const landVideoTimestamp = useMemo(
    () => (landVideo ? formatTimeAgo(landVideo.createdAt) : ''),
    [landVideo],
  )
  const plantVideoTimestamp = useMemo(
    () => (plantVideo ? formatTimeAgo(plantVideo.createdAt) : ''),
    [plantVideo],
  )

  const { cityState, country } = useMemo(
    () => formatGeocodeParts(group?.location),
    [group?.location],
  )
  const locationText = useMemo(() => {
    if (!group?.location?.trim()) return 'Unknown location'
    return country ? `${cityState}, ${country}` : cityState
  }, [cityState, country, group?.location])

  const statusMeta = useMemo(
    () => (group ? getPlanterSubmissionBadge(group) : null),
    [group],
  )

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <header className="sticky top-0 z-10 flex flex-row items-center justify-between border-b border-gray-100 bg-white px-4 py-2">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => router.back()}
            className="rounded-md p-0.5 text-[#111] hover:bg-gray-100"
            aria-label="Back"
          >
            <HiArrowLeft className="h-6 w-6" />
          </button>
          <button
            type="button"
            onClick={() => void onRefresh()}
            disabled={refreshing || loading}
            className="rounded-md p-0.5 text-[#111] hover:bg-gray-100 disabled:opacity-40"
            aria-label="Refresh"
          >
            <HiArrowPath
              className={`h-5 w-5 ${refreshing ? 'animate-spin' : ''}`}
            />
          </button>
        </div>
        <h1 className="text-[18px] font-bold text-[#111]">Submission</h1>
        <div className="w-10 shrink-0" />
      </header>

      <div className="flex flex-1 flex-col overflow-y-auto px-[15px] pb-24 pt-[15px]">
        {loading ? (
          <div className="mt-8 flex items-center justify-center">
            <Spinner size="lg" />
          </div>
        ) : group ? (
          <div className="flex flex-col gap-3.5">
            <SubmissionStatusBadges
              rewardClaimDisplay={null}
              statusMeta={statusMeta}
            />

            <LandVideoSection
              videoUrl={landVideoUrl}
              locationText={locationText}
              timeAgo={landVideoTimestamp}
              mlVerification={landVideo?.mlVerification}
            />

            <PlantVideoSection
              submissionId={id}
              plantVideo={plantVideo}
              plantVideoUrl={plantVideoUrl}
              locationText={locationText}
              timeAgo={plantVideoTimestamp}
              mlVerification={plantVideo?.mlVerification}
            />
          </div>
        ) : (
          <div className="mt-8 flex items-center justify-center">
            <p className="text-red-700">{error || 'Submission not found'}</p>
          </div>
        )}
      </div>

      {group?.submissionStatus === 'rejected' && id ? (
        <RejectionFeedbackFooter submissionId={id} />
      ) : null}
    </div>
  )
}
