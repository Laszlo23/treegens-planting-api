'use client'

import { RewardClaimStatusPill } from '@/components/submission-detail/RewardClaimStatusPill'
import type { PlanterSubmissionBadge } from '@/utils/planterSubmissionBadge'

function BadgeRow({ meta }: { meta: PlanterSubmissionBadge }) {
  const Icon = meta.Icon
  return (
    <div className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-2.5 py-1.5">
      <Icon
        className="h-3.5 w-3.5 shrink-0"
        style={{ color: meta.color }}
        aria-hidden
      />
      <span className="text-sm font-semibold text-gray-800">{meta.label}</span>
    </div>
  )
}

type Props = {
  rewardClaimDisplay: boolean | null
  statusMeta: PlanterSubmissionBadge | null
}

export function SubmissionStatusBadges({
  rewardClaimDisplay,
  statusMeta,
}: Props) {
  return (
    <div className="flex flex-row flex-wrap items-center justify-end gap-1.5 self-end">
      {rewardClaimDisplay !== null ? (
        <RewardClaimStatusPill claimed={rewardClaimDisplay} />
      ) : statusMeta ? (
        <BadgeRow meta={statusMeta} />
      ) : null}
    </div>
  )
}
