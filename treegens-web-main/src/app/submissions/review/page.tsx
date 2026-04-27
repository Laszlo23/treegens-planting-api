'use client'

import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Spinner'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { SubmissionReviewCard } from '@/components/SubmissionReviewCard'
import { appConfig } from '@/config/appConfig'
import { useUser } from '@/contexts/UserProvider'
import type { ISubmissionGroup } from '@/types'
import {
  loadVerifierSubmissionRows,
  type VerifierSubmissionRow,
} from '@/utils/verifierModeration'
import {
  submissionMatchesVerifierFilter,
  type VerifierSubmissionFilter,
} from '@/utils/verifierSubmissionsFilter'
import { HiArrowLeft, HiArrowPath } from 'react-icons/hi2'
import { IoCheckmarkDoneCircleOutline, IoPulseOutline } from 'react-icons/io5'

export default function Submissions() {
  const router = useRouter()
  const { user } = useUser()
  const [rows, setRows] = useState<VerifierSubmissionRow[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState('')
  const isVerifier = Boolean(user?.isVerifier)
  const [activeFilter, setActiveFilter] =
    useState<VerifierSubmissionFilter>('all')

  const load = useCallback(async () => {
    setError('')
    try {
      if (!isVerifier || !user?.walletAddress?.trim()) {
        setRows([])
        return
      }
      const list = await loadVerifierSubmissionRows(user.walletAddress, {
        limit: 50,
      })
      setRows(list)
    } catch (e) {
      console.error('Failed to load moderation submissions', e)
      setError('Failed to load submissions.')
    }
  }, [isVerifier, user?.walletAddress])

  useEffect(() => {
    setLoading(true)
    void load().finally(() => setLoading(false))
  }, [load])

  const onRefresh = useCallback(async () => {
    setRefreshing(true)
    await load()
    setRefreshing(false)
  }, [load])

  const filteredRows = useMemo(
    () =>
      rows.filter(r => submissionMatchesVerifierFilter(activeFilter, r.badge)),
    [rows, activeFilter],
  )

  const filterOptions: Array<{ key: VerifierSubmissionFilter; label: string }> =
    [
      { key: 'all', label: 'All' },
      { key: 'pending', label: 'In review' },
      { key: 'voted', label: 'Voted' },
      { key: 'unclaimed', label: 'Approved' },
    ]

  return (
    <div className="min-h-screen bg-[#f6f1ea] px-4 pb-7 pt-2">
      <div className="mb-3 flex items-center justify-between">
        <button
          type="button"
          onClick={() => router.back()}
          className="rounded-md p-1 text-[#111] hover:bg-neutral-200/50"
          aria-label="Back"
        >
          <HiArrowLeft className="h-6 w-6" />
        </button>
        <h1 className="text-2xl font-bold text-[#111]">Submissions</h1>
        {isVerifier ? (
          <button
            type="button"
            onClick={() => router.push(appConfig.routes.HealthChecks)}
            className="rounded-md p-1 text-[#111] hover:bg-neutral-200/50"
            aria-label="Go to health checks"
          >
            <IoPulseOutline className="h-6 w-6" />
          </button>
        ) : (
          <span className="w-8" aria-hidden />
        )}
      </div>

      {loading ? (
        <div className="mt-6 flex items-center justify-center gap-2.5">
          <Spinner size="lg" />
        </div>
      ) : error ? (
        <div className="mt-6 flex flex-col items-center justify-center gap-2.5">
          <p className="text-center text-base text-red-600">{error}</p>
          <Button
            className="rounded-full px-5 py-2 font-semibold"
            color="success"
            onClick={() => void load()}
          >
            Retry
          </Button>
        </div>
      ) : !isVerifier ? (
        <div className="mt-6 flex flex-col items-center justify-center gap-2.5">
          <p className="text-center text-base font-semibold text-[#333]">
            Only verifiers can review submissions
          </p>
          <Button
            className="rounded-full px-5 py-2.5 font-semibold"
            color="success"
            onClick={() => router.push(appConfig.routes.Stake)}
          >
            Request Verifier Access
          </Button>
        </div>
      ) : (
        <>
          {rows.length > 0 ? (
            <div className="mb-2 mt-1 flex flex-wrap items-center gap-2">
              {filterOptions.map(option => {
                const selected = activeFilter === option.key
                return (
                  <button
                    key={option.key}
                    type="button"
                    onClick={() => setActiveFilter(option.key)}
                    className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${
                      selected
                        ? 'border-green-700 bg-green-600 text-white shadow-sm shadow-green-700/30'
                        : 'border-neutral-200 bg-white text-neutral-700'
                    }`}
                  >
                    {option.label}
                  </button>
                )
              })}
            </div>
          ) : null}

          <div className="mb-3 flex justify-end">
            <button
              type="button"
              onClick={() => void onRefresh()}
              className="rounded-md p-1 text-[#111] hover:bg-neutral-200/50"
              aria-label="Refresh submissions"
            >
              <HiArrowPath
                className={`h-5 w-5 ${refreshing ? 'animate-spin' : ''}`}
              />
            </button>
          </div>

          {rows.length === 0 ? (
            <div className="mt-6 flex flex-col items-center justify-center gap-2.5">
              <IoCheckmarkDoneCircleOutline className="h-9 w-9 text-[#435f24]" />
              <p className="text-center text-base font-semibold text-[#333]">
                Nothing to review or claim right now
              </p>
            </div>
          ) : filteredRows.length === 0 ? (
            <div className="mt-8 items-center px-4">
              <p className="text-center text-base leading-6 text-neutral-500">
                No submissions match this filter.
              </p>
            </div>
          ) : (
            <div className="mt-[18px] flex flex-col gap-3.5">
              {filteredRows.map(row => (
                <SubmissionReviewCard
                  key={`${row.group.userWalletAddress}-${row.group.submissionId}`}
                  group={row.group as ISubmissionGroup}
                  verifierBadge={row.badge}
                  verifierRewardClaimed={
                    row.badge === 'approved' ? false : null
                  }
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}
