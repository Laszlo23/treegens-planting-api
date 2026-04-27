'use client'

import { Button } from '@/components/ui/Button'
import { postMlFramePreview } from '@/services/mlPreviewService'
import { useCallback, useEffect, useRef, useState } from 'react'
import { IoVideocamOutline } from 'react-icons/io5'
import { MdClose } from 'react-icons/md'

const PREVIEW_INTERVAL_MS = 2000

function pickRecorderMime(): string | undefined {
  if (typeof MediaRecorder === 'undefined') return undefined
  const types = [
    'video/webm;codecs=vp9,opus',
    'video/webm;codecs=vp8,opus',
    'video/webm',
    'video/mp4',
  ]
  return types.find(t => MediaRecorder.isTypeSupported(t))
}

type Props = {
  /** When true, show camera UI (parent toggles from file picker mode). */
  isActive: boolean
  onClose: () => void
  /** Called with the recorded video file when user stops recording. */
  onClipReady: (file: File) => void
  latitude: number | null
  longitude: number | null
  hasValidLocation: boolean
  isUserOnline: boolean
  /** Optional: for plant step — suggest tree count from last unique estimate. */
  onUniqueEstimate?: (n: number) => void
}

export function LiveCameraVideoCapture({
  isActive,
  onClose,
  onClipReady,
  latitude,
  longitude,
  hasValidLocation,
  isUserOnline,
  onUniqueEstimate,
}: Props) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const recorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const previewTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const previewInFlight = useRef(false)

  const [phase, setPhase] = useState<'idle' | 'preview' | 'recording'>('idle')
  const [error, setError] = useState<string>('')
  const [liveLabel, setLiveLabel] = useState<string | null>(null)
  const [liveLoading, setLiveLoading] = useState(false)

  const stopPreviewLoop = useCallback(() => {
    if (previewTimerRef.current) {
      clearInterval(previewTimerRef.current)
      previewTimerRef.current = null
    }
  }, [])

  const runOnePreview = useCallback(async () => {
    if (!isUserOnline || !hasValidLocation || latitude == null || longitude == null) {
      return
    }
    const video = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas || video.readyState < 2) return
    if (previewInFlight.current) return
    const w = video.videoWidth
    const h = video.videoHeight
    if (!w || !h) return
    canvas.width = w
    canvas.height = h
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.drawImage(video, 0, 0, w, h)
    previewInFlight.current = true
    setLiveLoading(true)
    try {
      const blob = await new Promise<Blob | null>(resolve => {
        canvas.toBlob(b => resolve(b), 'image/jpeg', 0.82)
      })
      if (!blob) return
      const data = await postMlFramePreview(blob, latitude, longitude)
      const n = data.uniqueTreeEstimate
      setLiveLabel(
        data.stub
          ? 'AI preview unavailable (stub)'
          : `~${n} tree${n === 1 ? '' : 's'} (estimate)`,
      )
      if (!data.stub && n >= 1 && onUniqueEstimate) {
        onUniqueEstimate(n)
      }
    } catch (e) {
      console.warn('ML preview frame failed', e)
      setLiveLabel(null)
    } finally {
      previewInFlight.current = false
      setLiveLoading(false)
    }
  }, [
    isUserOnline,
    hasValidLocation,
    latitude,
    longitude,
    onUniqueEstimate,
  ])

  const startCamera = useCallback(async () => {
    setError('')
    setLiveLabel(null)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' } },
        audio: true,
      })
      streamRef.current = stream
      const v = videoRef.current
      if (v) {
        v.srcObject = stream
        await v.play()
      }
      setPhase('preview')
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Camera access failed'
      setError(msg)
    }
  }, [])

  const stopStream = useCallback(() => {
    stopPreviewLoop()
    streamRef.current?.getTracks().forEach(t => t.stop())
    streamRef.current = null
    const v = videoRef.current
    if (v) v.srcObject = null
  }, [stopPreviewLoop])

  const startRecording = useCallback(() => {
    const stream = streamRef.current
    if (!stream) return
    setError('')
    chunksRef.current = []
    const mime = pickRecorderMime()
    const rec = mime
      ? new MediaRecorder(stream, { mimeType: mime })
      : new MediaRecorder(stream)
    recorderRef.current = rec
    rec.ondataavailable = ev => {
      if (ev.data.size) chunksRef.current.push(ev.data)
    }
    rec.onerror = () => setError('Recording error')
    rec.onstop = () => {
      const type = rec.mimeType || 'video/webm'
      const blob = new Blob(chunksRef.current, { type })
      if (blob.size < 256) {
        setError('Recording was too short. Try again.')
        streamRef.current?.getTracks().forEach(t => t.stop())
        streamRef.current = null
        if (videoRef.current) videoRef.current.srcObject = null
        setPhase('idle')
        return
      }
      const name = type.includes('mp4') ? 'recording.mp4' : 'recording.webm'
      const file = new File([blob], name, { type })
      streamRef.current?.getTracks().forEach(t => t.stop())
      streamRef.current = null
      if (videoRef.current) videoRef.current.srcObject = null
      setPhase('idle')
      onClipReady(file)
      onClose()
    }
    rec.start(200)
    setPhase('recording')
    if (isUserOnline && hasValidLocation && latitude != null && longitude != null) {
      void runOnePreview()
      previewTimerRef.current = setInterval(() => {
        void runOnePreview()
      }, PREVIEW_INTERVAL_MS)
    }
  }, [
    isUserOnline,
    hasValidLocation,
    latitude,
    longitude,
    onClipReady,
    onClose,
    runOnePreview,
  ])

  const stopRecording = useCallback(() => {
    stopPreviewLoop()
    const rec = recorderRef.current
    if (rec && rec.state !== 'inactive') {
      rec.stop()
    }
    recorderRef.current = null
  }, [stopPreviewLoop])

  const handleCancel = useCallback(() => {
    stopPreviewLoop()
    if (recorderRef.current && recorderRef.current.state !== 'inactive') {
      recorderRef.current.stop()
    }
    recorderRef.current = null
    chunksRef.current = []
    stopStream()
    setPhase('idle')
    setError('')
    setLiveLabel(null)
    onClose()
  }, [onClose, stopPreviewLoop, stopStream])

  useEffect(() => {
    if (!isActive) {
      stopStream()
      setPhase('idle')
      setLiveLabel(null)
    }
  }, [isActive, stopStream])

  useEffect(
    () => () => {
      stopPreviewLoop()
      streamRef.current?.getTracks().forEach(t => t.stop())
    },
    [stopPreviewLoop],
  )

  if (!isActive) return null

  return (
    <div className="flex w-full flex-col gap-2 rounded-xl border border-dashed border-tree-green-2/40 bg-[#f7fbf3] p-3">
      <div className="flex flex-row items-center justify-between gap-2">
        <p className="text-sm font-medium text-gray-800">Camera with live count</p>
        <button
          type="button"
          onClick={handleCancel}
          className="rounded-full p-1.5 text-gray-600 hover:bg-white/80"
          aria-label="Close"
        >
          <MdClose className="h-5 w-5" />
        </button>
      </div>
      <p className="text-xs text-gray-600">
        Estimate updates while recording; final verification uses your full upload.
      </p>
      {error ? <p className="text-xs text-red-600">{error}</p> : null}
      <div className="relative aspect-[2/1] w-full overflow-hidden rounded-xl bg-black">
        <video
          ref={videoRef}
          className="h-full w-full object-cover"
          playsInline
          muted
          autoPlay
        />
        <canvas ref={canvasRef} className="hidden" />
        {phase === 'idle' ? (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50">
            <Button type="button" onClick={startCamera} color="success" pill>
              <span className="inline-flex items-center gap-1">
                <IoVideocamOutline className="h-5 w-5" />
                Start camera
              </span>
            </Button>
          </div>
        ) : null}
        {phase === 'preview' ? (
          <div className="absolute bottom-0 left-0 right-0 flex flex-row items-center justify-between gap-2 bg-black/55 p-2">
            <span className="min-w-0 text-xs text-white">Preview (not recording)</span>
            <Button type="button" onClick={startRecording} color="success" pill className="shrink-0 text-sm">
              Record
            </Button>
          </div>
        ) : null}
        {phase === 'recording' ? (
          <div className="absolute bottom-0 left-0 right-0 flex flex-col gap-1 bg-black/60 p-2">
            <div className="flex flex-row items-center justify-between gap-2 text-xs text-white">
              <span className="live-indicator font-semibold text-lime-300">● Rec</span>
              <span>
                {liveLoading
                  ? 'Counting…'
                  : liveLabel || (hasValidLocation ? '…' : 'Location required for count')}
              </span>
            </div>
            <Button type="button" onClick={stopRecording} className="w-full" pill>
              Stop and use clip
            </Button>
          </div>
        ) : null}
      </div>
    </div>
  )
}
