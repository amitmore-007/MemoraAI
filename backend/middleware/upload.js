import multer from 'multer'
import path from 'path'

// Configure multer for memory storage
const storage = multer.memoryStorage()

// File filter function
const fileFilter = (req, file, cb) => {
  // Check if file is a video
  if (file.mimetype.startsWith('video/')) {
    cb(null, true)
  } else {
    cb(new Error('Please upload a video file'), false)
  }
}

// Create multer upload instance
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB limit
  },
  fileFilter: fileFilter
})

// Middleware for single video upload
export const uploadVideo = upload.single('video')

// Error handling middleware for multer
export const handleUploadError = (error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File too large. Maximum size is 100MB.'
      })
    }
    if (error.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({
        success: false,
        message: 'Unexpected field name. Use "video" as field name.'
      })
    }
  }
  
  if (error.message === 'Please upload a video file') {
    return res.status(400).json({
      success: false,
      message: 'Please upload a valid video file'
    })
  }
  
  next(error)
}
