import express from 'express'
import { body } from 'express-validator'
import { protect } from '../middleware/auth.js'
import {
  generateStoryFromVideos,
  getStories,
  getStory,
  updateStory,
  deleteStory,
  toggleLikeStory,
  getStoryStats,
  getTrendingStories
} from '../controllers/storyController.js'

const router = express.Router()

// Story generation validation
const generateStoryValidation = [
  body('prompt')
    .trim()
    .isLength({ min: 5, max: 500 })
    .withMessage('Prompt must be between 5 and 500 characters'),
  body('videoIds')
    .isArray({ min: 1 })
    .withMessage('At least one video ID is required'),
  body('storyType')
    .optional()
    .isIn(['narrative', 'highlights', 'timeline', 'thematic'])
    .withMessage('Invalid story type')
]

// Story update validation
const updateStoryValidation = [
  body('title')
    .optional()
    .trim()
    .isLength({ min: 1, max: 300 })
    .withMessage('Title must be between 1 and 300 characters'),
  body('content')
    .optional()
    .trim()
    .isLength({ min: 10 })
    .withMessage('Content must be at least 10 characters'),
  body('tags')
    .optional()
    .isArray()
    .withMessage('Tags must be an array')
]

// @route   POST /api/stories/generate
router.post('/generate', protect, generateStoryValidation, generateStoryFromVideos)

// @route   GET /api/stories
router.get('/', protect, getStories)

// @route   GET /api/stories/stats
router.get('/stats', protect, getStoryStats)

// @route   GET /api/stories/trending
router.get('/trending', getTrendingStories)

// @route   GET /api/stories/:id
router.get('/:id', protect, getStory)

// @route   PUT /api/stories/:id
router.put('/:id', protect, updateStoryValidation, updateStory)

// @route   DELETE /api/stories/:id
router.delete('/:id', protect, deleteStory)

// @route   POST /api/stories/:id/like
router.post('/:id/like', protect, toggleLikeStory)

export default router
