import Submission from '../models/Submission'
import User from '../models/User'
import VerifierWarning from '../models/VerifierWarning'

export type VerifierWarningBanner = {
  shouldShow: boolean
  warningCount: number
  messageVariant: 'first' | 'again'
  submissionId?: string
  submissionOwnerWalletAddress?: string
  healthCheckId?: string
  warnedAt?: string
}

export default class UserService {
  constructor() {
    // User service for managing user data
  }

  async getUserByWalletAddress(walletAddress: string) {
    // Normalize wallet address to lowercase for consistency
    const normalizedWalletAddress = walletAddress.toLowerCase()

    try {
      const user: any = await User.findOne({
        walletAddress: normalizedWalletAddress,
      }).lean()

      if (!user) {
        console.log('User not found for wallet address:', walletAddress)
        return null
      }

      return user
    } catch (error) {
      console.error('Error in getUserByWalletAddress:', error)
      throw error
    }
  }

  async getUserWithComputedTrees(walletAddress: string) {
    // Normalize wallet address to lowercase for consistency
    const normalizedWalletAddress = walletAddress.toLowerCase()

    try {
      const user = await User.findOne({
        walletAddress: normalizedWalletAddress,
      }).lean()

      if (!user) {
        console.log('User not found for wallet address:', walletAddress)
        return null
      }

      // Trees are credited on approval transition and persisted on User.
      return user
    } catch (error) {
      console.error('Error in getUserWithComputedTrees:', error)
      throw error
    }
  }

  async getTreesPlantedLeaderboard(
    page: number = 1,
    limit: number = 10,
  ): Promise<
    Array<{
      walletAddress: string
      name: string | undefined
      treesPlanted: number
      createdAt: Date
    }>
  > {
    const pageNum = Math.max(1, Math.floor(Number(page)) || 1)
    const limitRaw = Math.floor(Number(limit)) || 10
    const limitNum = Math.min(50, Math.max(1, limitRaw))
    const skip = (pageNum - 1) * limitNum

    try {
      const rows = await User.find({ treesPlanted: { $gt: 0 } })
        .sort({ treesPlanted: -1, createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .select({
          walletAddress: 1,
          name: 1,
          treesPlanted: 1,
          createdAt: 1,
          _id: 0,
        })
        .lean()

      return rows.map(u => ({
        walletAddress: u.walletAddress,
        name: u.name,
        treesPlanted: u.treesPlanted ?? 0,
        createdAt: u.createdAt,
      }))
    } catch (error) {
      console.error('Error in getTreesPlantedLeaderboard:', error)
      throw error
    }
  }

  async updateUserProfile(
    walletAddress: string,
    updates: {
      name?: string
      phone?: string
      experience?: string
    },
  ) {
    const normalizedWalletAddress = walletAddress.toLowerCase()
    const sanitizedUpdates: {
      name?: string
      phone?: string
      experience?: string
    } = {}

    if (updates.name !== undefined) {
      sanitizedUpdates.name = updates.name
    }
    if (updates.phone !== undefined) {
      sanitizedUpdates.phone = updates.phone
    }
    if (updates.experience !== undefined) {
      sanitizedUpdates.experience = updates.experience
    }

    try {
      return await User.findOneAndUpdate(
        { walletAddress: normalizedWalletAddress },
        { $set: sanitizedUpdates },
        { new: true, runValidators: true },
      ).lean()
    } catch (error) {
      console.error('Error in updateUserProfile:', error)
      throw error
    }
  }

  async getVerifierWarningBanner(
    walletAddress: string,
  ): Promise<VerifierWarningBanner> {
    const normalizedWalletAddress = walletAddress.toLowerCase()
    const user = await User.findOne({
      walletAddress: normalizedWalletAddress,
    })
      .select({ isVerifier: 1, verifierWarningCount: 1 })
      .lean()

    if (!user || !user.isVerifier) {
      return {
        shouldShow: false,
        warningCount: 0,
        messageVariant: 'first',
      }
    }

    const warningCount = Number(user.verifierWarningCount || 0)
    if (warningCount <= 0) {
      return {
        shouldShow: false,
        warningCount: 0,
        messageVariant: 'first',
      }
    }

    const latestWarning = await VerifierWarning.findOne({
      walletAddress: normalizedWalletAddress,
      healthCheckId: { $exists: false },
      consumedBySlashAt: { $exists: false },
    })
      .sort({ createdAt: -1 })
      .lean()

    if (!latestWarning) {
      return {
        shouldShow: false,
        warningCount,
        messageVariant: warningCount >= 2 ? 'again' : 'first',
      }
    }

    const submission = await Submission.findById(latestWarning.submissionId)
      .select({ userWalletAddress: 1 })
      .lean()

    return {
      shouldShow: true,
      warningCount,
      messageVariant: warningCount >= 2 ? 'again' : 'first',
      submissionId: String(latestWarning.submissionId),
      submissionOwnerWalletAddress: submission?.userWalletAddress,
      healthCheckId: latestWarning.healthCheckId
        ? String(latestWarning.healthCheckId)
        : undefined,
      warnedAt: latestWarning.createdAt
        ? new Date(latestWarning.createdAt).toISOString()
        : undefined,
    }
  }
}
