'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { offlineVideoService } from '@/services/offlineVideoService'
import { isBackendHealthy, wait } from '@/utils/helpers'

interface ConnectivityContextType {
  isUserOnline: boolean
}

const ConnectivityContext = createContext<ConnectivityContextType | undefined>(
  undefined,
)

export const useConnectivity = (): ConnectivityContextType => {
  const context = useContext(ConnectivityContext)
  if (context === undefined) {
    throw new Error(
      'useConnectivity must be used within a ConnectivityProvider',
    )
  }
  return context
}

interface ConnectivityProviderProps {
  children: React.ReactNode
}

export const ConnectivityProvider: React.FC<ConnectivityProviderProps> = ({
  children,
}) => {
  const [isUserOnline, setIsUserOnline] = useState<boolean>(true)

  useEffect(() => {
    const checkConnectivity = async () => {
      const _isOnline = await isBackendHealthy()
      setIsUserOnline(_isOnline)
      // First load background sync
      if (_isOnline) {
        offlineVideoService.triggerBackgroundSync()
      }
    }
    checkConnectivity()

    const onOnline = async () => {
      await wait(5000)
      setIsUserOnline(true)
      await offlineVideoService.triggerBackgroundSync()
      toast.success('Back online! Syncing queued videos...', {
        id: 'connectivity-status',
      })
    }

    const onOffline = () => {
      setIsUserOnline(false)
      toast('You are offline. Videos will be queued for upload.', {
        id: 'connectivity-status',
        icon: '📴',
        duration: 5000,
      })
    }

    window.addEventListener('online', onOnline)
    window.addEventListener('offline', onOffline)

    return () => {
      window.removeEventListener('online', onOnline)
      window.removeEventListener('offline', onOffline)
    }
  }, [])

  return (
    <ConnectivityContext.Provider value={{ isUserOnline }}>
      {children}
    </ConnectivityContext.Provider>
  )
}
