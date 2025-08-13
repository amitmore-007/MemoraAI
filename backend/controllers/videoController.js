import { validationResult } from 'express-validator'
import Video from '../models/Video.js'
import User from '../models/User.js'
import { 
  uploadVideoToCloudinary, 
  generateThumbnail, 
  deleteVideoFromCloudinary,
  deleteAudioFromCloudinary,
  getVideoMetadata 
} from '../services/cloudinaryService.js'
import { 
  transcribeVideo, 
  analyzeVideoContent, 
  generateVideoTags 
} from '../services/openaiService.js'

// @desc    Upload video
// @route   POST /api/videos/upload
// @access  Private
export const uploadVideo = async (req, res, next) => {
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

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Please upload a video file'
      })
    }

    const { title, description } = req.body
    const file = req.file

    // Upload to Cloudinary
    const cloudinaryResult = await uploadVideoToCloudinary(file.buffer, {
      public_id: `${req.user.id}_${Date.now()}`,
      eager: [
        { quality: "auto:good" },
        { width: 640, height: 360, crop: "fill", format: "jpg", start_offset: "10%" }
      ]
    })

    // Generate thumbnail
    const thumbnail = await generateThumbnail(cloudinaryResult.public_id)

    // Create video record
    const video = await Video.create({
      title: title || file.originalname.replace(/\.[^/.]+$/, ''),
      description: description || '',
      filename: file.originalname,
      originalName: file.originalname,
      fileSize: file.size,
      mimeType: file.mimetype,
      cloudinaryUrl: cloudinaryResult.secure_url,
      cloudinaryPublicId: cloudinaryResult.public_id,
      thumbnail,
      owner: req.user.id,
      duration: cloudinaryResult.duration || 0,
      metadata: {
        width: cloudinaryResult.width,
        height: cloudinaryResult.height,
        format: cloudinaryResult.format
      }
    })

    // Update user stats
    await req.user.updateStats({ 
      totalVideos: req.user.stats.totalVideos + 1,
      storageUsed: req.user.stats.storageUsed + file.size
    })

    // Start background processing
    processVideoInBackground(video._id)

    res.status(201).json({
      success: true,
      message: 'Video uploaded successfully',
      video
    })
  } catch (error) {
    next(error)
  }
}

