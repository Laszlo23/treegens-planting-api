'use client'

export interface UploadProgressModalProps {
  isOpen: boolean
  onClose: () => void
  isQueueMode: boolean
  compression: {
    phase: string
    progress: number
    message: string
    originalSizeMB?: number
    compressedSizeMB?: number
    ratio?: number
    durationMs?: number
  }
  upload: {
    progress: number
    message?: string
    success?: boolean
    error?: string
  }
}

export default function UploadProgressModal({
  isOpen,
  onClose,
  isQueueMode,
  compression,
  upload,
}: UploadProgressModalProps) {
  if (!isOpen) return null

  const niceNumber = (n?: number) =>
    typeof n === 'number' ? n.toFixed(2) : undefined

  const reductionPercent = (() => {
    const o = compression.originalSizeMB
    const c = compression.compressedSizeMB
    if (typeof o === 'number' && typeof c === 'number' && o > 0) {
      return Math.max(0, Math.min(100, (1 - c / o) * 100))
    }
    if (typeof compression.ratio === 'number' && compression.ratio > 0) {
      return Math.max(0, Math.min(100, (1 - 1 / compression.ratio) * 100))
    }
    return undefined
  })()

  return (
    <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center">
      <div className="relative w-full md:max-w-lg md:rounded-xl md:shadow-2xl md:mb-0 mb-0 bg-white border border-gray-200 p-4 md:p-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-gray-900">Video Upload</h3>
          {((!isQueueMode && upload.success) ||
            (isQueueMode && compression.compressedSizeMB)) && (
            <button onClick={onClose} className="text-gray-500 text-sm">
              Close
            </button>
          )}
        </div>

        <div className="space-y-4">
          <section>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-medium text-gray-700">
                Compression
              </span>
              <span className="text-xs text-gray-600">
                {compression.progress}%
              </span>
            </div>
            <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-2 bg-blue-600 rounded-full transition-[width] duration-200"
                style={{
                  width: `${Math.min(100, Math.max(0, compression.progress))}%`,
                }}
              />
            </div>
            <div className="text-xs text-gray-600 mt-1">
              {compression.message}
            </div>
            {(compression.originalSizeMB ||
              compression.compressedSizeMB ||
              compression.ratio ||
              compression.durationMs) && (
              <div className="grid grid-cols-2 gap-2 text-xs text-gray-700 mt-2">
                {compression.originalSizeMB !== undefined && (
                  <div>
                    <span className="font-medium">Original:</span>{' '}
                    {niceNumber(compression.originalSizeMB)} MB
                  </div>
                )}
                {compression.compressedSizeMB !== undefined && (
                  <div>
                    <span className="font-medium">Compressed:</span>{' '}
                    {niceNumber(compression.compressedSizeMB)} MB
                  </div>
                )}
                {reductionPercent !== undefined && (
                  <div>
                    <span className="font-medium">Reduction:</span>{' '}
                    {niceNumber(reductionPercent)}%
                  </div>
                )}
                {compression.durationMs !== undefined && (
                  <div>
                    <span className="font-medium">Time:</span>{' '}
                    {Math.round(compression.durationMs / 1000)}s
                  </div>
                )}
              </div>
            )}
          </section>

          <section>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-medium text-gray-700">Upload</span>
              <span className="text-xs text-gray-600">{upload.progress}%</span>
            </div>
            <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-2 bg-green-600 rounded-full transition-[width] duration-200"
                style={{
                  width: `${Math.min(100, Math.max(0, upload.progress))}%`,
                }}
              />
            </div>
            {upload.message && (
              <div className="text-xs text-gray-600 mt-1">{upload.message}</div>
            )}
          </section>

          {upload.success && (
            <div className="p-3 rounded-lg bg-green-50 border border-green-200 text-green-800 text-xs">
              ✅ Upload completed successfully.
            </div>
          )}
          {upload.error && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-800 text-xs">
              ❌ {upload.error}
            </div>
          )}
          {upload.success && (
            <div className="flex justify-end">
              <button
                className="mt-2 px-3 py-1.5 text-xs rounded-md bg-green-600 text-white hover:bg-green-700"
                onClick={onClose}
              >
                Done
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
