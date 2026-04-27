'use client'

import {
  IoCheckmarkCircleOutline,
  IoCheckmarkDoneOutline,
} from 'react-icons/io5'

type Props = {
  claimed: boolean
}

export function RewardClaimStatusPill({ claimed }: Props) {
  const palette = claimed
    ? { bg: 'bg-green-100', color: 'text-green-800' }
    : { bg: 'bg-blue-100', color: 'text-blue-900' }
  const Icon = claimed ? IoCheckmarkDoneOutline : IoCheckmarkCircleOutline
  return (
    <div
      className={`inline-flex items-center gap-0.5 rounded-full px-2.5 py-1.5 ${palette.bg}`}
    >
      <Icon className={`h-3.5 w-3.5 ${palette.color}`} aria-hidden />
      <span className={`text-xs font-medium ${palette.color}`}>
        {claimed ? 'Claimed' : 'Approved'}
      </span>
    </div>
  )
}
