import type { Vote } from '@/types'

/**
 * Builds one paragraph per `no` vote.
 */
export function buildRejectionParagraphs(votes: Vote[] | undefined): {
  paragraphs: string[]
} {
  const list = votes ?? []
  const noVotes = list.filter(v => v.vote === 'no')
  const paragraphs = noVotes
    .map(v => {
      const reasons = v.reasons ?? []
      return reasons
        .map(r => r.trim())
        .filter(Boolean)
        .join(' ')
    })
    .filter(Boolean)

  return { paragraphs }
}
