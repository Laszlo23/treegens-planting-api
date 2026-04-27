import rateLimit from 'express-rate-limit'

const defaults = {
  standardHeaders: true,
  legacyHeaders: false,
} as const

/**
 * Broad safety net for all `/api/*` routes (per IP).
 * Stricter per-route limiters stack on top of this.
 */
export const globalApiLimiter = rateLimit({
  ...defaults,
  windowMs: 15 * 60 * 1000,
  max: 500,
})

/** POST /api/auth/challenge — challenge storage and signing prep */
export const authChallengeLimiter = rateLimit({
  ...defaults,
  windowMs: 60 * 1000,
  max: 20,
})

/** POST /api/auth/signin — signature verification */
export const authSignInLimiter = rateLimit({
  ...defaults,
  windowMs: 60 * 1000,
  max: 20,
})

/** POST /api/submissions/upload — multipart + IPFS */
export const submissionUploadLimiter = rateLimit({
  ...defaults,
  windowMs: 60 * 1000,
  max: 30,
})

/** POST /api/submissions/ml-preview — throttled JPEG frames to YOLO preview */
export const mlPreviewLimiter = rateLimit({
  ...defaults,
  windowMs: 60 * 1000,
  max: 45,
})

/** POST /api/users/verifier/check | /verifier/request — RPC reads */
export const verifierPublicLimiter = rateLimit({
  ...defaults,
  windowMs: 60 * 1000,
  max: 40,
})

/** POST /api/submissions/:id/vote — verifier votes */
export const submissionVoteLimiter = rateLimit({
  ...defaults,
  windowMs: 60 * 1000,
  max: 60,
})

/** POST /api/rewards/claim — queue + chain work */
export const rewardClaimLimiter = rateLimit({
  ...defaults,
  windowMs: 60 * 1000,
  max: 30,
})
