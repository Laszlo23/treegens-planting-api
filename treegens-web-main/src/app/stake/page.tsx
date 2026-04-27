'use client'

import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import { HiArrowLeft, HiArrowPath } from 'react-icons/hi2'
import {
  getContract,
  prepareContractCall,
  readContract,
  sendTransaction,
  waitForReceipt,
} from 'thirdweb'
import { defaultChain } from '@/config/thirdwebChain'
import { useActiveAccount, useSwitchActiveWalletChain } from 'thirdweb/react'
import type { Abi } from 'viem'
import {
  TGN_TOKEN_ADDRESS as TOKEN_ADDRESS,
  TGN_TOKEN_DECIMALS as TOKEN_DECIMALS,
  TGN_VAULT_ADDRESS as VAULT_ADDRESS,
  VALIDATORS_MINIMUM_TGN_TOKENS,
} from '@/config/tgnContracts'
import { client } from '@/config/thirdwebConfig'
import {
  checkVerifierStatus,
  getCurrentUser,
  requestVerifierStatus,
} from '@/services/app'

// Minimal ERC20 ABI
const ERC20_ABI = [
  {
    name: 'balanceOf',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'owner', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'allowance',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: 'owner', type: 'address' },
      { name: 'spender', type: 'address' },
    ],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'approve',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'spender', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [{ name: '', type: 'bool' }],
  },
  {
    name: 'symbol',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'string' }],
  },
  {
    name: 'decimals',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint8' }],
  },
] as const satisfies Abi

// Minimal TGNVault ABI parts we need
const VAULT_ABI = [
  {
    name: 'stake',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'amount', type: 'uint256' }],
    outputs: [],
  },
  {
    name: 'unstake',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'amount', type: 'uint256' }],
    outputs: [],
  },
  {
    name: 'getStakedBalance',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'staker', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
] as const satisfies Abi

function formatAmount(amount: bigint, decimals = TOKEN_DECIMALS): string {
  const negative = amount < 0n
  const value = negative ? -amount : amount
  const base = 10n ** BigInt(decimals)
  const integer = value / base
  const fraction = (value % base)
    .toString()
    .padStart(decimals, '0')
    .replace(/0+$/, '')
  return `${negative ? '-' : ''}${integer.toString()}${fraction ? '.' + fraction : ''}`
}

function parseAmount(input: string, decimals = TOKEN_DECIMALS): bigint | null {
  const trimmed = input.trim()
  if (!trimmed) return null
  if (!/^\d*(?:\.\d*)?$/.test(trimmed)) return null
  const [whole, frac = ''] = trimmed.split('.')
  if (frac.length > decimals) return null
  const fracPadded = (frac + '0'.repeat(decimals)).slice(0, decimals)
  try {
    return (
      BigInt(whole || '0') * 10n ** BigInt(decimals) + BigInt(fracPadded || '0')
    )
  } catch {
    return null
  }
}

function sleep(ms: number) {
  return new Promise<void>(resolve => setTimeout(resolve, ms))
}

