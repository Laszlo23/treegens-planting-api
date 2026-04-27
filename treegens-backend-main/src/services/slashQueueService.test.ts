import assert from 'node:assert/strict'
import test from 'node:test'
import {
  buildSlashIdempotencyKey,
  isSlashJobFinalStatus,
} from './slashQueueService'

test('buildSlashIdempotencyKey normalizes wallet and fixes suffix', () => {
  const key = buildSlashIdempotencyKey('sub123', '0xAbC')
  assert.equal(key, 'sub123:0xabc:slash')
})

test('isSlashJobFinalStatus only true for completed/failed', () => {
  assert.equal(isSlashJobFinalStatus('queued'), false)
  assert.equal(isSlashJobFinalStatus('processing'), false)
  assert.equal(isSlashJobFinalStatus('completed'), true)
  assert.equal(isSlashJobFinalStatus('failed'), true)
})
