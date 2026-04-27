import { Contract, JsonRpcProvider, Wallet } from 'ethers'
import env from '../config/environment'

const TGN_VAULT_SLASH_ABI = [
  {
    inputs: [{ internalType: 'address', name: 'staker', type: 'address' }],
    name: 'slash',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
] as const

export type VaultSlashResult = {
  txHash: string
  blockNumber?: number
}

class VaultSlashService {
  private provider: JsonRpcProvider | null = null
  private wallet: Wallet | null = null

  private ensureReady(): { provider: JsonRpcProvider; wallet: Wallet } {
    const rpcUrl = env.BASE_SEPOLIA_RPC_URL
    if (!rpcUrl) {
      throw new Error(
        'BASE_SEPOLIA_RPC_URL (or RPC_URL) is required for vault slashing',
      )
    }
    const pk = env.TGN_VAULT_SLASHER_PRIVATE_KEY?.trim()
    if (!pk) {
      throw new Error('TGN_VAULT_SLASHER_PRIVATE_KEY is not configured')
    }
    if (!this.provider) {
      this.provider = new JsonRpcProvider(rpcUrl)
    }
    if (!this.wallet) {
      this.wallet = new Wallet(pk, this.provider)
    }
    return { provider: this.provider, wallet: this.wallet }
  }

  isConfigured(): boolean {
    return Boolean(
      env.BASE_SEPOLIA_RPC_URL?.trim() &&
        env.TGN_VAULT_SLASHER_PRIVATE_KEY?.trim(),
    )
  }

  async slash(walletAddress: string): Promise<VaultSlashResult> {
    const { wallet } = this.ensureReady()
    const contract = new Contract(
      env.TGN_VAULT_ADDRESS,
      TGN_VAULT_SLASH_ABI as unknown as [],
      wallet,
    )
    const tx = await contract.slash(walletAddress)
    const receipt = await tx.wait()
    if (!receipt) {
      throw new Error('Vault slash transaction was not mined')
    }
    return {
      txHash: receipt.hash,
      blockNumber: receipt.blockNumber,
    }
  }
}

export default VaultSlashService
