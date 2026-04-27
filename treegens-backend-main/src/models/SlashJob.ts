import mongoose from 'mongoose'

const slashJobStatus = ['queued', 'processing', 'completed', 'failed'] as const

const slashJobSchema = new mongoose.Schema(
  {
    jobId: { type: String, required: true, unique: true, index: true },
    idempotencyKey: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    submissionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Submission',
      required: true,
      index: true,
    },
    walletAddress: {
      type: String,
      required: true,
      lowercase: true,
      index: true,
    },
    reason: {
      type: String,
      required: true,
      default: 'minority_vote',
    },
    status: {
      type: String,
      enum: slashJobStatus,
      required: true,
      default: 'queued',
      index: true,
    },
    attempts: { type: Number, required: true, default: 0 },
    txHash: { type: String, required: false },
    lastError: { type: String, required: false },
    queuedAt: { type: Date, required: true, default: Date.now },
    startedAt: { type: Date, required: false },
    completedAt: { type: Date, required: false },
  },
  { timestamps: true },
)

slashJobSchema.index({ walletAddress: 1, createdAt: -1 })
slashJobSchema.index({ status: 1, createdAt: -1 })
slashJobSchema.index({ submissionId: 1, walletAddress: 1 })

export default mongoose.model('SlashJob', slashJobSchema)
