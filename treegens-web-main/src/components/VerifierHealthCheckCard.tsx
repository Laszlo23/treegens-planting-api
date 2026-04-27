'use client'

import type { IHealthCheckDoc } from '@/types'

function shortId(id: string) {
  const s = String(id)
  if (s.length <= 12) return s
  return `${s.slice(0, 6)}…${s.slice(-4)}`
}

function statusStyle(status: IHealthCheckDoc['status']) {
  switch (status) {
    case 'pending_review':
      return { bg: 'bg-amber-100', text: 'text-amber-900', label: 'Pending' }
    case 'approved':
      return {
        bg: 'bg-emerald-100',
        text: 'text-emerald-900',
        label: 'Approved',
      }
    case 'rejected':
      return { bg: 'bg-red-100', text: 'text-red-900', label: 'Rejected' }
    default:
      return { bg: 'bg-neutral-100', text: 'text-neutral-800', label: status }
  }
}

type Props = {
  hc: IHealthCheckDoc
  onClick?: () => void
}

export function VerifierHealthCheckCard({ hc, onClick }: Props) {
  const st = statusStyle(hc.status)

  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full rounded-2xl border border-[#e5e7eb] bg-white p-4 text-left shadow-sm shadow-black/5 transition-opacity hover:opacity-95"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold uppercase text-[#6b7280]">
            Submission
          </p>
          <p className="truncate text-sm font-medium text-[#111827]">
            {shortId(String(hc.submissionId))}
          </p>
        </div>
        <span
          className={`rounded-full px-2.5 py-1 text-xs font-semibold ${st.bg} ${st.text}`}
        >
          {st.label}
        </span>
      </div>
      <p className="mt-3 text-sm text-[#4b5563]">
        Trees alive: {hc.treesAlive}
      </p>
    </button>
  )
}
