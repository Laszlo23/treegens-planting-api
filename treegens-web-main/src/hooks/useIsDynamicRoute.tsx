'use client'
import { useParams, usePathname } from 'next/navigation'
import { useMemo } from 'react'
import { appConfig, tabShellPaths } from '@/config/appConfig'

export function useIsDynamicRoute() {
  const pathname = usePathname()
  const params = useParams()

  const dynamicPathname = useMemo(() => {
    let d = pathname
    Object.entries(params).forEach(([key, value]) => {
      if (typeof value === 'string') {
        d = d.replace(value, `[${key}]`)
      }
    })
    return d
  }, [pathname, params])

  const isTabShellRoute = tabShellPaths.includes(pathname)
  const { routes } = appConfig
  const isLeaderboardRoute =
    pathname === routes.Leaderboard || pathname === routes.LeaderboardFunded

  const isDynamicTitleRoute =
    !isTabShellRoute && appConfig.dynamicTitleRoutes.includes(dynamicPathname)

  const dynamicTitle = appConfig.dynamicTitleRoutesMap[dynamicPathname]

  return {
    isDynamicTitleRoute,
    isTabShellRoute,
    isLeaderboardRoute,
    dynamicTitle,
    dynamicPathname,
  }
}
