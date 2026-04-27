/**
 * TGN staking contract config — defaults match `mobile/constants/thirdweb.ts`.
 * Override with `NEXT_PUBLIC_*` env vars (same addresses as `EXPO_PUBLIC_*` on mobile).
 */

export const VALIDATORS_MINIMUM_TGN_TOKENS =
  process.env.NEXT_PUBLIC_VALIDATORS_MINIMUM_TGN_TOKENS || '2000'

export const TGN_VAULT_ADDRESS =
  process.env.NEXT_PUBLIC_TGN_VAULT_ADDRESS ||
  '0x66e003F3318F13b122477E2561c1cf5C5181bc97'

export const TGN_TOKEN_ADDRESS =
  process.env.NEXT_PUBLIC_TGN_TOKEN_ADDRESS ||
  '0xA10336e3e0ee9CC81397db91aC585BA32460Cdcf'

export const TGN_TOKEN_DECIMALS = Number(
  process.env.NEXT_PUBLIC_TGN_TOKEN_DECIMALS || 18,
)
