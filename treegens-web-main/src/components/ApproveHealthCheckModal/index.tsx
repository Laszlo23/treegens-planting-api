'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'

interface ApproveHealthCheckModalProps {
  onApprove: (payload: { reasons: string[] }) => void
  onClose: () => void
  isOpen: boolean
}

const APPROVE_HEALTH_CHECK_INSTRUCTIONS = [
  { id: 1, title: 'Video was taken at the same location' },
  {
    id: 2,
    title:
      'Camera movement was continuous from one direction to the next (not back and forth)',
  },
]

export function ApproveHealthCheckModal({
  isOpen,
  onClose,
  onApprove,
}: ApproveHealthCheckModalProps) {
  const [note, setNote] = useState('')

  const handleApprove = () => {
    const reasons = note.trim() ? [note.trim()] : []
    onApprove({ reasons })
    setNote('')
  }

  return (
    <Modal open={isOpen} onClose={onClose} title="Approve Health Check">
      <div className="flex flex-col gap-4">
        <h4 className="text-sm text-gray-900">
          By approving this health check, you confirm that these conditions have
          been met:
        </h4>
        <div className="flex flex-col gap-2">
          {APPROVE_HEALTH_CHECK_INSTRUCTIONS.map(item => (
            <div key={item.id} className="flex items-start gap-2">
              <span aria-hidden className="mt-[2px] text-sm text-gray-900">
                •
              </span>
              <p className="text-sm font-semibold text-gray-900">
                {item.title}
              </p>
            </div>
          ))}
        </div>

        <textarea
          placeholder="Add an optional note"
          rows={6}
          className="rounded-lg border border-gray-300 bg-gray-50 p-2 text-sm text-gray-900 placeholder:text-gray-500"
          name="note"
          id="note"
          value={note}
          onChange={e => setNote(e.target.value)}
        />
        <Button onClick={handleApprove} outline color="green">
          Approve
        </Button>
      </div>
    </Modal>
  )
}
