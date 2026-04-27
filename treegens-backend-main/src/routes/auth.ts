import express, { Request, Response } from 'express'
import { authenticate } from '../middleware/auth'
import {
  authChallengeLimiter,
  authSignInLimiter,
} from '../middleware/rateLimits'
import {
  validateChallengeRequest,
  validateWalletSignIn,
} from '../middleware/validation'
import AuthService from '../services/authService'
import {
  sendSuccess,
  sendError,
  sendBadRequest,
  sendCreated,
} from '../utils/responseHelpers'

const router = express.Router()
const authService = new AuthService()

/**
 * @swagger
 * tags:
 *   name: Authentication
 *   description: User authentication and authorization endpoints
 */

/**
 * @swagger
 * /api/auth/challenge:
 *   post:
 *     summary: Generate challenge message for wallet signing
 *     description: Generates a unique challenge message that needs to be signed by the user's wallet for authentication
 *     tags: [Authentication]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               walletAddress:
 *                 type: string
 *                 description: Ethereum wallet address
 *                 example: "0x1234567890abcdef1234567890abcdef12345678"
 *             required:
 *               - walletAddress
 *     responses:
 *       200:
 *         description: Challenge generated successfully
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
 *                         message:
 *                           type: string
 *                           description: Challenge message to be signed
 *                         nonce:
 *                           type: string
 *                           description: Unique nonce for this challenge
 *                         timestamp:
 *                           type: string
 *                           description: Challenge generation timestamp
 *       400:
 *         description: Bad request - missing or invalid wallet address
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
router.post(
  '/challenge',
  authChallengeLimiter,
  validateChallengeRequest,
  async (req: Request, res: Response) => {
    try {
      const { walletAddress } = req.body

      if (!walletAddress) {
        return sendBadRequest(res, 'Wallet address is required')
      }

      // Generate challenge message
      const challenge =
        await authService.generateChallengeMessage(walletAddress)

      return sendSuccess(res, 'Challenge generated successfully', challenge)
    } catch (error: any) {
      console.error('Challenge generation error:', error)
      return sendError(res, 'Failed to generate challenge')
    }
  },
)

/**
 * @swagger
 * /api/auth/signin:
 *   post:
 *     summary: Sign in with wallet signature
 *     description: Authenticate user using wallet signature verification (compatible with thirdweb)
 *     tags: [Authentication]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/WalletSignInRequest'
 *     responses:
 *       201:
 *         description: Authentication successful
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/AuthResponse'
 *       400:
 *         description: Bad request - missing required fields
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Authentication failed - invalid signature
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
// Sign in with wallet (compatible with thirdweb)
router.post(
  '/signin',
  authSignInLimiter,
  validateWalletSignIn,
  async (req: Request, res: Response) => {
    try {
      const { walletAddress, signature, message } = req.body

      if (!walletAddress || !signature || !message) {
        return sendBadRequest(
          res,
          'Wallet address, signature, and message are required',
        )
      }

      console.log('Wallet sign-in attempt:', { walletAddress })

      const authResult = await authService.signInWithWallet(
        walletAddress,
        signature,
        message,
      )

      return sendCreated(res, 'Authentication successful', authResult)
    } catch (error: any) {
      console.error('Wallet authentication error:', {
        walletAddress: req.body?.walletAddress,
        messagePrefix: req.body?.message?.slice(0, 40),
        error,
      })
      return sendError(res, error.message, 401)
    }
  },
)

/**
 * @swagger
 * /api/auth/verify:
 *   get:
 *     summary: Verify authentication token
 *     description: Protected endpoint to verify if the provided JWT token is valid
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Token is valid
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
 *                         user:
 *                           $ref: '#/components/schemas/User'
 *                         message:
 *                           type: string
 *                           example: "You are authenticated"
 *       401:
 *         description: Unauthorized - invalid or missing token
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
// Verify token (protected route to test authentication)
router.get('/verify', authenticate, async (req: Request, res: Response) => {
  try {
    return sendSuccess(res, 'Token is valid', {
      user: req.user,
      message: 'You are authenticated',
    })
  } catch (error: any) {
    console.error('Token verification error:', error)
    return sendError(res, 'Token verification failed')
  }
})

/**
 * @swagger
 * /api/auth/signout:
 *   post:
 *     summary: Sign out user
 *     description: Invalidate the current user's authentication token
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Successfully signed out
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       401:
 *         description: Unauthorized - invalid or missing token
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
// Sign out
router.post('/signout', authenticate, async (req: Request, res: Response) => {
  try {
    await authService.signOut(req.user.userId)

    return sendSuccess(res, 'Successfully signed out')
  } catch (error: any) {
    console.error('Sign out error:', error)
    return sendError(res, 'Sign out failed')
  }
})

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     summary: Get current user information
 *     description: Retrieve information about the currently authenticated user
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User information retrieved successfully
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
 *                         user:
 *                           $ref: '#/components/schemas/User'
 *       401:
 *         description: Unauthorized - invalid or missing token
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
// Get current user info
router.get('/me', authenticate, async (req: Request, res: Response) => {
  try {
    return sendSuccess(res, 'User information retrieved', {
      user: req.user,
    })
  } catch (error: any) {
    console.error('Get user info error:', error)
    return sendError(res, 'Failed to get user information')
  }
})

export default router
