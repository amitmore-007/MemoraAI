import mongoose from 'mongoose'

const storySchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Story title is required'],
    trim: true,
    maxlength: [300, 'Title cannot exceed 300 characters']
  },
  content: {
    type: String,
    required: [true, 'Story content is required'],
    trim: true
  },
  prompt: {
    type: String,
    required: [true, 'Prompt is required'],
    trim: true,
    maxlength: [500, 'Prompt cannot exceed 500 characters']
  },
  storyType: {
    type: String,
    enum: ['narrative', 'highlights', 'timeline', 'thematic'],
    default: 'narrative'
  },
  videos: [{
    video: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Video',
      required: true
    },
    relevanceScore: {
      type: Number,
      default: 1.0,
      min: 0,
      max: 1
    }
  }],
  metadata: {
    wordCount: {
      type: Number,
      default: 0
    },
    readingTime: {
      type: Number,
      default: 0
    },
    aiModel: {
      type: String,
      default: 'groq'
    },
    tokensUsed: {
      type: Number,
      default: 0
    },
    generationTime: {
      type: Number,
      default: 0
    }
  },
  settings: {
    tone: {
      type: String,
      enum: ['casual', 'formal', 'enthusiastic', 'professional'],
      default: 'casual'
    },
    length: {
      type: String,
      enum: ['short', 'medium', 'long'],
      default: 'medium'
    },
    includeTimestamps: {
      type: Boolean,
      default: false
    },
    includeQuotes: {
      type: Boolean,
      default: true
    }
  },
  tags: [{
    type: String,
    trim: true
  }],
  views: {
    type: Number,
    default: 0
  },
  likes: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    likedAt: {
      type: Date,
      default: Date.now
    }
  }],
  likeCount: {
    type: Number,
    default: 0
  },
  version: {
    type: Number,
    default: 1
  },
  isPublic: {
    type: Boolean,
    default: false
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
})

// Indexes for better query performance
storySchema.index({ owner: 1, createdAt: -1 })
storySchema.index({ title: 'text', content: 'text', prompt: 'text' })
storySchema.index({ storyType: 1 })
storySchema.index({ tags: 1 })
storySchema.index({ isPublic: 1, createdAt: -1 })
storySchema.index({ likeCount: -1, createdAt: -1 })

// Virtual for formatted reading time
storySchema.virtual('formattedReadingTime').get(function() {
  if (this.metadata.readingTime < 1) return 'Less than 1 min'
  return `${this.metadata.readingTime} min read`
})

// Method to increment views
storySchema.methods.incrementViews = function() {
  this.views += 1
  return this.save()
}

// Method to toggle like
storySchema.methods.toggleLike = function(userId) {
  const existingLike = this.likes.find(like => like.user.toString() === userId.toString())
  
  if (existingLike) {
    // Remove like
    this.likes = this.likes.filter(like => like.user.toString() !== userId.toString())
    this.likeCount = Math.max(0, this.likeCount - 1)
  } else {
    // Add like
    this.likes.push({ user: userId })
    this.likeCount += 1
  }
  
  return this.save()
}

// Method to check if user liked this story
storySchema.methods.isLikedBy = function(userId) {
  return this.likes.some(like => like.user.toString() === userId.toString())
}

// Static method to get user's story stats
storySchema.statics.getUserStats = async function(userId) {
  try {
    const stats = await this.aggregate([
      { $match: { owner: new mongoose.Types.ObjectId(userId) } },
      {
        $group: {
          _id: null,
          totalStories: { $sum: 1 },
          totalViews: { $sum: '$views' },
          totalLikes: { $sum: '$likeCount' },
          avgReadingTime: { $avg: '$metadata.readingTime' }
        }
      }
    ])
    
    return stats[0] || {
      totalStories: 0,
      totalViews: 0,
      totalLikes: 0,
      avgReadingTime: 0
    }
  } catch (error) {
    console.error('Error getting story stats:', error)
    return {
      totalStories: 0,
      totalViews: 0,
      totalLikes: 0,
      avgReadingTime: 0
    }
  }
}

// Static method to get trending stories
storySchema.statics.getTrending = async function(limit = 10) {
  const oneWeekAgo = new Date()
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)
  
  return this.find({
    isPublic: true,
    createdAt: { $gte: oneWeekAgo }
  })
    .sort({ likeCount: -1, views: -1, createdAt: -1 })
    .limit(limit)
    .populate('owner', 'name')
    .populate('videos.video', 'title thumbnail')
}

export default mongoose.model('Story', storySchema)
