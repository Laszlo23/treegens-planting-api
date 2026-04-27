import assert from 'node:assert/strict'
import test from 'node:test'
import {
  calculateRewardStatusProjection,
  computeLatestDueCheckpointOneBased,
  computeSurvivalPlanterTargetCumulativeWei,
  getClaimScheduleConfig,
} from './rewardService'

function makeBaseAllocation() {
  const approvedAt = new Date('2026-01-01T00:00:00.000Z')
  return {
    _id: 'alloc-1',
    submissionId: '507f1f77bcf86cd799439011',
    approvedAt,
    planterWallet: '0xplanter',
    planterTotalWei: '600',
    verifierPoolWei: '0',
    verifierRewardWei: '0',
    yesVoterCount: 0,
    verifierClaims: [],
    tranches: [
      {
        index: 0,
        amountWei: '100',
        unlockAt: new Date('2026-01-01T00:00:00.000Z'),
        status: 'paid',
      },
      {
        index: 1,
        amountWei: '100',
        unlockAt: new Date('2026-07-01T00:00:00.000Z'),
        status: 'pending',
      },
      {
        index: 2,
        amountWei: '100',
        unlockAt: new Date('2027-01-01T00:00:00.000Z'),
        status: 'pending',
      },
      {
        index: 3,
        amountWei: '100',
        unlockAt: new Date('2027-07-01T00:00:00.000Z'),
        status: 'pending',
      },
      {
        index: 4,
        amountWei: '100',
        unlockAt: new Date('2028-01-01T00:00:00.000Z'),
        status: 'pending',
      },
      {
        index: 5,
        amountWei: '100',
        unlockAt: new Date('2028-07-01T00:00:00.000Z'),
        status: 'pending',
      },
    ],
  }
}

test('returns NEXT_CLAIM when next tranche not yet due', () => {
  const allocation = makeBaseAllocation()
  const now = new Date('2026-02-01T00:00:00.000Z')
  const status = calculateRewardStatusProjection(
    allocation as any,
    '0xplanter',
    now,
  )

  assert.equal(status.displayState, 'NEXT_CLAIM')
  assert.equal(status.claimedAmountWei, '100')
  assert.equal(status.pendingClaimAmountWei, '0')
  assert.equal(status.nextClaimAmountWei, '100')
  assert.equal(status.canClaim, false)
})

test('returns one missed interval as pending claim', () => {
  const allocation = makeBaseAllocation()
  const now = new Date('2026-09-01T00:00:00.000Z')
  const status = calculateRewardStatusProjection(
    allocation as any,
    '0xplanter',
    now,
  )

  assert.equal(status.displayState, 'PENDING_CLAIM')
  assert.equal(status.pendingClaimAmountWei, '100')
  assert.equal(status.intervalsMissed, 1)
  assert.equal(status.nextClaimAmountWei, null)
  assert.equal(status.canClaim, true)
})

test('aggregates multiple missed intervals as pending claim', () => {
  const allocation = makeBaseAllocation()
  const now = new Date('2027-10-01T00:00:00.000Z')
  const status = calculateRewardStatusProjection(
    allocation as any,
    '0xplanter',
    now,
  )

  assert.equal(status.displayState, 'PENDING_CLAIM')
  assert.equal(status.pendingClaimAmountWei, '300')
  assert.equal(status.intervalsMissed, 3)
  assert.equal(status.canClaim, true)
})

test('returns COMPLETED when all tranches are paid', () => {
  const allocation = makeBaseAllocation()
  allocation.tranches.forEach((t: any) => {
    t.status = 'paid'
  })
  const now = new Date('2028-08-01T00:00:00.000Z')
  const status = calculateRewardStatusProjection(
    allocation as any,
    '0xplanter',
    now,
  )

  assert.equal(status.displayState, 'COMPLETED')
  assert.equal(status.scheduleCompleted, true)
  assert.equal(status.claimedAmountWei, '600')
  assert.equal(status.pendingClaimAmountWei, '0')
  assert.equal(status.canClaim, false)
})

