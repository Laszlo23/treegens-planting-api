import { Button } from '@/components/ui/Button'

interface VideoSavedSuccessModalProps {
  isOpen: boolean
  onClose: () => void
  locationInfo?: {
    hasValidLocation: boolean
    formatLocation: () => string
    accuracy?: number | null
  }
}

export default function VideoSavedSuccessModal({
  isOpen,
  onClose,
  locationInfo,
}: VideoSavedSuccessModalProps) {
  const handleDone = () => {
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="relative w-full max-w-md mx-auto bg-white rounded-3xl shadow-2xl overflow-hidden animate-in fade-in-0 zoom-in-95 duration-200">
        <div className="px-6 py-9">
          <div className="flex flex-col items-center gap-6 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-2">
              <span className="text-3xl">🌱</span>
            </div>

            <h3 className="text-2xl font-bold text-gray-900">
              Video Saved. Now go plant some trees!
            </h3>

            <p className="text-lg font-semibold text-gray-700">
              Your video will be reviewed by verifiers once you submit a second
              video with trees planted.
            </p>

            {locationInfo?.hasValidLocation && (
              <div className="w-full p-4 bg-gray-50 rounded-lg">
                <div className="text-sm text-gray-700 space-y-1">
                  <p className="flex items-center justify-center gap-2">
                    <span>📍</span>
                    <span>
                      Location recorded: {locationInfo.formatLocation()}
                    </span>
                  </p>
                  <p className="flex items-center justify-center gap-2">
                    <span>🎯</span>
                    <span>
                      Accuracy: ±
                      {locationInfo.accuracy
                        ? Math.round(locationInfo.accuracy)
                        : 'Unknown'}
                      m
                    </span>
                  </p>
                </div>
              </div>
            )}

            <Button
              onClick={handleDone}
              className="w-full bg-green-600 hover:bg-green-700 focus:ring-green-300"
              pill
              size="lg"
            >
              <span className="font-semibold">Done</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
