import 'express'

declare module 'express-serve-static-core' {
  interface Request {
    user?: {
      userId: string
      walletAddress: string
      email?: string | null
      name?: string | null
      authProvider?: 'wallet' | 'gmail' | string
    } | null
    token?: string | null
    file?: Express.Multer.File
  }
}
