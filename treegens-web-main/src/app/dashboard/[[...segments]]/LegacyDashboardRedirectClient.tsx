'use client'

import { useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'

/**
 * Replaces `next.config` redirects when `output: 'export'` (IPFS) — redirect API does not run.
 * Maps legacy /dashboard/* paths to current routes.
 */
const LEGACY: Record<string, string> = {
  stake: '/stake',
  'how-to-plant': '/tutorial',
  'new-plant': '/submissions/create',
  'my-plants': '/submissions',
  submissions: '/submissions/review',
  leaderboard: '/leaderboard',
}

export default function LegacyDashboardRedirectClient() {
  const router = useRouter()
  const params = useParams()
  const segments = (params.segments as string[] | undefined) || []

  useEffect(() => {
    if (segments.length === 0) {
      router.replace('/')
      return
    }
    if (segments[0] === 'submissions' && segments.length === 3) {
      const [, userWalletAddress, submissionId] = segments
      router.replace(
        `/submissions/review/${encodeURIComponent(userWalletAddress)}/${encodeURIComponent(submissionId)}`,
      )
      return
    }
    const one = segments[0]
    const to = one ? LEGACY[one] : null
    if (to) {
      router.replace(to)
    } else {
      router.replace('/')
    }
  }, [router, segments])

  return (
    <div
      className="flex min-h-screen items-center justify-center text-slate-500"
      data-testid="legacy-dashboard-redirect"
    >
      Redirecting…
    </div>
  )
}
