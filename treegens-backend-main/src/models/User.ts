import mongoose from 'mongoose'

const userSchema = new mongoose.Schema(
  {
    walletAddress: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    name: {
      type: String,
      required: false,
      trim: true,
      maxlength: 100,
    },
    ensName: {
      type: String,
      required: false,
      trim: true,
      maxlength: 100,
    },
    phone: {
      type: String,
      required: false,
      trim: true,
    },
    experience: {
      type: String,
      required: false,
      trim: true,
      maxlength: 500,
    },
    // Authentication fields
    email: {
      type: String,
      required: false,
      trim: true,
      maxlength: 200,
    },
    authProvider: {
      type: String,
      required: false,
      enum: ['wallet', 'gmail'],
      default: 'wallet',
    },
    currentToken: {
      type: String,
      required: false,
    },
    tokenExpiration: {
      type: Date,
      required: false,
    },
    lastLoginAt: {
      type: Date,
      required: false,
    },
    // Future extensible fields
    treesPlanted: {
      type: Number,
      required: false,
      default: 0,
      min: 0,
    },
    tokensClaimed: {
      type: String,
      required: false,
      default: '0',
    },
    // Verifier fields
    isVerifier: {
      type: Boolean,
      required: false,
      default: false,
      index: true,
    },
    verifierSince: {
      type: Date,
      required: false,
    },
    verifierWarningCount: {
      type: Number,
      required: false,
      default: 0,
      min: 0,
    },
    verifierSlashCount: {
      type: Number,
      required: false,
      default: 0,
      min: 0,
    },
    lastSlashedAt: {
      type: Date,
      required: false,
    },
  },
  {
    timestamps: true,
  },
)

// Indexes for efficient querying
userSchema.index({ walletAddress: 1 })
userSchema.index({ createdAt: -1 })

export default mongoose.model('User', userSchema)