export default function StakePage() {
  const router = useRouter()
  const account = useActiveAccount()
  const switchChain = useSwitchActiveWalletChain()
  const [isVerifier, setIsVerifier] = useState<boolean>(false)
  const tokenContract = useMemo(
    () =>
      getContract({
        client,
        chain: defaultChain,
        address: TOKEN_ADDRESS,
        abi: ERC20_ABI,
      }),
    [],
  )
  const vaultContract = useMemo(
    () =>
      getContract({
        client,
        chain: defaultChain,
        address: VAULT_ADDRESS,
        abi: VAULT_ABI,
      }),
    [],
  )

  const [symbol, setSymbol] = useState<string>('TGN')
  const [tokenBalance, setTokenBalance] = useState<string>('0')
  const [stakedBalance, setStakedBalance] = useState<string>('0')
  const [stakedBalanceWei, setStakedBalanceWei] = useState<bigint>(0n)
  const [inputAmount, setInputAmount] = useState<string>('')
  const [unstakeAmount, setUnstakeAmount] = useState<string>('')
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [isApproving, setIsApproving] = useState<boolean>(false)
  const [isUnstaking, setIsUnstaking] = useState<boolean>(false)
  const [isRequestingVerifier, setIsRequestingVerifier] =
    useState<boolean>(false)
  const [isSyncingBalances, setIsSyncingBalances] = useState<boolean>(false)
  const [allowanceWei, setAllowanceWei] = useState<bigint>(0n)
  const [activeTab, setActiveTab] = useState<'stake' | 'unstake'>('stake')

  const MIN_VERIFIER_TOKENS = BigInt(Number(VALIDATORS_MINIMUM_TGN_TOKENS))
  const MIN_VERIFIER_WEI = MIN_VERIFIER_TOKENS * 10n ** BigInt(TOKEN_DECIMALS)

  const meetsVerifierStakeThreshold = useMemo(
    () => stakedBalanceWei >= MIN_VERIFIER_WEI,
    [stakedBalanceWei, MIN_VERIFIER_WEI],
  )

  const refreshAllowance = useCallback(async (): Promise<bigint> => {
    if (!account?.address) {
      setAllowanceWei(0n)
      return 0n
    }
    const allowance = (await readContract({
      contract: tokenContract,
      method: 'allowance',
      params: [account.address, VAULT_ADDRESS],
    })) as bigint
    setAllowanceWei(allowance)
    return allowance
  }, [account?.address, tokenContract])

  const loadBalances = useCallback(async () => {
    if (!account?.address) return
    try {
      const [bal, staked, sym] = await Promise.all([
        readContract({
          contract: tokenContract,
          method: 'balanceOf',
          params: [account.address],
        }) as Promise<bigint>,
        readContract({
          contract: vaultContract,
          method: 'getStakedBalance',
          params: [account.address],
        }) as Promise<bigint>,
        readContract({
          contract: tokenContract,
          method: 'symbol',
          params: [],
        }).catch(() => 'TGN') as Promise<string>,
      ])
      setTokenBalance(formatAmount(bal))
      setStakedBalance(formatAmount(staked))
      setStakedBalanceWei(staked)
      if (sym) setSymbol(sym)
      await refreshAllowance()
    } catch (err) {
      console.error('Failed to load balances:', err)
      toast.error('Failed to load balances')
    }
  }, [account?.address, tokenContract, vaultContract, refreshAllowance])

  const syncVerifierFromApi = useCallback(async () => {
    if (!account?.address) return
    try {
      const { data } = await checkVerifierStatus(account.address)
      setIsVerifier(Boolean(data?.data?.isVerifier))
    } catch {
      setIsVerifier(false)
    }
  }, [account?.address])

  const refreshScreen = useCallback(async () => {
    await loadBalances()
    await syncVerifierFromApi()
  }, [loadBalances, syncVerifierFromApi])

  useEffect(() => {
    void loadBalances()
  }, [loadBalances])

  useEffect(() => {
    if (!account?.address) {
      setIsLoading(false)
      setIsApproving(false)
      setIsUnstaking(false)
      setIsRequestingVerifier(false)
      setIsSyncingBalances(false)
      setInputAmount('')
      setUnstakeAmount('')
      setTokenBalance('0')
      setStakedBalance('0')
      setStakedBalanceWei(0n)
      setAllowanceWei(0n)
      setSymbol('TGN')
      setIsVerifier(false)
    } else {
      void syncVerifierFromApi()
    }
  }, [account?.address, syncVerifierFromApi])

  const handleSyncBalances = async () => {
    try {
      setIsSyncingBalances(true)
      await refreshScreen()
    } finally {
      setIsSyncingBalances(false)
    }
  }

  const handleApprove = async () => {
    if (!account?.address) {
      toast.error('Connect your wallet first')
      return
    }

    const amountWei = parseAmount(inputAmount)
    if (amountWei === null || amountWei <= 0n) {
      toast.error('Enter a valid amount')
      return
    }

    try {
      setIsApproving(true)
      await switchChain(defaultChain)

      const currentAllowance = await refreshAllowance()
      if (currentAllowance >= amountWei) {
        toast('Approval already sufficient for this amount.', { icon: 'ℹ️' })
        return
      }

      if (currentAllowance > 0n) {
        const resetTx = prepareContractCall({
          contract: tokenContract,
          method: 'approve',
          params: [VAULT_ADDRESS, 0n],
        })
        const resetRes = await sendTransaction({
          account,
          transaction: resetTx,
        })
        await waitForReceipt(resetRes)
      }

      const approveTx = prepareContractCall({
        contract: tokenContract,
        method: 'approve',
        params: [VAULT_ADDRESS, amountWei],
      })
      const approveRes = await sendTransaction({
        account,
        transaction: approveTx,
      })
      await waitForReceipt(approveRes)

      let updatedAllowance = 0n
      for (let attempt = 0; attempt < 15; attempt++) {
        updatedAllowance = await refreshAllowance()
        if (updatedAllowance >= amountWei) break
        await sleep(400)
      }

      if (updatedAllowance < amountWei) {
        throw new Error('Approval not reflected yet. Please try again.')
      }

      toast.success('Approval successful. You can now stake.')
    } catch (err: unknown) {
      console.error('Approve failed:', err)
      const message =
        typeof err === 'string'
          ? err
          : (err as Error)?.message || 'Approval failed'
      toast.error(message)
    } finally {
      setIsApproving(false)
    }
  }

  const handleStake = async () => {
    if (!account?.address) {
      toast.error('Connect your wallet first')
      return
    }

    const amountWei = parseAmount(inputAmount)
    if (amountWei === null || amountWei <= 0n) {
      toast.error('Enter a valid amount')
      return
    }

    try {
      setIsLoading(true)
      await switchChain(defaultChain)

      const currentAllowance = await refreshAllowance()
      if (currentAllowance < amountWei) {
        toast.error('Approval required before staking. Tap Approve first.')
        return
      }

      const stakeTx = prepareContractCall({
        contract: vaultContract,
        method: 'stake',
        params: [amountWei],
      })
      const stakeRes = await sendTransaction({ account, transaction: stakeTx })
      await waitForReceipt(stakeRes)

      const nextStakedWei = stakedBalanceWei + amountWei
      setStakedBalanceWei(nextStakedWei)
      setStakedBalance(formatAmount(nextStakedWei))

      const prevTokenWei = parseAmount(tokenBalance) ?? 0n
      const nextTokenWei =
        prevTokenWei >= amountWei ? prevTokenWei - amountWei : 0n
      setTokenBalance(formatAmount(nextTokenWei))

      await refreshAllowance()
      await syncVerifierFromApi()

      toast.success('Stake successful')
      setInputAmount('')
    } catch (err: unknown) {
      console.error('Stake failed:', err)
      const message = (err as Error)?.message || 'Transaction failed'
      toast.error(message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleUnstake = async () => {
    if (!account?.address) {
      toast.error('Connect your wallet first')
      return
    }

    const amountWei = parseAmount(unstakeAmount)
    if (amountWei === null || amountWei <= 0n) {
      toast.error('Enter a valid amount')
      return
    }

    try {
      setIsUnstaking(true)

      await switchChain(defaultChain)

      const unstakeTx = prepareContractCall({
        contract: vaultContract,
        method: 'unstake',
        params: [amountWei],
      })
      const unstakeRes = await sendTransaction({
        account,
        transaction: unstakeTx,
      })
      await waitForReceipt(unstakeRes)

      const nextStakedWei =
        stakedBalanceWei >= amountWei ? stakedBalanceWei - amountWei : 0n
      setStakedBalanceWei(nextStakedWei)
      setStakedBalance(formatAmount(nextStakedWei))

      const prevTokenWei = parseAmount(tokenBalance) ?? 0n
      const nextTokenWei = prevTokenWei + amountWei
      setTokenBalance(formatAmount(nextTokenWei))

      try {
        await requestVerifierStatus(account.address)
      } catch {
        /* low-key: no toast — backend may re-evaluate / revoke verifier when stake drops */
      }
      await syncVerifierFromApi()

      setUnstakeAmount('')
      toast.success('Unstake successful')
    } catch (err: unknown) {
      console.error('Unstake failed:', err)
      const message = (err as Error)?.message || 'Transaction failed'
      toast.error(message)
    } finally {
      setIsUnstaking(false)
    }
  }

  const handleRequestVerifier = async () => {
    if (!account?.address) {
      toast.error('Connect your wallet first')
      return
    }

    // Check stake requirement on-chain first
    if (stakedBalanceWei < MIN_VERIFIER_WEI) {
      toast.error(
        `You need at least ${VALIDATORS_MINIMUM_TGN_TOKENS} TGN staked to request verifier`,
      )
      return
    }

    try {
      setIsRequestingVerifier(true)
      const { data } = await requestVerifierStatus(account.address)
      const granted = data.data.eligible
      if (granted) {
        toast.success('Congrats! You are now a verifier!')
      } else {
        toast('You are not eligible yet', { icon: 'ℹ️' })
      }
      const userRes = await getCurrentUser()
      setIsVerifier(Boolean(userRes.data.data.isVerifier))
      await loadBalances()
    } catch (err: unknown) {
      console.error('Verifier request failed:', err)
      const message = (err as Error)?.message || 'Request failed'
      toast.error(message)
    } finally {
      setIsRequestingVerifier(false)
    }
  }

  const isStakeTab = activeTab === 'stake'
  const activeAmount = isStakeTab ? inputAmount : unstakeAmount
  const setActiveAmount = isStakeTab ? setInputAmount : setUnstakeAmount
  const stakeAmountWei = parseAmount(inputAmount)
  const hasValidStakeAmount = stakeAmountWei != null && stakeAmountWei > 0n
  const needsApproval =
    isStakeTab && hasValidStakeAmount && allowanceWei < (stakeAmountWei ?? 0n)
  const isActionLoading = isStakeTab ? isLoading || isApproving : isUnstaking
  const canApprove =
    !!account?.address && hasValidStakeAmount && !isActionLoading
  const canStake =
    !!account?.address &&
    hasValidStakeAmount &&
    !needsApproval &&
    !isActionLoading
  const canUnstake = !!account?.address && !isActionLoading

  return (
    <div className="relative min-h-screen flex-1 bg-white">
      <div
        className="pointer-events-none absolute bottom-0 left-0 right-0 -z-10 h-1/3 bg-[#E8F7ED]"
        aria-hidden
      />

      <header className="flex flex-row items-center justify-between border-b border-gray-100 px-4 py-2">
        <button
          type="button"
          onClick={() => router.back()}
          className="rounded-md p-0.5 text-[#111] hover:bg-gray-100"
          aria-label="Back"
        >
          <HiArrowLeft className="h-6 w-6" />
        </button>
        <h1 className="text-[22px] font-bold text-[#111]">Stake</h1>
        <button
          type="button"
          onClick={() => void handleSyncBalances()}
          disabled={!account?.address || isSyncingBalances}
          className="rounded-md p-0.5 text-[#111] hover:bg-gray-100 disabled:opacity-40"
          aria-label="Refresh balances"
        >
          <HiArrowPath
            className={`h-6 w-6 ${isSyncingBalances ? 'animate-spin' : ''}`}
          />
        </button>
      </header>

      <div className="px-5 pb-12 pt-4">
        <div className="mb-4 flex flex-row gap-3">
          <div className="flex-1 rounded-xl border border-gray-200 bg-gray-50 p-3">
            <div className="text-xs text-gray-500">Balance</div>
            <div className="mt-1 text-base font-semibold text-gray-900">
              {tokenBalance} {symbol}
            </div>
          </div>
          <div className="flex-1 rounded-xl border border-gray-200 bg-gray-50 p-3">
            <div className="text-xs text-gray-500">Staked</div>
            <div className="mt-1 text-base font-semibold text-gray-900">
              {stakedBalance} {symbol}
            </div>
          </div>
        </div>

        <div className="mb-4 flex justify-center">
          <div className="flex flex-row rounded-full border border-gray-200 bg-gray-100 p-1">
            <button
              type="button"
              onClick={() => setActiveTab('stake')}
              className={`rounded-full px-7 py-2 text-base font-semibold transition-colors ${
                isStakeTab
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500'
              }`}
            >
              Stake
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('unstake')}
              className={`rounded-full px-7 py-2 text-base font-semibold transition-colors ${
                !isStakeTab
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500'
              }`}
            >
              Unstake
            </button>
          </div>
        </div>

        <div className="mb-4 flex flex-col">
          <label
            htmlFor="stake-amount"
            className="mb-2 block text-xs font-semibold text-gray-700"
          >
            Enter amount
          </label>
          <div className="flex flex-row items-center rounded-xl border border-gray-300 bg-white">
            <input
              id="stake-amount"
              type="text"
              inputMode="decimal"
              placeholder="0.0"
              value={activeAmount}
              onChange={e => setActiveAmount(e.target.value)}
              disabled={!account?.address || isActionLoading}
              className="min-w-0 flex-1 border-0 bg-transparent p-3 pr-2 text-base text-gray-900 placeholder:text-gray-400 focus:ring-0 disabled:bg-gray-50"
            />
            <button
              type="button"
              onClick={() =>
                isStakeTab
                  ? setInputAmount(tokenBalance)
                  : setUnstakeAmount(stakedBalance)
              }
              disabled={!account?.address || isActionLoading}
              className="mr-2 rounded-md border border-gray-200 bg-gray-100 px-2.5 py-1.5 text-xs font-semibold text-[#435f24] disabled:opacity-50"
            >
              Max
            </button>
          </div>

          {isStakeTab ? (
            <button
              type="button"
              onClick={needsApproval ? handleApprove : handleStake}
              disabled={needsApproval ? !canApprove : !canStake}
              className="mt-5 flex min-w-[160px] items-center justify-center self-center rounded-xl bg-gray-800 px-8 py-3 disabled:opacity-50"
            >
              {isActionLoading ? (
                <span
                  className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white"
                  aria-hidden
                />
              ) : (
                <span className="text-base font-semibold text-white">
                  {needsApproval ? 'Approve' : 'Stake'}
                </span>
              )}
            </button>
          ) : (
            <button
              type="button"
              onClick={handleUnstake}
              disabled={!canUnstake}
              className="mt-5 flex min-w-[160px] items-center justify-center self-center rounded-xl bg-gray-800 px-8 py-3 disabled:opacity-50"
            >
              {isUnstaking ? (
                <span
                  className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white"
                  aria-hidden
                />
              ) : (
                <span className="text-base font-semibold text-white">
                  Unstake
                </span>
              )}
            </button>
          )}
        </div>

        {!isVerifier && (
          <div className="my-4 rounded-lg border border-green-200 bg-green-50 p-3">
            {meetsVerifierStakeThreshold ? (
              <div className="flex flex-row items-center justify-between gap-3">
                <p className="flex-1 text-sm text-gray-700">
                  You&apos;ve staked enough to
                </p>
                <button
                  type="button"
                  onClick={handleRequestVerifier}
                  disabled={!account?.address || isRequestingVerifier}
                  className="inline-flex shrink-0 items-center justify-center gap-2 rounded-full bg-green-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
                >
                  {isRequestingVerifier ? (
                    <>
                      <span
                        className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white"
                        aria-hidden
                      />
                      <span>Requesting...</span>
                    </>
                  ) : (
                    'Become a verifier'
                  )}
                </button>
              </div>
            ) : (
              <p className="mt-0.5 text-center text-sm text-gray-700">
                You need at least{' '}
                <span className="font-semibold">
                  {VALIDATORS_MINIMUM_TGN_TOKENS} {symbol}
                </span>{' '}
                staked to become a verifier
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
