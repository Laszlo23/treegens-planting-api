'use client'

import type { ReactNode } from 'react'

/** Lightweight hover tooltip (Tailwind only — no Popper). */
export function Tooltip({
  content,
  children,
}: {
  content: ReactNode
  children: ReactNode
}) {
  return (
    <span className="group relative inline-block max-w-full">
      {children}
      <span className="pointer-events-none absolute bottom-full left-1/2 z-50 mb-1 hidden w-max max-w-[min(100vw-2rem,280px)] -translate-x-1/2 rounded border border-gray-200 bg-white px-2 py-1.5 text-left text-xs text-gray-800 shadow-md group-hover:block">
        {content}
      </span>
    </span>
  )
}
