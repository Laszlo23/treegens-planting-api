'use client'

import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import {
  IoCallOutline,
  IoCheckmarkCircle,
  IoFlagOutline,
  IoPersonOutline,
} from 'react-icons/io5'
import { HiArrowLeft } from 'react-icons/hi2'
import { defaultChain } from '@/config/thirdwebChain'
import { client } from '@/config/thirdwebConfig'
import { routes } from '@/config/appConfig'
import { ProfileWalletInfo } from '@/components/profile/ProfileWalletInfo'
import { useAuth } from '@/contexts/AuthProvider'
import { useUser } from '@/contexts/UserProvider'
import { patchCurrentUserProfile } from '@/services/app'
import {
  validateProfileForm,
  type ProfileFormData,
} from '@/utils/profileValidation'
import {
  useActiveAccount,
  useActiveWallet,
  useConnectModal,
  getLastAuthProvider,
  useDisconnect,
  useWalletDetailsModal,
} from 'thirdweb/react'
import {
  createWallet,
  inAppWallet,
  type InAppWalletAuth,
  type WalletId,
} from 'thirdweb/wallets'

const LAST_WALLET_ID_KEY = 'treegens_last_wallet_id'
const LAST_WALLET_ADDRESS_KEY = 'treegens_last_wallet_address'
const LAST_AUTH_PROVIDER_KEY = 'treegens_last_auth_provider'

/** `Colors.secondary` from mobile — icon tint */
const ICON = '#4d341e'

