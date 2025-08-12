import { v2 as cloudinary } from 'cloudinary'
import { Readable } from 'stream'
import fetch from 'node-fetch'

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true // Force HTTPS URLs
})

// Retry helper function
const retryWithBackoff = async (fn, maxRetries = 3, baseDelay = 1000) => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn()
    } catch (error) {
      console.error(`❌ Cloudinary operation attempt ${attempt}/${maxRetries} failed:`, error.message)
      
      if (attempt === maxRetries) {
        throw error
      }
      
      // Check if it's a retryable error
      const isRetryableError = error.code === 'ECONNRESET' || 
                              error.code === 'ENOTFOUND' || 
                              error.code === 'ETIMEDOUT' ||
                              (error.http_code && error.http_code >= 500)
      
      if (!isRetryableError) {
        throw error
      }
      
      const delay = baseDelay * Math.pow(2, attempt - 1)
      console.log(`⏳ Retrying Cloudinary operation in ${delay}ms...`)
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }
}

// Upload video to Cloudinary
export const uploadVideoToCloudinary = async (fileBuffer, options = {}) => {
  return retryWithBackoff(() => {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          resource_type: 'video',
          folder: 'videostory-ai/videos',
          quality: 'auto',
          format: 'mp4',
          transformation: [
            { quality: 'auto:good' },
            { fetch_format: 'auto' }
          ],
          ...options
        },
        (error, result) => {
          if (error) {
            reject(error)
          } else {
            resolve(result)
          }
        }
      )

      // Convert buffer to stream and pipe to Cloudinary
      const bufferStream = new Readable()
      bufferStream.push(fileBuffer)
      bufferStream.push(null)
      bufferStream.pipe(uploadStream)
    })
  }, 2, 2000)
}

// Upload audio to Cloudinary
export const uploadAudioToCloudinary = async (audioBuffer, options = {}) => {
  return retryWithBackoff(() => {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          resource_type: 'video', // Use video resource type for audio files
          folder: 'videostory-ai/audio',
          format: 'mp3',
          ...options
        },
        (error, result) => {
          if (error) {
            reject(error)
          } else {
            resolve(result)
          }
        }
      )

      // Convert buffer to stream and pipe to Cloudinary
      const bufferStream = new Readable()
      bufferStream.push(audioBuffer)
      bufferStream.push(null)
      bufferStream.pipe(uploadStream)
    })
  }, 2, 2000)
}

// Generate video thumbnail
export const generateThumbnail = async (videoPublicId) => {
  try {
    const thumbnailUrl = cloudinary.url(videoPublicId, {
      resource_type: 'video',
      format: 'jpg',
      secure: true, // Force HTTPS
      transformation: [
        { width: 640, height: 360, crop: 'fill' },
        { start_offset: '10%' } // Get thumbnail from 10% into the video
      ]
    })
    
    return thumbnailUrl
  } catch (error) {
    console.error('Error generating thumbnail:', error)
    return null
  }
}

// Extract and upload audio from video for transcription
export const extractAndUploadAudioFromVideo = async (videoPublicId) => {
  return retryWithBackoff(async () => {
    try {
      // Generate audio URL from video using Cloudinary transformation
      const audioUrl = cloudinary.url(videoPublicId, {
        resource_type: 'video',
        format: 'mp3',
        secure: true, // Force HTTPS
        transformation: [
          { flags: 'splice', start_offset: '0' },
          { audio_codec: 'mp3', audio_frequency: '16000', audio_bit_rate: '128k' }, // Enhanced audio quality
          { duration: '300' } // Limit to 5 minutes for faster processing
        ]
      })

      console.log('🎵 Generated audio URL:', audioUrl)

      // Download the audio file with enhanced timeout and headers
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 60000) // Increase to 60 seconds

      try {
        const response = await fetch(audioUrl, {
          signal: controller.signal,
          timeout: 60000,
          headers: {
            'User-Agent': 'VideoStory-AI/1.0',
            'Accept': 'audio/mpeg, audio/*',
            'Cache-Control': 'no-cache'
          }
        })
        
        clearTimeout(timeoutId)

        if (!response.ok) {
          throw new Error(`Failed to fetch audio: ${response.status} ${response.statusText}`)
        }

        // Get content length for validation
        const contentLength = response.headers.get('content-length')
        console.log('📊 Expected audio size:', contentLength, 'bytes')

        const audioArrayBuffer = await response.arrayBuffer()
        const audioBuffer = Buffer.from(audioArrayBuffer)
        
        console.log('✅ Audio downloaded successfully, actual size:', audioBuffer.length, 'bytes')
        
        if (audioBuffer.length === 0) {
          throw new Error('Downloaded audio file is empty')
        }
        
        // Enhanced validation
        if (audioBuffer.length < 1000) {
          throw new Error('Audio file too small, possibly corrupted')
        }

        // Validate it's actually an MP3 file (check for MP3 header)
        const mp3Header = audioBuffer.slice(0, 3)
        const isValidMp3 = mp3Header[0] === 0xFF && (mp3Header[1] & 0xE0) === 0xE0
        
        if (!isValidMp3) {
          console.warn('⚠️ File may not be valid MP3, but proceeding...')
        }

        // Upload audio to Cloudinary with better options
        console.log('📤 Uploading audio to Cloudinary...')
        const audioUploadResult = await uploadAudioToCloudinary(audioBuffer, {
          public_id: `${videoPublicId}_audio`,
          overwrite: true,
          resource_type: 'video',
          format: 'mp3',
          quality: 'auto:good'
        })

        console.log('✅ Audio uploaded to Cloudinary:', audioUploadResult.secure_url)
        
        return {
          buffer: audioBuffer,
          cloudinaryUrl: audioUploadResult.secure_url,
          cloudinaryPublicId: audioUploadResult.public_id,
          originalUrl: audioUrl,
          format: 'mp3',
          size: audioBuffer.length
        }
      } catch (fetchError) {
        clearTimeout(timeoutId)
        console.error('❌ Audio download failed:', fetchError.message)
        throw fetchError
      }
    } catch (error) {
      console.error('❌ Error in extractAndUploadAudioFromVideo:', error.message)
      throw error
    }
  }, 3, 2000)
}

// Keep the original function for backward compatibility
export const extractAudioFromVideo = async (videoPublicId) => {
  const result = await extractAndUploadAudioFromVideo(videoPublicId)
  return {
    buffer: result.buffer,
    url: result.originalUrl,
    format: result.format
  }
}

// Delete video from Cloudinary
export const deleteVideoFromCloudinary = async (publicId) => {
  return retryWithBackoff(async () => {
    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: 'video'
    })
    return result
  }, 2, 1000)
}

// Delete audio from Cloudinary
export const deleteAudioFromCloudinary = async (publicId) => {
  return retryWithBackoff(async () => {
    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: 'video'
    })
    return result
  }, 2, 1000)
}

// Get video metadata
export const getVideoMetadata = async (publicId) => {
  return retryWithBackoff(async () => {
    const result = await cloudinary.api.resource(publicId, {
      resource_type: 'video'
    })
    
    return {
      duration: result.duration,
      width: result.width,
      height: result.height,
      format: result.format,
      bitrate: result.bit_rate,
      frameRate: result.frame_rate
    }
  }, 2, 1000)
}
