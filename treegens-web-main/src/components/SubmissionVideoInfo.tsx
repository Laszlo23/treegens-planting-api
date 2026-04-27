import { VideoType } from '@/services/videoService'
import { IVideo } from '@/types'
import { ipfsGatewayUrl } from '@/utils/ipfsGatewayUrl'

const SubmissionVideoInfo = (props: { video?: IVideo }) => {
  const { video } = props
  if (!video) return null

  const ipfsUrl = ipfsGatewayUrl(video.videoCID)

  return (
    <section className="bg-gray-50 rounded-lg p-4">
      <h4 className="text-sm font-semibold text-gray-700 mb-2">
        {video.type === VideoType.LAND
          ? 'Land Video Details'
          : 'Plant Video Details'}
      </h4>
      <div className="text-xs text-gray-600 space-y-1">
        <p>
          <span className="font-medium">Status:</span> {video.status}
        </p>
        <p>
          <span className="font-medium">Uploaded:</span>{' '}
          {new Date(video.createdAt).toLocaleString()}
        </p>
        <p>
          <span className="font-medium">GPS Coordinates:</span>{' '}
          {video.gpsCoordinates.latitude}, {video.gpsCoordinates.longitude}
        </p>
        {video.reverseGeocode && (
          <p>
            <span className="font-medium">Address:</span> {video.reverseGeocode}
          </p>
        )}
        {video.treesPlanted && (
          <p>
            <span className="font-medium">Trees Planted:</span>{' '}
            {video.treesPlanted}
          </p>
        )}
        {video.treetype && (
          <p>
            <span className="font-medium">Tree Type:</span> {video.treetype}
          </p>
        )}
        <p>
          <span className="font-medium">File:</span> {video.originalFilename}
        </p>
        <p>
          <span className="font-medium">IPFS CID:</span> {video.videoCID}
        </p>
        {ipfsUrl && (
          <a
            href={ipfsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-500 hover:text-blue-600 text-xs"
          >
            View on IPFS ↗
          </a>
        )}
      </div>
    </section>
  )
}

export default SubmissionVideoInfo
