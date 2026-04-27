'use client'

import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Spinner'
import { useParams, useRouter } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'
import { listHealthChecksForSubmission } from '@/services/healthCheckService'
import type { IHealthCheckDoc } from '@/types'
import { ipfsGatewayUrl } from '@/utils/ipfsGatewayUrl'
import toast from 'react-hot-toast'

function healthCheckStatusLabel(status: IHealthCheckDoc['status']) {
  switch (status) {
    case 'pending_review':
      return 'Pending'
    case 'approved':
      return 'Approved'
    case 'rejected':
      return 'Rejected'
    default:
      return status
  }
}

function healthCheckVideoUrl(hc: IHealthCheckDoc) {
  if (hc.publicUrl?.trim()) return hc.publicUrl
  return ipfsGatewayUrl(hc.videoCID) ?? ''
}

export default function SubmissionHealthChecksListClient() {
  const params = useParams()
  const id = typeof params.id === 'string' ? params.id : ''
  const router = useRouter()
  const [rows, setRows] = useState<IHealthCheckDoc[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const load = useCallback(async () => {
    if (!id) return
    setLoading(true)
    try {
      const { data } = await listHealthChecksForSubmission(id)
      setRows(data.data.healthChecks || [])
    } catch (e) {
      console.error(e)
      toast.error('Failed to load health checks')
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    void load()
  }, [load])

  const onRefresh = useCallback(async () => {
    setRefreshing(true)
    await load()
    setRefreshing(false)
  }, [load])

  return (
    <div className="flex flex-col gap-4 p-6 mb-24">
      <div className="flex items-center justify-between gap-2">
        <Button
          size="xs"
          color="gray"
          onClick={() =>
            router.push(
              `/submissions/${encodeURIComponent(id)}/health-checks/create`,
            )
          }
        >
          New health check
        </Button>
        <Button size="xs" color="gray" onClick={() => void onRefresh()}>
          {refreshing ? 'Refreshing...' : 'Refresh'}
        </Button>
      </div>
      {loading ? (
        <Spinner />
      ) : rows.length ? (
        <ul className="flex flex-col gap-3">
          {rows.map(hc => (
            <li
              key={hc._id}
              className="rounded-xl border border-warm-grey bg-white p-3 text-sm"
            >
              <div className="flex items-center justify-between">
                <span className="font-semibold text-brown-3">
                  Trees alive: {hc.treesAlive}
                </span>
                <span className="text-xs font-semibold text-brown-2">
                  {healthCheckStatusLabel(hc.status)}
                </span>
              </div>
              {healthCheckVideoUrl(hc) ? (
                <video
                  className="aspect-video w-full rounded-lg bg-black object-cover"
                  src={healthCheckVideoUrl(hc)}
                  controls
                />
              ) : null}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-brown-2 text-sm">No health checks yet.</p>
      )}
    </div>
  )
}
