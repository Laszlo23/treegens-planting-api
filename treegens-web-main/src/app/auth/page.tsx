'use client'

import { routes } from '@/config/appConfig'
import { defaultChain } from '@/config/thirdwebChain'
import { client } from '@/config/thirdwebConfig'
import { treegensWallets } from '@/config/treegensWallets'
import { useAuth } from '@/contexts/AuthProvider'
import { offlineVideoService } from '@/services/offlineVideoService'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { useActiveAccount, useConnectModal } from 'thirdweb/react'

/**
 * Matches `mobile/app/auth.tsx`: one black “Sign in” opens the wallet flow,
 * then we show a loader while the JWT challenge/sign-in runs, then navigate home.
 */
export default function AuthPage() {
  const router = useRouter()
  const { connect: openConnectModal } = useConnectModal()
  const account = useActiveAccount()
  const {
    isAuthenticated,
    isLoading: authContextLoading,
    authenticate,
    token,
  } = useAuth()

  const [pendingSignIn, setPendingSignIn] = useState(false)
  const [isAuthenticating, setIsAuthenticating] = useState(false)
  const authAttemptRef = useRef(false)
  const [serviceWorkerVersion, setServiceWorkerVersion] = useState<
    string | null
  >(offlineVideoService.activeVersion)

  useEffect(() => {
    let isMounted = true
    offlineVideoService
      .getServiceWorkerVersion()
      .then(version => {
        if (!isMounted) return
        if (version) {
          setServiceWorkerVersion(version)
        } else if (offlineVideoService.activeVersion) {
          setServiceWorkerVersion(offlineVideoService.activeVersion)
        }
      })
      .catch(error => {
        console.warn('[Login] Failed to read SW version:', error)
      })
    return () => {
      isMounted = false
    }
  }, [])

  useEffect(() => {
    if (
      !pendingSignIn ||
      !account?.address ||
      isAuthenticated ||
      isAuthenticating ||
      authAttemptRef.current
    ) {
      return
    }
    authAttemptRef.current = true
    ;(async () => {
      setIsAuthenticating(true)
      try {
        await authenticate(true)
        router.replace(routes.Home)
      } finally {
        setPendingSignIn(false)
        setIsAuthenticating(false)
        authAttemptRef.current = false
      }
    })()
  }, [
    pendingSignIn,
    account?.address,
    isAuthenticated,
    isAuthenticating,
    authenticate,
    router,
  ])

  const handleSignInPress = () => {
    setPendingSignIn(true)
    openConnectModal({
      client,
      chain: defaultChain,
      wallets: treegensWallets,
      walletConnect: {
        projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || '',
      },
      showAllWallets: true,
    }).catch(() => {
      setPendingSignIn(false)
    })
  }

  if (authContextLoading && !isAuthenticated && !token) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-lime-green-2" />
      </div>
    )
  }

  if (isAuthenticated && token) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-lime-green-2" />
      </div>
    )
  }

  if (isAuthenticating) {
    return (
      <div className="relative min-h-screen w-full">
        <div className="absolute inset-0 -z-10">
          <Image src="/img/treegens-bg.png" alt="" fill />
        </div>
        <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-6">
          <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-lime-green-2" />
          <p className="text-center text-white">Signing you in…</p>
        </div>
      </div>
    )
  }

  return (
    <main className="relative h-full w-full min-h-screen">
      <div className="absolute inset-0 -z-10">
        <Image src="/img/treegens-bg.png" alt="Background" fill />
      </div>

      <div className="flex min-h-screen flex-col justify-between px-5 pb-20 pt-[200px]">
        <div className="mx-auto flex flex-col items-center gap-2">
          <Image
            src="/img/treegens-logo.svg"
            alt="Logo"
            width={81}
            height={80}
          />
          <Image
            src="/img/treegens-text.svg"
            alt="Treegens"
            width={191}
            height={60}
            priority
          />
          <span className="text-sm font-semibold text-[#d3e165]">
            Plant Trees, Get Rewarded
          </span>
          {serviceWorkerVersion && (
            <span className="text-[8px] text-lime-green-2">
              {serviceWorkerVersion}
            </span>
          )}
        </div>

        <div className="mx-auto flex w-4/5 max-w-md flex-col items-center gap-3">
          <div className="w-[60%] max-w-xs">
            <button
              type="button"
              onClick={handleSignInPress}
              className="flex w-full items-center justify-center rounded-[25px] bg-black px-6 py-3.5 font-semibold text-white disabled:opacity-60"
              disabled={pendingSignIn}
            >
              Sign in
            </button>
          </div>
          <p className="w-full px-1 text-center text-xs leading-5 text-white/85">
            By signing in, you accept our{' '}
            <button
              type="button"
              className="cursor-pointer border-0 bg-transparent p-0 font-medium text-[#d3e165] underline"
              onClick={() => {}}
            >
              Privacy Policy
            </button>
          </p>
        </div>
      </div>
    </main>
  )
}
