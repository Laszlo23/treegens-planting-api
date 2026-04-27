'use client'

import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Spinner'
import { appConfig, buildReviewSubmissionPath } from '@/config/appConfig'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { getSubmissionById } from '@/services/app'
import {
  getHealthCheck,
  voteOnHealthCheck,
} from '@/services/healthCheckService'
import { useUser } from '@/contexts/UserProvider'
import type { IHealthCheckDoc, ISubmissionDoc } from '@/types'
import { ipfsGatewayUrl } from '@/utils/ipfsGatewayUrl'
import Image from 'next/image'
import { RejectHealthCheckModal } from '@/components/RejectHealthCheckModal'
import { ApproveHealthCheckModal } from '@/components/ApproveHealthCheckModal'

function videoSrc(doc: IHealthCheckDoc) {
  if (doc.publicUrl) return doc.publicUrl
  return ipfsGatewayUrl(doc.videoCID) ?? ''
}

function statusLabel(status: IHealthCheckDoc['status']) {
  if (status === 'pending_review') return 'Pending'
  if (status === 'approved') return 'Approved'
  if (status === 'rejected') return 'Rejected'
  return status
}

export default function HealthCheckIdPageClient() {
  const params = useParams()
  const searchParams = useSearchParams()
  const router = useRouter()
  const { user } = useUser()
  const healthCheckId =
    typeof params.healthCheckId === 'string' ? params.healthCheckId : ''
  const submissionId = searchParams.get('submissionId') || ''
  const [doc, setDoc] = useState<IHealthCheckDoc | null>(null)
  const [submission, setSubmission] = useState<ISubmissionDoc | null>(null)
  const [loading, setLoading] = useState(true)
  const [voting, setVoting] = useState(false)
  const [isApproveOpen, setIsApproveOpen] = useState(false)
  const [isRejectOpen, setIsRejectOpen] = useState(false)
  const isVerifier = Boolean(user?.isVerifier)

  const load = useCallback(async () => {
    if (!submissionId || !healthCheckId) return
    setLoading(true)
    try {
      const [hcRes, subRes] = await Promise.all([
        getHealthCheck(submissionId, healthCheckId),
        getSubmissionById(submissionId).catch(() => null),
      ])
      setDoc(hcRes.data.data.healthCheck)
      setSubmission(subRes?.data.data ?? null)
    } catch (e) {
      console.error(e)
      toast.error('Failed to load health check')
    } finally {
      setLoading(false)
    }
  }, [submissionId, healthCheckId])

  useEffect(() => {
    void load()
  }, [load])

  if (!submissionId) {
    return (
      <div className="p-6">
        <p className="text-brown-2 text-sm">Missing submissionId query.</p>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner size="lg" />
      </div>
    )
  }

  if (!doc) {
    return (
      <div className="p-6">
        <p className="text-[#b91c1c]">Not found</p>
      </div>
    )
  }

  const src = videoSrc(doc)
  const submissionReviewHref =
    submission?.userWalletAddress && submission?._id
      ? buildReviewSubmissionPath(submission.userWalletAddress, submission._id)
      : null

  return (
    <div className="flex flex-col gap-4 p-6 mb-24">
      <h1 className="text-2xl font-bold text-[#111827]">Review health check</h1>
      {submissionReviewHref ? (
        <Button color="gray" onClick={() => router.push(submissionReviewHref)}>
          View submission
        </Button>
      ) : null}
      <div className="rounded-xl bg-warm-grey p-4 text-sm text-brown-2">
        <div className="mb-2 inline-flex items-center gap-1 rounded-full bg-[#eef7e7] px-2.5 py-1">
          <Image src="/img/tree.svg" alt="" width={14} height={14} />
          <span className="font-semibold capitalize text-[#1f2937]">
            {doc.treesAlive}
            {submission?.treeType ? ` ${submission.treeType}` : ''}
          </span>
        </div>
        <p>Status: {statusLabel(doc.status)}</p>
      </div>
      {src ? (
        <video
          className="w-full rounded-lg bg-black aspect-video"
          src={src}
          controls
        />
      ) : (
        <p className="text-xs text-gray-500">No video URL available.</p>
      )}
      {isVerifier && doc.status === 'pending_review' && (
        <div className="flex gap-2">
          <Button
            color="success"
            disabled={voting}
            onClick={() => setIsApproveOpen(true)}
          >
            Approve
          </Button>
          <Button
            color="failure"
            disabled={voting}
            onClick={() => setIsRejectOpen(true)}
          >
            Reject
          </Button>
        </div>
      )}
      <RejectHealthCheckModal
        isOpen={isRejectOpen}
        onClose={() => setIsRejectOpen(false)}
        onReject={async ({ reasons }) => {
          const cleaned = reasons.map(r => String(r).trim()).filter(Boolean)
          if (cleaned.length === 0) {
            toast.error('Add at least one reason to reject.')
            return
          }
          try {
            if (!submissionId || !healthCheckId) return
            setVoting(true)
            await voteOnHealthCheck(submissionId, healthCheckId, 'no', cleaned)
            toast.success('Vote recorded')
            setIsRejectOpen(false)
            router.push(appConfig.routes.Home)
            router.refresh()
          } catch (e) {
            console.error(e)
            toast.error('Vote failed')
          } finally {
            setVoting(false)
          }
        }}
      />
      <ApproveHealthCheckModal
        isOpen={isApproveOpen}
        onClose={() => setIsApproveOpen(false)}
        onApprove={async ({ reasons }) => {
          try {
            if (!submissionId || !healthCheckId) return
            setVoting(true)
            await voteOnHealthCheck(submissionId, healthCheckId, 'yes', reasons)
            toast.success('Vote recorded')
            setIsApproveOpen(false)
            router.push(appConfig.routes.Home)
            router.refresh()
          } catch (e) {
            console.error(e)
            toast.error('Vote failed')
          } finally {
            setVoting(false)
          }
        }}
      />
    </div>
  )
}