// @desc    Get all videos for user
// @route   GET /api/videos
// @access  Private
export const getVideos = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, sort = '-createdAt' } = req.query

    const videos = await Video.find({ owner: req.user.id })
      .sort(sort)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .populate('owner', 'name email')

    const total = await Video.countDocuments({ owner: req.user.id })

    res.status(200).json({
      success: true,
      videos,
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

// @desc    Get single video
// @route   GET /api/videos/:id
// @access  Private
export const getVideo = async (req, res, next) => {
  try {
    const video = await Video.findOne({
      _id: req.params.id,
      owner: req.user.id
    }).populate('owner', 'name email')

    if (!video) {
      return res.status(404).json({
        success: false,
        message: 'Video not found'
      })
    }

    // Increment views
    await video.incrementViews()

    res.status(200).json({
      success: true,
      video
    })
  } catch (error) {
    next(error)
  }
}

// @desc    Update video
// @route   PUT /api/videos/:id
// @access  Private
export const updateVideo = async (req, res, next) => {
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

    const { title, description, tags, isPublic } = req.body

    const video = await Video.findOne({
      _id: req.params.id,
      owner: req.user.id
    })

    if (!video) {
      return res.status(404).json({
        success: false,
        message: 'Video not found'
      })
    }

    // Update video
    video.title = title || video.title
    video.description = description || video.description
    video.tags = tags || video.tags
    video.isPublic = isPublic !== undefined ? isPublic : video.isPublic

    await video.save()

    res.status(200).json({
      success: true,
      message: 'Video updated successfully',
      video
    })
  } catch (error) {
    next(error)
  }
}

// @desc    Delete video
// @route   DELETE /api/videos/:id
// @access  Private
export const deleteVideo = async (req, res, next) => {
  try {
    const video = await Video.findOne({
      _id: req.params.id,
      owner: req.user.id
    })

    if (!video) {
      return res.status(404).json({
        success: false,
        message: 'Video not found'
      })
    }

    // Delete video from Cloudinary
    await deleteVideoFromCloudinary(video.cloudinaryPublicId)
    
    // Delete audio from Cloudinary if it exists
    if (video.audioCloudinaryPublicId) {
      try {
        await deleteAudioFromCloudinary(video.audioCloudinaryPublicId)
        console.log('✅ Audio deleted from Cloudinary')
      } catch (audioDeleteError) {
        console.warn('⚠️ Failed to delete audio from Cloudinary:', audioDeleteError.message)
        // Don't fail the entire operation if audio deletion fails
      }
    }

    // Delete from database
    await Video.findByIdAndDelete(req.params.id)

    // Update user stats
    await req.user.updateStats({ 
      totalVideos: Math.max(0, req.user.stats.totalVideos - 1),
      storageUsed: Math.max(0, req.user.stats.storageUsed - video.fileSize)
    })

    res.status(200).json({
      success: true,
      message: 'Video deleted successfully'
    })
  } catch (error) {
    next(error)
  }
}

// @desc    Search videos
// @route   GET /api/videos/search
// @access  Private
export const searchVideos = async (req, res, next) => {
  try {
    const { q, tags, dateRange, duration, page = 1, limit = 10 } = req.query

    // Build search query
    let searchQuery = { owner: req.user.id }

    // Text search
    if (q) {
      searchQuery.$text = { $search: q }
    }

    // Tag filtering
    if (tags) {
      const tagArray = tags.split(',').map(tag => tag.trim())
      searchQuery.tags = { $in: tagArray }
    }

    // Date range filtering
    if (dateRange) {
      const now = new Date()
      let startDate

      switch (dateRange) {
        case 'today':
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate())
          break
        case 'week':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
          break
        case 'month':
          startDate = new Date(now.getFullYear(), now.getMonth(), 1)
          break
        case 'year':
          startDate = new Date(now.getFullYear(), 0, 1)
          break
      }

      if (startDate) {
        searchQuery.createdAt = { $gte: startDate }
      }
    }

    // Duration filtering
    if (duration) {
      switch (duration) {
        case 'short':
          searchQuery.duration = { $lt: 300 } // Under 5 minutes
          break
        case 'medium':
          searchQuery.duration = { $gte: 300, $lte: 1200 } // 5-20 minutes
          break
        case 'long':
          searchQuery.duration = { $gt: 1200 } // Over 20 minutes
          break
      }
    }

    // Execute search
    const videos = await Video.find(searchQuery)
      .sort(q ? { score: { $meta: 'textScore' } } : '-createdAt')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .populate('owner', 'name email')

    const total = await Video.countDocuments(searchQuery)

    res.status(200).json({
      success: true,
      videos,
      query: q,
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

// @desc    Get video statistics
// @route   GET /api/videos/stats
// @access  Private
export const getVideoStats = async (req, res, next) => {
  try {
    const stats = await Video.getUserStats(req.user.id)
    
    res.status(200).json({
      success: true,
      stats
    })
  } catch (error) {
    next(error)
  }
}

// Background processing function
const processVideoInBackground = async (videoId) => {
  let video = null
  
  try {
    video = await Video.findById(videoId)
    if (!video) {
      console.error(`❌ Video not found: ${videoId}`)
      return
    }

    console.log(`🔄 Starting background processing for video: ${video.title}`)

    // Update processing status
    await video.updateProcessingStatus('processing')

    // Initialize error tracking
    if (!video.processing.errors) {
      video.processing.errors = {}
    }

    // Step 1: Transcribe video with enhanced error handling
    try {
      console.log('📝 Starting transcription...')
      video.processing.transcriptionStatus = 'processing'
      await video.save()

      // Add timeout for transcription
      const transcriptionPromise = transcribeVideo(video.cloudinaryUrl, video.cloudinaryPublicId)
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Transcription timeout after 5 minutes')), 300000)
      )

      const transcription = await Promise.race([transcriptionPromise, timeoutPromise])
      
      // Ensure transcription is properly structured
      const transcriptionData = {
        text: typeof transcription === 'string' ? transcription : transcription.text,
        confidence: transcription.confidence || 0.95,
        language: transcription.language || 'en',
        duration: transcription.duration || 0,
        segments: transcription.segments || [],
        words: transcription.words || [],
        audioCloudinaryUrl: transcription.audioCloudinaryUrl || null,
        audioCloudinaryPublicId: transcription.audioCloudinaryPublicId || null,
        processedAt: new Date()
      }
      
      console.log(`✅ Transcription completed: ${transcriptionData.text.length} characters`)
      console.log(`📊 Transcription confidence: ${transcriptionData.confidence}`)
      console.log(`🎵 Audio stored at: ${transcriptionData.audioCloudinaryUrl}`)
      
      await video.updateTranscription(transcriptionData)
      
      video.processing.transcriptionStatus = 'completed'
      // Clear any previous transcription errors
      if (video.processing.errors && video.processing.errors.transcription) {
        delete video.processing.errors.transcription
      }
      await video.save()
      
    } catch (error) {
      console.error('❌ Transcription failed:', error.message)
      console.error('❌ Transcription stack:', error.stack)
      
      video.processing.transcriptionStatus = 'failed'
      if (!video.processing.errors) video.processing.errors = {}
      video.processing.errors.transcription = error.message
      await video.save()
      
      // Continue with AI analysis even if transcription fails
      console.log('⚠️ Continuing with AI analysis despite transcription failure')
    }

    // Step 2: AI Analysis
    try {
      console.log('🤖 Starting AI analysis...')
      video.processing.aiAnalysisStatus = 'processing'
      await video.save()

      const analysis = await analyzeVideoContent(
        video.thumbnail || video.cloudinaryUrl,
        video.transcription?.text
      )
      
      // Validate analysis structure before saving
      const validatedAnalysis = {
        tags: (analysis.tags || []).map(tag => ({
          name: typeof tag === 'string' ? tag : (tag.name || 'unknown'),
          confidence: typeof tag === 'object' && tag.confidence ? tag.confidence : 0.8
        })),
        objects: (analysis.objects || []).map(obj => ({
          name: typeof obj === 'string' ? obj : (obj.name || 'unknown'),
          confidence: typeof obj === 'object' && obj.confidence ? obj.confidence : 0.7,
          timestamp: typeof obj === 'object' && obj.timestamp ? obj.timestamp : 0
        })),
        emotions: (analysis.emotions || []).map(emotion => ({
          emotion: typeof emotion === 'string' ? emotion : (emotion.emotion || 'neutral'),
          confidence: typeof emotion === 'object' && emotion.confidence ? emotion.confidence : 0.8,
          timestamp: typeof emotion === 'object' && emotion.timestamp ? emotion.timestamp : 0
        })),
        summary: analysis.summary || 'AI analysis completed',
        themes: Array.isArray(analysis.themes) ? analysis.themes : ['general'],
        processedAt: new Date()
      }
      
      await video.updateAiAnalysis(validatedAnalysis)

      // Generate additional tags using AI
      const aiTags = await generateVideoTags(
        video.title,
        video.description,
        video.transcription?.text
      )
      
      // Merge tags without duplicates, ensuring all are strings
      const existingTags = video.tags || []
      const cleanAiTags = aiTags.filter(tag => typeof tag === 'string' && tag.trim().length > 0)
      const newTags = [...new Set([...existingTags, ...cleanAiTags])]
      video.tags = newTags
      
      video.processing.aiAnalysisStatus = 'completed'
      // Clear any previous AI analysis errors
      if (video.processing.errors && video.processing.errors.aiAnalysis) {
        delete video.processing.errors.aiAnalysis
      }
      await video.save()
      
      console.log('✅ AI analysis completed')
      
    } catch (error) {
      console.error('❌ AI analysis failed:', error.message)
      video.processing.aiAnalysisStatus = 'failed'
      video.processing.errors.aiAnalysis = error.message
      await video.save()
    }

    // Step 3: Insights Processing
    try {
      video.processing.insightsStatus = 'processing'
      video.processing.insightsProgress = 0
      await video.save()

      // Run multi-modal insights (speaker diarization, sentiment, topics, keywords)
      await runMultiModalInsights(video)
      video.processing.insightsStatus = 'completed'
      video.processing.insightsProgress = 100
      await video.save()

      // Generate highlight reel (async, may take longer)
      generateHighlightReel(video)
      // highlightReel status will be updated by service

    } catch (error) {
      video.processing.insightsStatus = 'failed'
      await video.save()
      console.error('Insights processing failed:', error)
    }

    // Determine final status
    const hasAnySuccess = video.processing.transcriptionStatus === 'completed' || 
                         video.processing.aiAnalysisStatus === 'completed'
    
    const finalStatus = hasAnySuccess ? 'completed' : 'failed'
    const finalError = hasAnySuccess ? null : 'All processing steps failed'

    // Update final processing status
    await video.updateProcessingStatus(finalStatus, finalError)
    
    if (hasAnySuccess) {
      console.log(`🎉 Video processing completed for: ${video.title}`)
      console.log(`📊 Final status: Transcription: ${video.processing.transcriptionStatus}, AI Analysis: ${video.processing.aiAnalysisStatus}`)
    } else {
      console.log(`⚠️ Video processing completed with errors for: ${video.title}`)
    }
    
  } catch (error) {
    console.error('❌ Video processing failed:', error)
    console.error('❌ Processing stack:', error.stack)
    
    // Try to update the video status if possible
    try {
      if (video) {
        await video.updateProcessingStatus('failed', `Processing error: ${error.message}`)
      } else {
        console.error('❌ Could not update video status - video object not available')
      }
    } catch (updateError) {
      console.error('❌ Failed to update video status after error:', updateError.message)
    }
  }
}

// Background insights processing function
const processInsightsInBackground = async (videoId) => {
  try {
    console.log(`🔄 [BACKGROUND] Starting insights processing for video: ${videoId}`)
    
    const video = await Video.findById(videoId)
    if (!video) {
      console.error(`❌ [BACKGROUND] Video not found for insights processing: ${videoId}`)
      return
    }

    console.log(`🔄 [BACKGROUND] Processing insights for: ${video.title}`)
    
    // Run the dynamic multi-modal insights
    await runMultiModalInsights(video)
    
    console.log(`✅ [BACKGROUND] Insights processing completed for: ${video.title}`)
  } catch (error) {
    console.error('❌ [BACKGROUND] Insights processing failed:', error)
    
    // Update video with failed status
    try {
      const video = await Video.findById(videoId)
      if (video) {
        video.insights = {
          processingStatus: 'failed',
          error: error.message,
          speakerDiarization: [],
          sentimentTimeline: [],
          topicChapters: [],
          keywords: [],
          processedAt: new Date()
        }
        await video.save()
      }
    } catch (updateError) {
      console.error('❌ [BACKGROUND] Failed to update video with error status:', updateError)
    }
  }
}