import express, { Request, Response } from 'express'
import mongoose from 'mongoose'
import { authenticate, requireVerifier } from '../middleware/auth'
import {
  mlPreviewLimiter,
  submissionUploadLimiter,
  submissionVoteLimiter,
} from '../middleware/rateLimits'
import { upload, uploadImagePreview } from '../middleware/upload'
import {
  validateHealthCheckUpload,
  validateHealthCheckVote,
  validateSubmissionUpload,
} from '../middleware/validation'
import User from '../models/User'
import SubmissionService from '../services/submissionService'
import HealthCheckService from '../services/healthCheckService'
import { verifyFrameWithPlantingApi } from '../services/plantingVerificationService'
import {
  sendBadRequest,
  sendCreated,
  sendError,
  sendNotFound,
  sendSuccess,
} from '../utils/responseHelpers'

const router = express.Router()
const submissionService = new SubmissionService()
const healthCheckService = new HealthCheckService()

router.get(
  '/health-checks/moderation',
  authenticate,
  requireVerifier,
  async (req: Request, res: Response) => {
    try {
      const page = Math.max(1, Number(req.query.page) || 1)
      const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 20))
      const data = await healthCheckService.listModerationQueue(page, limit)
      return sendSuccess(res, 'Health check moderation queue', data)
    } catch (error: any) {
      console.error('Health check moderation list error:', error)
      return sendError(res, error.message || 'Failed to list health checks')
    }
  },
)

/**
 * @swagger
 * tags:
 *   name: Submissions
 *   description: Land and plant video submissions (one document per submission)
 */

/**
 * @swagger
 * /api/submissions/upload:
 *   post:
 *     summary: Upload land or plant clip to IPFS
 *     description: |
 *       multipart/form-data with file field `video`. `type=land` creates a new submission (do not send submissionId).
 *       `type=plant` requires `submissionId`, `treesPlanted`, and `treeType` or `treetype`; sets submission to `pending_review`.
 *       `treeType` is stored trimmed and lowercased.
 *     tags: [Submissions]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - video
 *               - latitude
 *               - longitude
 *               - type
 *             properties:
 *               video:
 *                 type: string
 *                 format: binary
 *               latitude:
 *                 type: number
 *               longitude:
 *                 type: number
 *               type:
 *                 type: string
 *                 enum: [land, plant]
 *               submissionId:
 *                 type: string
 *                 description: Required when type=plant; must be omitted when type=land
 *               treesPlanted:
 *                 type: integer
 *                 description: Required when type=plant
 *               treeType:
 *                 type: string
 *                 description: Required when type=plant (or send treetype). Verifier review applies when value is mangrove (case-insensitive).
 *               treetype:
 *                 type: string
 *                 description: Alternate field name for treeType when type=plant
 *               reverseGeocode:
 *                 type: string
 *     responses:
 *       201:
 *         description: Clip uploaded
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/SubmissionUploadResponse'
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Upload failed
 */

router.post(
  '/upload',
  submissionUploadLimiter,
  authenticate,
  upload.single('video'),
  validateSubmissionUpload,
  async (req: Request, res: Response) => {
    try {
      const {
        latitude,
        longitude,
        type,
        submissionId,
        treesPlanted,
        treeType,
        treetype,
        reverseGeocode,
      } = req.body
      const file = req.file
      const userWalletAddress = req.user?.walletAddress as string

      if (!file) {
        return sendBadRequest(res, 'No video file provided')
      }

      const uploadData = await submissionService.uploadClip(
        file,
        userWalletAddress,
        latitude,
        longitude,
        type,
        submissionId || undefined,
        treesPlanted,
        treeType || treetype,
        reverseGeocode,
      )
      return sendCreated(
        res,
        'Submission clip uploaded successfully to IPFS',
        uploadData,
      )
    } catch (error: any) {
      console.error('Submission upload error:', error)
      return sendError(res, `Failed to upload to IPFS: ${error.message}`, 500)
    }
  },
)

