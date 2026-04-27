import assert from 'node:assert/strict'
import { afterEach, test } from 'node:test'
import Submission from '../models/Submission'
import User from '../models/User'
import VerifierWarning from '../models/VerifierWarning'
import UserService from './userService'

const originalUserFindOne = User.findOne
const originalWarningFindOne = VerifierWarning.findOne
const originalSubmissionFindById = Submission.findById

function chainWithValue<T>(value: T) {
  return {
    select() {
      return this
    },
    sort() {
      return this
    },
    async lean() {
      return value
    },
  }
}

afterEach(() => {
  ;(User.findOne as any) = originalUserFindOne
  ;(VerifierWarning.findOne as any) = originalWarningFindOne
  ;(Submission.findById as any) = originalSubmissionFindById
})

test('returns hidden banner when user is not verifier', async () => {
  ;(User.findOne as any) = () =>
    chainWithValue({ isVerifier: false, verifierWarningCount: 2 })

  const service = new UserService()
  const result = await service.getVerifierWarningBanner('0xAbc')

  assert.equal(result.shouldShow, false)
  assert.equal(result.warningCount, 0)
})

test('returns first warning banner for single warning', async () => {
  ;(User.findOne as any) = () =>
    chainWithValue({ isVerifier: true, verifierWarningCount: 1 })
  ;(VerifierWarning.findOne as any) = () =>
    chainWithValue({
      submissionId: '507f1f77bcf86cd799439011',
      createdAt: new Date('2026-01-10T00:00:00.000Z'),
    })
  ;(Submission.findById as any) = () =>
    chainWithValue({ userWalletAddress: '0xplanter' })

  const service = new UserService()
  const result = await service.getVerifierWarningBanner('0xAbc')

  assert.equal(result.shouldShow, true)
  assert.equal(result.warningCount, 1)
  assert.equal(result.messageVariant, 'first')
  assert.equal(result.submissionId, '507f1f77bcf86cd799439011')
  assert.equal(result.submissionOwnerWalletAddress, '0xplanter')
})

test('returns again warning banner for second warning', async () => {
  ;(User.findOne as any) = () =>
    chainWithValue({ isVerifier: true, verifierWarningCount: 2 })
  ;(VerifierWarning.findOne as any) = () =>
    chainWithValue({
      submissionId: '507f191e810c19729de860ea',
      createdAt: new Date('2026-01-11T00:00:00.000Z'),
    })
  ;(Submission.findById as any) = () =>
    chainWithValue({ userWalletAddress: '0xowner' })

  const service = new UserService()
  const result = await service.getVerifierWarningBanner('0xAbc')

  assert.equal(result.shouldShow, true)
  assert.equal(result.warningCount, 2)
  assert.equal(result.messageVariant, 'again')
})

test('hides banner when only consumed warning records remain', async () => {
  ;(User.findOne as any) = () =>
    chainWithValue({ isVerifier: true, verifierWarningCount: 1 })
  ;(VerifierWarning.findOne as any) = () => chainWithValue(null)

  const service = new UserService()
  const result = await service.getVerifierWarningBanner('0xAbc')

  assert.equal(result.shouldShow, false)
  assert.equal(result.warningCount, 1)
  assert.equal(result.messageVariant, 'first')
})

test('queries warnings newest first by createdAt', async () => {
  let capturedSort: Record<string, unknown> | undefined
  ;(User.findOne as any) = () =>
    chainWithValue({ isVerifier: true, verifierWarningCount: 2 })
  ;(VerifierWarning.findOne as any) = () => ({
    sort(sortSpec: Record<string, unknown>) {
      capturedSort = sortSpec
      return this
    },
    async lean() {
      return {
        submissionId: '507f191e810c19729de860eb',
        createdAt: new Date('2026-01-12T00:00:00.000Z'),
      }
    },
  })
  ;(Submission.findById as any) = () =>
    chainWithValue({ userWalletAddress: '0xowner' })

  const service = new UserService()
  await service.getVerifierWarningBanner('0xAbc')

  assert.deepEqual(capturedSort, { createdAt: -1 })
})
