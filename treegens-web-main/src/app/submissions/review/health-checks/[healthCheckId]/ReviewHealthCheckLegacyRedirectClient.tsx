'use client'

import { useParams, useRouter } from 'next/navigation'
import { useEffect } from 'react'

/** Legacy path — forwards to `/health-checks/[healthCheckId]` (see mobile redirect). */
export default function ReviewHealthCheckLegacyRedirectClient() {
  const params = useParams()
  const router = useRouter()
  const healthCheckId =
    typeof params.healthCheckId === 'string' ? params.healthCheckId : ''

  useEffect(() => {
    if (!healthCheckId) {
      router.replace('/health-checks')
      return
    }
    const submissionId =
      typeof window !== 'undefined'
        ? new URLSearchParams(window.location.search).get('submissionId') || ''
        : ''
    const q = submissionId
      ? `?submissionId=${encodeURIComponent(submissionId)}`
      : ''
    router.replace(`/health-checks/${encodeURIComponent(healthCheckId)}${q}`)
  }, [healthCheckId, router])

  return null
}
