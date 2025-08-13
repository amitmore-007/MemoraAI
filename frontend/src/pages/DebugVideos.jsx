import React, { useState, useEffect } from 'react'
import { useVideo } from '../contexts/VideoContext'
import toast from 'react-hot-toast'

const DebugVideos = () => {
  const { debugListVideos, fetchVideoInsights } = useVideo()
  const [videos, setVideos] = useState([])
  const [testingInsights, setTestingInsights] = useState({})

  useEffect(() => {
    loadVideos()
  }, [])

  const loadVideos = async () => {
    const result = await debugListVideos()
    if (result.success) {
      setVideos(result.videos)
      console.log('📹 Available videos:', result.videos)
    }
  }

  const testInsights = async (videoId) => {
    setTestingInsights(prev => ({ ...prev, [videoId]: true }))
    try {
      console.log(`🧪 Testing insights for video: ${videoId}`)
      const result = await fetchVideoInsights(videoId)
      console.log(`📊 Insights result:`, result)
      
      if (result.success) {
        toast.success(`Insights loaded for video ${videoId}`)
      } else {
        toast.error(`Failed to load insights: ${result.error}`)
      }
    } catch (error) {
      console.error('Error testing insights:', error)
      toast.error('Error testing insights')
    } finally {
      setTestingInsights(prev => ({ ...prev, [videoId]: false }))
    }
  }

  const copyVideoId = (videoId) => {
    navigator.clipboard.writeText(videoId)
    toast.success('Video ID copied to clipboard!')
  }

  return (
    <div className="min-h-screen bg-black pt-20">
      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8">
          <h1 className="text-3xl font-bold text-white mb-8">Debug Videos & Insights</h1>
          
          <button 
            onClick={loadVideos}
            className="mb-6 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Refresh Video List
          </button>

          {videos.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-400">No videos found. Upload a video first.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {videos.map((video) => (
                <div 
                  key={video.id} 
                  className="bg-gray-800 border border-gray-700 rounded-lg p-6"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-white">{video.title}</h3>
                      <p className="text-sm text-gray-400">
                        Created: {new Date(video.createdAt).toLocaleString()}
                      </p>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => copyVideoId(video.id)}
                        className="px-3 py-1 bg-gray-700 text-gray-300 text-sm rounded hover:bg-gray-600"
                      >
                        Copy ID
                      </button>
                      <button
                        onClick={() => testInsights(video.id)}
                        disabled={testingInsights[video.id]}
                        className="px-3 py-1 bg-purple-600 text-white text-sm rounded hover:bg-purple-700 disabled:opacity-50"
                      >
                        {testingInsights[video.id] ? 'Testing...' : 'Test Insights'}
                      </button>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div className="bg-gray-700/50 p-3 rounded">
                      <span className="text-gray-400">Video ID:</span>
                      <p className="text-white font-mono break-all">{video.id}</p>
                    </div>
                    <div className="bg-gray-700/50 p-3 rounded">
                      <span className="text-gray-400">Processing:</span>
                      <p className={`font-semibold ${
                        video.processingStatus === 'completed' ? 'text-green-400' :
                        video.processingStatus === 'processing' ? 'text-yellow-400' :
                        video.processingStatus === 'failed' ? 'text-red-400' : 'text-gray-400'
                      }`}>
                        {video.processingStatus || 'unknown'}
                      </p>
                    </div>
                    <div className="bg-gray-700/50 p-3 rounded">
                      <span className="text-gray-400">Insights:</span>
                      <p className={`font-semibold ${
                        video.insightsStatus === 'completed' ? 'text-green-400' :
                        video.insightsStatus === 'processing' ? 'text-yellow-400' :
                        video.insightsStatus === 'failed' ? 'text-red-400' : 'text-gray-400'
                      }`}>
                        {video.insightsStatus || 'none'}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 text-xs text-gray-500">
                    <p>Test URL: <code>/api/videos/{video.id}/insights</code></p>
                    <p>Browser URL: <code>http://localhost:5173/video/{video.id}</code></p>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="mt-8 p-6 bg-gray-800/50 border border-gray-700 rounded-lg">
            <h3 className="text-lg font-semibold text-white mb-4">Quick Test Instructions</h3>
            <ol className="space-y-2 text-gray-300 text-sm">
              <li>1. Use the "Copy ID" button to copy a video ID</li>
              <li>2. Use the "Test Insights" button to test the insights API</li>
              <li>3. Check the browser console for detailed logs</li>
              <li>4. If you have videos, try visiting: <code>/video/[VIDEO_ID]</code></li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  )
}

export default DebugVideos
