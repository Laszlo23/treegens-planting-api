import express, { Request, Response } from 'express'
import { authenticate } from '../middleware/auth'
import { verifierPublicLimiter } from '../middleware/rateLimits'
import {
  validateChallengeRequest,
  validateUpdateProfile,
} from '../middleware/validation'
import UserService from '../services/userService'
import VerifierService from '../services/verifierService'
import { sendError, sendNotFound, sendSuccess } from '../utils/responseHelpers'

const router = express.Router()
const userService = new UserService()
const verifierService = new VerifierService()

/**
 * @swagger
 * tags:
 *   name: Users
 *   description: User management and profile endpoints
 */

/**
 * @swagger
 * /api/users/me:
 *   get:
 *     summary: Get current authenticated user
 *     description: Retrieve the profile of the authenticated user based on the wallet address in the token
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/User'
 *       401:
 *         description: Unauthorized - authentication required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
// GET /api/users/me - Get current authenticated user by wallet in token
router.get('/me', authenticate, async (req: Request, res: Response) => {
  try {
    const walletAddress = req.user.walletAddress

    const user = await userService.getUserWithComputedTrees(walletAddress)

    if (!user) {
      return sendNotFound(res, 'User')
    }

    return sendSuccess(res, 'User retrieved successfully', user)
  } catch (error: any) {
    console.error('Error in get current user endpoint:', error)
    return sendError(res, 'Failed to retrieve user')
  }
})

router.get(
  '/me/verifier-warning-banner',
  authenticate,
  async (req: Request, res: Response) => {
    try {
      const walletAddress = req.user.walletAddress
      const banner = await userService.getVerifierWarningBanner(walletAddress)
      return sendSuccess(res, 'Verifier warning banner retrieved', banner)
    } catch (error: any) {
      console.error('Error in verifier warning banner endpoint:', error)
      return sendError(res, 'Failed to retrieve verifier warning banner')
    }
  },
)

/**
 * @swagger
 * /api/users/me:
 *   patch:
 *     summary: Update current authenticated user profile
 *     description: Update profile fields for the authenticated user. Only name, phone, and experience are accepted.
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 maxLength: 100
 *               phone:
 *                 type: string
 *                 maxLength: 30
 *               experience:
 *                 type: string
 *                 maxLength: 500
 *             additionalProperties: false
 *             minProperties: 1
 *     responses:
 *       200:
 *         description: User profile updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/User'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Unauthorized - authentication required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.patch(
  '/me',
  authenticate,
  validateUpdateProfile,
  async (req: Request, res: Response) => {
    try {
      const walletAddress = req.user.walletAddress
      const { name, phone, experience } = req.body
      const user = await userService.updateUserProfile(walletAddress, {
        name,
        phone,
        experience,
      })

      if (!user) {
        return sendNotFound(res, 'User')
      }

      return sendSuccess(res, 'User profile updated successfully', user)
    } catch (error: any) {
      console.error('Error in update profile endpoint:', error)
      return sendError(res, 'Failed to update user profile')
    }
  },
)

/**
 * @swagger
 * /api/users/leaderboard/trees-planted:
 *   get:
 *     summary: Get trees planted leaderboard
 *     description: Users with treesPlanted > 0, ranked by trees planted then account age (newer first when tied). Returns a plain array in data.
 *     tags: [Users]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number (1-based)
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 50
 *           default: 10
 *         description: Page size (max 50)
 *     responses:
 *       200:
 *         description: Leaderboard retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           walletAddress:
 *                             type: string
 *                           name:
 *                             type: string
 *                             nullable: true
 *                           treesPlanted:
 *                             type: number
 *                           createdAt:
 *                             type: string
 *                             format: date-time
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
// GET /api/users/leaderboard/trees-planted - Get trees planted leaderboard
router.get(
  '/leaderboard/trees-planted',
  async (req: Request, res: Response) => {
    try {
      const { page = 1, limit = 10 } = req.query as Record<string, string>

      const rows = await userService.getTreesPlantedLeaderboard(
        Number(page),
        Number(limit),
      )
      return sendSuccess(
        res,
        'Trees planted leaderboard retrieved successfully',
        rows,
      )
    } catch (error: any) {
      console.error('Error in trees planted leaderboard endpoint:', error)
      return sendError(res, 'Failed to retrieve trees planted leaderboard')
    }
  },
)

/**
 * @swagger
 * /api/users/verifier/check:
 *   post:
 *     summary: Check if a wallet is a verifier
 *     description: Returns whether the given walletAddress is currently marked as a verifier. Public endpoint; no authentication required.
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               walletAddress:
 *                 type: string
 *                 description: Wallet address to check
 *                 example: "0x1234567890abcdef1234567890abcdef12345678"
 *             required:
 *               - walletAddress
 *     responses:
 *       200:
 *         description: Verifier status retrieved
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         isVerifier:
 *                           type: boolean
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
// POST /api/users/verifier/check - Public: check verifier status by wallet
router.post(
  '/verifier/check',
  verifierPublicLimiter,
  validateChallengeRequest,
  async (req: Request, res: Response) => {
    try {
      const wallet = req.body.walletAddress
      const user = await userService.getUserByWalletAddress(wallet)
      const isVerifier = user ? Boolean(user.isVerifier) : false
      return sendSuccess(res, 'Verifier status retrieved', { isVerifier })
    } catch (error: any) {
      console.error('Verifier check error:', error)
      return sendError(res, 'Failed to check verifier status')
    }
  },
)

/**
 * @swagger
 * /api/users/verifier/request:
 *   post:
 *     summary: Request verifier status
 *     description: Validates user's staked TGN balance on-chain and grants verifier role if balance >= 2000 TGN
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               walletAddress:
 *                 type: string
 *                 description: Wallet address to evaluate for verifier eligibility
 *                 example: "0x1234567890abcdef1234567890abcdef12345678"
 *             required:
 *               - walletAddress
 *     responses:
 *       200:
 *         description: Verifier status evaluated
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         eligible:
 *                           type: boolean
 *                         balanceWei:
 *                           type: string
 *                         balanceTokens:
 *                           type: number
 *                         user:
 *                           $ref: '#/components/schemas/User'
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal error
 */
router.post(
  '/verifier/request',
  verifierPublicLimiter,
  validateChallengeRequest,
  async (req: Request, res: Response) => {
    try {
      const wallet = req.body.walletAddress
      const result = await verifierService.requestVerifier(wallet)
      return sendSuccess(
        res,
        result.eligible ? 'Verifier granted' : 'Verifier denied',
        result,
      )
    } catch (error: any) {
      console.error('Verifier request error:', error)
      return sendError(
        res,
        error.message || 'Failed to process verifier request',
      )
    }
  },
)

export default router
