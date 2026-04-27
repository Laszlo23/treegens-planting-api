import { useCallback, useEffect, useMemo, useState } from 'react'

interface GeolocationState {
  loading: boolean
  accuracy: number | null
  altitude: number | null
  altitudeAccuracy: number | null
  heading: number | null
  latitude: number | null
  longitude: number | null
  speed: number | null
  timestamp: number | null
  error: string | null
}

interface GeolocationOptions {
  enableHighAccuracy?: boolean
  timeout?: number
  maximumAge?: number
}

// Helper function to check if we're in browser environment
const isBrowser = () =>
  typeof window !== 'undefined' && typeof navigator !== 'undefined'

export const useGeolocation = (options: GeolocationOptions = {}) => {
  const [state, setState] = useState<GeolocationState>({
    loading: false,
    accuracy: null,
    altitude: null,
    altitudeAccuracy: null,
    heading: null,
    latitude: null,
    longitude: null,
    speed: null,
    timestamp: null,
    error: null,
  })

  const [watchId, setWatchId] = useState<number | null>(null)

  // Memoize defaultOptions to prevent infinite re-renders
  const defaultOptions = useMemo(
    (): GeolocationOptions => ({
      enableHighAccuracy: true,
      timeout: 15000, // 15 seconds
      maximumAge: 10000, // 10 seconds
      ...options,
    }),
    [options.enableHighAccuracy, options.timeout, options.maximumAge],
  )

  // Check if geolocation is supported (only in browser)
  const isSupported = useMemo(() => {
    return isBrowser() && 'geolocation' in navigator
  }, [])

  const onSuccess = useCallback((position: GeolocationPosition) => {
    setState({
      loading: false,
      accuracy: position.coords.accuracy,
      altitude: position.coords.altitude,
      altitudeAccuracy: position.coords.altitudeAccuracy,
      heading: position.coords.heading,
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
      speed: position.coords.speed,
      timestamp: position.timestamp,
      error: null,
    })
  }, [])

  const onError = useCallback((error: GeolocationPositionError) => {
    setState((prev: GeolocationState) => ({
      ...prev,
      loading: false,
      error: getErrorMessage(error),
    }))
  }, [])

  const getErrorMessage = (error: GeolocationPositionError): string => {
    switch (error.code) {
      case error.PERMISSION_DENIED:
        return 'Location access denied by user'
      case error.POSITION_UNAVAILABLE:
        return 'Location information unavailable'
      case error.TIMEOUT:
        return 'Location request timed out'
      default:
        return 'An unknown error occurred'
    }
  }

  const getCurrentPosition = useCallback(() => {
    if (!isBrowser()) {
      setState((prev: GeolocationState) => ({
        ...prev,
        error: 'Geolocation is only available in browser environment',
      }))
      return
    }

    if (!isSupported) {
      setState((prev: GeolocationState) => ({
        ...prev,
        error: 'Geolocation is not supported by this browser',
      }))
      return
    }

    setState((prev: GeolocationState) => ({
      ...prev,
      loading: true,
      error: null,
    }))

    navigator.geolocation.getCurrentPosition(onSuccess, onError, defaultOptions)
  }, [onSuccess, onError, defaultOptions, isSupported])

  const watchPosition = useCallback(() => {
    if (!isBrowser()) {
      setState((prev: GeolocationState) => ({
        ...prev,
        error: 'Geolocation is only available in browser environment',
      }))
      return
    }

    if (!isSupported) {
      setState((prev: GeolocationState) => ({
        ...prev,
        error: 'Geolocation is not supported by this browser',
      }))
      return
    }

    setState((prev: GeolocationState) => ({
      ...prev,
      loading: true,
      error: null,
    }))

    const id = navigator.geolocation.watchPosition(
      onSuccess,
      onError,
      defaultOptions,
    )

    setWatchId(id)
    return id
  }, [onSuccess, onError, defaultOptions, isSupported])

  const clearWatch = useCallback(() => {
    if (isBrowser() && watchId !== null) {
      navigator.geolocation.clearWatch(watchId)
      setWatchId(null)
    }
  }, [watchId])

  useEffect(() => {
    return () => {
      if (isBrowser() && watchId !== null) {
        navigator.geolocation.clearWatch(watchId)
      }
    }
  }, [watchId])

  return {
    ...state,
    getCurrentPosition,
    watchPosition,
    clearWatch,
    isSupported,
  }
}
