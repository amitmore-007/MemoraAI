import mongoose from 'mongoose'

const videoSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Video title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },
  filename: {
    type: String,
    required: true
  },
  originalName: {
    type: String,
    required: true
  },
  fileSize: {
    type: Number,
    required: true
  },
  mimeType: {
    type: String,
    required: true
  },
  duration: {
    type: Number, // in seconds
    default: 0
  },
  cloudinaryUrl: {
    type: String,
    required: true
  },
  cloudinaryPublicId: {
    type: String,
    required: true
  },
  thumbnail: {
    type: String,
    default: null
  },
  
  // Add audio storage information
  audioCloudinaryUrl: {
    type: String,
    default: null
  },
  audioCloudinaryPublicId: {
    type: String,
    default: null
  },
  
  transcription: {
    text: {
      type: String,
      default: null
    },
    confidence: {
      type: Number,
      default: 0
    },
    language: {
      type: String,
      default: 'en'
    },
    processedAt: {
      type: Date,
      default: null
    },
    audioCloudinaryUrl: {
      type: String,
      default: null
    },
    audioCloudinaryPublicId: {
      type: String,
      default: null
    }
  },
  aiAnalysis: {
    tags: [{
      name: String,
      confidence: Number
    }],
    objects: [{
      name: String,
      confidence: Number,
      timestamp: Number // when object appears in video
    }],
    emotions: [{
      emotion: String,
      confidence: Number,
      timestamp: Number
    }],
    scenes: [{
      startTime: Number,
      endTime: Number,
      description: String,
      tags: [String]
    }],
    summary: {
      type: String,
      default: null
    },
    processedAt: {
      type: Date,
      default: null
    }
  },
  metadata: {
    width: Number,
    height: Number,
    framerate: Number,
    bitrate: Number,
    codec: String
  },
  processing: {
    status: {
      type: String,
      enum: ['pending', 'processing', 'completed', 'failed'],
      default: 'pending'
    },
    transcriptionStatus: {
      type: String,
      enum: ['pending', 'processing', 'completed', 'failed'],
      default: 'pending'
    },
    aiAnalysisStatus: {
      type: String,
      enum: ['pending', 'processing', 'completed', 'failed'],
      default: 'pending'
    },
    insightsStatus: {
      type: String,
      enum: ['pending', 'processing', 'completed', 'failed'],
      default: 'pending'
    },
    error: {
      type: String,
      default: null
    },
    startedAt: {
      type: Date,
      default: null
    },
    completedAt: {
      type: Date,
      default: null
    },
    insightsProgress: {
      type: Number,
      default: 0
    }
  },
  views: {
    type: Number,
    default: 0
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  isPublic: {
    type: Boolean,
    default: false
  },
  tags: [{
    type: String,
    trim: true
  }],
  insights: {
    speakerDiarization: [{
      speaker: String, // "Speaker 1", "Speaker 2", etc.
      start: Number,
      end: Number,
      text: String
    }],
    sentimentTimeline: [{
      timestamp: Number,
      sentiment_score: Number,
      sentiment_label: String
    }],
    topicChapters: [{
      title: String,
      start_time: Number,
      end_time: Number,
      summary: String
    }],
    keywords: [{
      phrase: String,
      timestamps: [Number]
    }],
    highlightReel: {
      status: { type: String, default: 'pending' }, // pending, processing, ready, failed
      url: String,
      segments: [{
        start: Number,
        end: Number,
        phrase: String
      }]
    }
  }
}, {
  timestamps: true
})

// Indexes for better query performance
videoSchema.index({ owner: 1, createdAt: -1 })
videoSchema.index({ title: 'text', description: 'text', 'transcription.text': 'text' })
videoSchema.index({ tags: 1 })
videoSchema.index({ 'processing.status': 1 })
videoSchema.index({ createdAt: -1 })

// Virtual for formatted duration
videoSchema.virtual('formattedDuration').get(function() {
  if (!this.duration) return '0:00'
  
  const hours = Math.floor(this.duration / 3600)
  const minutes = Math.floor((this.duration % 3600) / 60)
  const seconds = this.duration % 60

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
  }
  return `${minutes}:${seconds.toString().padStart(2, '0')}`
})

// Method to increment views
videoSchema.methods.incrementViews = function() {
  this.views += 1
  return this.save()
}

// Method to update processing status
videoSchema.methods.updateProcessingStatus = function(status, error = null) {
  this.processing.status = status
  if (error) {
    this.processing.error = error
  }
  if (status === 'processing' && !this.processing.startedAt) {
    this.processing.startedAt = new Date()
  }
  if (status === 'completed' || status === 'failed') {
    this.processing.completedAt = new Date()
  }
  return this.save()
}

// Method to update transcription
videoSchema.methods.updateTranscription = function(transcriptionData) {
  this.transcription = {
    ...this.transcription,
    ...transcriptionData,
    processedAt: new Date()
  }
  
  // Store audio Cloudinary information at video level as well
  if (transcriptionData.audioCloudinaryUrl) {
    this.audioCloudinaryUrl = transcriptionData.audioCloudinaryUrl
  }
  if (transcriptionData.audioCloudinaryPublicId) {
    this.audioCloudinaryPublicId = transcriptionData.audioCloudinaryPublicId
  }
  
  this.processing.transcriptionStatus = 'completed'
  return this.save()
}

// Method to update AI analysis
videoSchema.methods.updateAiAnalysis = function(analysisData) {
  this.aiAnalysis = {
    ...this.aiAnalysis,
    ...analysisData,
    processedAt: new Date()
  }
  this.processing.aiAnalysisStatus = 'completed'
  
  // Extract tags from AI analysis - fix the nested object issue
  if (analysisData.tags && Array.isArray(analysisData.tags)) {
    const extractedTags = analysisData.tags.map(tag => {
      // Handle both string tags and object tags with name property
      if (typeof tag === 'string') {
        return tag
      } else if (tag && typeof tag === 'object' && tag.name) {
        return tag.name
      }
      return null
    }).filter(tag => tag !== null)
    
    // Merge with existing tags, ensuring uniqueness
    this.tags = [...new Set([...this.tags, ...extractedTags])]
  }
  
  return this.save()
}

// Static method to get user's video stats
videoSchema.statics.getUserStats = async function(userId) {
  try {
    const stats = await this.aggregate([
      { $match: { owner: new mongoose.Types.ObjectId(userId) } },
      {
        $group: {
          _id: null,
          totalVideos: { $sum: 1 },
          totalDuration: { $sum: '$duration' },
          totalViews: { $sum: '$views' },
          totalFileSize: { $sum: '$fileSize' }
        }
      }
    ])
    
    return stats[0] || {
      totalVideos: 0,
      totalDuration: 0,
      totalViews: 0,
      totalFileSize: 0
    }
  } catch (error) {
    console.error('Error getting user stats:', error)
    return {
      totalVideos: 0,
      totalDuration: 0,
      totalViews: 0,
      totalFileSize: 0
    }
  }
}

export default mongoose.model('Video', videoSchema)
