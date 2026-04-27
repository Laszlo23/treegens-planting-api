'use client'

import axios from 'axios'
import React, { createContext, useContext, useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { resolveName } from 'thirdweb/extensions/ens'
import { useActiveAccount } from 'thirdweb/react'
import {
  offlineVideoService,
  QueueStatus,
} from '@/services/offlineVideoService'
import {
  cacheUser,
  cacheVideos,
  readCachedUser,
  readCachedVideos,
} from '@/utils/helpers'
import { client } from '../config/thirdwebConfig'
import {
  getCurrentUser,
  getUserVideos,
  patchCurrentUserProfile,
} from '../services/app'
import { IUserProfile, IVideo } from '../types'
import { useAuth } from './AuthProvider'
import { useConnectivity } from './ConnectivityProvider'

interface UserContextType {
  user: IUserProfile | null
  isLoading: boolean
  fetchUser: () => Promise<void>
  updateUser: (userData: Partial<IUserProfile>) => Promise<void>
  queueStatus: QueueStatus
  setQueueStatus: (status: QueueStatus) => void
  videos: IVideo[]
  setVideos: (videos: IVideo[]) => void
  videosLoading: boolean
  refetchVideos: () => Promise<void>
}

const UserContext = createContext<UserContextType | undefined>(undefined)

export const useUser = () => {
  const context = useContext(UserContext)
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider')
  }
  return context
}

interface UserProviderProps {
  children: React.ReactNode
}

export const UserProvider: React.FC<UserProviderProps> = ({ children }) => {
  const [user, setUser] = useState<IUserProfile | null>(
    readCachedUser() || null,
  )
  const [isLoading, setIsLoading] = useState(false)
  const [queueStatus, setQueueStatus] = useState<QueueStatus>({
    pending: 0,
    completed: 0,
    failed: 0,
    total: 0,
  })
  const [videos, setVideos] = useState<IVideo[]>(readCachedVideos() || [])
  const [videosLoading, setVideosLoading] = useState<boolean>(false)

  const account = useActiveAccount()
  const activeWalletAddress = account?.address
  const userWalletAddress = user?.walletAddress
  const { isAuthenticated, token } = useAuth()
  const { isUserOnline } = useConnectivity()

  const fetchENSName = async (address: string): Promise<string | undefined> => {
    try {
      const ensName = await resolveName({
        client,
        address,
      })
      return ensName || undefined
    } catch (error) {
      console.log(`No ENS name found for address: ${address}, error: ${error}`)
      return undefined
    }
  }

  const fetchUser = async () => {
    setIsLoading(true)

    try {
      const response = await getCurrentUser()
      setUser(response.data.data)
    } catch (err: unknown) {
      if (axios.isAxiosError(err) && err.response?.status === 404) {
        toast.error(
          'Profile not found. Sign out and sign in again to refresh your session.',
        )
      } else {
        const errorMsg = `Failed to fetch user: ${err instanceof Error ? err.message : JSON.stringify(err)}`
        toast.error(errorMsg)
        console.error('Error fetching user:', err)
      }
    } finally {
      setIsLoading(false)
    }
  }

  const refetchVideos = async () => {
    if (!user?.walletAddress || !token) return
    setVideosLoading(true)
    try {
      if (isUserOnline) {
        const response = await getUserVideos()
        const fetchedVideos = response.data.data.videos.sort((a, b) => {
          return (
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          )
        })
        setVideos(fetchedVideos)
        cacheVideos(fetchedVideos)
      } else {
        setVideos(readCachedVideos() || [])
      }
    } catch (e) {
      console.error('Failed to fetch videos:', e)
    } finally {
      setVideosLoading(false)
    }
  }

  const updateUser = async (userData: Partial<IUserProfile>) => {
    if (!userWalletAddress) {
      const errorMsg = 'No wallet address available'
      toast.error(errorMsg)
      return
    }

    setIsLoading(true)

    try {
      // Fetch ENS name if it's not already set
      let ensName = user?.ensName
      if (!ensName) {
        ensName = await fetchENSName(userWalletAddress)
      }

      const patchBody: {
        name?: string
        phone?: string
        experience?: string
      } = {}
      if (userData.name !== undefined) patchBody.name = userData.name
      if (userData.phone !== undefined) patchBody.phone = String(userData.phone)
      if (userData.experience !== undefined)
        patchBody.experience = userData.experience
      if (ensName && userData.name === undefined && !user?.name) {
        patchBody.name = ensName
      }

      const response = await patchCurrentUserProfile(patchBody)
      setUser(response.data.data)
      toast.success('Profile updated successfully!')
    } catch (err: unknown) {
      const errorMsg = `Failed to update user: ${err instanceof Error ? err.message : JSON.stringify(err)}`
      toast.error(errorMsg)
      console.error('Error updating user:', err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    const hydrateUser = async () => {
      const cachedUser = readCachedUser()
      if (isAuthenticated && token && isUserOnline) {
        fetchUser()
      } else if (cachedUser) {
        try {
          setUser(cachedUser)
        } catch {
          // ignore corrupted cache
        }
      } else if (isUserOnline) {
        setUser(null)
      }
    }
    hydrateUser()
  }, [isAuthenticated, token])

  useEffect(() => {
    refetchVideos()
  }, [user?.walletAddress, isUserOnline])

  useEffect(() => {
    const updateQueueStatus = async () => {
      const status = await offlineVideoService.getQueueStatus()
      setQueueStatus(status)
    }
    updateQueueStatus()

    const handleUploadSuccess = () => {
      toast.success('Queued video uploaded successfully!')
      updateQueueStatus()
      refetchVideos()
    }
    const handleUploadFailure = (event: CustomEvent) => {
      toast.error(`Upload failed: ${event.detail.error}`)
      updateQueueStatus()
    }

    window.addEventListener('offlineUploadSuccess', handleUploadSuccess)
    window.addEventListener(
      'offlineUploadFailure',
      handleUploadFailure as EventListener,
    )

    return () => {
      window.removeEventListener('offlineUploadSuccess', handleUploadSuccess)
      window.removeEventListener(
        'offlineUploadFailure',
        handleUploadFailure as EventListener,
      )
    }
  }, [])

  // Persist user locally to enable offline boot
  useEffect(() => {
    if (typeof window === 'undefined') return
    if (user) cacheUser(user)
  }, [user])

  const contextValue: UserContextType = {
    user,
    isLoading,
    fetchUser,
    updateUser,
    queueStatus,
    setQueueStatus,
    videos,
    setVideos,
    videosLoading,
    refetchVideos,
  }

  return (
    <UserContext.Provider value={contextValue}>{children}</UserContext.Provider>
  )
}
