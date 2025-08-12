import React, { createContext, useContext, useState } from 'react'
import axios from 'axios'
import toast from 'react-hot-toast'

const VideoContext = createContext()

export const useVideo = () => {
  const context = useContext(VideoContext)
  if (!context) {
    throw new Error('useVideo must be used within a VideoProvider')
  }
  return context
}

export const VideoProvider = ({ children }) => {
  const [videos, setVideos] = useState([])
  const [loading, setLoading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [searchResults, setSearchResults] = useState([])
  const [currentVideo, setCurrentVideo] = useState(null)

  const uploadVideo = async (file, metadata = {}) => {
    try {
      setLoading(true)
      setUploadProgress(0)

      const formData = new FormData()
      formData.append('video', file)
      formData.append('title', metadata.title || file.name)
      formData.append('description', metadata.description || '')

      const response = await axios.post('/videos/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          const progress = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          )
          setUploadProgress(progress)
        },
      })

      toast.success('Video uploaded successfully!')
      await fetchVideos() // Refresh video list
      return { success: true, video: response.data.video }
    } catch (error) {
      const message = error.response?.data?.message || 'Upload failed'
      toast.error(message)
      return { success: false, error: message }
    } finally {
      setLoading(false)
      setUploadProgress(0)
    }
  }

  const fetchVideos = async (params = {}) => {
    try {
      setLoading(true)
      const response = await axios.get('/videos', { params })
      setVideos(response.data.videos)
      return { success: true, videos: response.data.videos }
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to fetch videos'
      toast.error(message)
      return { success: false, error: message }
    } finally {
      setLoading(false)
    }
  }

  const searchVideos = async (query, filters = {}) => {
    try {
      setLoading(true)
      const params = { q: query, ...filters }
      const response = await axios.get('/videos/search', { params })
      setSearchResults(response.data.videos)
      return { success: true, videos: response.data.videos }
    } catch (error) {
      const message = error.response?.data?.message || 'Search failed'
      toast.error(message)
      setSearchResults([])
      return { success: false, error: message }
    } finally {
      setLoading(false)
    }
  }

  const getVideoDetails = async (videoId) => {
    try {
      setLoading(true)
      const response = await axios.get(`/videos/${videoId}`)
      setCurrentVideo(response.data.video)
      return { success: true, video: response.data.video }
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to get video details'
      toast.error(message)
      return { success: false, error: message }
    } finally {
      setLoading(false)
    }
  }

  const deleteVideo = async (videoId) => {
    try {
      await axios.delete(`/videos/${videoId}`)
      toast.success('Video deleted successfully!')
      await fetchVideos() // Refresh video list
      return { success: true }
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to delete video'
      toast.error(message)
      return { success: false, error: message }
    }
  }

  const generateStory = async (prompt, selectedVideos = []) => {
    try {
      setLoading(true)
      const response = await axios.post('/stories/generate', {
        prompt,
        videoIds: selectedVideos
      })
      toast.success('Story generated successfully!')
      return { success: true, story: response.data.story }
    } catch (error) {
      const message = error.response?.data?.message || 'Story generation failed'
      toast.error(message)
      return { success: false, error: message }
    } finally {
      setLoading(false)
    }
  }

  const getVideoStats = async () => {
    try {
      const response = await axios.get('/videos/stats')
      return { success: true, stats: response.data.stats }
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to get video stats'
      return { success: false, error: message }
    }
  }

  const getStoryStats = async () => {
    try {
      const response = await axios.get('/stories/stats')
      return { success: true, stats: response.data.stats }
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to get story stats'
      return { success: false, error: message }
    }
  }

  const updateVideo = async (videoId, updateData) => {
    try {
      const response = await axios.put(`/videos/${videoId}`, updateData)
      toast.success('Video updated successfully!')
      await fetchVideos() // Refresh video list
      return { success: true, video: response.data.video }
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to update video'
      toast.error(message)
      return { success: false, error: message }
    }
  }

  const value = {
    videos,
    loading,
    uploadProgress,
    searchResults,
    currentVideo,
    uploadVideo,
    fetchVideos,
    searchVideos,
    getVideoDetails,
    deleteVideo,
    generateStory,
    getVideoStats,
    getStoryStats,
    updateVideo,
    setSearchResults,
    setCurrentVideo
  }

  return (
    <VideoContext.Provider value={value}>
      {children}
    </VideoContext.Provider>
  )
}
