import { createThirdwebClient } from 'thirdweb'

/**
 * Empty NEXT_PUBLIC_THIRDWEB_CLIENT_ID breaks `next build` (static prerender).
 * Use a real Client ID from https://thirdweb.com/dashboard for production wallets.
 */
const clientId =
  process.env.NEXT_PUBLIC_THIRDWEB_CLIENT_ID?.trim() ||
  '00000000000000000000000000000000'

export const client = createThirdwebClient({ clientId })
