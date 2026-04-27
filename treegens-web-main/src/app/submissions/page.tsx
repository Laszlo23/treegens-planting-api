'use client'

import SubmissionCard from '@/components/SubmissionCard'
import { Spinner } from '@/components/ui/Spinner'
import { appConfig } from '@/config/appConfig'
import { useUser } from '@/contexts/UserProvider'
import { getMySubmissions } from '@/services/app'
import { submissionDocToVideos } from '@/services/submissionApiMappers'
import { getRewardStatus } from '@/services/rewardService'
import { VideoType } from '@/services/videoService'
import type { ISubmissionDoc, SubmissionStatus } from '@/types'
import { getPlanterSubmissionBadge } from '@/utils/planterSubmissionBadge'
import { rewardScheduleFullyClaimed } from '@/utils/rewardScheduleClaimed'
import {
  submissionDocToPlanterGroup,
  type PlanterSubmissionGroup,
} from '@/utils/submissionPlanterGroup'
import axios from 'axios'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import { HiArrowLeft, HiArrowPath } from 'react-icons/hi2'
import { MdOutlineInfo } from 'react-icons/md'

type MyPlantsFilter =
  | 'all'
  | 'incomplete'
  | 'pending'
  | 'unclaimed'
  | 'claimed'
  | 'rejected'

const FILTER_OPTIONS: { key: MyPlantsFilter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'incomplete', label: 'Draft' },
  { key: 'pending', label: 'In review' },
  { key: 'unclaimed', label: 'Approved' },
  { key: 'claimed', label: 'Claimed' },
  { key: 'rejected', label: 'Rejected' },
]

function matchesFilter(
  group: PlanterSubmissionGroup,
  filter: MyPlantsFilter,
  rewardClaimed: boolean | null | undefined,
) {
  if (filter === 'all') return true

  if (filter === 'rejected') {
    return group.submissionStatus === 'rejected'
  }

  const badge = getPlanterSubmissionBadge(group)

  if (filter === 'incomplete') {
    return badge.label === 'Draft'
  }

  if (filter === 'pending') {
    return badge.label === 'In review' || badge.label === 'Queued'
  }

  if (group.submissionStatus !== 'approved') {
    return false
  }

  if (filter === 'claimed') {
    return rewardClaimed === true
  }

  if (filter === 'unclaimed') {
    if (rewardClaimed === true) return false
    if (rewardClaimed === undefined) return false
    return rewardClaimed === false || rewardClaimed === null
  }

  return false
}

function primaryClipForSubmission(sub: ISubmissionDoc) {
  const clips = submissionDocToVideos(
    sub as Parameters<typeof submissionDocToVideos>[0],
  )
  return clips.find(v => v.type === VideoType.PLANT) ?? clips[0] ?? null
}

