'use client'

import { defaultChain } from '@/config/thirdwebChain'
import {
  Blobbie,
  useActiveAccount,
  useIsAutoConnecting,
  useWalletBalance,
} from 'thirdweb/react'
import { shortenAddress } from 'thirdweb/utils'
import { client } from '@/config/thirdwebConfig'

export type ProfileWalletInfoProps = {
  onOpenWallet: () => void
  isWalletConnecting?: boolean
}

/** Web counterpart of `mobile/components/WalletInfo.tsx`. */
export function ProfileWalletInfo({
  onOpenWallet,
  isWalletConnecting = false,
}: ProfileWalletInfoProps) {
  const account = useActiveAccount()
  const address = account?.address
  const isAutoConnecting = useIsAutoConnecting()
  const { data: bal, isLoading: balLoading } = useWalletBalance({
    address,
    chain: defaultChain,
    client,
  })

  const title = address
    ? shortenAddress(address)
    : isAutoConnecting || isWalletConnecting
      ? 'Reconnecting...'
      : 'Connect wallet'

  return (
    <button
      type="button"
      onClick={onOpenWallet}
      className="flex min-w-0 max-w-[min(100%,260px)] flex-row items-center gap-2 rounded-lg px-1 py-1 text-left transition-colors hover:bg-gray-100 active:opacity-90"
      aria-label="Wallet: open wallet details"
    >
      <Blobbie
        address={address ?? ''}
        size={40}
        className="shrink-0 overflow-hidden rounded-full"
      />
      <div className="min-w-0 flex-1">
        <p className="truncate text-base font-bold text-[#1a1a1a]">{title}</p>
        {(isAutoConnecting || isWalletConnecting) && !address ? (
          <div
            className="mt-1 h-[22px] min-w-[100px] animate-pulse rounded-md bg-gray-200"
            aria-hidden
          />
        ) : address && balLoading ? (
          <div
            className="mt-1 h-4 w-24 animate-pulse rounded bg-gray-200"
            aria-hidden
          />
        ) : address && bal ? (
          <p className="text-[15px] text-[#6b7280]">
            {bal.displayValue} {bal.symbol}
          </p>
        ) : null}
      </div>
    </button>
  )
}
