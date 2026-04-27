import mongoose from 'mongoose'

const authChallengeSchema = new mongoose.Schema(
  {
    walletAddress: {
      type: String,
      required: true,
      lowercase: true,
      index: true,
    },
    nonce: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: { expires: 0 },
    },
  },
  {
    timestamps: true,
  },
)

authChallengeSchema.index({ walletAddress: 1, nonce: 1 }, { unique: true })

export default mongoose.model('AuthChallenge', authChallengeSchema)
