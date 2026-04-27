import mongoose from 'mongoose'

const verifierWarningSchema = new mongoose.Schema(
  {
    walletAddress: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    submissionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Submission',
      required: true,
      index: true,
    },
    /** When set, this warning is for a minority vote on that health check; omit for submission votes. */
    healthCheckId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'HealthCheck',
      required: false,
      index: true,
    },
    vote: {
      type: String,
      enum: ['yes', 'no'],
      required: true,
    },
    majorityVote: {
      type: String,
      enum: ['yes', 'no'],
      required: true,
    },
    consumedBySlashAt: {
      type: Date,
      required: false,
    },
  },
  { timestamps: true },
)

verifierWarningSchema.index(
  { walletAddress: 1, submissionId: 1, healthCheckId: 1 },
  { unique: true },
)

export default mongoose.model('VerifierWarning', verifierWarningSchema)