test('returns verifier pending claim projection', () => {
  const allocation = makeBaseAllocation()
  allocation.verifierPoolWei = '100'
  allocation.yesVoterCount = 2
  allocation.verifierRewardWei = '50'
  const submission = {
    votes: [
      { voterWalletAddress: '0xaa', vote: 'yes' },
      { voterWalletAddress: '0xverifier', vote: 'yes' },
    ],
  }
  const status = calculateRewardStatusProjection(
    allocation as any,
    '0xverifier',
    new Date('2026-02-01T00:00:00.000Z'),
    submission as any,
  )

  assert.equal(status.role, 'verifier')
  assert.equal(status.displayState, 'PENDING_CLAIM')
  assert.equal(status.pendingClaimAmountWei, '50')
  assert.equal(status.nextClaimAmountWei, null)
  assert.equal(status.canClaim, true)
})

test('survival projection disables claim when due checkpoint payNow is zero', () => {
  const allocation = makeBaseAllocation()
  const { totalTranches } = getClaimScheduleConfig()
  allocation.treesPlanted = 10
  allocation.planterCumulativePaidWei =
    computeSurvivalPlanterTargetCumulativeWei({
      planterTotalWei: 600n,
      checkpointOneBased: 2,
      initialTrees: 10,
      treesAlive: 0,
      totalTranches,
    }).toString()
  const now = new Date('2026-09-01T00:00:00.000Z')
  const healthChecks = [
    {
      checkpointIndex: 2,
      status: 'approved',
      treesAlive: 0,
      distanceMeters: 0,
    },
  ]
  const status = calculateRewardStatusProjection(
    allocation as any,
    '0xplanter',
    now,
    undefined,
    healthChecks as any,
  )

  assert.equal(status.pendingClaimAmountWei, '0')
  assert.equal(status.canClaim, false)
})

test('latest due checkpoint is capped by tranche count', () => {
  const k = computeLatestDueCheckpointOneBased({
    approvedAt: new Date('2026-01-01T00:00:00.000Z'),
    now: new Date('2028-12-01T00:00:00.000Z'),
    intervalSeconds: 60 * 60 * 24 * 30,
    totalTranches: 6,
  })
  assert.equal(k, 6)
})

test('survival projection allows catch-up claim from latest approved checkpoint', () => {
  const allocation = makeBaseAllocation()
  allocation.tranches[0].status = 'paid'
  allocation.tranches[1].status = 'pending'
  allocation.tranches[2].status = 'pending'
  allocation.tranches[3].status = 'pending'
  allocation.planterCumulativePaidWei = '100'
  allocation.treesPlanted = 10

  const now = new Date('2027-10-01T00:00:00.000Z')
  const healthChecks = [
    {
      checkpointIndex: 4,
      status: 'approved',
      treesAlive: 10,
      distanceMeters: 0,
    },
  ]

  const status = calculateRewardStatusProjection(
    allocation as any,
    '0xplanter',
    now,
    undefined,
    healthChecks as any,
  )

  assert.equal(status.nextPlanterAction, 'claim')
  assert.equal(status.canClaim, true)
  assert.equal(status.pendingClaimAmountWei, '300')
  assert.equal(status.intervalsMissed, 3)
})

test('survival projection requests a health check at latest due checkpoint', () => {
  const allocation = makeBaseAllocation()
  allocation.tranches[0].status = 'paid'
  allocation.tranches[1].status = 'pending'
  allocation.tranches[2].status = 'pending'
  allocation.planterCumulativePaidWei = '100'
  allocation.treesPlanted = 10

  const now = new Date('2027-02-01T00:00:00.000Z')
  const status = calculateRewardStatusProjection(
    allocation as any,
    '0xplanter',
    now,
    undefined,
    [] as any,
  )
  const { intervalSeconds, totalTranches } = getClaimScheduleConfig()
  const expectedCheckpoint = computeLatestDueCheckpointOneBased({
    approvedAt: allocation.approvedAt,
    now,
    intervalSeconds,
    totalTranches,
  })

  assert.equal(status.nextPlanterAction, 'health_check')
  assert.equal(status.healthCheckRequiredForNextClaim, true)
  assert.equal(status.pendingHealthCheckpointIndex, expectedCheckpoint)
})
