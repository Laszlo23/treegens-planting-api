import { removeCachedUser } from '@/utils/helpers'
import axios from 'axios'
import { Account } from 'thirdweb/wallets'
import { axiosInstance } from './axiosInstance'
import { getJwtToken, removeJwtToken, setJwtToken } from './jwtTokenStore'

// Types for authentication API responses
export interface AuthChallengeRequest {
  walletAddress: string
}

export interface AuthChallengeResponse {
  message: string
  data: {
    message: string
    nonce: string
    timestamp: string
  }
}

export interface AuthSignInRequest {
  walletAddress: string
  signature: string
  message: string
}

export interface AuthSignInResponse {
  message: string
  data: {
    token: string
    tokenExpiration: string
    user: {
      id: string
      walletAddress: string
      authProvider: string
      lastLoginAt: string
    }
  }
}

export interface AuthVerifyResponse {
  message: string
  data: {
    user: {
      userId: string
      walletAddress: string
      authProvider: string
    }
    message?: string
  }
}

/**
 * Authentication service for handling JWT token authentication with wallet signing
 */
export class AuthService {
  /**
   * Get JWT token from local storage
   */
  static getToken(): string | null {
    return getJwtToken()
  }

  /**
   * Store JWT token in local storage
   */
  static setToken(token: string): void {
    setJwtToken(token)
  }

  /**
   * Remove JWT token from local storage
   */
  static removeToken(): void {
    removeJwtToken()
  }

  /**
   * Check if user has a valid JWT token
   */
  static hasToken(): boolean {
    return !!this.getToken()
  }

  /**
   * Step 1: Get challenge message and nonce from backend
   */
  static async getChallenge(
    walletAddress: string,
  ): Promise<AuthChallengeResponse> {
    const response = await axiosInstance.post<AuthChallengeResponse>(
      '/api/auth/challenge',
      { walletAddress },
    )
    return response.data
  }

  /**
   * Step 2: Sign the challenge message with user's wallet
   */
  static async signChallengeMessage(
    account: Account,
    message: string,
    chainId?: number,
  ): Promise<string> {
    try {
      const signature = chainId
        ? await account.signMessage({ message, chainId })
        : await account.signMessage({ message })
      return signature
    } catch (error) {
      console.error('Error signing message:', error)
      throw new Error('Failed to sign challenge message')
    }
  }

  /**
   * Step 3: Send signed message to backend to get JWT token
   */
  static async signInWithWallet(
    walletAddress: string,
    signature: string,
    message: string,
  ): Promise<AuthSignInResponse> {
    const response = await axiosInstance.post<AuthSignInResponse>(
      '/api/auth/signin',
      {
        walletAddress,
        signature,
        message,
      },
    )
    return response.data
  }

  /**
   * Verify JWT token with backend
   * GET /api/auth/verify (requires Authorization header)
   */
  static async verifyToken(token: string): Promise<{ isValid: boolean }> {
    try {
      const response = await axiosInstance.get<AuthVerifyResponse>(
        '/api/auth/verify',
        {
          headers: {
            Authorization: token,
          },
        },
      )
      if (response.status === 200) {
        return {
          isValid: true,
        }
      }
      return {
        isValid: false,
      }
    } catch (error) {
      // 401 means the token is invalid
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        return {
          isValid: false,
        }
      }
      // If the verify endpoint doesn't exist (404) or other errors,
      // we'll assume user is offline
      console.log('Token verification endpoint not available:', error)
      throw error instanceof Error ? error : new Error(String(error))
    }
  }

  /**
   * Complete authentication flow: get challenge, sign, and get token
   */
  static async authenticateWithWallet(
    account: Account,
    chainId?: number,
  ): Promise<string> {
    const walletAddress = account.address

    try {
      // Step 0: Remove token and cached user
      this.removeToken()
      removeCachedUser()

      // Step 1: Get challenge
      console.log('Getting challenge for wallet:', walletAddress)
      const challengeResponse = await this.getChallenge(walletAddress)
      const { message } = challengeResponse.data

      // Step 2: Sign the message
      console.log('Signing challenge message...')
      const signature = await this.signChallengeMessage(
        account,
        message,
        chainId,
      )

      // Step 3: Get JWT token
      console.log('Getting JWT token...')
      const signInResponse = await this.signInWithWallet(
        walletAddress,
        signature,
        message,
      )

      const token = signInResponse.data.token

      // Step 4: Store token
      this.setToken(token)

      console.log('Authentication successful')
      return token
    } catch (error) {
      console.error('Authentication failed:', error)
      throw error
    }
  }

  /**
   * Sign out user by invalidating token on backend and removing it locally
   */
  static async signOut(): Promise<void> {
    const token = this.getToken()

    if (token) {
      try {
        // Call backend to invalidate token
        await axiosInstance.post(
          '/api/auth/signout',
          {},
          {
            headers: {
              Authorization: token,
            },
          },
        )
        console.log('Successfully signed out from backend')
      } catch (error: unknown) {
        // Log the error but continue with local cleanup
        if (error instanceof Error && 'response' in error) {
          const axiosError = error as {
            response?: { status?: number; data?: unknown }
          }
          if (axiosError.response?.status === 401) {
            console.log(
              'Token already invalid on backend:',
              axiosError.response.data,
            )
          } else {
            console.error('Error during backend signout:', error)
          }
        } else {
          console.error('Error during backend signout:', error)
        }
      }
    }

    // Always remove token locally, regardless of backend call result
    this.removeToken()
  }
}
