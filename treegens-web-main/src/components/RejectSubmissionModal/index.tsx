'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'

interface RejectSubmissionModalProps {
  onReject: (payload: { reasons: string[] }) => void
  onClose: () => void
  isOpen: boolean
}
const REJECT_CHECK_LIST = [
  { id: 1, title: 'Not planted approx. 30cm apart' },
  { id: 2, title: 'Not planted within 2m of the same tree species' },
  { id: 3, title: 'Filmed same trees twice' },
  {
    id: 4,
    title: `Propagules were not old enough
  and/or dead`,
  },
  {
    id: 5,
    title: 'Another reason (noted below)',
  },
]

export function RejectSubmissionModal({
  isOpen,
  onClose,
  onReject,
}: RejectSubmissionModalProps) {
  const [selectedReasonIds, setSelectedReasonIds] = useState<number[]>([])
  const [note, setNote] = useState('')

  const toggleReason = (id: number) => {
    setSelectedReasonIds(prev =>
      prev.includes(id) ? prev.filter(rid => rid !== id) : [...prev, id],
    )
  }

  const handleReject = () => {
    const selectedReasons = REJECT_CHECK_LIST.filter(item =>
      selectedReasonIds.includes(item.id),
    ).map(item => item.title)
    const reasons = note.trim()
      ? [...selectedReasons, note.trim()]
      : selectedReasons
    onReject({ reasons })
    setSelectedReasonIds([])
    setNote('')
  }
  return (
    <Modal open={isOpen} onClose={onClose} title="Reject Submission">
      <div className="flex flex-col gap-4">
        <h4 className="text-sm text-gray-900">
          Why are you rejecting this submission?
        </h4>
        {REJECT_CHECK_LIST.map(checkItem => (
          <div key={checkItem.id} className="flex items-center gap-2">
            <input
              type="checkbox"
              id={`reject-check-${checkItem.id}`}
              checked={selectedReasonIds.includes(checkItem.id)}
              onChange={() => toggleReason(checkItem.id)}
              className="h-5 w-5 rounded border-gray-300 accent-red-600 focus:ring-red-500"
            />
            <label
              className="text-sm font-semibold text-gray-900"
              htmlFor={`reject-check-${checkItem.id}`}
            >
              {checkItem.title}
            </label>
          </div>
        ))}

        <textarea
          placeholder="Add a note"
          rows={6}
          className="rounded-lg border border-gray-300 bg-gray-50 p-2 text-sm text-gray-900 placeholder:text-gray-500"
          name="note"
          id="note"
          value={note}
          onChange={e => setNote(e.target.value)}
        />
        <Button onClick={handleReject} outline color="red">
          Reject
        </Button>
      </div>
    </Modal>
  )
}
