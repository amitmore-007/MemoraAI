import mongoose from 'mongoose'
import dotenv from 'dotenv'
import Video from './models/Video.js'

dotenv.config()

const checkVideos = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI)
    
    const videos = await Video.find({}).select('_id title owner createdAt').limit(10)
    
    console.log(`📹 Found ${videos.length} videos in database:`)
    videos.forEach(video => {
      console.log(`📹 ID: ${video._id}`)
      console.log(`📹 Title: ${video.title}`)
      console.log(`📹 Owner: ${video.owner}`)
      console.log(`📹 Created: ${video.createdAt}`)
      console.log('---')
    })
    
  } catch (error) {
    console.error('❌ Error checking database:', error)
  } finally {
    await mongoose.disconnect()
  }
}

checkVideos()
