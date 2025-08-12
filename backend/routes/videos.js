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

// Routes
router.route('/')
  .get(getVideos)

router.route('/upload')
  .post(uploadMiddleware, handleUploadError, uploadValidation, uploadVideo)

router.get('/search', searchValidation, searchVideos)
router.get('/stats', getVideoStats)

router.route('/:id')
  .get(getVideo)
  .put(updateValidation, updateVideo)
  .delete(deleteVideo)

export default router
