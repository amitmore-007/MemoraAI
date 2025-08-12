import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useVideo } from '../contexts/VideoContext'
import {
  CloudArrowUpIcon,
  MagnifyingGlassIcon,
  SparklesIcon,
  PlayIcon,
  ClockIcon,
  EyeIcon,
  PlusIcon,
  ChartBarIcon,
  DocumentDuplicateIcon
} from '@heroicons/react/24/outline'
import LoadingSpinner from '../components/ui/LoadingSpinner'

const Dashboard = () => {
  const { user } = useAuth()
  const { videos, loading, fetchVideos } = useVideo()
  const [stats, setStats] = useState({
    totalVideos: 0,
    totalDuration: 0,
    totalViews: 0,
    recentActivity: []
  })

  useEffect(() => {
    fetchVideos()
  }, [])

  useEffect(() => {
    if (videos.length > 0) {
      const totalDuration = videos.reduce((acc, video) => acc + (video.duration || 0), 0)
      const totalViews = videos.reduce((acc, video) => acc + (video.views || 0), 0)
      
      setStats({
        totalVideos: videos.length,
        totalDuration,
        totalViews,
        recentActivity: videos.slice(0, 5)
      })
    }
  }, [videos])

  const formatDuration = (seconds) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    if (hours > 0) {
      return `${hours}h ${minutes}m`
    }
    return `${minutes}m`
  }

  const quickActions = [
    {
      title: 'Upload Video',
      description: 'Add new videos to your collection',
      icon: CloudArrowUpIcon,
      href: '/upload',
      color: 'blue'
    },
    {
      title: 'Search Videos',
      description: 'Find videos using AI-powered search',
      icon: MagnifyingGlassIcon,
      href: '/search',
      color: 'emerald'
    },
    {
      title: 'Generate Story',
      description: 'Create stories from your videos',
      icon: SparklesIcon,
      href: '/story-generator',
      color: 'purple'
    }
  ]

  if (loading && videos.length === 0) {
    return <LoadingSpinner message="Loading your dashboard..." />
  }

  return (
    <div className="min-h-screen bg-black">
      {/* Main Content - Proper spacing under navbar */}
      <div className="pt-20 pb-8">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          {/* Hero Section */}
          <div className="mb-12">
            <div className="text-center space-y-4">
              <h1 className="text-4xl md:text-6xl font-bold text-white">
                Welcome back, <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-emerald-400 bg-clip-text text-transparent">{user?.name?.split(' ')[0]}</span>
              </h1>
              <p className="text-xl text-gray-400 max-w-2xl mx-auto">
                Manage your video collection with AI-powered insights and seamless organization
              </p>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            {/* Total Videos Card */}
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 hover:border-blue-500/50 transition-all duration-300 group">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-blue-500/10 rounded-xl group-hover:bg-blue-500/20 transition-colors duration-300">
                  <PlayIcon className="w-6 h-6 text-blue-400" />
                </div>
                <ChartBarIcon className="w-5 h-5 text-green-400" />
              </div>
              <div>
                <p className="text-3xl font-bold text-white mb-1">{stats.totalVideos}</p>
                <p className="text-gray-400 text-sm">Total Videos</p>
              </div>
            </div>

            {/* Total Duration Card */}
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 hover:border-emerald-500/50 transition-all duration-300 group">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-emerald-500/10 rounded-xl group-hover:bg-emerald-500/20 transition-colors duration-300">
                  <ClockIcon className="w-6 h-6 text-emerald-400" />
                </div>
                <ChartBarIcon className="w-5 h-5 text-green-400" />
              </div>
              <div>
                <p className="text-3xl font-bold text-white mb-1">{formatDuration(stats.totalDuration)}</p>
                <p className="text-gray-400 text-sm">Total Duration</p>
              </div>
            </div>

            {/* Total Views Card */}
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 hover:border-purple-500/50 transition-all duration-300 group">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-purple-500/10 rounded-xl group-hover:bg-purple-500/20 transition-colors duration-300">
                  <EyeIcon className="w-6 h-6 text-purple-400" />
                </div>
                <ChartBarIcon className="w-5 h-5 text-green-400" />
              </div>
              <div>
                <p className="text-3xl font-bold text-white mb-1">{stats.totalViews}</p>
                <p className="text-gray-400 text-sm">Total Views</p>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="mb-12">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold text-white">Quick Actions</h2>
              <div className="w-16 h-1 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"></div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {quickActions.map((action, index) => {
                const Icon = action.icon
                const colorClasses = {
                  blue: 'bg-blue-500/10 text-blue-400 border-blue-500/20 hover:border-blue-500/50 hover:bg-blue-500/20',
                  emerald: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:border-emerald-500/50 hover:bg-emerald-500/20',
                  purple: 'bg-purple-500/10 text-purple-400 border-purple-500/20 hover:border-purple-500/50 hover:bg-purple-500/20'
                }
                
                return (
                  <Link
                    key={action.title}
                    to={action.href}
                    className={`block p-6 bg-gray-900 border rounded-2xl transition-all duration-300 hover:transform hover:-translate-y-1 ${colorClasses[action.color]}`}
                  >
                    <div className="flex flex-col items-center text-center space-y-4">
                      <div className="p-4 rounded-2xl bg-current bg-opacity-10">
                        <Icon className="w-8 h-8" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-white mb-2">{action.title}</h3>
                        <p className="text-gray-400 text-sm">{action.description}</p>
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>

          {/* Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Recent Videos */}
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-white">Recent Videos</h3>
                <Link to="/search" className="text-blue-400 hover:text-blue-300 text-sm font-medium transition-colors duration-300 flex items-center space-x-1">
                  <span>View All</span>
                  <DocumentDuplicateIcon className="w-4 h-4" />
                </Link>
              </div>
              
              {stats.recentActivity.length > 0 ? (
                <div className="space-y-3">
                  {stats.recentActivity.map((video) => (
                    <Link
                      key={video._id}
                      to={`/video/${video._id}`}
                      className="flex items-center space-x-4 p-4 rounded-xl bg-gray-800/50 hover:bg-gray-800 transition-all duration-300 border border-transparent hover:border-gray-700"
                    >
                      <div className="w-16 h-12 bg-gray-700 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden">
                        {video.thumbnail ? (
                          <img 
                            src={video.thumbnail} 
                            alt={video.title}
                            className="w-full h-full object-cover rounded-lg"
                          />
                        ) : (
                          <PlayIcon className="w-5 h-5 text-gray-400" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-white font-medium truncate">{video.title}</p>
                        <p className="text-gray-400 text-sm">
                          {new Date(video.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="w-20 h-20 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-6">
                    <PlayIcon className="w-10 h-10 text-gray-500" />
                  </div>
                  <p className="text-gray-400 mb-6">No videos uploaded yet</p>
                  <Link to="/upload" className="inline-flex items-center space-x-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-all duration-300">
                    <PlusIcon className="w-5 h-5" />
                    <span>Upload Your First Video</span>
                  </Link>
                </div>
              )}
            </div>

            {/* Getting Started Guide */}
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
              <h3 className="text-xl font-bold text-white mb-6">Getting Started</h3>
              <div className="space-y-6">
                {/*
                  {
                    step: '1',
                    title: 'Upload Your Videos',
                    description: 'Start by uploading your video files. Our AI will automatically transcribe and tag them.',
                    color: 'blue'
                  },
                  {
                    step: '2',
                    title: 'Search Your Content',
                    description: 'Use natural language to search through your video transcriptions and find specific moments.',
                    color: 'emerald'
                  },
                  {
                    step: '3',
                    title: 'Generate Stories',
                    description: 'Let AI create compelling stories from your video collection based on your prompts.',
                    color: 'purple'
                  }
                */}
                { [
                  {
                    step: '1',
                    title: 'Upload Your Videos',
                    description: 'Start by uploading your video files. Our AI will automatically transcribe and tag them.',
                    color: 'blue'
                  },
                  {
                    step: '2',
                    title: 'Search Your Content',
                    description: 'Use natural language to search through your video transcriptions and find specific moments.',
                    color: 'emerald'
                  },
                  {
                    step: '3',
                    title: 'Generate Stories',
                    description: 'Let AI create compelling stories from your video collection based on your prompts.',
                    color: 'purple'
                  }
                ].map((item) => (
                  <div key={item.step} className="flex items-start space-x-4">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                      item.color === 'blue' ? 'bg-blue-500/20 text-blue-400' :
                      item.color === 'emerald' ? 'bg-emerald-500/20 text-emerald-400' :
                      'bg-purple-500/20 text-purple-400'
                    }`}>
                      <span className="text-sm font-bold">{item.step}</span>
                    </div>
                    <div className="flex-1">
                      <h4 className="text-white font-medium mb-1">{item.title}</h4>
                      <p className="text-gray-400 text-sm leading-relaxed">{item.description}</p>
                    </div>
                  </div>
                )) }
              </div>
              
              <div className="mt-8 pt-6 border-t border-gray-800">
                <Link to="/upload" className="w-full inline-flex items-center justify-center space-x-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-xl transition-all duration-300">
                  <CloudArrowUpIcon className="w-5 h-5" />
                  <span>Get Started Now</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard
