'use client'

import { LiveCameraVideoCapture } from '@/components/createSubmission/LiveCameraVideoCapture'
import { Button } from '@/components/ui/Button'
import { AuthService } from '@/services/authService'
import { getJwtToken } from '@/services/jwtTokenStore'
import { VideoType, videoService, type VideoUploadResponse } from '@/services/videoService'
import { type ChangeEvent, useCallback, useMemo, useState } from 'react'

type ClipKind = 'land' | 'plant'

function toNumberOrNull(v: string): number | null {
  const n = Number(v)
  return Number.isFinite(n) ? n : null
}

export default function LiveVerifyPage() {
  const [jwt, setJwt] = useState<string>(() => getJwtToken() || '')
  const [lat, setLat] = useState<string>('-6.2')
  const [lng, setLng] = useState<string>('106.8')

  const [activeKind, setActiveKind] = useState<ClipKind | null>(null)
  const [recorded, setRecorded] = useState<{ kind: ClipKind; file: File } | null>(null)
  const [submissionId, setSubmissionId] = useState<string>('')
  const [suggestedTrees, setSuggestedTrees] = useState<number | null>(null)

  const [uploading, setUploading] = useState(false)
  const [uploadPct, setUploadPct] = useState<number>(0)
  const [result, setResult] = useState<VideoUploadResponse['data'] | null>(null)
  const [error, setError] = useState<string>('')

  const coords = useMemo(() => {
    return { latitude: toNumberOrNull(lat), longitude: toNumberOrNull(lng) }
  }, [lat, lng])
  const hasValidLocation = coords.latitude != null && coords.longitude != null

  const saveJwt = useCallback(() => {
    const t = jwt.trim()
    if (!t) {
      AuthService.removeToken()
      setError('JWT cleared. Paste a token to call authenticated endpoints.')
      return
    }
    AuthService.setToken(t)
    setError('')
  }, [jwt])

  const pickFile = useCallback(
    (kind: ClipKind) => (ev: ChangeEvent<HTMLInputElement>) => {
      const f = ev.target.files?.[0]
      if (!f) return
      setRecorded({ kind, file: f })
      setResult(null)
      setError('')
    },
    [],
  )

  const uploadRecorded = useCallback(async () => {
    if (!recorded) return
    if (!hasValidLocation || coords.latitude == null || coords.longitude == null) {
      setError('Latitude/longitude required.')
      return
    }
    if (!jwt.trim()) {
      setError('JWT required for upload. Paste token and click “Save JWT”.')
      return
    }

    setUploading(true)
    setUploadPct(0)
    setError('')
    setResult(null)
    try {
      const type = recorded.kind === 'land' ? VideoType.LAND : VideoType.PLANT
      const sidForUpload = recorded.kind === 'plant' ? submissionId.trim() : ''
      const treesPlanted =
        recorded.kind === 'plant' && suggestedTrees != null ? suggestedTrees : undefined

      const res = await videoService.uploadVideo(
        recorded.file,
        type,
        coords.latitude,
        coords.longitude,
        sidForUpload,
        treesPlanted,
        undefined,
        undefined,
        {
          onUploadProgress: setUploadPct,
        },
      )
      setResult(res.data)
      if (res.data?.submissionId) setSubmissionId(res.data.submissionId)
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      setError(msg)
    } finally {
      setUploading(false)
    }
  }, [
    coords.latitude,
    coords.longitude,
    hasValidLocation,
    jwt,
    recorded,
    submissionId,
    suggestedTrees,
  ])

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 p-4 pb-24">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold">Live verify (record → preview → upload)</h1>
        <p className="text-sm text-gray-600">
          This page records a clip, shows on-the-fly ML estimates during recording (frame
          preview), and uploads the final clip to the Node API (which runs full{' '}
          <code>/internal/verify-video</code> on the server and stores <code>mlVerification</code>
          on the clip).
        </p>
      </div>

      <div className="rounded-xl border bg-white p-4">
        <div className="mb-3 text-sm font-semibold">1) Auth (JWT)</div>
        <div className="flex flex-col gap-2">
          <label className="text-sm text-gray-700">
            JWT token (stored in <code>localStorage</code> and attached to API requests)
          </label>
          <textarea
            className="min-h-[84px] w-full rounded-lg border p-2 text-xs"
            placeholder="Paste JWT token here (must be valid for /api/submissions/*)"
            value={jwt}
            onChange={e => setJwt(e.target.value)}
          />
          <div className="flex gap-2">
            <Button color="info" onClick={saveJwt}>
              Save JWT
            </Button>
            <Button
              outline
              color="gray"
              onClick={() => {
                setJwt('')
                AuthService.removeToken()
                setError('JWT cleared.')
              }}
            >
              Clear
            </Button>
          </div>
        </div>
      </div>

      <div className="rounded-xl border bg-white p-4">
        <div className="mb-3 text-sm font-semibold">2) GPS</div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="flex flex-col gap-1">
            <label className="text-sm text-gray-700">Latitude</label>
            <input
              className="rounded-lg border p-2 text-sm"
              value={lat}
              onChange={e => setLat(e.target.value)}
              inputMode="decimal"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm text-gray-700">Longitude</label>
            <input
              className="rounded-lg border p-2 text-sm"
              value={lng}
              onChange={e => setLng(e.target.value)}
              inputMode="decimal"
            />
          </div>
        </div>
        {!hasValidLocation ? (
          <div className="mt-2 text-sm text-red-600">Enter valid numbers for lat/lon.</div>
        ) : null}
      </div>

      <div className="rounded-xl border bg-white p-4">
        <div className="mb-3 text-sm font-semibold">3) Record or pick a file</div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex flex-col gap-2">
            <div className="text-sm text-gray-700">Record (shows live frame preview)</div>
            <div className="flex flex-wrap gap-2">
              <Button color="success" onClick={() => setActiveKind('land')}>
                Record land
              </Button>
              <Button
                color="success"
                outline
                onClick={() => setActiveKind('plant')}
                disabled={!submissionId.trim()}
                title={!submissionId.trim() ? 'Upload land first to get submissionId' : ''}
              >
                Record plant
              </Button>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <div className="text-sm text-gray-700">Or pick a file (no live preview)</div>
            <div className="flex flex-col gap-2">
              <input type="file" accept="video/*" onChange={pickFile('land')} />
              <input type="file" accept="video/*" onChange={pickFile('plant')} />
            </div>
          </div>
        </div>

        <div className="mt-4 grid gap-2">
          <div className="text-sm">
            <span className="font-semibold">submissionId:</span>{' '}
            <code className="rounded bg-gray-100 px-1 py-0.5">
              {submissionId || '(none yet)'}
            </code>
          </div>
          <div className="text-sm">
            <span className="font-semibold">Suggested trees (from live preview):</span>{' '}
            {suggestedTrees ?? '(none)'}
          </div>
          {recorded ? (
            <div className="text-sm">
              <span className="font-semibold">Selected:</span> {recorded.kind} —{' '}
              {recorded.file.name} ({Math.round(recorded.file.size / 1024 / 1024)} MB)
            </div>
          ) : null}
        </div>
      </div>

      <div className="rounded-xl border bg-white p-4">
        <div className="mb-3 text-sm font-semibold">4) Upload to Node API</div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            color="info"
            disabled={!recorded || uploading}
            onClick={() => void uploadRecorded()}
          >
            {uploading ? `Uploading… ${uploadPct}%` : 'Upload selected clip'}
          </Button>
          <Button
            outline
            color="gray"
            disabled={!recorded || uploading}
            onClick={() => {
              setRecorded(null)
              setResult(null)
              setError('')
            }}
          >
            Clear selection
          </Button>
        </div>

        {error ? <div className="mt-3 text-sm text-red-600">{error}</div> : null}

        {result ? (
          <div className="mt-4 rounded-lg bg-gray-50 p-3 text-sm">
            <div className="font-semibold">Upload response</div>
            <div className="mt-2 grid gap-1">
              <div>
                <span className="font-semibold">type:</span> {result.type}
              </div>
              <div>
                <span className="font-semibold">submissionId:</span> {result.submissionId}
              </div>
              <div>
                <span className="font-semibold">publicUrl:</span>{' '}
                <a className="underline" href={result.publicUrl} target="_blank" rel="noreferrer">
                  open
                </a>
              </div>
              <div>
                <span className="font-semibold">mlVerification:</span>{' '}
                <code className="text-xs">
                  {JSON.stringify(result.mlVerification ?? null)}
                </code>
              </div>
            </div>
          </div>
        ) : null}
      </div>

      <LiveCameraVideoCapture
        isActive={activeKind != null}
        onClose={() => setActiveKind(null)}
        onClipReady={file => {
          if (!activeKind) return
          setRecorded({ kind: activeKind, file })
          setResult(null)
          setError('')
        }}
        onUniqueEstimate={n => setSuggestedTrees(n)}
        latitude={coords.latitude}
        longitude={coords.longitude}
        hasValidLocation={hasValidLocation}
        isUserOnline={true}
      />
    </div>
  )
}

