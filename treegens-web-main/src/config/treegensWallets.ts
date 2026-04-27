import type { Wallet } from 'thirdweb/wallets'
import { createWallet, inAppWallet } from 'thirdweb/wallets'

/**
 * Wallets used across connect flows — must match `AutoConnect` and connect modals
 * so the last wallet can restore on refresh (same idea as `mobile/constants/treegensWallets.ts`).
 */
export const treegensWallets: Wallet[] = [
  inAppWallet(),
  createWallet('io.metamask'),
  createWallet('com.coinbase.wallet'),
  createWallet('me.rainbow'),
]
