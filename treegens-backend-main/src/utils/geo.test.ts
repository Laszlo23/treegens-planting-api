import assert from 'node:assert/strict'
import test from 'node:test'
import { haversineMeters } from './geo'

test('haversineMeters is ~0 for same point', () => {
  const m = haversineMeters(40.7128, -74.006, 40.7128, -74.006)
  assert.ok(m < 1)
})

test('haversineMeters short distance is plausible', () => {
  const m = haversineMeters(40.7128, -74.006, 40.713, -74.0061)
  assert.ok(m > 10 && m < 50)
})
