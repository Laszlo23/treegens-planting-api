'use client'

import { truncateAddress } from '@/utils/helpers'
import { Blobbie } from 'thirdweb/react'

interface AddressProps {
  address: string
  className?: string
  blobbieSize?: number
}

export function Address({
  address,
  className,
  blobbieSize = 20,
}: AddressProps) {
  return (
    <div className="flex items-center gap-2 min-w-0">
      <Blobbie
        address={address}
        size={blobbieSize}
        className="shrink-0 overflow-hidden rounded-full"
      />
      <span className={className} title={address}>
        {truncateAddress(address)}
      </span>
    </div>
  )
}