export default function MySubmissionsPage() {
  const router = useRouter()
  const { user, isLoading: userLoading, fetchUser } = useUser()
  const [rows, setRows] = useState<ISubmissionDoc[]>([])
  const [rewardClaimedById, setRewardClaimedById] = useState<
    Record<string, boolean | null>
  >({})
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [filter, setFilter] = useState<MyPlantsFilter>('all')

  const load = useCallback(async (opts?: { silent?: boolean }) => {
    if (!opts?.silent) setLoading(true)
    try {
      const { data } = await getMySubmissions({ page: 1, limit: 100 })
      setRows(data.data.submissions || [])
    } catch (e) {
      console.error(e)
      if (!opts?.silent) toast.error('Failed to fetch your submissions')
    } finally {
      if (!opts?.silent) setLoading(false)
    }
  }, [])

  const refresh = useCallback(async () => {
    setRefreshing(true)
    try {
      await Promise.all([load({ silent: true }), fetchUser()])
    } catch {
      toast.error('Failed to refresh')
    } finally {
      setRefreshing(false)
    }
  }, [load, fetchUser])

  useEffect(() => {
    void load()
  }, [load])

  const groupedSubmissions = useMemo(
    () =>
      rows.map(r =>
        submissionDocToPlanterGroup(
          r as ISubmissionDoc & Record<string, unknown>,
        ),
      ),
    [rows],
  )

  useEffect(() => {
    const approvedIds = groupedSubmissions
      .filter(g => g.submissionStatus === 'approved')
      .map(g => g.submissionId)

    if (!approvedIds.length) {
      setRewardClaimedById({})
      return
    }

    let cancelled = false
    ;(async () => {
      const entries = await Promise.all(
        approvedIds.map(async id => {
          try {
            const rs = await getRewardStatus(id)
            return [id, rewardScheduleFullyClaimed(rs.data.data)] as const
          } catch (e) {
            if (axios.isAxiosError(e) && e.response?.status === 404) {
              return [id, null] as const
            }
            return [id, null] as const
          }
        }),
      )
      if (!cancelled) {
        setRewardClaimedById(Object.fromEntries(entries))
      }
    })()

    return () => {
      cancelled = true
    }
  }, [groupedSubmissions])

  const filtered = useMemo(
    () =>
      groupedSubmissions.filter(g =>
        matchesFilter(g, filter, rewardClaimedById[g.submissionId]),
      ),
    [groupedSubmissions, filter, rewardClaimedById],
  )

  const base = appConfig.routes.MySubmissions
  const treesPlanted = user?.treesPlanted ?? 0
  const treesCountLoading = userLoading && user === null

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <header className="sticky top-0 z-10 flex flex-row items-center justify-between border-b border-gray-100 bg-white px-4 py-2">
        <button
          type="button"
          onClick={() => router.back()}
          className="rounded-md p-0.5 text-[#111] hover:bg-gray-100"
          aria-label="Back"
        >
          <HiArrowLeft className="h-6 w-6" />
        </button>
        <h1 className="text-[22px] font-bold text-[#111]">My Plants</h1>
        <button
          type="button"
          onClick={() => void refresh()}
          disabled={refreshing || loading}
          className="rounded-md p-0.5 text-[#111] hover:bg-gray-100 disabled:opacity-40"
          aria-label="Refresh"
        >
          <HiArrowPath
            className={`h-6 w-6 ${refreshing ? 'animate-spin' : ''}`}
          />
        </button>
      </header>

      <div className="mx-[15px] mt-[15px] flex flex-col gap-2.5 rounded-[15px] bg-lime-green-1/50 p-5">
        <div className="flex flex-row items-center gap-2.5">
          <Image
            src="/img/tree.svg"
            alt=""
            width={25}
            height={25}
            className="h-[25px] w-[25px]"
          />
          {treesCountLoading ? (
            <div className="h-7 w-12 animate-pulse rounded bg-gray-200" />
          ) : (
            <span
              className="font-semibold text-lime-green-2"
              style={{ fontSize: '1.625rem', lineHeight: 1 }}
            >
              {treesPlanted.toLocaleString()}
            </span>
          )}
          <span className="text-sm font-medium text-brown-2">
            Trees Planted
          </span>
        </div>

        <div className="flex flex-row items-start gap-1">
          <MdOutlineInfo className="mt-0.5 h-5 w-5 shrink-0 text-black" />
          <p className="w-[90%] text-sm text-[#111] leading-snug">
            You get 1/6 of $MGRO tokens for total number of trees planted
          </p>
        </div>
      </div>

      {!loading ? (
        <div className="overflow-x-auto pb-3 pt-3">
          <div className="flex w-max flex-row items-center gap-2.5 px-4">
            {FILTER_OPTIONS.map(opt => {
              const selected = filter === opt.key
              return (
                <button
                  key={opt.key}
                  type="button"
                  onClick={() => setFilter(opt.key)}
                  className={`shrink-0 rounded-full border px-4 py-2.5 text-sm font-semibold transition-colors ${
                    selected
                      ? 'border-lime-green-2 bg-lime-green-2 text-white shadow-md shadow-lime-green-2/20'
                      : 'border-neutral-200/90 bg-white text-neutral-700 shadow-sm'
                  }`}
                >
                  {opt.label}
                </button>
              )
            })}
          </div>
        </div>
      ) : null}

      <div className="flex flex-1 flex-col px-[15px] pb-24">
        {loading ? (
          <div className="flex justify-center py-12">
            <Spinner size="lg" />
          </div>
        ) : filtered.length ? (
          <ul className="flex flex-col gap-2.5">
            {filtered.map(g => {
              const href = `${base}/${g.submissionId}`
              const sourceDoc = rows.find(r => r._id === g.submissionId)
              const clip = sourceDoc
                ? primaryClipForSubmission(sourceDoc)
                : null
              return (
                <li key={g.submissionId}>
                  {clip ? (
                    <SubmissionCard
                      video={clip}
                      detailHref={href}
                      statusMeta={getPlanterSubmissionBadge(g)}
                      rewardClaimDisplay={
                        typeof rewardClaimedById[g.submissionId] === 'boolean'
                          ? rewardClaimedById[g.submissionId]
                          : null
                      }
                    />
                  ) : (
                    <button
                      type="button"
                      onClick={() => router.push(href)}
                      className="flex w-full flex-col gap-1 rounded-2xl border border-warm-grey bg-white p-4 text-left shadow-sm shadow-black/5"
                    >
                      <span className="font-semibold text-brown-3">
                        Submission {g.submissionId.slice(-8)}
                      </span>
                      <span className="text-xs capitalize text-brown-2">
                        {g.submissionStatus.replace(/_/g, ' ')}
                      </span>
                      {sourceDoc?.treesPlanted != null && (
                        <span className="text-xs text-tree-green-3">
                          Trees: {sourceDoc.treesPlanted}
                        </span>
                      )}
                      <span className="text-xs text-brown-1">
                        Add clips to see preview
                      </span>
                    </button>
                  )}
                </li>
              )
            })}
          </ul>
        ) : (
          <div className="flex flex-col items-center px-6 py-10">
            <p className="text-center text-base leading-6 text-neutral-500">
              {rows.length === 0
                ? 'You have no submissions yet.'
                : 'No submissions match this filter.'}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
