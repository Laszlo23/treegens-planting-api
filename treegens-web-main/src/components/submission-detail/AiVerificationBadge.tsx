'use client'

import type { MlVerificationSummary } from '@/types'

type Props = {
  summary?: MlVerificationSummary | null
}

/**
 * Compact label for YOLO/metadata verification from the planting API (advisory; not human review).
 */
export function AiVerificationBadge({ summary }: Props) {
  if (!summary) return null
  if (summary.error) {
    const err =
      summary.error.length > 96
        ? `${summary.error.slice(0, 96)}…`
        : summary.error
    return (
      <p className="text-xs font-medium text-amber-800">
        AI verification: unavailable ({err})
      </p>
    )
  }
  if (summary.aggregatePass === true) {
    return (
      <p className="text-xs font-medium text-emerald-800">
        AI verification: passed
        {summary.modelVersion ? ` (${summary.modelVersion})` : ''}
      </p>
    )
  }
  if (summary.aggregatePass === false) {
    return (
      <p className="text-xs font-medium text-red-800">
        AI verification: did not pass automated checks
        {summary.modelVersion ? ` (${summary.modelVersion})` : ''}
      </p>
    )
  }
  return null
}
