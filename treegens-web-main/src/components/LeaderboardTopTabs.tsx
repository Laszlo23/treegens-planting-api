'use client'

import { Button } from '@/components/ui/Button'
import { usePathname, useRouter } from 'next/navigation'
import { appConfig } from '@/config/appConfig'

export function LeaderboardTopTabs() {
  const router = useRouter()
  const pathname = usePathname()
  const { routes } = appConfig

  return (
    <div className="flex gap-2">
      <Button
        className="grow"
        color={pathname === routes.Leaderboard ? 'success' : 'gray'}
        onClick={() => router.push(routes.Leaderboard)}
      >
        Trees Planted
      </Button>
      <Button
        className="grow"
        color={pathname === routes.LeaderboardFunded ? 'success' : 'gray'}
        onClick={() => router.push(routes.LeaderboardFunded)}
      >
        Trees Funded
      </Button>
    </div>
  )
}
