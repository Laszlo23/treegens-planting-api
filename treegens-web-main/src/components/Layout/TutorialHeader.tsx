'use client'

import { useRouter } from 'next/navigation'
import type { ReactNode } from 'react'
import { HiArrowLeft } from 'react-icons/hi2'

/** Mirrors `mobile/components/Header.tsx`: back (unless hidden), centered title, optional right. */
export function TutorialHeader({
  title,
  hideBackButton = false,
  right,
}: {
  title: string
  hideBackButton?: boolean
  right?: ReactNode
}) {
  const router = useRouter()

  return (
    <header className="sticky top-0 z-10 flex flex-row items-center justify-between border-b border-gray-100 bg-white px-4 py-2">
      {hideBackButton ? (
        <span className="w-6 shrink-0" aria-hidden />
      ) : (
        <button
          type="button"
          onClick={() => router.back()}
          className="rounded-md p-0.5 text-[#111] hover:bg-gray-100"
          aria-label="Back"
        >
          <HiArrowLeft className="h-6 w-6" />
        </button>
      )}
      <h1 className="text-[22px] font-bold text-[#111]">{title}</h1>
      {right != null ? (
        <div className="flex min-w-[1.5rem] shrink-0 justify-end">{right}</div>
      ) : (
        <span className="w-6 shrink-0" aria-hidden />
      )}
    </header>
  )
}
