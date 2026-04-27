/**
 * Video validation utilities for TreeGens
 * Ensures videos meet requirements for large-scale backend processing
 */

import { VIDEO_CONFIG } from './constants'

export interface VideoValidationResult {
  isValid: boolean
  error?: string
  duration?: number
  fileSize?: number
}

export interface VideoConstraints {
  maxDurationSeconds: number
  maxFileSizeMB: number
  maxOriginalSizeMB: number
  allowedFormats?: readonly string[]
}

/**
 * Get video duration from file
 * @param file Video file to check
 * @returns Promise with duration in seconds
 */
export const getVideoDuration = (file: File): Promise<number> => {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video')
    video.preload = 'metadata'

    video.onloadedmetadata = () => {
      window.URL.revokeObjectURL(video.src)
      resolve(video.duration)
    }

    video.onerror = () => {
      window.URL.revokeObjectURL(video.src)
      reject(new Error('Failed to load video metadata'))
    }

    video.src = URL.createObjectURL(file)
  })
}

/**
 * Validate video file against constraints with compression awareness
 * @param file Video file to validate
 * @returns Promise with validation result
 */
export const validateVideoFile = async (
  file: File,
): Promise<VideoValidationResult> => {
  try {
    // Check file type
    // if (
    //   VIDEO_CONFIG.SUPPORTED_FORMATS &&
    //   !VIDEO_CONFIG.SUPPORTED_FORMATS.includes(file.type)
    // ) {
    //   return {
    //     isValid: false,
    //     error: `Invalid video format. Allowed formats: ${VIDEO_CONFIG.SUPPORTED_FORMATS.join(', ')}`,
    //     fileSize: file.size / (1024 * 1024), // Size in MB
    //   }
    // }

    const fileSizeMB = file.size / (1024 * 1024)

    // Check if file is too large even for compression
    if (fileSizeMB > VIDEO_CONFIG.MAX_ORIGINAL_SIZE_MB) {
      return {
        isValid: false,
        error: `File too large. Maximum allowed size is ${VIDEO_CONFIG.MAX_ORIGINAL_SIZE_MB}MB (before compression)`,
        fileSize: fileSizeMB,
      }
    }

    // Check duration
    const duration = await getVideoDuration(file)
    if (duration > VIDEO_CONFIG.MAX_DURATION_SECONDS) {
      return {
        isValid: false,
        error: `Video too long. Maximum duration: ${VIDEO_CONFIG.MAX_DURATION_SECONDS} seconds`,
        duration,
        fileSize: fileSizeMB,
      }
    }

    return {
      isValid: true,
      duration,
      fileSize: fileSizeMB,
    }
  } catch (error) {
    return {
      isValid: false,
      error: `Failed to validate video: ${error instanceof Error ? error.message : 'Unknown error'}`,
    }
  }
}

/**
 * Validate a compressed video file to ensure it meets final upload requirements
 * @param file Compressed video file to validate
 * @returns Promise with validation result
 */
export const validateCompressedVideo = async (
  file: File,
): Promise<VideoValidationResult> => {
  const fileSizeMB = file.size / (1024 * 1024)

  // Final size check after compression
  if (fileSizeMB > VIDEO_CONFIG.MAX_COMPRESSED_SIZE_MB) {
    return {
      isValid: false,
      error: `Compressed video is still too large: ${fileSizeMB.toFixed(1)}MB. Maximum allowed: ${VIDEO_CONFIG.MAX_COMPRESSED_SIZE_MB}MB`,
      fileSize: fileSizeMB,
    }
  }

  // Duration check (should not change after compression)
  try {
    const duration = await getVideoDuration(file)
    if (duration > VIDEO_CONFIG.MAX_DURATION_SECONDS) {
      return {
        isValid: false,
        error: `Video duration invalid after compression: ${duration.toFixed(1)}s. Maximum: ${VIDEO_CONFIG.MAX_DURATION_SECONDS}s`,
        duration,
        fileSize: fileSizeMB,
      }
    }

    return {
      isValid: true,
      duration,
      fileSize: fileSizeMB,
    }
  } catch (error) {
    return {
      isValid: false,
      error: `Failed to validate compressed video: ${error instanceof Error ? error.message : 'Unknown error'}`,
      fileSize: fileSizeMB,
    }
  }
}
