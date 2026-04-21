'use client'

import type { MlVerificationSummary } from '@/types'

type Props = {
  summary?: MlVerificationSummary | null
}

function mlDetailLine(summary: MlVerificationSummary): string | null {
  const parts: string[] = []
  if (summary.uniqueTreeEstimate != null) {
    parts.push(`est. unique trees: ${summary.uniqueTreeEstimate}`)
  }
  if (summary.totalTreeDetections != null) {
    parts.push(`detections: ${summary.totalTreeDetections}`)
  }
  if (summary.imagesEvaluated != null) {
    parts.push(`frames: ${summary.imagesEvaluated}`)
  }
  return parts.length ? parts.join(' · ') : null
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
  const detail = mlDetailLine(summary)
  if (summary.aggregatePass === true) {
    return (
      <div className="text-xs font-medium text-emerald-800">
        <p>
          AI verification: passed
          {summary.modelVersion ? ` (${summary.modelVersion})` : ''}
        </p>
        {detail ? (
          <p className="mt-0.5 font-normal text-emerald-900/90">{detail}</p>
        ) : null}
      </div>
    )
  }
  if (summary.aggregatePass === false) {
    return (
      <div className="text-xs font-medium text-red-800">
        <p>
          AI verification: did not pass automated checks
          {summary.modelVersion ? ` (${summary.modelVersion})` : ''}
        </p>
        {detail ? (
          <p className="mt-0.5 font-normal text-red-900/90">{detail}</p>
        ) : null}
      </div>
    )
  }
  return null
}
