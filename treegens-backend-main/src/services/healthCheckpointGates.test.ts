import assert from 'node:assert/strict'
import test from 'node:test'
import {
  deriveLatestDueHealthCheckpoint,
  isPriorTranchePaidForHealthCheckpoint,
} from './healthCheckService'

test('checkpoint 2 requires tranche index 0 paid', () => {
  assert.equal(
    isPriorTranchePaidForHealthCheckpoint(2, [{ index: 0, status: 'paid' }]),
    true,
  )
  assert.equal(
    isPriorTranchePaidForHealthCheckpoint(2, [{ index: 0, status: 'pending' }]),
    false,
  )
})

test('checkpoint 3 requires tranche index 1 paid', () => {
  assert.equal(
    isPriorTranchePaidForHealthCheckpoint(3, [
      { index: 0, status: 'paid' },
      { index: 1, status: 'paid' },
    ]),
    true,
  )
  assert.equal(
    isPriorTranchePaidForHealthCheckpoint(3, [
      { index: 0, status: 'paid' },
      { index: 1, status: 'pending' },
    ]),
    false,
  )
})

test('deriveLatestDueHealthCheckpoint returns null before checkpoint 2', () => {
  const k = deriveLatestDueHealthCheckpoint({
    approvedAt: new Date('2026-01-01T00:00:00.000Z'),
    now: new Date('2026-01-01T00:00:00.000Z'),
    intervalSeconds: 60 * 60 * 24 * 30,
    totalTranches: 6,
  })
  assert.equal(k, null)
})

test('deriveLatestDueHealthCheckpoint returns latest elapsed checkpoint', () => {
  const k = deriveLatestDueHealthCheckpoint({
    approvedAt: new Date('2026-01-01T00:00:00.000Z'),
    now: new Date('2026-04-05T00:00:00.000Z'),
    intervalSeconds: 60 * 60 * 24 * 30,
    totalTranches: 6,
  })
  assert.equal(k, 4)
})
