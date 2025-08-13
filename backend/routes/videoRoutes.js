import express from 'express'
import { body } from 'express-validator'
import { 
  uploadVideo, 
  getVideos, 
  getVideo, 
  updateVideo, 
  deleteVideo, 
  searchVideos, 
  getVideoStats,
  getVideoInsights,
  downloadHighlightReel
} from '../controllers/videoController.js'
import { uploadVideo as uploadMiddleware, handleUploadError } from '../middleware/upload.js'
import { protect } from '../middleware/auth.js'

const router = express.Router()

// This file can be removed since routes are defined in videos.js
// Keeping for reference but routes should be in videos.js

export default router
