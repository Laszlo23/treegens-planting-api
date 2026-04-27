/**
 * Application constants for TreeGens
 */

// Video compression and upload configuration
export const VIDEO_CONFIG = {
  // Maximum video size after compression (configurable)
  MAX_COMPRESSED_SIZE_MB: 10,

  // Maximum video size that can be uploaded without compression
  MAX_ALLOWED_SIZE_WITHOUT_COMPRESSION_MB: 1,

  // Maximum original video size before compression
  MAX_ORIGINAL_SIZE_MB: 20,

  // Video duration limits
  MAX_DURATION_SECONDS: 10,

  // Compression settings
  COMPRESSION: {
    // Target bitrate for compression (kbps)
    TARGET_BITRATE: 800,

    // Maximum resolution for compressed videos
    MAX_WIDTH: 1280,
    MAX_HEIGHT: 1280,

    // Frame rate for compressed videos
    FRAME_RATE: 24,

    // Quality setting (0-51, lower is better quality)
    CRF: 28,
  },

  // Supported video formats
  // SUPPORTED_FORMATS: [
  //   'video/mp4',
  //   'video/webm',
  //   'video/mov',
  //   'video/avi',
  //   'video/quicktime',
  // ],
} as const
