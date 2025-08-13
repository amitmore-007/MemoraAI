// Quick test to verify insights route works
import axios from 'axios'

const testInsightsRoute = async () => {
  try {
    // Replace with actual video ID and auth token
    const videoId = 'your_video_id'
    const authToken = 'your_jwt_token'
    
    const response = await axios.get(`http://localhost:5000/api/videos/${videoId}/insights`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    })
    
    console.log('✅ Insights route works:', response.data)
  } catch (error) {
    console.error('❌ Insights route failed:', error.response?.data || error.message)
  }
}

// Uncomment to test
// testInsightsRoute()