/**
 * @swagger
 * /api/submissions/ml-preview:
 *   post:
 *     summary: Live ML tree preview (single image frame, advisory count)
 *     tags: [Submissions]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [image, latitude, longitude]
 *             properties:
 *               image: { type: string, format: binary }
 *               latitude: { type: number }
 *               longitude: { type: number }
 *     responses:
 *       200: { description: Preview counts from YOLO }
 *       400: { description: Bad request or ML error }
 *       503: { description: Planting ML disabled or not configured }
 */
router.post(
  '/ml-preview',
  mlPreviewLimiter,
  authenticate,
  (req: Request, res: Response, next) => {
    uploadImagePreview.single('image')(req, res, (err: unknown) => {
      if (err) {
        const msg = err instanceof Error ? err.message : String(err)
        return sendBadRequest(res, msg)
      }
      next()
    })
  },
  async (req: Request, res: Response) => {
    try {
      const file = req.file
      if (!file) {
        return sendBadRequest(res, 'No image file provided (field name: image)')
      }
      const lat = parseFloat(String(req.body.latitude))
      const lng = parseFloat(String(req.body.longitude))
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
        return sendBadRequest(
          res,
          'Valid latitude and longitude are required in the multipart body',
        )
      }
      const result = await verifyFrameWithPlantingApi({
        buffer: file.buffer,
        originalname: file.originalname,
        mimeType: file.mimetype,
        latitude: lat,
        longitude: lng,
        capturedAt: new Date(),
      })
      if (result.ok === false) {
        const err = result.error
        const code =
          err === 'planting_verification_disabled' ||
          err === 'planting_verification_not_configured'
            ? 503
            : 400
        return sendError(res, err, code)
      }
      return sendSuccess(res, 'ML frame preview', result.data)
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error)
      console.error('ML preview error:', error)
      return sendError(res, message, 500)
    }
  },
)

/**
 * @swagger
 * /api/submissions/my-submissions:
 *   get:
 *     summary: List current user's submissions
 *     tags: [Submissions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, minimum: 1, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, minimum: 1, default: 10 }
 *     responses:
 *       200:
 *         description: Paginated submissions with hasLandClip / hasPlantClip flags
 *       401:
 *         description: Unauthorized
 */

router.get(
  '/my-submissions',
  authenticate,
  async (req: Request, res: Response) => {
    try {
      const { page = 1, limit = 10 } = req.query
      const walletAddress = req.user?.walletAddress as string
      const data = await submissionService.getSubmissionsByUser(
        walletAddress,
        Number(page),
        Number(limit),
      )
      return sendSuccess(res, 'User submissions retrieved successfully', data)
    } catch (error: any) {
      console.error('Error fetching submissions:', error)
      return sendError(res, 'Failed to retrieve submissions')
    }
  },
)

/**
 * @swagger
 * /api/submissions:
 *   get:
 *     summary: List submissions
 *     description: |
 *       Default (no scope): same as caller's submissions. `scope=moderation`: verifier moderation queue; only submissions with treeType mangrove (case-insensitive) and vote/status filters as before.
 *       `scope=verifier_inbox`: approved submissions the caller voted yes on with verifier rewards not fully claimed.
 *     tags: [Submissions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: scope
 *         schema:
 *           type: string
 *           enum: [moderation, verifier_inbox]
 *       - in: query
 *         name: page
 *         schema: { type: integer, minimum: 1, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, minimum: 1, default: 10 }
 *       - in: query
 *         name: minYes
 *         schema: { type: integer }
 *         description: moderation scope only
 *       - in: query
 *         name: minNo
 *         schema: { type: integer }
 *       - in: query
 *         name: maxVotes
 *         schema: { type: integer }
 *       - in: query
 *         name: status
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Submissions list
 *       403:
 *         description: Verifier role required for scoped lists
 */

