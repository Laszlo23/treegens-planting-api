'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'

interface RejectHealthCheckModalProps {
  onReject: (payload: { reasons: string[] }) => void
  onClose: () => void
  isOpen: boolean
}

const REJECT_HEALTH_CHECK_LIST = [
  { id: 1, title: 'Video was not taken at the same location' },
  {
    id: 2,
    title: 'Camera movement was back and forth (not in one direction)',
  },
]

export function RejectHealthCheckModal({
  isOpen,
  onClose,
  onReject,
}: RejectHealthCheckModalProps) {
  const [selectedReasonIds, setSelectedReasonIds] = useState<number[]>([])
  const [note, setNote] = useState('')

  const toggleReason = (id: number) => {
    setSelectedReasonIds(prev =>
      prev.includes(id) ? prev.filter(rid => rid !== id) : [...prev, id],
    )
  }

  const noteTrim = note.trim()
  const hasChecklistReason = selectedReasonIds.length > 0
  const canSubmit = hasChecklistReason || noteTrim.length > 0

  const handleReject = () => {
    if (!canSubmit) return
    const selectedReasons = REJECT_HEALTH_CHECK_LIST.filter(item =>
      selectedReasonIds.includes(item.id),
    ).map(item => item.title)
    const reasons = noteTrim ? [...selectedReasons, noteTrim] : selectedReasons
    onReject({ reasons })
    setSelectedReasonIds([])
    setNote('')
  }

  return (
    <Modal open={isOpen} onClose={onClose} title="Reject Health Check">
      <div className="flex flex-col gap-4">
        <h4 className="text-sm text-gray-900">
          Why are you rejecting this health check?
        </h4>
        <p className="text-xs text-gray-500">
          A reason is required - choose one or more options above and/or add a
          note.
        </p>
        {REJECT_HEALTH_CHECK_LIST.map(checkItem => (
          <div key={checkItem.id} className="flex items-center gap-2">
            <input
              type="checkbox"
              id={`reject-health-check-${checkItem.id}`}
              checked={selectedReasonIds.includes(checkItem.id)}
              onChange={() => toggleReason(checkItem.id)}
              className="h-5 w-5 rounded border-gray-300 accent-red-600 focus:ring-red-500"
            />
            <label
              className="text-sm font-semibold text-gray-900"
              htmlFor={`reject-health-check-${checkItem.id}`}
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
        <Button
          onClick={handleReject}
          outline
          color="red"
          disabled={!canSubmit}
        >
          Reject
        </Button>
      </div>
    </Modal>
  )
}
