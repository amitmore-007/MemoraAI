import React from 'react'
import { Link } from 'react-router-dom'
import {
  ClockIcon,
  EyeIcon,
  HeartIcon,
  BookOpenIcon,
  CalendarDaysIcon
} from '@heroicons/react/24/outline'

const StoryCard = ({ story, className = '' }) => {
  const formatDuration = (minutes) => {
    if (minutes < 1) return 'Less than 1 min'
    return `${minutes} min read`
  }

  const getStoryTypeColor = (type) => {
    const colors = {
      narrative: 'from-purple-500 to-blue-500',
      highlights: 'from-orange-500 to-red-500',
      timeline: 'from-green-500 to-teal-500',
      thematic: 'from-pink-500 to-rose-500'
    }
    return colors[type] || colors.narrative
  }

  const getStoryTypeIcon = (type) => {
    return <BookOpenIcon className="w-4 h-4" />
  }

  return (
    <Link
      to={`/stories/${story._id}`}
      className={`block bg-gradient-to-br from-gray-900 via-gray-900 to-gray-800 border border-gray-800 rounded-2xl overflow-hidden hover:border-gray-700 transition-all duration-300 hover:transform hover:-translate-y-1 hover:shadow-2xl group ${className}`}
    >
      {/* Story Header */}
      <div className="p-6 border-b border-gray-800">
        <div className="flex items-start justify-between mb-3">
          <div className={`px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r ${getStoryTypeColor(story.storyType)} text-white flex items-center space-x-1`}>
            {getStoryTypeIcon(story.storyType)}
            <span>{story.storyType?.replace('_', ' ') || 'Story'}</span>
          </div>
          <div className="flex items-center space-x-3 text-sm text-gray-400">
            {story.views > 0 && (
              <div className="flex items-center space-x-1">
                <EyeIcon className="w-4 h-4" />
                <span>{story.views}</span>
              </div>
            )}
            {story.likeCount > 0 && (
              <div className="flex items-center space-x-1">
                <HeartIcon className="w-4 h-4" />
                <span>{story.likeCount}</span>
              </div>
            )}
          </div>
        </div>

        <h3 className="text-xl font-bold text-white group-hover:text-purple-300 transition-colors line-clamp-2 mb-2">
          {story.title}
        </h3>

        <p className="text-gray-400 text-sm line-clamp-1 mb-3">
          {story.prompt}
        </p>

        {/* Story Metadata */}
        <div className="flex items-center space-x-4 text-xs text-gray-500">
          <div className="flex items-center space-x-1">
            <ClockIcon className="w-3 h-3" />
            <span>{formatDuration(story.metadata?.readingTime || 0)}</span>
          </div>
          <div className="flex items-center space-x-1">
            <CalendarDaysIcon className="w-3 h-3" />
            <span>{new Date(story.createdAt).toLocaleDateString()}</span>
          </div>
          {story.metadata?.wordCount && (
            <span>{story.metadata.wordCount} words</span>
          )}
        </div>
      </div>

      {/* Story Preview */}
      <div className="p-6">
        <div className="bg-gray-800/30 rounded-lg p-4 border border-gray-700/50">
          <p className="text-gray-300 text-sm leading-relaxed line-clamp-4">
            {story.content?.substring(0, 300)}...
          </p>
        </div>

        {/* Video Count */}
        {story.videos && story.videos.length > 0 && (
          <div className="mt-4 flex items-center justify-between">
            <div className="text-xs text-gray-400">
              Based on {story.videos.length} video{story.videos.length > 1 ? 's' : ''}
            </div>
            <div className="flex -space-x-2">
              {story.videos.slice(0, 3).map((videoRef, index) => (
                <div 
                  key={index}
                  className="w-8 h-6 bg-gray-700 rounded border-2 border-gray-900 overflow-hidden"
                >
                  {videoRef.video?.thumbnail && (
                    <img
                      src={videoRef.video.thumbnail}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  )}
                </div>
              ))}
              {story.videos.length > 3 && (
                <div className="w-8 h-6 bg-gray-600 rounded border-2 border-gray-900 flex items-center justify-center">
                  <span className="text-xs text-gray-300">+{story.videos.length - 3}</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Hover Effect Overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-purple-600/0 to-blue-600/0 group-hover:from-purple-600/5 group-hover:to-blue-600/5 transition-all duration-300 pointer-events-none rounded-2xl"></div>
    </Link>
  )
}

export default StoryCard
