import { validationResult } from 'express-validator'
import Story from '../models/Story.js'
import Video from '../models/Video.js'
import User from '../models/User.js'
import { generateStory } from '../services/openaiService.js'

// @desc    Generate story from videos
// @route   POST /api/stories/generate
// @access  Private
export const generateStoryFromVideos = async (req, res, next) => {
  try {
    // Check for validation errors
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      })
    }

    const { prompt, videoIds = [], storyType = 'narrative', settings = {} } = req.body

    // Validate video IDs
    if (!videoIds.length) {
      return res.status(400).json({
        success: false,
        message: 'At least one video is required'
      })
    }

    // Get videos owned by user
    const videos = await Video.find({
      _id: { $in: videoIds },
      owner: req.user.id
    })

    if (!videos.length) {
      return res.status(404).json({
        success: false,
        message: 'No valid videos found'
      })
    }

    const startTime = Date.now()

    // Generate story using AI
    const aiResult = await generateStory(prompt, videos, storyType)
    
    const generationTime = Date.now() - startTime

    // Create story record
    const story = await Story.create({
      title: `${prompt.substring(0, 50)}${prompt.length > 50 ? '...' : ''}`,
      content: aiResult.content,
      prompt,
      storyType,
      videos: videos.map(video => ({
        video: video._id,
        relevanceScore: 0.8 // Default relevance score
      })),
      metadata: {
        ...aiResult.metadata,
        generationTime
      },
      settings: {
        tone: settings.tone || 'casual',
        length: settings.length || 'medium',
        includeTimestamps: settings.includeTimestamps || false,
        includeQuotes: settings.includeQuotes || true
      },
      owner: req.user.id
    })

    // Update user stats - increment story count
    try {
      const user = await User.findById(req.user.id)
      if (user && user.stats) {
        await user.updateStats({ 
          totalStoriesGenerated: (user.stats.totalStoriesGenerated || 0) + 1
        })
      }
    } catch (statsError) {
      console.warn('Failed to update user story stats:', statsError.message)
    }

    // Populate the story with video details
    const populatedStory = await Story.findById(story._id)
      .populate('videos.video', 'title thumbnail duration tags')
      .populate('owner', 'name email')

    res.status(201).json({
      success: true,
      message: 'Story generated successfully',
      story: populatedStory
    })
  } catch (error) {
    next(error)
  }
}

// @desc    Get all stories for user
// @route   GET /api/stories
// @access  Private
export const getStories = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, sort = '-createdAt', storyType } = req.query

    let query = { owner: req.user.id }

    // Filter by story type
    if (storyType) {
      query.storyType = storyType
    }

    const stories = await Story.find(query)
      .sort(sort)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .populate('videos.video', 'title thumbnail duration')
      .populate('owner', 'name email')

    const total = await Story.countDocuments(query)

    res.status(200).json({
      success: true,
      stories,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    next(error)
  }
}

// @desc    Get single story
// @route   GET /api/stories/:id
// @access  Private
export const getStory = async (req, res, next) => {
  try {
    const story = await Story.findOne({
      _id: req.params.id,
      owner: req.user.id
    })
      .populate('videos.video', 'title thumbnail duration tags transcription')
      .populate('owner', 'name email')

    if (!story) {
      return res.status(404).json({
        success: false,
        message: 'Story not found'
      })
    }

    // Increment views
    await story.incrementViews()

    res.status(200).json({
      success: true,
      story
    })
  } catch (error) {
    next(error)
  }
}

// @desc    Update story
// @route   PUT /api/stories/:id
// @access  Private
export const updateStory = async (req, res, next) => {
  try {
    // Check for validation errors
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      })
    }

    const { title, content, tags, isPublic } = req.body

    const story = await Story.findOne({
      _id: req.params.id,
      owner: req.user.id
    })

    if (!story) {
      return res.status(404).json({
        success: false,
        message: 'Story not found'
      })
    }

    // Update story
    story.title = title || story.title
    story.content = content || story.content
    story.tags = tags || story.tags
    story.isPublic = isPublic !== undefined ? isPublic : story.isPublic

    // Increment version if content changed
    if (content && content !== story.content) {
      story.version += 1
    }

    await story.save()

    res.status(200).json({
      success: true,
      message: 'Story updated successfully',
      story
    })
  } catch (error) {
    next(error)
  }
}

// @desc    Delete story
// @route   DELETE /api/stories/:id
// @access  Private
export const deleteStory = async (req, res, next) => {
  try {
    const story = await Story.findOne({
      _id: req.params.id,
      owner: req.user.id
    })

    if (!story) {
      return res.status(404).json({
        success: false,
        message: 'Story not found'
      })
    }

    await Story.findByIdAndDelete(req.params.id)

    // Update user stats
    await req.user.updateStats({ 
      totalStoriesGenerated: Math.max(0, req.user.stats.totalStoriesGenerated - 1)
    })

    res.status(200).json({
      success: true,
      message: 'Story deleted successfully'
    })
  } catch (error) {
    next(error)
  }
}

// @desc    Like/unlike story
// @route   POST /api/stories/:id/like
// @access  Private
export const toggleLikeStory = async (req, res, next) => {
  try {
    const story = await Story.findById(req.params.id)

    if (!story) {
      return res.status(404).json({
        success: false,
        message: 'Story not found'
      })
    }

    // Check if user can like this story (must be public or owned by user)
    if (!story.isPublic && story.owner.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Cannot like private story'
      })
    }

    const wasLiked = story.isLikedBy(req.user.id)
    await story.toggleLike(req.user.id)

    res.status(200).json({
      success: true,
      message: wasLiked ? 'Story unliked' : 'Story liked',
      liked: !wasLiked,
      likeCount: story.likeCount
    })
  } catch (error) {
    next(error)
  }
}

// @desc    Get story statistics
// @route   GET /api/stories/stats
// @access  Private
export const getStoryStats = async (req, res, next) => {
  try {
    const stats = await Story.getUserStats(req.user.id)
    
    res.status(200).json({
      success: true,
      stats
    })
  } catch (error) {
    next(error)
  }
}

// @desc    Get trending stories
// @route   GET /api/stories/trending
// @access  Public
export const getTrendingStories = async (req, res, next) => {
  try {
    const { limit = 10 } = req.query

    const stories = await Story.getTrending(parseInt(limit))

    res.status(200).json({
      success: true,
      stories
    })
  } catch (error) {
    next(error)
  }
}
