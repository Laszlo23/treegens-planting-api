import axios from 'axios'
import FormData from 'form-data'
import env from '../config/environment'

/** Stored on Submission land/plant clips (Mongo subdocument). */
export type MlVerificationClip = {
  modelVersion?: string
  aggregatePass?: boolean
  result?: Record<string, unknown>
  verifiedAt: Date
  error?: string
}

type VerifyInput = {
  buffer: Buffer
  originalname: string
  mimeType: string
  latitude: number
  longitude: number
  claimedTreeCount?: number
}

/**
 * Calls FastAPI POST /internal/verify-video (YOLO + metadata checks).
 * Never throws: failures become mlVerification.error so IPFS upload flow still completes.
 */
export async function verifyClipWithPlantingApi(
  input: VerifyInput,
): Promise<MlVerificationClip> {
  const verifiedAt = new Date()
  if (!env.PLANTING_VERIFICATION_ENABLED) {
    return { verifiedAt, error: 'planting_verification_disabled' }
  }
  const base = env.PLANTING_VERIFICATION_API_URL?.trim()
  const key = env.PLANTING_VERIFICATION_INTERNAL_KEY?.trim()
  if (!base || !key) {
    return { verifiedAt, error: 'planting_verification_not_configured' }
  }

  const url = `${base.replace(/\/$/, '')}/internal/verify-video`
  const form = new FormData()
  form.append('video', input.buffer, {
    filename: input.originalname || 'clip.mp4',
    contentType: input.mimeType,
  })
  form.append('captured_at', verifiedAt.toISOString())
  form.append('latitude', String(input.latitude))
  form.append('longitude', String(input.longitude))
  if (input.claimedTreeCount != null && input.claimedTreeCount > 0) {
    form.append('claimed_tree_count', String(input.claimedTreeCount))
  }

  try {
    const res = await axios.post<{
      verification: {
        aggregate_pass: boolean
        metadata?: unknown
        model?: unknown
      }
      model_version: string
    }>(url, form, {
      headers: {
        ...form.getHeaders(),
        'X-Internal-Key': key,
      },
      maxBodyLength: Infinity,
      maxContentLength: Infinity,
      timeout: env.PLANTING_VERIFICATION_TIMEOUT_MS,
      validateStatus: s => s < 500,
    })

    if (res.status >= 400) {
      const detail =
        (res.data as { detail?: string | unknown })?.detail ?? res.statusText
      const msg =
        typeof detail === 'string'
          ? detail
          : JSON.stringify(detail ?? res.status)
      return { verifiedAt, error: `planting_api_${res.status}: ${msg}` }
    }

    const { verification, model_version: modelVersion } = res.data
    return {
      verifiedAt,
      modelVersion,
      aggregatePass: verification.aggregate_pass,
      result: verification as unknown as Record<string, unknown>,
    }
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e)
    console.error('[plantingVerificationService]', msg)
    return { verifiedAt, error: msg }
  }
}

export type MlFramePreviewOk = {
  modelVersion: string
  totalTreeDetections: number
  uniqueTreeEstimate: number
  stub: boolean
  aggregatePass: boolean
  metadata: {
    geoOk: boolean
    timeOk: boolean
    geoMessage: string | null | undefined
    timeMessage: string | null | undefined
  }
}

type FrameVerifyInput = {
  buffer: Buffer
  originalname: string
  mimeType: string
  latitude: number
  longitude: number
  capturedAt: Date
}

/**
 * Single-frame preview (FastAPI POST /internal/verify-frame). Used for live count during recording.
 * Returns { ok: false, error } when ML is disabled or the upstream call fails.
 */
export async function verifyFrameWithPlantingApi(
  input: FrameVerifyInput,
): Promise<
  { ok: true; data: MlFramePreviewOk } | { ok: false; error: string }
> {
  if (!env.PLANTING_VERIFICATION_ENABLED) {
    return { ok: false, error: 'planting_verification_disabled' }
  }
  const base = env.PLANTING_VERIFICATION_API_URL?.trim()
  const key = env.PLANTING_VERIFICATION_INTERNAL_KEY?.trim()
  if (!base || !key) {
    return { ok: false, error: 'planting_verification_not_configured' }
  }

  const url = `${base.replace(/\/$/, '')}/internal/verify-frame`
  const form = new FormData()
  form.append('image', input.buffer, {
    filename: input.originalname || 'frame.jpg',
    contentType: input.mimeType,
  })
  form.append('captured_at', input.capturedAt.toISOString())
  form.append('latitude', String(input.latitude))
  form.append('longitude', String(input.longitude))

  try {
    const res = await axios.post<{
      model_version: string
      total_tree_detections: number
      unique_tree_estimate: number
      stub: boolean
      aggregate_pass: boolean
      metadata: {
        geo_ok: boolean
        time_ok: boolean
        geo_message?: string | null
        time_message?: string | null
      }
    }>(url, form, {
      headers: {
        ...form.getHeaders(),
        'X-Internal-Key': key,
      },
      maxBodyLength: Infinity,
      maxContentLength: Infinity,
      timeout: Math.min(60_000, env.PLANTING_VERIFICATION_TIMEOUT_MS),
      validateStatus: s => s < 500,
    })

    if (res.status >= 400) {
      const detail =
        (res.data as { detail?: string | unknown })?.detail ?? res.statusText
      const msg =
        typeof detail === 'string'
          ? detail
          : JSON.stringify(detail ?? res.status)
      return { ok: false, error: `planting_api_${res.status}: ${msg}` }
    }

    const d = res.data
    return {
      ok: true,
      data: {
        modelVersion: d.model_version,
        totalTreeDetections: d.total_tree_detections,
        uniqueTreeEstimate: d.unique_tree_estimate,
        stub: d.stub,
        aggregatePass: d.aggregate_pass,
        metadata: {
          geoOk: d.metadata.geo_ok,
          timeOk: d.metadata.time_ok,
          geoMessage: d.metadata.geo_message,
          timeMessage: d.metadata.time_message,
        },
      },
    }
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e)
    console.error('[verifyFrameWithPlantingApi]', msg)
    return { ok: false, error: msg }
  }
}
