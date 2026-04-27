'use client'
import { appConfig, tabShellPaths } from '@/config/appConfig'
import { useIsDynamicRoute } from '@/hooks/useIsDynamicRoute'
import { offlineVideoService } from '@/services/offlineVideoService'
import cn from 'classnames'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import { Rectangle } from './_components/Rectangle'
import { TreeButton } from './_components/TreeButton'

export const AppBottomNav = () => {
  const router = useRouter()
  const pathname = usePathname()
  const { isLeaderboardRoute } = useIsDynamicRoute()
  const { routes } = appConfig

  if (!tabShellPaths.includes(pathname)) return null

  const isHomeActive = pathname === routes.Home

  return (
    <div className="fixed bg-blur-gradient flex justify-center inset-x-0 h-36 items-end  bottom-0 pb-4 mx-auto z-50">
      <div className="relative">
        <Rectangle />
        <div className="absolute top-0 inset-x-0 flex mx-8 justify-between">
          <div
            onClick={() => router.push(routes.Home)}
            role="button"
            className="flex flex-col gap-2 w-16 items-center"
          >
            <div
              className={cn(
                'h-1.5 rounded-b-full w-full bg-lime-gradient opacity-0 transition-opacity',
                { 'opacity-100': isHomeActive && !isLeaderboardRoute },
              )}
            ></div>
            <div className="flex flex-col items-center">
              <Image
                src={
                  isLeaderboardRoute || !isHomeActive
                    ? '/img/home-icon.svg'
                    : '/img/home-icon-active.svg'
                }
                alt="Home icon"
                width="0"
                height="0"
                style={{ width: '24px', height: 'auto' }}
              />
              <span
                className={cn(
                  'text-lime-green-1 text-[10px] transition-opacity',
                  {
                    'opacity-40': isLeaderboardRoute || !isHomeActive,
                  },
                )}
              >
                Home
              </span>
            </div>
          </div>
          <div className="flex flex-col items-center self-end">
            <span className="text-white text-xs">Plant Trees</span>
            {offlineVideoService.activeVersion && (
              <span className="text-[8px] text-gray-400 leading-none mt-1">
                {offlineVideoService.activeVersion}
              </span>
            )}
          </div>
          <div
            onClick={() => router.push(routes.Leaderboard)}
            role="button"
            className="flex flex-col gap-2 items-center w-16"
          >
            <div
              className={cn(
                'h-1.5 rounded-b-full w-full bg-lime-gradient opacity-0 transition-opacity',
                { 'opacity-100': isLeaderboardRoute },
              )}
            ></div>
            <div className="flex flex-col items-center">
              <Image
                src={
                  isLeaderboardRoute
                    ? '/img/leaderboard-icon-active.svg'
                    : '/img/leaderboard-icon.svg'
                }
                alt="Leaderboard icon"
                width={24}
                height={24}
              />
              <span
                className={cn(
                  'text-lime-green-1 mt-0.5 text-[10px] transition-opacity',
                  {
                    'opacity-40': !isLeaderboardRoute,
                  },
                )}
              >
                Leaderboard
              </span>
            </div>
          </div>
        </div>
      </div>

      <div
        onClick={() => router.push(routes.Tutorial)}
        className="absolute bottom-14 -mb-1"
        role="button"
      >
        <TreeButton />
      </div>
    </div>
  )
}
