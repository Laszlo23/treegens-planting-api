import assert from 'node:assert/strict'
import test from 'node:test'
import RewardAllocation from '../models/RewardAllocation'
import { RewardService } from './rewardService'

function makeSubmission() {
  return {
    _id: '507f1f77bcf86cd799439011',
    status: 'approved',
  } as any
}

test('handleSubmissionApproved enqueues planter claim for new allocation', async () => {
  const service = new RewardService() as any
  const submission = makeSubmission()

  service.ensureAllocationFromApprovedSubmission = async () => ({
    created: true,
  })
  let enqueueCalls = 0
  service.rewardClaimQueueService = {
    enqueueOrReuseClaimJob: async () => {
      enqueueCalls += 1
      return { job: { jobId: 'job-1' } }
    },
  }

  const originalFindOne = RewardAllocation.findOne
  ;(RewardAllocation as any).findOne = async () => ({
    _id: 'alloc-1',
    planterWallet: '0xplanter',
  })

  try {
    const result = await service.handleSubmissionApproved(submission)
    assert.equal(result.allocationCreated, true)
    assert.equal(result.claimJobEnqueued, true)
    assert.equal(result.claimJobId, 'job-1')
    assert.equal(enqueueCalls, 1)
  } finally {
    ;(RewardAllocation as any).findOne = originalFindOne
  }
})

test('handleSubmissionApproved does not enqueue when allocation already exists', async () => {
  const service = new RewardService() as any
  const submission = makeSubmission()

  service.ensureAllocationFromApprovedSubmission = async () => ({
    created: false,
  })
  let enqueueCalls = 0
  service.rewardClaimQueueService = {
    enqueueOrReuseClaimJob: async () => {
      enqueueCalls += 1
      return { job: { jobId: 'job-1' } }
    },
  }

  const originalFindOne = RewardAllocation.findOne
  ;(RewardAllocation as any).findOne = async () => ({
    _id: 'alloc-1',
    planterWallet: '0xplanter',
  })

  try {
    const result = await service.handleSubmissionApproved(submission)
    assert.equal(result.allocationCreated, false)
    assert.equal(result.claimJobEnqueued, false)
    assert.equal(enqueueCalls, 0)
  } finally {
    ;(RewardAllocation as any).findOne = originalFindOne
  }
})

test('handleSubmissionApproved is non-blocking when enqueue fails', async () => {
  const service = new RewardService() as any
  const submission = makeSubmission()

  service.ensureAllocationFromApprovedSubmission = async () => ({
    created: true,
  })
  service.rewardClaimQueueService = {
    enqueueOrReuseClaimJob: async () => {
      throw new Error('queue unavailable')
    },
  }

  const originalFindOne = RewardAllocation.findOne
  ;(RewardAllocation as any).findOne = async () => ({
    _id: 'alloc-1',
    planterWallet: '0xplanter',
  })

  try {
    const result = await service.handleSubmissionApproved(submission)
    assert.equal(result.allocationCreated, true)
    assert.equal(result.claimJobEnqueued, false)
  } finally {
    ;(RewardAllocation as any).findOne = originalFindOne
  }
})
