'use client'

import { offlineVideoService } from '@/services/offlineVideoService'
import {
  removeCachedUser,
  removeCachedVideos,
  removeNeverShowPWA,
} from '@/utils/helpers'
import { AxiosError } from 'axios'
import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react'
import toast from 'react-hot-toast'
import {
  getLastAuthProvider,
  useActiveAccount,
  useActiveWallet,
  useDisconnect,
  useIsAutoConnecting,
} from 'thirdweb/react'
import { defaultChain } from '@/config/thirdwebChain'
import { AuthService } from '../services/authService'
import { useConnectivity } from './ConnectivityProvider'

// Authentication context types
interface AuthContextType {
  isAuthenticated: boolean
  isLoading: boolean
  token: string | null
  authenticate: (force?: boolean) => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)
const LAST_WALLET_ID_KEY = 'treegens_last_wallet_id'
const LAST_WALLET_ADDRESS_KEY = 'treegens_last_wallet_address'
const LAST_AUTH_PROVIDER_KEY = 'treegens_last_auth_provider'

// Hook to use authentication context
export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

interface AuthProviderProps {
  children: React.ReactNode
}

/**
 * AuthProvider manages JWT token authentication state
 * Integrates with thirdweb wallet connection for signing challenges
 */
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [token, setToken] = useState<string | null>(
    AuthService.getToken() || null,
  )
  const lastAuthAttemptAtRef = useRef<number | null>(null)
  const signOutInFlightRef = useRef(false)
  const prevAccountAddressRef = useRef<string | undefined>(undefined)

  const { disconnect } = useDisconnect()
  const account = useActiveAccount()
  const activeWallet = useActiveWallet()
  const isAutoConnecting = useIsAutoConnecting()
  const { isUserOnline } = useConnectivity()

  /**
   * Authenticate user with current wallet account
   */
  const authenticate = async (force = false): Promise<void> => {
    if (!account?.address) {
      toast.error('Please connect your wallet first')
      return
    }

    if (!force) {
      const lastAttemptAt = lastAuthAttemptAtRef.current
      if (lastAttemptAt && Date.now() - lastAttemptAt < 30000) {
        return
      }
    }

    lastAuthAttemptAtRef.current = Date.now()
    setIsLoading(true)
    try {
      const chainId = activeWallet?.getChain()?.id ?? defaultChain.id
      const jwtToken = await AuthService.authenticateWithWallet(
        account,
        chainId,
      )
      if (typeof window !== 'undefined' && activeWallet?.id) {
        localStorage.setItem(LAST_WALLET_ID_KEY, activeWallet.id)
        localStorage.setItem(
          LAST_WALLET_ADDRESS_KEY,
          account.address.toLowerCase(),
        )
        const isInAppWallet =
          activeWallet.id === 'inApp' ||
          activeWallet.id.startsWith('ecosystem.')
        if (isInAppWallet) {
          const lastAuthProvider = await getLastAuthProvider()
          if (lastAuthProvider) {
            localStorage.setItem(LAST_AUTH_PROVIDER_KEY, lastAuthProvider)
          }
        }
      }
      setToken(jwtToken)
      setIsAuthenticated(true)
      toast.success('Signed in!')
    } catch (error) {
      console.error('Authentication failed:', error)
      const axiosError = error as AxiosError<{
        error?: string
        message?: string
      }>
      const backendMessage =
        axiosError.response?.data?.error || axiosError.response?.data?.message
      const fallbackMessage =
        error instanceof Error
          ? error.message
          : 'Authentication failed. Please try again.'
      toast.error(backendMessage || fallbackMessage)
      setIsAuthenticated(false)
      setToken(null)
    } finally {
      setIsLoading(false)
    }
  }

  /**
   * Sign out user
   */
  const signOut = async (): Promise<void> => {
    if (signOutInFlightRef.current) return
    signOutInFlightRef.current = true
    setIsLoading(true)
    try {
      await AuthService.signOut()
      removeCachedUser()
      removeCachedVideos()
      removeNeverShowPWA()
      if (typeof window !== 'undefined') {
        localStorage.removeItem(LAST_WALLET_ID_KEY)
        localStorage.removeItem(LAST_WALLET_ADDRESS_KEY)
        localStorage.removeItem(LAST_AUTH_PROVIDER_KEY)
      }
      setToken(null)
      setIsAuthenticated(false)
      if (activeWallet) {
        await disconnect(activeWallet)
      }
      toast.success('Signed out successfully')
    } catch (error) {
      console.error('Error during signout:', error)
      // Still clear local state even if backend call fails
      setToken(null)
      setIsAuthenticated(false)
      toast.success('Signed out successfully')
    } finally {
      signOutInFlightRef.current = false
      setIsLoading(false)
    }
  }

  /** Wallet disconnect → app sign-out (same idea as mobile `useWallet` `onDisconnect`). */
  useEffect(() => {
    if (isAutoConnecting) return

    const addr = account?.address
    const hadAddr = prevAccountAddressRef.current

    if (hadAddr && !addr && isAuthenticated && token) {
      void signOut()
    }

    prevAccountAddressRef.current = addr
  }, [account?.address, isAutoConnecting, isAuthenticated, token, signOut])

  /**
   * Check authentication status on mount using stored token only
   */
  useEffect(() => {
    const checkAuthStatus = async () => {
      const storedToken = AuthService.getToken()

      if (!storedToken) {
        setIsAuthenticated(false)
        setIsLoading(false)
        setToken(null)
        return
      }

      if (!isUserOnline) {
        setIsLoading(false)
        setIsAuthenticated(true)
        setToken(storedToken)
        return
      }

      setIsLoading(true)
      try {
        const verifyResponse = await AuthService.verifyToken(storedToken)
        if (verifyResponse.isValid) {
          setToken(storedToken)
          setIsAuthenticated(true)
          await offlineVideoService.pushAuthTokenToServiceWorker(storedToken)
        } else {
          await signOut()
        }
      } catch (error) {
        // If verification fails (e.g., network), allow due to offline-first
        console.error('Token verification failed on init:', error)
        setToken(storedToken)
        setIsAuthenticated(true)
      } finally {
        setIsLoading(false)
      }
    }

    checkAuthStatus()
  }, [isUserOnline])

  // Whenever token changes, send it to the Service Worker
  useEffect(() => {
    const syncToken = async () => {
      await offlineVideoService.pushAuthTokenToServiceWorker(token ?? null)
    }
    syncToken()
  }, [token])

  const contextValue: AuthContextType = {
    isAuthenticated,
    isLoading,
    token,
    authenticate,
    signOut,
  }

  return (
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
  )
}