router.get('/', authenticate, async (req: Request, res: Response) => {
  try {
    const scope = (req.query.scope as string | undefined)?.trim()
    const wallet = req.user?.walletAddress as string
    if (!wallet) {
      return sendError(res, 'Wallet address missing from token', 403)
    }

    if (scope === 'moderation' || scope === 'verifier_inbox') {
      const user = await User.findOne({
        walletAddress: wallet.toLowerCase(),
      }).lean()
      if (!user?.isVerifier) {
        return sendError(res, 'Access denied. Verifier role required.', 403)
      }
    }

    const page = Number(req.query.page) || 1
    const limit = Number(req.query.limit) || 10

    if (scope === 'moderation') {
      const { minYes, minNo, maxVotes, status } = req.query as Record<
        string,
        string | undefined
      >
      const result = await submissionService.getSubmissionsWithVoteFilters({
        minYes: minYes !== undefined ? Number(minYes) : undefined,
        minNo: minNo !== undefined ? Number(minNo) : undefined,
        maxVotes: maxVotes !== undefined ? Number(maxVotes) : undefined,
        status: status as string | undefined,
        page,
        limit,
      })
      return sendSuccess(res, 'Submissions retrieved', result)
    }

    if (scope === 'verifier_inbox') {
      const result = await submissionService.getVerifierInbox(
        wallet,
        page,
        limit,
      )
      return sendSuccess(res, 'Verifier inbox retrieved', result)
    }

    const data = await submissionService.getSubmissionsByUser(
      wallet,
      page,
      limit,
    )
    return sendSuccess(res, 'Submissions retrieved successfully', data)
  } catch (error: any) {
    console.error('Submissions list error:', error)
    return sendError(res, 'Failed to retrieve submissions')
  }
})

router.post(
  '/:submissionId/health-checks',
  submissionUploadLimiter,
  authenticate,
  upload.single('video'),
  validateHealthCheckUpload,
  async (req: Request, res: Response) => {
    try {
      const { submissionId } = req.params
      if (!mongoose.Types.ObjectId.isValid(submissionId)) {
        return sendBadRequest(res, 'Invalid submissionId')
      }
      const file = req.file
      const userWalletAddress = req.user?.walletAddress as string
      if (!file) {
        return sendBadRequest(res, 'No video file provided')
      }
      const { latitude, longitude, treesAlive, reverseGeocode } = req.body
      const data = await healthCheckService.createHealthCheckUpload({
        submissionId,
        planterWallet: userWalletAddress,
        file,
        latitude,
        longitude,
        treesAlive,
        reverseGeocode,
      })
      return sendCreated(res, 'Health check uploaded', data)
    } catch (error: any) {
      console.error('Health check upload error:', error)
      return sendError(res, error.message || 'Failed to upload health check')
    }
  },
)

router.get(
  '/:submissionId/health-checks/:healthCheckId',
  authenticate,
  async (req: Request, res: Response) => {
    try {
      const { submissionId, healthCheckId } = req.params
      if (!mongoose.Types.ObjectId.isValid(submissionId)) {
        return sendBadRequest(res, 'Invalid submissionId')
      }
      if (!mongoose.Types.ObjectId.isValid(healthCheckId)) {
        return sendBadRequest(res, 'Invalid healthCheckId')
      }
      const wallet = (req.user!.walletAddress as string).toLowerCase()
      const user = await User.findOne({ walletAddress: wallet }).lean()
      const isVerifier = Boolean(user?.isVerifier)
      const data = await healthCheckService.getById(
        submissionId,
        healthCheckId,
        wallet,
        isVerifier,
      )
      return sendSuccess(res, 'Health check retrieved', data)
    } catch (error: any) {
      console.error('Health check get error:', error)
      if (error.message === 'Health check not found') {
        return sendNotFound(res, 'Health check')
      }
      return sendError(res, error.message || 'Failed to get health check')
    }
  },
)

router.get(
  '/:submissionId/health-checks',
  authenticate,
  async (req: Request, res: Response) => {
    try {
      const { submissionId } = req.params
      if (!mongoose.Types.ObjectId.isValid(submissionId)) {
        return sendBadRequest(res, 'Invalid submissionId')
      }
      const wallet = (req.user!.walletAddress as string).toLowerCase()
      const user = await User.findOne({ walletAddress: wallet }).lean()
      const isVerifier = Boolean(user?.isVerifier)
      const data = await healthCheckService.listForSubmission(
        submissionId,
        wallet,
        isVerifier,
      )
      return sendSuccess(res, 'Health checks retrieved', data)
    } catch (error: any) {
      console.error('Health check list error:', error)
      return sendError(res, error.message || 'Failed to list health checks')
    }
  },
)

