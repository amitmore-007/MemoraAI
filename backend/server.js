import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import compression from 'compression'
import rateLimit from 'express-rate-limit'
import dotenv from 'dotenv'

// Load environment variables first
dotenv.config()

import validateEnv from './utils/validateEnv.js'
import connectDB from './config/database.js'
import errorHandler from './middleware/errorHandler.js'

// Import routes - use videos.js, not videoRoutes.js
import authRoutes from './routes/auth.js'
import videoRoutes from './routes/videos.js'  // This should be videos.js
import storyRoutes from './routes/stories.js'

// Validate environment variables
validateEnv()

// Connect to database
connectDB()

const app = express()
const PORT = process.env.PORT || 5000

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}))

// CORS configuration - Updated for production
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, etc.)
    if (!origin) return callback(null, true)
    
    const allowedOrigins = [
      process.env.CORS_ORIGIN,
      'https://memoraai-1.onrender.com',
      'http://localhost:5173',
      'http://localhost:3000',
      'https://localhost:5173'
    ].filter(Boolean)
    
    console.log(`CORS check: origin=${origin}, allowed=${allowedOrigins}`)
    
    // In production, also allow any onrender.com subdomain
    if (process.env.NODE_ENV === 'production') {
      if (origin && origin.endsWith('.onrender.com')) {
        console.log('CORS: Allowing onrender.com subdomain')
        return callback(null, true)
      }
    }
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      console.log('CORS: Origin allowed')
      callback(null, true)
    } else {
      console.warn(`CORS blocked origin: ${origin}`)
      callback(new Error('Not allowed by CORS'))
    }
  },
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}

app.use(cors(corsOptions))

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  message: {
    error: 'Too many requests from this IP, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false
})
app.use(limiter)

// Body parsing middleware
app.use(express.json({ limit: '50mb' }))
app.use(express.urlencoded({ extended: true, limit: '50mb' }))

// Compression middleware
app.use(compression())

// Logging middleware
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'))
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV
  })
})

// Root welcome endpoint
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'VideoStory AI Backend API is running',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      auth: '/api/auth',
      videos: '/api/videos',
      stories: '/api/stories'
    }
  })
})

// Routes
app.use('/api/auth', authRoutes)
app.use('/api/videos', videoRoutes)
app.use('/api/stories', storyRoutes)

// Log route registration
console.log('🛠️ Routes registered:')
console.log('   - /api/auth (Auth routes)')
console.log('   - /api/videos (Video routes)')
console.log('   - /api/stories (Story routes)')

// Add deployment verification endpoint
app.get('/api/deployment/check', (req, res) => {
  res.json({
    success: true,
    message: 'Backend deployment active',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    version: '2.0.0-basic',
    features: {
      transcription: true,
      aiAnalysis: true,
      stories: true
    }
  })
})

// Add route debugging middleware after routes are registered
if (process.env.NODE_ENV === 'development') {
  app.use((req, res, next) => {
    console.log(`🌐 [${new Date().toISOString()}] ${req.method} ${req.path}`)
    next()
  })
}

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`
  })
})

// Error handling middleware
app.use(errorHandler)

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`)
  console.log(`📊 Environment: ${process.env.NODE_ENV}`)
  console.log(`🌐 CORS Origin: ${process.env.CORS_ORIGIN}`)
})

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Promise Rejection:', err)
  process.exit(1)
})

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err)
  process.exit(1)
})