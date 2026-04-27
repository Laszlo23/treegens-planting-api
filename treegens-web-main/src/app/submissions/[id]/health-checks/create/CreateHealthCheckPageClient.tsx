'use client'

import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Spinner'
import { getSubmissionById } from '@/services/app'
import { uploadHealthCheckVideo } from '@/services/healthCheckService'
import type { ISubmissionDoc } from '@/types'
import { getSubmissionDetailVideoUrl } from '@/utils/submissionDetailVideo'
import { submissionDocToPlanterGroup } from '@/utils/submissionPlanterGroup'
import { validateVideoFile } from '@/utils/videoValidation'
import { useParams, useRouter } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import { IoVideocamOutline } from 'react-icons/io5'
import { MdClose } from 'react-icons/md'
import { HiArrowLeft } from 'react-icons/hi2'
import { useGeolocation } from '@/hooks/useGeolocation'
import { reverseGeocode as fetchReverseGeocode } from '@/services/geocodingService'

export default function CreateHealthCheckPageClient() {
  const params = useParams()
  const submissionId = typeof params.id === 'string' ? params.id : ''
  const router = useRouter()

  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [error, setError] = useState('')

  const [plantVideoUrl, setPlantVideoUrl] = useState<string | null>(null)
  const [latitude, setLatitude] = useState<number | null>(null)
  const [longitude, setLongitude] = useState<number | null>(null)
  const [reverseGeocode, setReverseGeocode] = useState('')

  const [videoFile, setVideoFile] = useState<File | null>(null)
  const [videoPreviewUrl, setVideoPreviewUrl] = useState('')
  const [treesAliveInput, setTreesAliveInput] = useState('1')
  const [validationError, setValidationError] = useState('')

  const {
    latitude: geoLat,
    longitude: geoLng,
    loading: geoLoading,
    error: geoError,
    getCurrentPosition,
    isSupported,
  } = useGeolocation({
    enableHighAccuracy: true,
    timeout: 15000,
    maximumAge: 10000,
  })

  const treesAlive = useMemo(() => {
    const n = parseInt(treesAliveInput, 10)
    return Number.isFinite(n) && n >= 0 ? n : 0
  }, [treesAliveInput])

  useEffect(() => {
    const load = async () => {
      if (!submissionId) {
        setError('Invalid submission')
        setLoading(false)
        return
      }
      setLoading(true)
      setError('')
      try {
        const res = await getSubmissionById(submissionId)
        const doc = res.data.data as ISubmissionDoc & Record<string, unknown>
        const group = submissionDocToPlanterGroup(doc)
        const plant = group.plantVideo
        if (!plant) {
          setError('Plant video is required before health checks.')
          setLoading(false)
          return
        }
        setPlantVideoUrl(getSubmissionDetailVideoUrl(plant))
        const lat = plant.gpsCoordinates.latitude
        const lng = plant.gpsCoordinates.longitude
        setLatitude(lat)
        setLongitude(lng)
        setReverseGeocode(plant.reverseGeocode || '')
      } catch (e) {
        console.error(e)
        setError('Failed to load submission')
      } finally {
        setLoading(false)
      }
    }
    void load()
  }, [submissionId])

  useEffect(() => {
    return () => {
      if (videoPreviewUrl) URL.revokeObjectURL(videoPreviewUrl)
    }
  }, [videoPreviewUrl])

  useEffect(() => {
    if (geoLat == null || geoLng == null) return
    setLatitude(geoLat)
    setLongitude(geoLng)
    void (async () => {
      try {
        const rev = await fetchReverseGeocode(geoLat, geoLng)
        if (rev?.success && rev.address) {
          setReverseGeocode(rev.address)
        }
      } catch {
        /* optional */
      }
    })()
  }, [geoLat, geoLng])

  const onPickVideo = async (file: File | null) => {
    if (!file) return
    setValidationError('')
    const v = await validateVideoFile(file)
    if (!v.isValid) {
      setValidationError(v.error || 'Invalid video')
      return
    }
    setVideoFile(file)
    if (videoPreviewUrl) URL.revokeObjectURL(videoPreviewUrl)
    setVideoPreviewUrl(URL.createObjectURL(file))
  }

  const clearVideo = () => {
    setVideoFile(null)
    if (videoPreviewUrl) URL.revokeObjectURL(videoPreviewUrl)
    setVideoPreviewUrl('')
  }

  const syncLocationFromDevice = () => {
    void getCurrentPosition()
  }

  const onSubmit = async () => {
    if (!submissionId || !videoFile || latitude == null || longitude == null) {
      toast.error('Video and location are required.')
      return
    }
    if (treesAlive < 0) {
      toast.error('Trees alive must be zero or more.')
      return
    }
    setSubmitting(true)
    setUploadProgress(0)
    setError('')
    try {
      await uploadHealthCheckVideo(
        submissionId,
        {
          videoFile,
          latitude,
          longitude,
          treesAlive,
          reverseGeocode: reverseGeocode.trim() || undefined,
        },
        { onUploadProgress: p => setUploadProgress(p) },
      )
      toast.success('Health check uploaded')
      router.push(`/submissions/${encodeURIComponent(submissionId)}/health-checks`)
      router.refresh()
    } catch (e) {
      console.error(e)
      setError('Upload failed')
      toast.error('Upload failed')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Spinner size="lg" />
      </div>
    )
  }

  if (error && !plantVideoUrl) {
    return (
      <div className="p-6">
        <p className="text-red-700">{error}</p>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col bg-white pb-24">
      <header className="sticky top-0 z-10 flex items-center gap-2 border-b border-gray-100 bg-white px-4 py-2">
        <button
          type="button"
          onClick={() => router.back()}
          className="rounded-md p-1 text-[#111] hover:bg-gray-100"
          aria-label="Back"
        >
          <HiArrowLeft className="h-6 w-6" />
        </button>
        <h1 className="text-lg font-bold text-[#111]">New health check</h1>
      </header>

      <div className="flex flex-col gap-4 px-4 pt-4">
        {plantVideoUrl ? (
          <div>
            <p className="mb-2 text-sm text-brown-2">Reference — plant video</p>
            <video
              className="aspect-video w-full rounded-lg bg-black"
              src={plantVideoUrl}
              controls
            />
          </div>
        ) : null}

        <div>
          <label className="mb-1 block text-sm font-medium text-[#111]">
            Trees alive
          </label>
          <input
            type="number"
            min={0}
            className="w-full rounded-lg border border-gray-200 px-3 py-2"
            value={treesAliveInput}
            onChange={e => setTreesAliveInput(e.target.value)}
          />
        </div>

        <div>
          <p className="mb-1 text-sm font-medium text-[#111]">Location</p>
          <p className="text-xs text-brown-2">
            {latitude != null && longitude != null
              ? `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`
              : 'Not set'}
          </p>
          {isSupported ? (
            <Button
              size="xs"
              color="gray"
              className="mt-2"
              onClick={() => void syncLocationFromDevice()}
              disabled={geoLoading || submitting}
            >
              {geoLoading ? 'Locating…' : 'Use device location'}
            </Button>
          ) : null}
          {geoError ? (
            <p className="mt-1 text-xs text-amber-700">{geoError}</p>
          ) : null}
        </div>

        <div>
          <p className="mb-2 text-sm font-medium">Health check video</p>
          <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-warm-grey bg-warm-grey/30 px-4 py-8">
            <IoVideocamOutline className="h-10 w-10 text-brown-2" />
            <span className="mt-2 text-sm text-brown-2">Tap to choose video</span>
            <input
              type="file"
              accept="video/*"
              className="hidden"
              onChange={e => void onPickVideo(e.target.files?.[0] ?? null)}
            />
          </label>
          {validationError ? (
            <p className="mt-2 text-sm text-red-700">{validationError}</p>
          ) : null}
          {videoPreviewUrl ? (
            <div className="relative mt-3">
              <button
                type="button"
                onClick={clearVideo}
                className="absolute right-2 top-2 z-10 rounded-full bg-black/60 p-1 text-white"
                aria-label="Remove video"
              >
                <MdClose className="h-5 w-5" />
              </button>
              <video
                className="aspect-video w-full rounded-lg bg-black"
                src={videoPreviewUrl}
                controls
              />
            </div>
          ) : null}
        </div>

        {error ? <p className="text-sm text-red-700">{error}</p> : null}
        {submitting ? (
          <p className="text-sm text-brown-2">Uploading… {uploadProgress}%</p>
        ) : null}

        <Button
          color="success"
          disabled={submitting || !videoFile || latitude == null || longitude == null}
          onClick={() => void onSubmit()}
        >
          {submitting ? 'Uploading…' : 'Submit health check'}
        </Button>
      </div>
    </div>
  )
}
