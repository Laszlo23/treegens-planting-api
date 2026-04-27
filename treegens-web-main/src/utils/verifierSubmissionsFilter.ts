import type { VerifierBadge } from '@/utils/verifierModeration'

export type VerifierSubmissionFilter = 'all' | 'pending' | 'voted' | 'unclaimed'

export function submissionMatchesVerifierFilter(
  filter: VerifierSubmissionFilter,
  badge: VerifierBadge,
): boolean {
  if (filter === 'all') return true
  if (filter === 'pending') return badge === 'pending'
  if (filter === 'voted') return badge === 'voted'
  if (filter === 'unclaimed') return badge === 'approved'
  return false
}
