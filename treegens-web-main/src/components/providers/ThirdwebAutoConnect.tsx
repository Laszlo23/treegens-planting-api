'use client'

import { AutoConnect } from 'thirdweb/react'
import { defaultChain } from '@/config/thirdwebChain'
import { client } from '@/config/thirdwebConfig'
import { treegensWallets } from '@/config/treegensWallets'

/**
 * Restores the last connected wallet on reload (parity with `mobile/modules/providers/Thirdweb.tsx`).
 */
export function ThirdwebAutoConnect() {
  return (
    <AutoConnect
      client={client}
      chain={defaultChain}
      wallets={treegensWallets}
    />
  )
}
