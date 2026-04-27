'use client'

import { Button } from '@/components/ui/Button'

const DEFAULT_QUEUE =
  'Your claim has been queued and will be processed shortly.'

type Props = {
  variant: 'claim' | 'queue' | 'wait' | 'health_check'
  claimed: number
  detailLabel: string
  detailValue: string
  buttonLabel?: string
  onClaim?: () => void
  onHealthCheck?: () => void
  queueMessage?: string
}

export function ClaimCard({
  variant,
  claimed,
  detailLabel,
  detailValue,
  buttonLabel,
  onClaim,
  onHealthCheck,
  queueMessage = DEFAULT_QUEUE,
}: Props) {
  return (
    <div className="mt-0.5 flex flex-col gap-2 rounded-2xl border border-gray-200 bg-lime-green-1/50 p-3.5">
      <div className="flex flex-row items-center justify-between">
        <span className="text-sm text-gray-500">Total claimed</span>
        <span className="text-sm font-semibold text-gray-900">
          {claimed.toLocaleString()} MGRO
        </span>
      </div>
      <div className="flex flex-row items-center justify-between">
        <span className="text-sm text-gray-500">{detailLabel}</span>
        <span className="text-sm font-semibold text-gray-900">
          {detailValue}
        </span>
      </div>
      {variant === 'queue' ? (
        <div className="mt-2 rounded-xl border border-blue-200 bg-blue-50 px-3 py-2.5">
          <p className="text-center text-lg leading-5 text-blue-900">
            {queueMessage}
          </p>
        </div>
      ) : variant === 'wait' ? null : (
        <Button
          type="button"
          className="mt-2 w-full justify-center rounded-xl py-2.5 font-bold text-white"
          color={
            variant === 'claim' || variant === 'health_check' ? 'green' : 'gray'
          }
          disabled={variant !== 'claim' && variant !== 'health_check'}
          onClick={
            variant === 'health_check'
              ? onHealthCheck
              : variant === 'claim'
                ? onClaim
                : undefined
          }
        >
          {variant === 'health_check' ? 'Health Check' : buttonLabel || 'Claim'}
        </Button>
      )}
    </div>
  )
}
