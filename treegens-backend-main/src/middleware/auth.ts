import { Request, Response, NextFunction } from 'express'
import User from '../models/User'
import AuthService from '../services/authService'

const authService = new AuthService()

// Authentication middleware
const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    // Get token from Authorization header
    const authHeader = req.header('Authorization')

    if (!authHeader) {
      console.warn('Authentication failed: missing Authorization header', {
        path: req.path,
        method: req.method,
        ip: req.ip,
      })
      return res.status(401).json({
        error: 'Access denied. No token provided.',
        code: 'NO_TOKEN',
      })
    }

    // Extract token from "Bearer <token>" format
    const token = authHeader.startsWith('Bearer ')
      ? authHeader.substring(7)
      : authHeader

    if (!token) {
      console.warn('Authentication failed: invalid token format', {
        path: req.path,
        method: req.method,
        ip: req.ip,
      })
      return res.status(401).json({
        error: 'Access denied. Invalid token format.',
        code: 'INVALID_TOKEN_FORMAT',
      })
    }

    // Validate token and get user info
    const userInfo = await authService.validateUserToken(token)

    // Add user info to request object
    req.user = userInfo as any
    req.token = token

    next()
  } catch (error: any) {
    console.error('Authentication error:', {
      message: (error as any).message,
      path: req.path,
      method: req.method,
      ip: req.ip,
    })

    // Determine error type and response
    const statusCode = 401
    let errorCode = 'INVALID_TOKEN'

    if ((error as any).message.includes('expired')) {
      errorCode = 'TOKEN_EXPIRED'
    } else if ((error as any).message.includes('revoked')) {
      errorCode = 'TOKEN_REVOKED'
    } else if ((error as any).message.includes('not found')) {
      errorCode = 'USER_NOT_FOUND'
    }

    return res.status(statusCode).json({
      error: (error as any).message,
      code: errorCode,
    })
  }
}

// Optional authentication middleware (doesn't fail if no token)
const optionalAuth = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const authHeader = req.header('Authorization')

    if (!authHeader) {
      // No token provided, continue without authentication
      req.user = null
      req.token = null
      return next()
    }

    const token = authHeader.startsWith('Bearer ')
      ? authHeader.substring(7)
      : authHeader

    if (!token) {
      req.user = null
      req.token = null
      return next()
    }

    // Try to validate token
    const userInfo = await authService.validateUserToken(token)
    req.user = userInfo as any
    req.token = token

    next()
  } catch (error: any) {
    // If token validation fails, continue without authentication
    console.log('Optional auth failed:', error.message)
    req.user = null
    req.token = null
    next()
  }
}

// Role-based authorization middleware
const authorize = (allowedProviders: string[] = []) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Authentication required',
        code: 'AUTH_REQUIRED',
      })
    }

    // Check if user's auth provider is allowed
    if (
      allowedProviders.length > 0 &&
      !allowedProviders.includes(req.user.authProvider)
    ) {
      return res.status(403).json({
        error: 'Insufficient privileges for this auth provider',
        code: 'INSUFFICIENT_PRIVILEGES',
      })
    }

    next()
  }
}

// Middleware to check if user owns the resource
const requireOwnership = (userIdField = 'userId') => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Authentication required',
        code: 'AUTH_REQUIRED',
      })
    }

    const resourceUserId = req.params[userIdField] || req.body[userIdField]

    if (!resourceUserId) {
      return res.status(400).json({
        error: 'Resource user ID not provided',
        code: 'MISSING_USER_ID',
      })
    }

    // Check if the authenticated user is the owner of the resource
    if (req.user.userId.toString() !== resourceUserId.toString()) {
      return res.status(403).json({
        error: 'Access denied. You can only access your own resources.',
        code: 'ACCESS_DENIED',
      })
    }

    next()
  }
}

// Middleware to check wallet address ownership
const requireWalletOwnership = (walletAddressField = 'userWalletAddress') => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Authentication required',
        code: 'AUTH_REQUIRED',
      })
    }

    if (!req.user.walletAddress) {
      return res.status(403).json({
        error: 'Wallet address not found in token',
        code: 'NO_WALLET_ADDRESS',
      })
    }

    const resourceWalletAddress =
      req.params[walletAddressField] || req.body[walletAddressField]

    if (!resourceWalletAddress) {
      return res.status(400).json({
        error: 'Resource wallet address not provided',
        code: 'MISSING_WALLET_ADDRESS',
      })
    }

    // Check if the authenticated user's wallet address matches the resource wallet address
    if (
      req.user.walletAddress.toLowerCase() !==
      resourceWalletAddress.toLowerCase()
    ) {
      return res.status(403).json({
        error:
          'Access denied. You can only access resources associated with your wallet address.',
        code: 'WALLET_ACCESS_DENIED',
      })
    }

    next()
  }
}

export {
  authenticate,
  optionalAuth,
  authorize,
  requireOwnership,
  requireWalletOwnership,
}

// Verifier-only middleware
const requireVerifier = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    if (!req.user || !req.user.walletAddress) {
      return res.status(401).json({
        error: 'Authentication required',
        code: 'AUTH_REQUIRED',
      })
    }

    const user = await User.findOne({
      walletAddress: req.user.walletAddress.toLowerCase(),
    })
    if (!user || !user.isVerifier) {
      return res.status(403).json({
        error: 'Access denied. Verifier role required.',
        code: 'VERIFIER_REQUIRED',
      })
    }

    next()
  } catch {
    return res.status(500).json({ error: 'Failed to verify user role' })
  }
}

export { requireVerifier }