router.post(
  '/:submissionId/health-checks/:healthCheckId/vote',
  submissionVoteLimiter,
  authenticate,
  requireVerifier,
  validateHealthCheckVote,
  async (req: Request, res: Response) => {
    try {
      const { submissionId, healthCheckId } = req.params
      if (!mongoose.Types.ObjectId.isValid(submissionId)) {
        return sendBadRequest(res, 'Invalid submissionId')
      }
      if (!mongoose.Types.ObjectId.isValid(healthCheckId)) {
        return sendBadRequest(res, 'Invalid healthCheckId')
      }
      const { vote, reasons } = req.body
      const voterWalletAddress = req.user!.walletAddress as string
      const result = await healthCheckService.castVote({
        healthCheckId,
        submissionId,
        voterWalletAddress,
        vote,
        reasons,
      })
      return sendSuccess(res, 'Vote recorded', result)
    } catch (error: any) {
      console.error('Health check vote error:', error)
      return sendError(res, error.message || 'Failed to vote')
    }
  },
)

/**
 * @swagger
 * /api/submissions/{submissionId}:
 *   get:
 *     summary: Get submission by id
 *     tags: [Submissions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: submissionId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Submission document (land + plant)
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Submission'
 *       400:
 *         description: Invalid id
 *       401:
 *         description: Unauthorized — missing or invalid token
 *       403:
 *         description: Forbidden — not the submission owner or a verifier
 *       404:
 *         description: Not found
 */

router.get(
  '/:submissionId',
  authenticate,
  async (req: Request, res: Response) => {
    try {
      const { submissionId } = req.params
      const wallet = (req.user!.walletAddress as string).toLowerCase()
      if (!mongoose.Types.ObjectId.isValid(submissionId)) {
        return sendBadRequest(res, 'Invalid submissionId')
      }
      const doc = await submissionService.getSubmissionById(submissionId)
      if (!doc) {
        return sendNotFound(res, 'Submission')
      }
      const owner = String(doc.userWalletAddress || '').toLowerCase()
      if (owner && owner === wallet) {
        return sendSuccess(res, 'Submission retrieved successfully', doc)
      }
      const user = await User.findOne({ walletAddress: wallet }).lean()
      if (user?.isVerifier) {
        return sendSuccess(res, 'Submission retrieved successfully', doc)
      }
      return sendError(res, 'Access denied', 403)
    } catch {
      return sendError(res, 'Failed to retrieve submission')
    }
  },
)

/**
 * @swagger
 * /api/submissions/{submissionId}/vote:
 *   post:
 *     summary: Cast verifier vote
 *     description: Only allowed for submissions in pending_review with treeType mangrove (case-insensitive).
 *     tags: [Submissions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: submissionId
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [vote]
 *             properties:
 *               vote:
 *                 type: string
 *                 enum: [yes, no]
 *               reasons:
 *                 type: array
 *                 items: { type: string }
 *     responses:
 *       200:
 *         description: Vote recorded; may include approval transition
 *       400:
 *         description: Invalid request
 *       403:
 *         description: Not a verifier
 */

router.post(
  '/:submissionId/vote',
  submissionVoteLimiter,
  authenticate,
  requireVerifier,
  async (req: Request, res: Response) => {
    try {
      const { submissionId } = req.params
      if (!mongoose.Types.ObjectId.isValid(submissionId)) {
        return sendBadRequest(res, 'Invalid submissionId')
      }
      const { vote, reasons } = req.body
      const voterWalletAddress = req.user!.walletAddress
      const result = await submissionService.castVote({
        submissionId,
        voterWalletAddress,
        vote,
        reasons,
      })
      return sendSuccess(res, 'Vote recorded', result)
    } catch (error: any) {
      console.error('Vote error:', error)
      return sendError(res, error.message || 'Failed to vote')
    }
  },
)

export default router
