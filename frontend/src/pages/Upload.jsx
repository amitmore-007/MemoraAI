import React, { useState, useRef } from 'react'
import { useVideo } from '../contexts/VideoContext'
import {
  CloudArrowUpIcon,
  DocumentIcon,
  XMarkIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline'

const Upload = () => {
  const { uploadVideo, loading, uploadProgress } = useVideo()
  const [dragActive, setDragActive] = useState(false)
  const [selectedFile, setSelectedFile] = useState(null)
  const [metadata, setMetadata] = useState({
    title: '',
    description: ''
  })
  const [errors, setErrors] = useState({})
  const fileInputRef = useRef(null)

  const supportedFormats = ['mp4', 'mov', 'avi', 'mkv', 'webm']
  const maxFileSize = 100 * 1024 * 1024 // 100MB

  const validateFile = (file) => {
    const errors = {}
    
    if (!file) {
      errors.file = 'Please select a file'
      return errors
    }

    if (!file.type.startsWith('video/')) {
      errors.file = 'Please select a video file'
      return errors
    }

    const extension = file.name.split('.').pop().toLowerCase()
    if (!supportedFormats.includes(extension)) {
      errors.file = `Unsupported format. Please use: ${supportedFormats.join(', ')}`
      return errors
    }

    if (file.size > maxFileSize) {
      errors.file = 'File size must be less than 100MB'
      return errors
    }

    return errors
  }

  const handleDrag = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0])
    }
  }

  const handleFileSelect = (file) => {
    const fileErrors = validateFile(file)
    if (Object.keys(fileErrors).length > 0) {
      setErrors(fileErrors)
      return
    }

    setSelectedFile(file)
    setErrors({})
    
    // Auto-fill title if not set
    if (!metadata.title) {
      setMetadata(prev => ({
        ...prev,
        title: file.name.replace(/\.[^/.]+$/, '')
      }))
    }
  }

  const handleInputChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelect(e.target.files[0])
    }
  }

  const handleMetadataChange = (e) => {
    const { name, value } = e.target
    setMetadata(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const removeFile = () => {
    setSelectedFile(null)
    setErrors({})
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!selectedFile) {
      setErrors({ file: 'Please select a file' })
      return
    }

    if (!metadata.title.trim()) {
      setErrors({ title: 'Title is required' })
      return
    }

    const result = await uploadVideo(selectedFile, metadata)
    
    if (result.success) {
      // Reset form
      setSelectedFile(null)
      setMetadata({ title: '', description: '' })
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  return (
    <div className="min-h-screen bg-black">
      <div className="pt-20 pb-8">
        <div className="max-w-4xl mx-auto px-6 lg:px-8">
          {/* Header */}
          <div className="mb-12">
            <div className="text-center space-y-4">
              <h1 className="text-4xl md:text-6xl font-bold text-white">
                Upload Your <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-emerald-400 bg-clip-text text-transparent">Video</span>
              </h1>
              <p className="text-xl text-gray-400 max-w-2xl mx-auto">
                Upload your video and let our AI transcribe and analyze it automatically
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* File Upload Area */}
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8">
              <div
                className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-300 ${
                  dragActive 
                    ? 'border-purple-500 bg-purple-500/10' 
                    : errors.file 
                    ? 'border-red-500 bg-red-500/10' 
                    : 'border-gray-700 hover:border-gray-600 hover:bg-gray-800/50'
                }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="video/*"
                  onChange={handleInputChange}
                  className="hidden"
                  disabled={loading}
                />

                {selectedFile ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-center space-x-4">
                      <div className="p-3 bg-green-500/20 rounded-xl">
                        <DocumentIcon className="w-12 h-12 text-green-400" />
                      </div>
                      <div className="text-left">
                        <p className="text-white font-semibold text-lg">{selectedFile.name}</p>
                        <p className="text-gray-400">{formatFileSize(selectedFile.size)}</p>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          removeFile()
                        }}
                        className="p-2 text-gray-400 hover:text-red-400 transition-colors hover:bg-red-500/10 rounded-lg"
                        disabled={loading}
                      >
                        <XMarkIcon className="w-5 h-5" />
                      </button>
                    </div>
                    
                    {loading && (
                      <div className="space-y-3">
                        <div className="w-full bg-gray-700 rounded-full h-2">
                          <div 
                            className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${uploadProgress}%` }}
                          ></div>
                        </div>
                        <p className="text-sm text-gray-400 text-center">
                          Uploading... {uploadProgress}%
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="w-20 h-20 bg-gray-800 rounded-full flex items-center justify-center mx-auto">
                      <CloudArrowUpIcon className="w-10 h-10 text-gray-400" />
                    </div>
                    <div>
                      <p className="text-xl text-white font-semibold mb-2">
                        Drag and drop your video here, or click to browse
                      </p>
                      <p className="text-gray-400">
                        Supports: {supportedFormats.join(', ')} • Max size: 100MB
                      </p>
                    </div>
                  </div>
                )}
              </div>
              
              {errors.file && (
                <div className="mt-4 flex items-center space-x-2 text-red-400 bg-red-500/10 p-3 rounded-lg border border-red-500/30">
                  <ExclamationTriangleIcon className="w-5 h-5" />
                  <span className="text-sm">{errors.file}</span>
                </div>
              )}
            </div>

            {/* Metadata Form */}
            {selectedFile && (
              <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 space-y-6">
                <h3 className="text-2xl font-bold text-white">Video Details</h3>
                
                {/* Title */}
                <div>
                  <label htmlFor="title" className="block text-sm font-medium text-gray-300 mb-2">
                    Title *
                  </label>
                  <input
                    type="text"
                    id="title"
                    name="title"
                    value={metadata.title}
                    onChange={handleMetadataChange}
                    className={`w-full px-4 py-3 bg-gray-800/50 border rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-transparent transition-all duration-300 ${
                      errors.title ? 'border-red-500' : 'border-gray-700'
                    }`}
                    placeholder="Enter video title"
                    disabled={loading}
                  />
                  {errors.title && (
                    <p className="mt-2 text-sm text-red-400">{errors.title}</p>
                  )}
                </div>

                {/* Description */}
                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-gray-300 mb-2">
                    Description
                  </label>
                  <textarea
                    id="description"
                    name="description"
                    rows={4}
                    value={metadata.description}
                    onChange={handleMetadataChange}
                    className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-transparent transition-all duration-300 resize-none"
                    placeholder="Enter video description (optional)"
                    disabled={loading}
                  />
                </div>

                {/* AI Features Info */}
                <div className="bg-gray-800/50 p-6 rounded-xl border border-gray-700">
                  <h4 className="font-semibold text-white mb-4">What happens after upload:</h4>
                  <div className="space-y-3 text-sm text-gray-300">
                    <div className="flex items-center space-x-3">
                      <CheckCircleIcon className="w-5 h-5 text-green-400" />
                      <span>Automatic speech-to-text transcription</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <CheckCircleIcon className="w-5 h-5 text-green-400" />
                      <span>AI-powered scene and object detection</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <CheckCircleIcon className="w-5 h-5 text-green-400" />
                      <span>Smart tagging and categorization</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <CheckCircleIcon className="w-5 h-5 text-green-400" />
                      <span>Search indexing for easy discovery</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Submit Button */}
            {selectedFile && (
              <div className="text-center">
                <button
                  type="submit"
                  disabled={loading}
                  className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-xl transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none text-lg inline-flex items-center space-x-2"
                >
                  {loading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Processing...</span>
                    </>
                  ) : (
                    <>
                      <CloudArrowUpIcon className="w-5 h-5" />
                      <span>Upload & Process Video</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  )
}

export default Upload
