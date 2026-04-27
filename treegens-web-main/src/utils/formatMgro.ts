import { formatUnits } from 'viem'

/** Matches mobile Overview: wei → decimal string with locale + max 4 fraction digits */
export function formatMgroCollectedDisplay(
  tokensClaimed?: string | number | null,
): string {
  if (tokensClaimed == null) return '0'
  if (typeof tokensClaimed === 'number') {
    if (!Number.isFinite(tokensClaimed)) return '0'
    return tokensClaimed.toLocaleString(undefined, { maximumFractionDigits: 4 })
  }
  try {
    const value = Number(formatUnits(BigInt(tokensClaimed || '0'), 18))
    return value.toLocaleString(undefined, { maximumFractionDigits: 4 })
  } catch {
    return '0'
  }
}
