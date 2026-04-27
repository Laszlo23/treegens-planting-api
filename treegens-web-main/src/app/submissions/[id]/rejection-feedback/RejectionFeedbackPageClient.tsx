'use client'

import { useCallback, useEffect, useState } from 'react'
import { HiArrowLeft } from 'react-icons/hi'
import { useParams, useRouter } from 'next/navigation'

import { getSubmissionById } from '@/services/app'
import { buildRejectionParagraphs } from '@/utils/rejectionFeedback'

export default function RejectionFeedbackPageClient() {
  const router = useRouter()
  const params = useParams()
  const id = typeof params.id === 'string' ? params.id : ''
  const [loading, setLoading] = useState(true)
  const [paragraphs, setParagraphs] = useState<string[]>([])
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    if (!id) {
      setError('Invalid submission')
      setLoading(false)
      return
    }
    setLoading(true)
    setError('')
    try {
      const response = await getSubmissionById(id)
      const { paragraphs: built } = buildRejectionParagraphs(
        response.data?.data?.votes,
      )
      setParagraphs(built)
    } catch (e) {
      console.error('Failed to load rejection feedback', e)
      setError('Failed to load feedback')
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    void load()
  }, [load])

  return (
    <div className="mx-auto mb-24 max-w-3xl px-4 pb-8 pt-4">
      <div className="mb-4 flex items-center justify-between">
        <button
          type="button"
          onClick={() => router.back()}
          className="rounded-md p-1 text-[#111] hover:bg-neutral-200/50"
          aria-label="Back"
        >
          <HiArrowLeft className="h-6 w-6" />
        </button>
        <h1 className="text-2xl font-bold text-[#111]">Verifier feedback</h1>
        <span className="w-8" aria-hidden />
      </div>

      {loading ? (
        <div className="flex min-h-[40vh] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-neutral-200 border-t-green-600" />
        </div>
      ) : error ? (
        <div className="flex min-h-[40vh] items-center justify-center px-6">
          <p className="text-center text-red-700">{error}</p>
        </div>
      ) : (
        <div className="space-y-4 pt-1">
          {paragraphs.length === 0 ? (
            <p className="text-base leading-7 text-neutral-600">
              No verifier feedback is available for this submission.
            </p>
          ) : (
            paragraphs.map((text, index) => (
              <section
                key={`${index}-${text.slice(0, 24)}`}
                className="space-y-1.5 rounded-xl border border-neutral-200 bg-white p-4"
              >
                {paragraphs.length > 1 ? (
                  <p className="text-sm font-semibold text-neutral-500">
                    Feedback {index + 1}
                  </p>
                ) : null}
                <p className="text-base leading-7 text-neutral-800">{text}</p>
              </section>
            ))
          )}
        </div>
      )}
    </div>
  )
}
