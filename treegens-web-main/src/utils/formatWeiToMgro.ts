import { formatUnits } from 'viem'

export function formatWeiToMgro(value?: string | null): number {
  if (!value) return 0
  try {
    return Number(formatUnits(BigInt(value), 18))
  } catch {
    return 0
  }
}
