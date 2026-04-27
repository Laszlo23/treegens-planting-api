'use client'

import Link from 'next/link'

type Props = {
  submissionId: string
}

export function RejectionFeedbackFooter({ submissionId }: Props) {
  return (
    <div className="border-t border-neutral-200/80 bg-white px-4 pb-6 pt-3">
      <Link
        href={`/submissions/${encodeURIComponent(submissionId)}/rejection-feedback`}
        className="flex items-center justify-center rounded-2xl bg-lime-green-2 py-3.5 text-lg font-semibold text-brown-3 active:opacity-90"
      >
        View feedback
      </Link>
    </div>
  )
}
