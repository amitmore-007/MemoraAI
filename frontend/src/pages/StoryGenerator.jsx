import React, { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useVideo } from '../contexts/VideoContext'
import {
  SparklesIcon,
  PlayIcon,
  CheckCircleIcon,
  ClockIcon,
  DocumentTextIcon,
  ArrowPathIcon,
  BookOpenIcon,
  FilmIcon
} from '@heroicons/react/24/outline'
import LoadingSpinner from '../components/ui/LoadingSpinner'

const StoryGenerator = () => {
  const [searchParams] = useSearchParams()
  const { videos, fetchVideos, generateStory, loading } = useVideo()
  const [selectedVideos, setSelectedVideos] = useState([])
  const [prompt, setPrompt] = useState('')
  const [storyType, setStoryType] = useState('narrative')
  const [generatedStory, setGeneratedStory] = useState(null)
  const [isGenerating, setIsGenerating] = useState(false)

  const storyTypes = [
    {
      id: 'narrative',
      name: 'Narrative Story',
      description: 'Create a flowing narrative from your videos',
      icon: BookOpenIcon
    },
    {
      id: 'highlights',
      name: 'Highlight Reel',
      description: 'Generate a summary of key moments',
      icon: SparklesIcon
    },
    {
      id: 'timeline',
      name: 'Timeline Story',
      description: 'Chronological story based on video dates',
      icon: ClockIcon
    },
    {
      id: 'thematic',
      name: 'Thematic Story',
      description: 'Story based on themes and emotions',
      icon: FilmIcon
    }
  ]

  const promptSuggestions = [
    'Create a story about my vacation memories',
    'Tell the story of my cooking journey',
    'Make a highlight reel of my fitness progress',
    'Create a timeline of my family gatherings',
    'Tell the story of my creative projects',
    'Generate a story about my pet\'s adventures'
  ]

  useEffect(() => {
    fetchVideos()
    
    // Pre-select video if passed in URL
    const videoId = searchParams.get('video')
    if (videoId) {
      setSelectedVideos([videoId])
    }
  }, [])

  const handleVideoToggle = (videoId) => {
    setSelectedVideos(prev => 
      prev.includes(videoId) 
        ? prev.filter(id => id !== videoId)
        : [...prev, videoId]
    )
  }

  const handleGenerateStory = async () => {
    if (!prompt.trim() || selectedVideos.length === 0) return

    setIsGenerating(true)
    const result = await generateStory(prompt, selectedVideos)
    
    if (result.success) {
      setGeneratedStory(result.story)
    }
    setIsGenerating(false)
  }

  const formatDuration = (seconds) => {
    const minutes = Math.floor(seconds / 60)
    return `${minutes}:${(seconds % 60).toString().padStart(2, '0')}`
  }

  const selectedVideoObjects = videos.filter(v => selectedVideos.includes(v._id))
  const totalDuration = selectedVideoObjects.reduce((acc, video) => acc + (video.duration || 0), 0)

  return (
    <div className="min-h-screen bg-black">
      <div className="pt-20 pb-8">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          {/* Header */}
          <div className="mb-12">
            <div className="text-center space-y-4">
              <h1 className="text-4xl md:text-6xl font-bold text-white">
                AI <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-emerald-400 bg-clip-text text-transparent">Story Generator</span>
              </h1>
              <p className="text-xl text-gray-400 max-w-2xl mx-auto">
                Transform your videos into compelling stories using AI-powered insights
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Story Configuration */}
            <div className="lg:col-span-2 space-y-8">
              {/* Story Type Selection */}
              <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
                <h2 className="text-2xl font-bold text-white mb-6">Choose Story Type</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {storyTypes.map((type) => {
                    const Icon = type.icon
                    return (
                      <button
                        key={type.id}
                        onClick={() => setStoryType(type.id)}
                        className={`p-6 rounded-xl border-2 transition-all duration-300 text-left hover:transform hover:-translate-y-1 ${
                          storyType === type.id
                            ? 'border-purple-500/50 bg-purple-500/10'
                            : 'border-gray-700 hover:border-gray-600 bg-gray-800/50'
                        }`}
                      >
                        <div className="flex items-center space-x-3 mb-3">
                          <div className={`p-2 rounded-lg ${
                            storyType === type.id ? 'bg-purple-500/20' : 'bg-gray-700/50'
                          }`}>
                            <Icon className={`w-5 h-5 ${
                              storyType === type.id ? 'text-purple-400' : 'text-gray-400'
                            }`} />
                          </div>
                          <h3 className="font-semibold text-white">{type.name}</h3>
                        </div>
                        <p className="text-sm text-gray-400">{type.description}</p>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Prompt Input */}
              <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
                <h2 className="text-2xl font-bold text-white mb-6">Story Prompt</h2>
                <div className="space-y-4">
                  <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="Describe the story you want to create..."
                    className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-transparent transition-all duration-300 resize-none h-32"
                    rows={4}
                  />
                  
                  {/* Prompt Suggestions */}
                  <div>
                    <p className="text-sm text-gray-400 mb-3">Quick suggestions:</p>
                    <div className="flex flex-wrap gap-2">
                      {promptSuggestions.map((suggestion, index) => (
                        <button
                          key={index}
                          onClick={() => setPrompt(suggestion)}
                          className="px-3 py-2 bg-gray-800 text-gray-300 rounded-lg text-sm hover:bg-gray-700 hover:text-white transition-all duration-300 border border-gray-700 hover:border-gray-600"
                        >
                          {suggestion}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Video Selection */}
              <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-white">Select Videos</h2>
                  <span className="text-sm text-gray-400 bg-purple-500/20 px-3 py-1 rounded-full border border-purple-500/30">
                    {selectedVideos.length} selected
                  </span>
                </div>
                
                {videos.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-96 overflow-y-auto">
                    {videos.map((video) => (
                      <div
                        key={video._id}
                        onClick={() => handleVideoToggle(video._id)}
                        className={`p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 hover:transform hover:-translate-y-1 ${
                          selectedVideos.includes(video._id)
                            ? 'border-purple-500/50 bg-purple-500/10'
                            : 'border-gray-700 hover:border-gray-600 bg-gray-800/50'
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          <div className="w-16 h-12 bg-gray-700 rounded-lg flex-shrink-0 overflow-hidden">
                            {video.thumbnail ? (
                              <img
                                src={video.thumbnail}
                                alt={video.title}
                                className="w-full h-full object-cover rounded-lg"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <PlayIcon className="w-6 h-6 text-gray-400" />
                              </div>
                            )}
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <h3 className="font-medium text-white truncate">{video.title}</h3>
                            <div className="flex items-center space-x-2 text-sm text-gray-400">
                              <ClockIcon className="w-3 h-3" />
                              <span>{video.duration ? formatDuration(video.duration) : 'Unknown'}</span>
                            </div>
                          </div>
                          
                          {selectedVideos.includes(video._id) && (
                            <CheckCircleIcon className="w-5 h-5 text-purple-400 flex-shrink-0" />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <PlayIcon className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                    <p className="text-gray-400">No videos available</p>
                  </div>
                )}
              </div>

              {/* Generate Button */}
              <div className="text-center">
                <button
                  onClick={handleGenerateStory}
                  disabled={!prompt.trim() || selectedVideos.length === 0 || isGenerating}
                  className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-xl transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none text-lg inline-flex items-center space-x-2"
                >
                  {isGenerating ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Generating Story...</span>
                    </>
                  ) : (
                    <>
                      <SparklesIcon className="w-5 h-5" />
                      <span>Generate Story</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Selection Summary */}
              <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
                <h3 className="text-xl font-bold text-white mb-4">Selection Summary</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Videos Selected:</span>
                    <span className="text-white font-semibold">{selectedVideos.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Total Duration:</span>
                    <span className="text-white font-semibold">{formatDuration(totalDuration)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Story Type:</span>
                    <span className="text-white font-semibold capitalize">{storyType.replace('_', ' ')}</span>
                  </div>
                </div>
              </div>

              {/* Tips */}
              <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
                <h3 className="text-xl font-bold text-white mb-4">Tips for Better Stories</h3>
                <div className="space-y-3 text-sm text-gray-300">
                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-purple-400 rounded-full mt-2 flex-shrink-0"></div>
                    <span>Be specific in your prompt for better results</span>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-purple-400 rounded-full mt-2 flex-shrink-0"></div>
                    <span>Select videos with clear transcriptions</span>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-purple-400 rounded-full mt-2 flex-shrink-0"></div>
                    <span>Choose videos that relate to your story theme</span>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-purple-400 rounded-full mt-2 flex-shrink-0"></div>
                    <span>Include variety for more interesting narratives</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Generated Story */}
          {generatedStory && (
            <div className="mt-8 bg-gradient-to-br from-gray-900 via-gray-900 to-purple-900/20 border border-gray-800 rounded-2xl overflow-hidden">
              {/* Story Header */}
              <div className="bg-gradient-to-r from-purple-600/10 to-blue-600/10 border-b border-gray-800 p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-purple-500/20 rounded-lg">
                      <DocumentTextIcon className="w-6 h-6 text-purple-400" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-white">Your AI-Generated Story</h2>
                      <p className="text-gray-400 text-sm">Created from {selectedVideos.length} video{selectedVideos.length > 1 ? 's' : ''}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4 text-sm text-gray-400">
                    {generatedStory.metadata && (
                      <>
                        <div className="flex items-center space-x-1">
                          <span>{generatedStory.metadata.wordCount || 0} words</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <ClockIcon className="w-4 h-4" />
                          <span>{generatedStory.metadata.readingTime || 0} min read</span>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Story Content */}
              <div className="p-8">
                <div className="max-w-4xl mx-auto">
                  {/* Story Type Badge */}
                  <div className="flex justify-center mb-8">
                    <span className="px-4 py-2 bg-gradient-to-r from-purple-500/20 to-blue-500/20 text-purple-300 rounded-full border border-purple-500/30 text-sm font-semibold uppercase tracking-wide">
                      {storyType.replace('_', ' ')} Story
                    </span>
                  </div>

                  {/* Enhanced Story Content */}
                  <div className="prose prose-lg prose-invert max-w-none">
                    <div className="story-content bg-gray-800/30 rounded-2xl p-8 border border-gray-700/50 backdrop-blur-sm">
                      <div 
                        className="text-gray-100 leading-relaxed space-y-6 text-lg"
                        style={{ 
                          fontFamily: 'Georgia, serif',
                          lineHeight: '1.8'
                        }}
                      >
                        {(generatedStory.content || generatedStory).split('\n\n').map((paragraph, index) => {
                          if (paragraph.trim().startsWith('---')) return null;
                          
                          // Check if it's a title (first paragraph or starts with certain patterns)
                          const isTitle = index === 0 && paragraph.length < 100;
                          
                          if (isTitle) {
                            return (
                              <h1 key={index} className="text-3xl font-bold text-center text-white mb-8 bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                                {paragraph.trim()}
                              </h1>
                            );
                          }
                          
                          return (
                            <p key={index} className="text-gray-200 first-letter:text-5xl first-letter:font-bold first-letter:text-purple-400 first-letter:mr-1 first-letter:float-left first-letter:leading-none">
                              {paragraph.trim()}
                            </p>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Story Metadata */}
                  {generatedStory.metadata && (
                    <div className="mt-8 p-6 bg-gray-800/50 rounded-xl border border-gray-700">
                      <h4 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-4">Story Details</h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div className="text-center p-3 bg-gray-700/50 rounded-lg">
                          <div className="text-2xl font-bold text-white">{generatedStory.metadata.wordCount || 0}</div>
                          <div className="text-gray-400">Words</div>
                        </div>
                        <div className="text-center p-3 bg-gray-700/50 rounded-lg">
                          <div className="text-2xl font-bold text-white">{generatedStory.metadata.readingTime || 0}</div>
                          <div className="text-gray-400">Min Read</div>
                        </div>
                        <div className="text-center p-3 bg-gray-700/50 rounded-lg">
                          <div className="text-2xl font-bold text-white">{selectedVideos.length}</div>
                          <div className="text-gray-400">Videos Used</div>
                        </div>
                        <div className="text-center p-3 bg-gray-700/50 rounded-lg">
                          <div className="text-2xl font-bold text-white">{generatedStory.metadata.aiModel || 'AI'}</div>
                          <div className="text-gray-400">Generated By</div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Story Actions */}
              <div className="border-t border-gray-800 bg-gray-900/50 p-6">
                <div className="flex flex-wrap gap-3 justify-center">
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(generatedStory.content || generatedStory);
                      toast.success('Story copied to clipboard!');
                    }}
                    className="px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold rounded-xl transition-all duration-300 transform hover:scale-105 flex items-center space-x-2"
                  >
                    <DocumentTextIcon className="w-4 h-4" />
                    <span>Copy Story</span>
                  </button>
                  
                  <button
                    onClick={() => {
                      const blob = new Blob([generatedStory.content || generatedStory], { type: 'text/plain' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `${prompt.substring(0, 30)}-story.txt`;
                      a.click();
                      URL.revokeObjectURL(url);
                    }}
                    className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-xl transition-all duration-300 transform hover:scale-105 flex items-center space-x-2"
                  >
                    <ArrowPathIcon className="w-4 h-4" />
                    <span>Download</span>
                  </button>
                  
                  <button
                    onClick={handleGenerateStory}
                    disabled={isGenerating}
                    className="px-6 py-3 bg-gray-800 text-gray-300 font-semibold rounded-xl border border-gray-700 hover:border-gray-600 transition-all duration-300 hover:bg-gray-700 hover:text-white flex items-center space-x-2 disabled:opacity-50"
                  >
                    <SparklesIcon className="w-4 h-4" />
                    <span>Regenerate</span>
                  </button>

                  <button
                    onClick={() => {
                      if (navigator.share) {
                        navigator.share({
                          title: `AI Story: ${prompt}`,
                          text: generatedStory.content || generatedStory,
                        });
                      }
                    }}
                    className="px-6 py-3 bg-transparent text-white font-semibold rounded-xl border border-purple-500/50 hover:border-purple-400 transition-all duration-300 hover:bg-purple-500/10 flex items-center space-x-2"
                  >
                    <FilmIcon className="w-4 h-4" />
                    <span>Share</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Add custom styles */}
          <style jsx>{`
            .story-content {
              background: linear-gradient(135deg, rgba(17, 24, 39, 0.8) 0%, rgba(31, 41, 55, 0.8) 100%);
              backdrop-filter: blur(10px);
            }
            
            .story-content p::first-letter {
              line-height: 0.8;
              margin-top: 0.1em;
            }
            
            .prose h1 {
              background: linear-gradient(135deg, #a855f7 0%, #3b82f6 100%);
              -webkit-background-clip: text;
              -webkit-text-fill-color: transparent;
              background-clip: text;
            }
          `}</style>
        </div>
      </div>
    </div>
  )
}

export default StoryGenerator
