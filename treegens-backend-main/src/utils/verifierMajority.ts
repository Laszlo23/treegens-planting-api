export type VerifierVote = {
  vote: 'yes' | 'no'
}

export function getVoteCounts(votes: VerifierVote[] = []) {
  const yesCount = votes.filter(v => v.vote === 'yes').length
  const noCount = votes.filter(v => v.vote === 'no').length
  return {
    yesCount,
    noCount,
    totalVotes: votes.length,
  }
}

/**
 * Strict majority vs total verifier pool: yes wins if yesCount*2 > totalVerifiers.
 */
export function determineMajorityVote(
  votes: VerifierVote[],
  totalVerifiers: number,
): 'yes' | 'no' | null {
  const { yesCount, noCount } = getVoteCounts(votes)
  if (yesCount * 2 > totalVerifiers) return 'yes'
  if (noCount * 2 > totalVerifiers) return 'no'
  return null
}
