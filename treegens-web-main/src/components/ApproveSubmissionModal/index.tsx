'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'

interface ApproveSubmissionModalProps {
  onApprove: (payload: { reasons: string[] }) => void
  onClose: () => void
  isOpen: boolean
}
const APPROVE_INSTRUCTIONS = [
  { id: 1, title: 'Not planted approx. 30cm apart' },
  { id: 2, title: 'Within 2m of the same tree species' },
  { id: 3, title: 'Did not film the same trees twice' },
  { id: 4, title: 'Propagules were old enough & alive' },
]
export function ApproveSubmissionModal({
  isOpen,
  onClose,
  onApprove,
}: ApproveSubmissionModalProps) {
  const [note, setNote] = useState('')

  const handleApprove = () => {
    const reasons = note.trim() ? [note.trim()] : []
    onApprove({ reasons })
    setNote('')
  }
  return (
    <Modal open={isOpen} onClose={onClose} title="Approve Submission">
      <div className="flex flex-col gap-4">
        <h4 className="text-sm text-gray-900">
          By approving this submission, you confirm that these conditions have
          been met:
        </h4>
        <div className="flex flex-col gap-2">
          {APPROVE_INSTRUCTIONS.map(checkItem => (
            <div key={checkItem.id} className="flex items-start gap-2">
              <span aria-hidden className="mt-[2px] text-sm text-gray-900">
                •
              </span>
              <p className="text-sm font-semibold text-gray-900">
                {checkItem.title}
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
