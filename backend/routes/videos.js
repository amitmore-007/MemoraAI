import express from 'express'
import { body, query } from 'express-validator'
import {
  uploadVideo,
  getVideos,
  getVideo,
  updateVideo,
  deleteVideo,
  searchVideos,
  getVideoStats
} from '../controllers/videoController.js'
import { protect } from '../middleware/auth.js'
import { uploadVideo as uploadMiddleware, handleUploadError } from '../middleware/upload.js'
import Video from '../models/Video.js'

const router = express.Router()

// Validation rules
const uploadValidation = [
  body('title')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Title cannot exceed 200 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Description cannot exceed 1000 characters')
]

const updateValidation = [
  body('title')
    .optional()
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Title must be between 1 and 200 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Description cannot exceed 1000 characters'),
  body('tags')
    .optional()
    .isArray()
    .withMessage('Tags must be an array'),
  body('tags.*')
    .optional()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Each tag must be between 1 and 50 characters'),
  body('isPublic')
    .optional()
    .isBoolean()
    .withMessage('isPublic must be a boolean')
]

const searchValidation = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage('Limit must be between 1 and 50'),
  query('duration')
    .optional()
    .isIn(['short', 'medium', 'long'])
    .withMessage('Duration must be short, medium, or long'),
  query('dateRange')
    .optional()
    .isIn(['today', 'week', 'month', 'year'])
    .withMessage('Date range must be today, week, month, or year')
]

// All routes are protected
router.use(protect)

// Add comprehensive logging middleware for debugging
router.use((req, res, next) => {
  console.log(`🛣️ [ROUTE] ${req.method} ${req.path} - Original URL: ${req.originalUrl}`)
  console.log(`🛣️ [ROUTE] Params:`, req.params)
  console.log(`🛣️ [ROUTE] Query:`, req.query)
  next()
})

// Static routes (no parameters) come FIRST
router.route('/')
  .get(getVideos)

router.route('/upload')
  .post(uploadMiddleware, handleUploadError, uploadValidation, uploadVideo)

router.get('/search', searchValidation, searchVideos)
router.get('/stats', getVideoStats)

// Health and debug routes
router.get('/health', (req, res) => {
  res.json({ 
    success: true, 
    message: 'Video routes are working',
    timestamp: new Date().toISOString(),
    deployment: 'render-production'
  })
})

router.get('/deployment/verify', (req, res) => {
  res.json({ 
    success: true, 
    message: 'Latest deployment with basic video functionality',
    timestamp: new Date().toISOString(),
    version: '2.0.0-basic',
    platform: 'render'
  })
})

// Add a debug route to list videos with IDs
router.get('/debug/list', (req, res) => {
  Video.find({ owner: req.user.id })
    .select('_id title createdAt processing')
    .limit(10)
    .then(videos => {
      console.log(`📹 [DEBUG] Found ${videos.length} videos for user ${req.user.id}`)
      videos.forEach(video => {
        console.log(`📹 [DEBUG] Video: ${video._id} - "${video.title}"`)
        console.log(`📹 [DEBUG] Processing: ${video.processing?.status || 'unknown'}`)
      })
      
      res.json({
        success: true,
        count: videos.length,
        videos: videos.map(v => ({
          id: v._id,
          title: v.title,
          createdAt: v.createdAt,
          processingStatus: v.processing?.status
        }))
      })
    })
    .catch(error => {
      console.error('❌ [DEBUG] Error listing videos:', error)
      res.status(500).json({ success: false, error: error.message })
    })
})

// Generic :id routes
router.route('/:id')
  .get(getVideo)
  .put(updateValidation, updateVideo)
  .delete(deleteVideo)

export default router
         