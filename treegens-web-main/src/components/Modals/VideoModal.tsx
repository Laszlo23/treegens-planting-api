import { HiXMark } from 'react-icons/hi2'
import { IVideo } from '@/types'
import {
  getVideoStatusColor,
  getVideoStatusText,
  getVideoTypeColor,
  getVideoTypeText,
} from '@/utils/helpers'

interface VideoModalProps {
  isOpen: boolean
  onClose: () => void
  videoUrl: string
  video: IVideo
}

function VideoModal({ isOpen, onClose, videoUrl, video }: VideoModalProps) {
  if (!isOpen) return null

  const statusColor = getVideoStatusColor(video.status)
  const typeColor = getVideoTypeColor(video.type)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="relative w-full max-w-4xl mx-auto bg-black rounded-lg overflow-hidden">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 bg-black/50 hover:bg-black/70 rounded-full transition-colors"
        >
          <HiXMark className="h-6 w-6 text-white" />
        </button>

        {/* Video */}
        <video
          className="w-full max-h-[80vh] object-contain"
          controls
          autoPlay
          preload="metadata"
        >
          <source src={videoUrl} type="video/mp4" />
          Your browser does not support the video tag.
        </video>

        {/* Video info overlay */}
        <div className="absolute top-4 left-4 flex gap-2">
          <div
            className={`px-2 py-1 rounded-full text-xs font-medium ${statusColor}`}
          >
            {getVideoStatusText(video.status)}
          </div>
          <div
            className={`px-2 py-1 rounded-full text-xs font-medium ${typeColor}`}
          >
            {getVideoTypeText(video.type)}
          </div>
        </div>

        {/* Bottom info */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
          <div className="text-white text-sm">
            <div className="flex justify-between items-center">
              <span>
                {new Date(video.createdAt).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'short',
                  day: '2-digit',
                })}
              </span>
              <span>
                {video.gpsCoordinates.latitude.toFixed(4)},{' '}
                {video.gpsCoordinates.longitude.toFixed(4)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default VideoModal
