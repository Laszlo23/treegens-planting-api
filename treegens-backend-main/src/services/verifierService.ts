import { ethers } from 'ethers'
import env from '../config/environment'
import User from '../models/User'
import SubmissionService from './submissionService'

// Minimal ABI with only the function we need
const TGN_VAULT_ABI = [
  {
    inputs: [{ internalType: 'address', name: 'staker', type: 'address' }],
    name: 'getStakedBalance',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
]

class VerifierService {
  private provider: ethers.JsonRpcProvider
  private vaultAddress: string
  private tokenDecimals: number
  private eligibilityThresholdTokens: bigint
  private contract: ethers.Contract
  private submissionService: SubmissionService
  constructor() {
    const rpcUrl = env.BASE_SEPOLIA_RPC_URL
    if (!rpcUrl) {
      throw new Error(
        'BASE_SEPOLIA_RPC_URL is required for verifier functionality',
      )
    }

    this.provider = new ethers.JsonRpcProvider(rpcUrl)
    this.vaultAddress = env.TGN_VAULT_ADDRESS as string
    this.tokenDecimals = env.TGN_DECIMALS as number
    // Configure minimum tokens from env (token units, not wei)
    try {
      const minTokens = env.VALIDATORS_MINIMUM_TGN_TOKENS
      this.eligibilityThresholdTokens =
        typeof minTokens === 'bigint' ? minTokens : BigInt(minTokens)
    } catch {
      this.eligibilityThresholdTokens = 2000n
    }
    this.contract = new ethers.Contract(
      this.vaultAddress,
      TGN_VAULT_ABI,
      this.provider,
    )
    this.submissionService = new SubmissionService()
  }

  private async triggerPendingSubmissionResolution(reason: string) {
    try {
      const result =
        await this.submissionService.attemptResolvePendingSubmissions()
      console.log('[VerifierService] Pending submission resolution complete', {
        reason,
        processed: result.processed,
        resolved: result.resolved,
        totalVerifiers: result.totalVerifiers,
      })
    } catch (error: any) {
      console.error('[VerifierService] Pending submission resolution failed', {
        reason,
        message: error?.message,
      })
    }
  }

  toWeiTokens(tokensBigInt: bigint) {
    const decimals = BigInt(this.tokenDecimals)
    const scale = 10n ** decimals
    return tokensBigInt * scale
  }

  async getStakedBalance(walletAddress: string) {
    const balance = await this.contract.getStakedBalance(walletAddress)
    // ethers v6 returns BigInt-like (BigNumberish -> bigint)
    return BigInt(balance.toString())
  }

  async isEligibleByWallet(walletAddress: string) {
    const balance = await this.getStakedBalance(walletAddress)
    const thresholdWei = this.toWeiTokens(this.eligibilityThresholdTokens)
    return { eligible: balance >= thresholdWei, balanceWei: balance }
  }

  async requestVerifier(walletAddress: string) {
    const { eligible, balanceWei } =
      await this.isEligibleByWallet(walletAddress)
    const normalized = walletAddress.toLowerCase()
    const existingUser = await User.findOne({
      walletAddress: normalized,
    }).select('isVerifier')

    const updates: any = {}
    if (eligible) {
      updates.isVerifier = true
      updates.verifierSince = new Date()
    } else {
      updates.isVerifier = false
      updates.verifierSince = undefined
    }

    await User.findOneAndUpdate(
      { walletAddress: normalized },
      { $set: updates },
      { new: true },
    )

    if (eligible && !existingUser?.isVerifier) {
      await this.triggerPendingSubmissionResolution('requestVerifier')
    }

    return {
      eligible,
      balanceWei: balanceWei.toString(),
      balanceTokens: Number(balanceWei) / 10 ** this.tokenDecimals,
    }
  }

  async refreshVerifiers() {
    const verifiers = await User.find({ isVerifier: true }).lean()
    const thresholdWei = this.toWeiTokens(this.eligibilityThresholdTokens)

    const results: any[] = []
    let changed = false
    for (const v of verifiers) {
      try {
        const balance = await this.getStakedBalance(v.walletAddress)
        const stillEligible = balance >= thresholdWei
        if (!stillEligible) {
          await User.updateOne(
            { walletAddress: v.walletAddress.toLowerCase() },
            { $set: { isVerifier: false }, $unset: { verifierSince: '' } },
          )
          changed = true
        }
        results.push({
          walletAddress: v.walletAddress,
          balanceWei: balance.toString(),
          removed: !stillEligible,
        })
      } catch (err) {
        const e: any = err
        results.push({ walletAddress: v.walletAddress, error: e.message })
      }
    }
    if (changed) {
      await this.triggerPendingSubmissionResolution('refreshVerifiers')
    }
    return results
  }
}

export default VerifierService
