import assert from 'node:assert/strict'
import test from 'node:test'
import {
  computeFirstTrancheWei,
  computeSurvivalPlanterPayNow,
  computeSurvivalPlanterTargetCumulativeWei,
} from './rewardService'

test('target cumulative k=2: first tranche plus remainder pool slice (floor)', () => {
  const planterTotalWei = 600n
  const N = 6
  const first = computeFirstTrancheWei(planterTotalWei, N)
  const survivalPool = planterTotalWei - first
  const T = 10
  const treesAlive = 100
  const expected =
    first +
    (survivalPool * BigInt(2 - 1) * BigInt(Math.min(T, treesAlive))) /
      (BigInt(N - 1) * BigInt(T))
  const target = computeSurvivalPlanterTargetCumulativeWei({
    planterTotalWei,
    checkpointOneBased: 2,
    initialTrees: T,
    treesAlive,
    totalTranches: N,
  })
  assert.equal(target, expected)
})

test('k=1 cumulative is first tranche slice only', () => {
  const planterTotalWei = 601n
  const N = 6
  const first = computeFirstTrancheWei(planterTotalWei, N)
  const t1 = computeSurvivalPlanterTargetCumulativeWei({
    planterTotalWei,
    checkpointOneBased: 1,
    initialTrees: 10,
    treesAlive: 0,
    totalTranches: N,
  })
  assert.equal(t1, first)
})

test('payNow is difference to cumulative', () => {
  const pay = computeSurvivalPlanterPayNow({
    planterTotalWei: 600n,
    checkpointOneBased: 1,
    initialTrees: 10,
    treesAlive: 10,
    totalTranches: 6,
    planterCumulativePaidWei: 0n,
  })
  assert.equal(pay, 100n)
})

test('payNow through checkpoints is non-decreasing for fixed survival', () => {
  const planterTotalWei = 600n
  const N = 6
  const T = 10
  const alive = 10
  let paid = 0n
  for (let k = 1; k <= N; k++) {
    const pay = computeSurvivalPlanterPayNow({
      planterTotalWei,
      checkpointOneBased: k,
      initialTrees: T,
      treesAlive: alive,
      totalTranches: N,
      planterCumulativePaidWei: paid,
    })
    assert.ok(pay >= 0n)
    paid += pay
  }
})
