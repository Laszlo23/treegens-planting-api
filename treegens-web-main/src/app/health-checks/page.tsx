'use client'

import { Button } from '@/components/ui/Button'
import { VerifierHealthCheckCard } from '@/components/VerifierHealthCheckCard'
import { appConfig } from '@/config/appConfig'
import { Spinner } from '@/components/ui/Spinner'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'
import { useUser } from '@/contexts/UserProvider'
import { listHealthCheckModeration } from '@/services/healthCheckService'
import type { IHealthCheckDoc } from '@/types'
import toast from 'react-hot-toast'
import { HiArrowLeft, HiArrowPath } from 'react-icons/hi2'

const PAGE_SIZE = 20

function hasVerifierVotedOnHealthCheck(
  hc: IHealthCheckDoc,
  verifierWalletAddress?: string | null,
) {
  const wallet = verifierWalletAddress?.trim().toLowerCase()
  if (!wallet) return false
  const votes = hc.votes
  if (!Array.isArray(votes)) return false
  return votes.some(v => v.voterWalletAddress?.toLowerCase() === wallet)
}

export default function HealthChecksQueuePage() {
  const router = useRouter()
  const { user } = useUser()
  const [rows, setRows] = useState<IHealthCheckDoc[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(0)
  const isVerifier = Boolean(user?.isVerifier)

  const loadPage = useCallback(
    async (nextPage: number, append: boolean) => {
      const { data } = await listHealthCheckModeration(nextPage, PAGE_SIZE)
      const raw = data.data.healthChecks || []
      const list = raw.filter(
        hc => !hasVerifierVotedOnHealthCheck(hc, user?.walletAddress),
      )
      setTotalPages(data.data.pagination?.pages ?? 0)
      setPage(nextPage)
      if (append) {
        setRows(prev => [...prev, ...list])
      } else {
        setRows(list)
      }
    },
    [user?.walletAddress],
  )

  const load = useCallback(async () => {
    if (!user?._id || !isVerifier) {
      setRows([])
      setLoading(false)
      return
    }
    setLoading(true)
    try {
      await loadPage(1, false)
    } catch (e) {
      console.error(e)
      toast.error('Failed to load health checks')
    } finally {
      setLoading(false)
    }
  }, [user?._id, isVerifier, loadPage])

  useEffect(() => {
    void load()
  }, [load])

  const onRefresh = useCallback(async () => {
    setRefreshing(true)
    try {
      await load()
    } finally {
      setRefreshing(false)
    }
  }, [load])

  const onLoadMore = useCallback(async () => {
    if (loadingMore || loading || totalPages <= 0 || page >= totalPages) return
    setLoadingMore(true)
    try {
      await loadPage(page + 1, true)
    } catch (e) {
      console.error(e)
      toast.error('Failed to load more')
    } finally {
      setLoadingMore(false)
    }
  }, [loadingMore, loading, totalPages, page, loadPage])

  useEffect(() => {
    const onWindowFocus = () => {
      void load()
    }
    window.addEventListener('focus', onWindowFocus)
    return () => window.removeEventListener('focus', onWindowFocus)
  }, [load])

  useEffect(() => {
    const onScroll = () => {
      const scrollTop =
        window.pageYOffset || document.documentElement.scrollTop || 0
      const viewport = window.innerHeight || 0
      const fullHeight = document.documentElement.scrollHeight || 0
      if (scrollTop + viewport >= fullHeight - 320) {
        void onLoadMore()
      }
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [onLoadMore])

  useEffect(() => {
    return () => {
      setRows([])
    }
  }, [])

  if (!isVerifier) {
    return (
      <div className="p-6">
        <p className="text-brown-2">Only verifiers can review health checks.</p>
        <Button
          className="mt-4 rounded-full px-5 py-2.5 font-semibold"
          color="success"
          onClick={() => router.push(appConfig.routes.Stake)}
        >
          Request verifier access
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4 p-6 mb-24">
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => router.back()}
          className="rounded-md p-1 text-[#111] hover:bg-neutral-200/50"
          aria-label="Back"
        >
          <HiArrowLeft className="h-6 w-6" />
        </button>
        <h1 className="text-2xl font-bold text-[#111]">Health checks</h1>
        <button
          type="button"
          onClick={() => void onRefresh()}
          className="rounded-md p-1 text-[#111] hover:bg-neutral-200/50"
          aria-label="Refresh health checks"
        >
          <HiArrowPath
            className={`h-5 w-5 ${refreshing ? 'animate-spin' : ''}`}
          />
        </button>
      </div>
      {loading ? (
        <div className="flex justify-center py-12">
          <Spinner size="lg" />
        </div>
      ) : rows.length ? (
        <>
          <ul className="flex flex-col gap-2">
            {rows.map(hc => (
              <li key={hc._id}>
                <VerifierHealthCheckCard
                  hc={hc}
                  onClick={() =>
                    router.push(
                      `/health-checks/${encodeURIComponent(hc._id)}?submissionId=${encodeURIComponent(hc.submissionId)}`,
                    )
                  }
                />
              </li>
            ))}
          </ul>
          {loadingMore ? (
            <div className="flex justify-center py-2">
              <Spinner size="sm" />
            </div>
          ) : null}
          {!loadingMore && totalPages > 0 && page < totalPages ? (
            <div className="flex justify-center">
              <Button size="xs" color="gray" onClick={() => void onLoadMore()}>
                Load more
              </Button>
            </div>
          ) : null}
        </>
      ) : (
        <p className="text-center text-brown-2 py-8">
          Nothing pending in the moderation queue.
        </p>
      )}
    </div>
  )
}
