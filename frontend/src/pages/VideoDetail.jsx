import React, { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useVideo } from '../contexts/VideoContext'
import {
  PlayIcon,
  ClockIcon,
  CalendarDaysIcon,
  TagIcon,
  DocumentTextIcon,
  TrashIcon,
  PencilIcon,
  ShareIcon,
  ArrowLeftIcon,
  EyeIcon
} from '@heroicons/react/24/outline'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import toast from 'react-hot-toast'

const VideoDetail = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { getVideoDetails, deleteVideo, updateVideo, currentVideo, loading } = useVideo()
  const [video, setVideo] = useState(null)
  const [isEditing, setIsEditing] = useState(false)
  const [editForm, setEditForm] = useState({
    title: '',
    description: ''
  })
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  useEffect(() => {
    if (id) {
      loadVideo()
    }
  }, [id])

  useEffect(() => {
    if (currentVideo) {
      setVideo(currentVideo)
      setEditForm({
        title: currentVideo.title || '',
        description: currentVideo.description || ''
      })
    }
  }, [currentVideo])

  const loadVideo = async () => {
    const result = await getVideoDetails(id)
    if (!result.success) {
      toast.error('Video not found')
      navigate('/dashboard')
    }
  }

  const handleDelete = async () => {
    const result = await deleteVideo(id)
    if (result.success) {
      navigate('/dashboard')
    }
    setShowDeleteConfirm(false)
  }

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: video.title,
          text: video.description,
          url: window.location.href
        })
      } catch (error) {
        // Fallback to clipboard
        copyToClipboard()
      }
    } else {
      copyToClipboard()
    }
  }

  const copyToClipboard = () => {
    navigator.clipboard.writeText(window.location.href)
    toast.success('Link copied to clipboard!')
  }

  const formatDuration = (seconds) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const remainingSeconds = seconds % 60

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`
    }
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const handleProfileSubmit = async (e) => {
    e.preventDefault()
    
    if (!editForm.title.trim()) {
      toast.error('Title is required')
      return
    }

    const result = await updateVideo(id, {
      title: editForm.title,
      description: editForm.description
    })
    
    if (result.success) {
      setVideo(result.video)
      setIsEditing(false)
      toast.success('Video updated successfully!')
    }
  }

  if (loading) {
    return <LoadingSpinner message="Loading video details..." />
  }

  if (!video) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-4">Video not found</h2>
          <Link to="/dashboard" className="btn-primary">
            Back to Dashboard
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black">
      <div className="pt-20 pb-8">
        <div className="max-w-6xl mx-auto px-6 lg:px-8">
          {/* Header Actions */}
          <div className="flex items-center justify-between mb-8">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center space-x-2 text-gray-300 hover:text-white transition-all duration-300 hover:bg-gray-800 px-4 py-2 rounded-xl"
            >
              <ArrowLeftIcon className="w-5 h-5" />
              <span>Back</span>
            </button>

            <div className="flex items-center space-x-3">
              <button
                onClick={handleShare}
                className="px-4 py-2 bg-transparent text-white font-semibold rounded-xl border border-purple-500/50 hover:border-purple-400 transition-all duration-300 hover:bg-purple-500/10 flex items-center space-x-2"
              >
                <ShareIcon className="w-4 h-4" />
                <span>Share</span>
              </button>
              <button
                onClick={() => setIsEditing(!isEditing)}
                className="px-4 py-2 bg-gray-800 text-gray-300 font-semibold rounded-xl border border-gray-700 hover:border-gray-600 transition-all duration-300 hover:bg-gray-700 hover:text-white flex items-center space-x-2"
              >
                <PencilIcon className="w-4 h-4" />
                <span>Edit</span>
              </button>
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="px-4 py-2 bg-red-600/20 text-red-400 font-semibold rounded-xl border border-red-500/30 hover:border-red-400/50 transition-all duration-300 hover:bg-red-600/30 flex items-center space-x-2"
              >
                <TrashIcon className="w-4 h-4" />
                <span>Delete</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Video Player */}
            <div className="lg:col-span-2 space-y-6">
              {/* Video */}
              <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
                <div className="aspect-video bg-gray-800 rounded-xl mb-6 overflow-hidden border border-gray-700">
                  {video.cloudinaryUrl ? (
                    <video
                      controls
                      className="w-full h-full"
                      poster={video.thumbnail}
                    >
                      <source src={video.cloudinaryUrl} type="video/mp4" />
                      Your browser does not support the video tag.
                    </video>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <PlayIcon className="w-16 h-16 text-gray-600" />
                    </div>
                  )}
                </div>

                {/* Video Info */}
                <div className="space-y-6">
                  {isEditing ? (
                    <div className="space-y-4">
                      <input
                        type="text"
                        value={editForm.title}
                        onChange={(e) => setEditForm(prev => ({ ...prev, title: e.target.value }))}
                        className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-transparent transition-all duration-300 text-2xl font-bold"
                        placeholder="Video title"
                      />
                      <textarea
                        value={editForm.description}
                        onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                        className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-transparent transition-all duration-300 resize-none"
                        rows={3}
                        placeholder="Video description"
                      />
                      <div className="flex space-x-3">
                        <button 
                          type="submit"
                          onClick={handleProfileSubmit}
                          className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-xl transition-all duration-300 transform hover:scale-105"
                        >
                          Save Changes
                        </button>
                        <button 
                          onClick={() => setIsEditing(false)}
                          className="px-6 py-3 bg-gray-800 text-gray-300 font-semibold rounded-xl border border-gray-700 hover:border-gray-600 transition-all duration-300 hover:bg-gray-700 hover:text-white"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <h1 className="text-3xl md:text-4xl font-bold text-white">
                        {video.title}
                      </h1>
                      {video.description && (
                        <p className="text-gray-300 text-lg leading-relaxed">
                          {video.description}
                        </p>
                      )}
                    </>
                  )}

                  {/* Metadata */}
                  <div className="flex flex-wrap items-center gap-6 text-sm text-gray-400">
                    <div className="flex items-center space-x-2">
                      <ClockIcon className="w-4 h-4" />
                      <span>{video.duration ? formatDuration(video.duration) : 'Unknown'}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <CalendarDaysIcon className="w-4 h-4" />
                      <span>{new Date(video.createdAt).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <EyeIcon className="w-4 h-4" />
                      <span>{video.views || 0} views</span>
                    </div>
                    {video.fileSize && (
                      <div className="flex items-center space-x-2">
                        <span>{formatFileSize(video.fileSize)}</span>
                      </div>
                    )}
                  </div>

                  {/* Tags */}
                  {video.tags && video.tags.length > 0 && (
                    <div className="flex items-start space-x-3">
                      <TagIcon className="w-5 h-5 text-gray-400 mt-1 flex-shrink-0" />
                      <div className="flex flex-wrap gap-2">
                        {video.tags.map((tag, index) => (
                          <span
                            key={index}
                            className="px-3 py-1 bg-purple-500/20 text-purple-300 text-sm rounded-full border border-purple-500/30"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Enhanced Transcription */}
              {video.transcription && (
                <div className="bg-gradient-to-br from-gray-900 via-gray-900 to-blue-900/20 border border-gray-800 rounded-2xl overflow-hidden">
                  {/* Transcription Header */}
                  <div className="bg-gradient-to-r from-blue-600/10 to-purple-600/10 border-b border-gray-800 p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-blue-500/20 rounded-lg">
                          <DocumentTextIcon className="w-6 h-6 text-blue-400" />
                        </div>
                        <div>
                          <h2 className="text-2xl font-bold text-white">AI Transcription</h2>
                          <p className="text-gray-400 text-sm">Automatically generated from your video</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        {video.transcription.confidence && (
                          <div className="text-center">
                            <div className="text-2xl font-bold text-green-400">
                              {Math.round(video.transcription.confidence * 100)}%
                            </div>
                            <div className="text-xs text-gray-400">Accuracy</div>
                          </div>
                        )}
                        {video.transcription.language && (
                          <div className="text-center">
                            <div className="text-lg font-bold text-blue-400 uppercase">
                              {video.transcription.language}
                            </div>
                            <div className="text-xs text-gray-400">Language</div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Transcription Content */}
                  <div className="p-8">
                    <div className="max-w-4xl mx-auto">
                      {/* Transcription Text */}
                      <div className="bg-gray-800/30 rounded-2xl p-8 border border-gray-700/50 backdrop-blur-sm">
                        <div 
                          className="transcription-content text-gray-100 leading-relaxed space-y-4"
                          style={{ 
                            fontFamily: 'Inter, system-ui, sans-serif',
                            lineHeight: '1.7'
                          }}
                        >
                          {/* Split transcription into paragraphs for better readability */}
                          {(typeof video.transcription === 'string' 
                            ? video.transcription 
                            : video.transcription.text || 'Transcription processing...'
                          ).split(/[.!?]+\s+/).map((sentence, index) => {
                            if (!sentence.trim()) return null;
                            
                            return (
                              <p 
                                key={index} 
                                className="text-gray-200 hover:text-white transition-colors duration-200 cursor-pointer p-2 rounded-lg hover:bg-gray-700/30"
                                onClick={() => {
                                  navigator.clipboard.writeText(sentence.trim());
                                  toast.success('Sentence copied!');
                                }}
                              >
                                <span className="text-blue-400 font-semibold mr-2">
                                  [{String(index + 1).padStart(2, '0')}]
                                </span>
                                {sentence.trim()}.
                              </p>
                            );
                          })}
                        </div>
                      </div>

                      {/* Transcription Segments (if available) */}
                      {video.transcription.segments && video.transcription.segments.length > 0 && (
                        <div className="mt-8">
                          <h3 className="text-lg font-semibold text-white mb-4 flex items-center space-x-2">
                            <ClockIcon className="w-5 h-5 text-blue-400" />
                            <span>Timeline Segments</span>
                          </h3>
                          <div className="space-y-3 max-h-64 overflow-y-auto">
                            {video.transcription.segments.map((segment, index) => (
                              <div 
                                key={index}
                                className="flex items-start space-x-4 p-4 bg-gray-800/50 rounded-lg border border-gray-700/50 hover:bg-gray-700/50 transition-all duration-200"
                              >
                                <div className="text-center min-w-0 flex-shrink-0">
                                  <div className="text-sm font-mono text-blue-400">
                                    {Math.floor(segment.start)}s
                                  </div>
                                  <div className="text-xs text-gray-500">
                                    {Math.floor(segment.end)}s
                                  </div>
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-gray-300 text-sm leading-relaxed">
                                    {segment.text}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Transcription Stats */}
                      <div className="mt-8 p-6 bg-gray-800/50 rounded-xl border border-gray-700">
                        <h4 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-4">Transcription Details</h4>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div className="text-center p-3 bg-gray-700/50 rounded-lg">
                            <div className="text-2xl font-bold text-white">
                              {(typeof video.transcription === 'string' 
                                ? video.transcription 
                                : video.transcription.text || ''
                              ).split(' ').length}
                            </div>
                            <div className="text-gray-400">Words</div>
                          </div>
                          <div className="text-center p-3 bg-gray-700/50 rounded-lg">
                            <div className="text-2xl font-bold text-white">
                              {(typeof video.transcription === 'string' 
                                ? video.transcription 
                                : video.transcription.text || ''
                              ).length}
                            </div>
                            <div className="text-gray-400">Characters</div>
                          </div>
                          <div className="text-center p-3 bg-gray-700/50 rounded-lg">
                            <div className="text-2xl font-bold text-white">
                              {video.transcription.segments ? video.transcription.segments.length : 0}
                            </div>
                            <div className="text-gray-400">Segments</div>
                          </div>
                          <div className="text-center p-3 bg-gray-700/50 rounded-lg">
                            <div className="text-2xl font-bold text-white">
                              {video.transcription.duration ? `${Math.floor(video.transcription.duration)}s` : 'N/A'}
                            </div>
                            <div className="text-gray-400">Duration</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Transcription Actions */}
                  <div className="border-t border-gray-800 bg-gray-900/50 p-6">
                    <div className="flex flex-wrap gap-3 justify-center">
                      <button
                        onClick={() => {
                          const text = typeof video.transcription === 'string' 
                            ? video.transcription 
                            : video.transcription.text || '';
                          navigator.clipboard.writeText(text);
                          toast.success('Transcription copied to clipboard!');
                        }}
                        className="px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold rounded-xl transition-all duration-300 transform hover:scale-105 flex items-center space-x-2"
                      >
                        <DocumentTextIcon className="w-4 h-4" />
                        <span>Copy Text</span>
                      </button>
                      
                      <button
                        onClick={() => {
                          const text = typeof video.transcription === 'string' 
                            ? video.transcription 
                            : video.transcription.text || '';
                          const blob = new Blob([text], { type: 'text/plain' });
                          const url = URL.createObjectURL(blob);
                          const a = document.createElement('a');
                          a.href = url;
                          a.download = `${video.title}-transcription.txt`;
                          a.click();
                          URL.revokeObjectURL(url);
                        }}
                        className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-xl transition-all duration-300 transform hover:scale-105 flex items-center space-x-2"
                      >
                        <ArrowLeftIcon className="w-4 h-4" />
                        <span>Download</span>
                      </button>

                      <Link
                        to={`/search?q=${encodeURIComponent(
                          (typeof video.transcription === 'string' 
                            ? video.transcription 
                            : video.transcription.text || ''
                          ).split(' ').slice(0, 5).join(' ')
                        )}`}
                        className="px-6 py-3 bg-transparent text-white font-semibold rounded-xl border border-blue-500/50 hover:border-blue-400 transition-all duration-300 hover:bg-blue-500/10 flex items-center space-x-2"
                      >
                        <TagIcon className="w-4 h-4" />
                        <span>Search Similar</span>
                      </Link>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* AI Analysis */}
              <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
                <h3 className="text-xl font-bold text-white mb-6">AI Analysis</h3>
                <div className="space-y-4">
                  {video.aiAnalysis ? (
                    <>
                      {video.aiAnalysis.mood && (
                        <div>
                          <p className="text-sm text-gray-400 mb-2">Detected Mood</p>
                          <span className="px-3 py-1 bg-green-500/20 text-green-300 text-sm rounded-full border border-green-500/30">
                            {typeof video.aiAnalysis.mood === 'string' ? video.aiAnalysis.mood : video.aiAnalysis.mood.emotion || 'Unknown'}
                          </span>
                        </div>
                      )}
                      {video.aiAnalysis.objects && video.aiAnalysis.objects.length > 0 && (
                        <div>
                          <p className="text-sm text-gray-400 mb-3">Detected Objects</p>
                          <div className="flex flex-wrap gap-2">
                            {video.aiAnalysis.objects.slice(0, 10).map((object, index) => (
                              <span
                                key={index}
                                className="px-2 py-1 bg-blue-500/20 text-blue-300 text-xs rounded-full border border-blue-500/30"
                              >
                                {typeof object === 'string' ? object : object.name || object}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      {video.aiAnalysis.themes && video.aiAnalysis.themes.length > 0 && (
                        <div>
                          <p className="text-sm text-gray-400 mb-3">Themes</p>
                          <div className="flex flex-wrap gap-2">
                            {video.aiAnalysis.themes.slice(0, 5).map((theme, index) => (
                              <span
                                key={index}
                                className="px-2 py-1 bg-purple-500/20 text-purple-300 text-xs rounded-full border border-purple-500/30"
                              >
                                {typeof theme === 'string' ? theme : theme.name || theme}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      {video.aiAnalysis.summary && (
                        <div>
                          <p className="text-sm text-gray-400 mb-2">AI Summary</p>
                          <p className="text-gray-300 text-sm bg-gray-800/50 p-3 rounded-lg border border-gray-700">
                            {video.aiAnalysis.summary}
                          </p>
                        </div>
                      )}
                    </>
                  ) : (
                    <p className="text-gray-400 text-sm">
                      AI analysis is being processed...
                    </p>
                  )}
                </div>
              </div>

              {/* Processing Status */}
              <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
                <h3 className="text-xl font-bold text-white mb-6">Processing Status</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
                    <span className="text-gray-400">Upload</span>
                    <span className="text-green-400 font-semibold">✓ Complete</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
                    <span className="text-gray-400">Audio Extraction</span>
                    <span className={`font-semibold ${video.audioCloudinaryUrl ? "text-green-400" : "text-yellow-400"}`}>
                      {video.audioCloudinaryUrl ? "✓ Complete" : "⏳ Processing"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
                    <span className="text-gray-400">Transcription</span>
                    <span className={`font-semibold ${video.transcription ? "text-green-400" : "text-yellow-400"}`}>
                      {video.transcription ? "✓ Complete" : "⏳ Processing"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
                    <span className="text-gray-400">AI Tagging</span>
                    <span className={`font-semibold ${video.tags?.length > 0 ? "text-green-400" : "text-yellow-400"}`}>
                      {video.tags?.length > 0 ? "✓ Complete" : "⏳ Processing"}
                    </span>
                  </div>
                </div>
                
                {/* Audio Storage Info */}
                {video.audioCloudinaryUrl && (
                  <div className="mt-6 pt-6 border-t border-gray-700">
                    <h4 className="text-sm font-medium text-gray-400 mb-3">Storage Information</h4>
                    <div className="space-y-2 text-xs text-gray-500">
                      <div className="flex justify-between">
                        <span>Video Storage:</span>
                        <span>Cloudinary</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Audio Storage:</span>
                        <span>Cloudinary</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Transcription:</span>
                        <span>{video.transcription?.audioCloudinaryUrl ? 'Stored' : 'Local'}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Related Actions */}
              <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
                <h3 className="text-xl font-bold text-white mb-6">Actions</h3>
                <div className="space-y-3">
                  <Link
                    to={`/story-generator?video=${video._id}`}
                    className="w-full flex items-center justify-center space-x-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-xl transition-all duration-300 transform hover:scale-105"
                  >
                    <PlayIcon className="w-4 h-4" />
                    <span>Create Story</span>
                  </Link>
                  <Link
                    to={`/search?q=${encodeURIComponent(video.title)}`}
                    className="w-full flex items-center justify-center space-x-2 px-6 py-3 bg-transparent text-white font-semibold rounded-xl border border-purple-500/50 hover:border-purple-400 transition-all duration-300 hover:bg-purple-500/10"
                  >
                    <TagIcon className="w-4 h-4" />
                    <span>Find Similar</span>
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Delete Confirmation Modal */}
          {showDeleteConfirm && (
            <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
              <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 max-w-md w-full">
                <h3 className="text-xl font-bold text-white mb-4">Delete Video</h3>
                <p className="text-gray-300 mb-6">
                  Are you sure you want to delete "{video.title}"? This action cannot be undone.
                </p>
                <div className="flex space-x-3">
                  <button
                    onClick={handleDelete}
                    className="flex-1 px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl transition-all duration-300"
                  >
                    Delete
                  </button>
                  <button
                    onClick={() => setShowDeleteConfirm(false)}
                    className="flex-1 px-6 py-3 bg-gray-800 text-gray-300 font-semibold rounded-xl border border-gray-700 hover:border-gray-600 transition-all duration-300 hover:bg-gray-700 hover:text-white"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default VideoDetail