export default function Profile() {
  const router = useRouter()
  const { user, isLoading: userLoading, fetchUser } = useUser()
  const { signOut, token } = useAuth()
  const [formData, setFormData] = useState<ProfileFormData>({})
  const [isSaving, setIsSaving] = useState(false)
  const [isSigningOut, setIsSigningOut] = useState(false)

  const activeAccount = useActiveAccount()
  const activeWallet = useActiveWallet()
  const walletDetailsModal = useWalletDetailsModal()
  const { connect: openConnectModal, isConnecting: isWalletConnecting } =
    useConnectModal()
  const { disconnect } = useDisconnect()
  const [isProfileConnectFlow, setIsProfileConnectFlow] = useState(false)

  const openWalletDetailsModal = useCallback(() => {
    walletDetailsModal.open({
      client,
      chains: [defaultChain],
      onDisconnect: () => {
        void signOut()
      },
    })
  }, [walletDetailsModal, signOut])

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name,
        phone: user.phone != null ? String(user.phone) : undefined,
        experience: user.experience,
      })
    }
  }, [user])

  const handleInputChange = (field: keyof ProfileFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSave = async () => {
    if (isSaving) return
    if (!token) {
      toast.error('Please sign in to save your profile.')
      return
    }

    const validation = validateProfileForm(formData)
    if (!validation.valid) {
      toast.error(validation.error)
      return
    }

    try {
      setIsSaving(true)
      await patchCurrentUserProfile(validation.normalized)
      await fetchUser()
      toast.success('Profile saved successfully')
    } catch (error) {
      console.error('Error saving user:', error)
      toast.error(
        'Failed to save profile. Please check your network connection and try again.',
      )
    } finally {
      setIsSaving(false)
    }
  }

  const handleOpenWalletProfile = async () => {
    if (!activeAccount) {
      const lastWalletId =
        typeof window !== 'undefined'
          ? localStorage.getItem(LAST_WALLET_ID_KEY)
          : null
      if (!lastWalletId) {
        toast.error('Please log in again to reconnect your wallet')
        return
      }
      const isInApp =
        lastWalletId === 'inApp' ||
        lastWalletId === 'inAppWallet' ||
        lastWalletId.startsWith('ecosystem.')
      let wallets
      if (isInApp) {
        const lastAuthProvider =
          (typeof window !== 'undefined'
            ? localStorage.getItem(LAST_AUTH_PROVIDER_KEY)
            : null) || (await getLastAuthProvider())
        if (!lastAuthProvider) {
          toast.error('Please log in again to reconnect your wallet')
          return
        }
        wallets = [
          inAppWallet({
            auth: {
              options: [lastAuthProvider as InAppWalletAuth],
            },
          }),
        ]
      } else {
        wallets = [createWallet(lastWalletId as WalletId)]
      }
      setIsProfileConnectFlow(true)
      void openConnectModal({
        client,
        chain: defaultChain,
        wallets,
        walletConnect: {
          projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || '',
        },
        showAllWallets: false,
      })
      return
    }
    openWalletDetailsModal()
  }

  useEffect(() => {
    if (!isProfileConnectFlow || !activeAccount) return
    const lastWalletAddress =
      typeof window !== 'undefined'
        ? localStorage.getItem(LAST_WALLET_ADDRESS_KEY)
        : null
    if (
      lastWalletAddress &&
      activeAccount.address.toLowerCase() !== lastWalletAddress.toLowerCase()
    ) {
      if (activeWallet) {
        void disconnect(activeWallet)
      }
      toast.error('Please connect the wallet you originally logged in with')
      setIsProfileConnectFlow(false)
      return
    }
    openWalletDetailsModal()
    setIsProfileConnectFlow(false)
  }, [
    activeAccount,
    activeWallet,
    disconnect,
    isProfileConnectFlow,
    openWalletDetailsModal,
  ])

  const confirmSignOut = useCallback(() => {
    const ok = window.confirm(
      "Sign out? This will remove your wallet and sign you out. You'll need to sign in again to access your account.",
    )
    if (!ok) return
    void (async () => {
      if (isSigningOut) return
      setIsSigningOut(true)
      try {
        await signOut()
        router.push(routes.Login)
      } catch (error) {
        console.error('Failed to sign out:', error)
        toast.error('Failed to sign out. Please try again.')
      } finally {
        setIsSigningOut(false)
      }
    })()
  }, [isSigningOut, signOut, router])

  if (userLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center bg-white px-4">
        <div
          className="h-10 w-10 animate-spin rounded-full border-2 border-gray-200 border-t-[#27B858]"
          aria-label="Loading"
        />
      </div>
    )
  }

  return (
    <div className="relative min-h-screen flex-1 bg-white">
      {/* `mobile/app/profile.tsx` bottom decoration — `bg-primaryLight` */}
      <div
        className="pointer-events-none absolute bottom-0 left-0 right-0 -z-10 h-1/3 bg-[#E8F7ED]"
        aria-hidden
      />

      {/* ScrollView `contentContainerStyle={{ paddingBottom: 120 }}` */}
      <div className="pb-[120px]">
        {/* `mobile/components/Header.tsx` */}
        <header className="flex flex-row items-center justify-between px-4 py-2">
          <button
            type="button"
            onClick={() => router.back()}
            className="rounded-md p-0.5 text-[#111] hover:bg-gray-100"
            aria-label="Back"
          >
            <HiArrowLeft className="h-6 w-6" />
          </button>
          <h1 className="text-[22px] font-bold text-[#111]">
            {user?.name ? 'My Profile' : 'Create Profile'}
          </h1>
          <div className="w-6 shrink-0" aria-hidden />
        </header>

        <div className="px-4">
          {/* Profile picture — `logo` in circle, `#ececec` */}
          <div className="mb-6 flex justify-center">
            <div className="relative h-20 w-20 overflow-hidden rounded-full bg-[#ececec]">
              <Image
                src="/img/treegens-logo.svg"
                alt=""
                fill
                className="object-cover"
                sizes="80px"
                priority
              />
            </div>
          </div>

          {/* Form — `gap-4`, rounded-full border `#d1d5db`, icon `marginRight: 12` */}
          <div className="mb-6 flex flex-col gap-4">
            <div className="flex flex-row items-center rounded-full border border-[#d1d5db] bg-white px-4">
              <IoPersonOutline
                className="mr-3 shrink-0"
                size={20}
                color={ICON}
                aria-hidden
              />
              <input
                type="text"
                className="min-w-0 flex-1 border-0 bg-transparent py-3 text-base text-[#111] placeholder:text-[#9ca3af] focus:ring-0"
                placeholder="Name"
                value={formData.name ?? ''}
                onChange={e => handleInputChange('name', e.target.value)}
                autoComplete="name"
              />
            </div>
            <div className="flex flex-row items-center rounded-full border border-[#d1d5db] bg-white px-4">
              <IoCallOutline
                className="mr-3 shrink-0"
                size={20}
                color={ICON}
                aria-hidden
              />
              <input
                type="tel"
                className="min-w-0 flex-1 border-0 bg-transparent py-3 text-base text-[#111] placeholder:text-[#9ca3af] focus:ring-0"
                placeholder="Phone no."
                value={formData.phone ?? ''}
                onChange={e => handleInputChange('phone', e.target.value)}
                autoComplete="tel"
              />
            </div>
            <div className="flex flex-row items-center rounded-full border border-[#d1d5db] bg-white px-4">
              <IoFlagOutline
                className="mr-3 shrink-0"
                size={20}
                color={ICON}
                aria-hidden
              />
              <input
                type="text"
                className="min-w-0 flex-1 border-0 bg-transparent py-3 text-base text-[#111] placeholder:text-[#9ca3af] focus:ring-0"
                placeholder="Experience (Optional)"
                value={formData.experience ?? ''}
                onChange={e => handleInputChange('experience', e.target.value)}
              />
            </div>
          </div>

          <div className="flex flex-row items-center justify-between gap-2">
            <ProfileWalletInfo
              onOpenWallet={handleOpenWalletProfile}
              isWalletConnecting={isWalletConnecting}
            />
            {user?.isVerifier ? (
              <div className="flex shrink-0 flex-row items-center gap-1 rounded-full border border-[#86efac] bg-[#dcfce7] px-2 py-1">
                <IoCheckmarkCircle className="text-[#15803d]" size={16} />
                <span className="text-xs font-semibold text-[#166534]">
                  Verifier
                </span>
              </div>
            ) : null}
          </div>

          <div className="mb-4 mt-2 flex w-full justify-end">
            <button
              type="button"
              onClick={() => router.push(routes.Stake)}
              className="rounded-full bg-[#ececec] px-4 py-2 text-[14px] text-[#374151] transition-opacity hover:opacity-90 active:opacity-90"
            >
              {user?.isVerifier ? 'Stake / Unstake TGN' : 'Become a verifier'}
            </button>
          </div>

          {/* Save stacked above Sign out */}
          <div className="w-full pb-6">
            <button
              type="button"
              onClick={() => void handleSave()}
              disabled={isSaving}
              className="mb-3 flex w-full flex-row items-center justify-center gap-2 rounded-full border py-3 text-base font-medium transition-opacity active:opacity-90 disabled:opacity-70"
            >
              {isSaving ? (
                <span
                  className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-white/40 border-t-white"
                  aria-hidden
                />
              ) : null}
              <span>{isSaving ? 'Saving…' : 'Save'}</span>
            </button>
            <button
              type="button"
              onClick={confirmSignOut}
              disabled={isSigningOut}
              className="flex w-full flex-row items-center justify-center gap-2 rounded-full border border-[rgba(241,52,14,0.35)] bg-[#ffdbd3] py-3 text-base font-medium text-[#f1340e] transition-opacity active:opacity-90 disabled:opacity-70"
            >
              {isSigningOut ? (
                <span
                  className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-[#f1340e]/40 border-t-[#f1340e]"
                  aria-hidden
                />
              ) : null}
              <span>{isSigningOut ? 'Signing out…' : 'Sign out'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
