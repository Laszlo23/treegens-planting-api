import mongoose from 'mongoose'

const gpsSchema = new mongoose.Schema(
  {
    latitude: { type: Number, required: true, min: -90, max: 90 },
    longitude: { type: Number, required: true, min: -180, max: 180 },
  },
  { _id: false },
)

const voteSchema = new mongoose.Schema(
  {
    voterWalletAddress: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    vote: { type: String, enum: ['yes', 'no'], required: true },
    reasons: { type: [String], default: [] },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false },
)

const healthCheckSchema = new mongoose.Schema(
  {
    submissionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Submission',
      required: true,
      index: true,
    },
    /** 1..N aligned with reward tranche index + 1 */
    checkpointIndex: { type: Number, required: true, min: 1 },
    treesAlive: { type: Number, required: true, min: 0 },
    distanceMeters: { type: Number, required: true, min: 0 },
    uploaded: { type: Boolean, default: false },
    originalFilename: { type: String, required: false },
    mimeType: { type: String, required: false },
    sizeBytes: { type: Number, min: 0, required: false },
    videoCID: { type: String, required: false },
    publicUrl: { type: String, required: false },
    gpsCoordinates: { type: gpsSchema, required: false },
    reverseGeocode: { type: String, required: false },
    uploadedAt: { type: Date, required: false },
    version: { type: Number, default: 1, min: 1 },
    status: {
      type: String,
      enum: ['pending_review', 'approved', 'rejected'],
      default: 'pending_review',
      index: true,
    },
    votes: { type: [voteSchema], default: [] },
    reviewedAt: { type: Date, required: false },
  },
  { timestamps: true },
)

healthCheckSchema.index({ submissionId: 1, checkpointIndex: 1 })
healthCheckSchema.index({ submissionId: 1, status: 1, createdAt: -1 })
healthCheckSchema.index({ status: 1, createdAt: -1 })

export default mongoose.model('HealthCheck', healthCheckSchema)
