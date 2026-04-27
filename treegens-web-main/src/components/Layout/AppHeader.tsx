'use client'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { Blobbie, useActiveAccount } from 'thirdweb/react'
import { routes } from '@/config/appConfig'

/** Matches `mobile/components/ui/home/Header.tsx`: logo + Blobbie profile. */
export const AppHeader = () => {
  const router = useRouter()
  const account = useActiveAccount()

  return (
    <header className="sticky top-0 z-50 flex flex-row items-center justify-between bg-white px-4 py-3">
      <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full">
        <Image
          src="/img/treegens-logo.svg"
          alt="Treegens"
          fill
          className="object-cover"
          sizes="40px"
          priority
        />
      </div>

      <div className="flex flex-row items-center gap-4">
        <button
          type="button"
          onClick={() => router.push(routes.Profile)}
          className="overflow-hidden rounded-full leading-none"
          aria-label="Profile"
        >
          <Blobbie
            address={account?.address ?? ''}
            size={36}
            className="rounded-full"
          />
        </button>
      </div>
    </header>
  )
}
