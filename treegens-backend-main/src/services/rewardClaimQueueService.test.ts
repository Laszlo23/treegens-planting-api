import assert from 'node:assert/strict'
import test from 'node:test'
import {
  buildRewardClaimIdempotencyKey,
  isClaimJobFinalStatus,
} from './rewardClaimQueueService'
import { isRetryableNonceError } from './rewardMintService'

test('buildRewardClaimIdempotencyKey normalizes wallet and includes claim type', () => {
  const key = buildRewardClaimIdempotencyKey('sub123', '0xAbC', 'both')
  assert.equal(key, 'sub123:0xabc:both')
})

test('isClaimJobFinalStatus only true for completed/failed', () => {
  assert.equal(isClaimJobFinalStatus('queued'), false)
  assert.equal(isClaimJobFinalStatus('processing'), false)
  assert.equal(isClaimJobFinalStatus('completed'), true)
  assert.equal(isClaimJobFinalStatus('failed'), true)
})

test('isRetryableNonceError catches nonce-related provider errors', () => {
  assert.equal(
    isRetryableNonceError({
      code: 'NONCE_EXPIRED',
      message: 'nonce has already been used',
    }),
    true,
  )
  assert.equal(
    isRetryableNonceError({
      message: 'nonce too low: next nonce 31, tx nonce 30',
    }),
    true,
  )
  assert.equal(
    isRetryableNonceError({
      message: 'execution reverted',
    }),
    false,
  )
})
