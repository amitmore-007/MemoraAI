import React, { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useVideo } from '../contexts/VideoContext'
import {
  UserIcon,
  EnvelopeIcon,
  KeyIcon,
  ChartBarIcon,
  CogIcon,
  EyeIcon,
  ClockIcon,
  PlayIcon,
  CalendarDaysIcon,
  PencilIcon,
  CheckIcon,
  XMarkIcon
} from '@heroicons/react/24/outline'

const Profile = () => {
  const { user, updateProfile, logout } = useAuth()
  const { videos, fetchVideos, getVideoStats, getStoryStats } = useVideo()
  const [isEditing, setIsEditing] = useState(false)
  const [profileForm, setProfileForm] = useState({
    name: '',
    email: ''
  })
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })
  const [showPasswordForm, setShowPasswordForm] = useState(false)
  const [stats, setStats] = useState({
    totalVideos: 0,
    totalDuration: 0,
    totalViews: 0,
    totalFileSize: 0,
    totalStories: 0,
    accountCreated: null
  })

  useEffect(() => {
    if (user) {
      setProfileForm({
        name: user.name || '',
        email: user.email || ''
      })
      setStats(prev => ({
        ...prev,
        accountCreated: user.createdAt
      }))
    }
  }, [user])

  useEffect(() => {
    fetchVideos()
    loadVideoStats()
  }, [])

  const loadVideoStats = async () => {
    try {
      const [videoResult, storyResult] = await Promise.all([
        getVideoStats(),
        getStoryStats()
      ])
      
      const combinedStats = {
        ...stats,
        accountCreated: user?.createdAt
      }
      
      if (videoResult.success) {
        Object.assign(combinedStats, videoResult.stats)
      }
      
      if (storyResult.success) {
        combinedStats.totalStories = storyResult.stats.totalStories || 0
      }
      
      setStats(combinedStats)
    } catch (error) {
      console.error('Error loading stats:', error)
    }
  }

  useEffect(() => {
    if (videos.length > 0) {
      const totalDuration = videos.reduce((acc, video) => acc + (video.duration || 0), 0)
      const totalViews = videos.reduce((acc, video) => acc + (video.views || 0), 0)
      const storiesGenerated = videos.reduce((acc, video) => acc + (video.storiesGenerated || 0), 0)
      
      setStats(prev => ({
        ...prev,
        totalVideos: videos.length,
        totalDuration,
        totalViews,
        storiesGenerated: storiesGenerated || prev.storiesGenerated
      }))
    }
  }, [videos])

  const handleProfileSubmit = async (e) => {
    e.preventDefault()
    const result = await updateProfile(profileForm)
    if (result.success) {
      setIsEditing(false)
    }
  }

  const handlePasswordSubmit = async (e) => {
    e.preventDefault()
    // Password update logic would go here
    setShowPasswordForm(false)
    setPasswordForm({
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    })
  }

  const formatDuration = (seconds) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    if (hours > 0) {
      return `${hours}h ${minutes}m`
    }
    return `${minutes}m`
  }

  const statCards = [
    {
      title: 'Total Videos',
      value: stats.totalVideos,
      icon: PlayIcon,
      color: 'bg-blue-500'
    },
    {
      title: 'Total Duration',
      value: formatDuration(stats.totalDuration),
      icon: ClockIcon,
      color: 'bg-green-500'
    },
    {
      title: 'Total Views',
      value: stats.totalViews,
      icon: EyeIcon,
      color: 'bg-purple-500'
    },
    {
      title: 'Stories Generated',
      value: stats.totalStories,
      icon: ChartBarIcon,
      color: 'bg-orange-500'
    }
  ]

  const recentVideos = videos.slice(0, 5)

  return (
    <div className="min-h-screen bg-black">
      <div className="pt-20 pb-8">
        <div className="max-w-6xl mx-auto px-6 lg:px-8">
          {/* Header */}
          <div className="mb-12">
            <div className="text-center space-y-4">
              <h1 className="text-4xl md:text-6xl font-bold text-white">
                Profile <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-emerald-400 bg-clip-text text-transparent">Settings</span>
              </h1>
              <p className="text-xl text-gray-400 max-w-2xl mx-auto">
                Manage your account and view your statistics
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Profile Information */}
            <div className="lg:col-span-2 space-y-8">
              {/* Basic Information */}
              <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-white">Basic Information</h2>
                  <button
                    onClick={() => setIsEditing(!isEditing)}
                    className="px-4 py-2 bg-gray-800 text-gray-300 font-semibold rounded-xl border border-gray-700 hover:border-gray-600 transition-all duration-300 hover:bg-gray-700 hover:text-white flex items-center space-x-2"
                  >
                    {isEditing ? (
                      <>
                        <XMarkIcon className="w-4 h-4" />
                        <span>Cancel</span>
                      </>
                    ) : (
                      <>
                        <PencilIcon className="w-4 h-4" />
                        <span>Edit</span>
                      </>
                    )}
                  </button>
                </div>

                {isEditing ? (
                  <form onSubmit={handleProfileSubmit} className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Full Name
                      </label>
                      <div className="relative">
                        <UserIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                          type="text"
                          value={profileForm.name}
                          onChange={(e) => setProfileForm(prev => ({ ...prev, name: e.target.value }))}
                          className="w-full px-4 py-3 pl-10 bg-gray-800/50 border border-gray-700 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-transparent transition-all duration-300"
                          placeholder="Enter your full name"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Email Address
                      </label>
                      <div className="relative">
                        <EnvelopeIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                          type="email"
                          value={profileForm.email}
                          onChange={(e) => setProfileForm(prev => ({ ...prev, email: e.target.value }))}
                          className="w-full px-4 py-3 pl-10 bg-gray-800/50 border border-gray-700 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-transparent transition-all duration-300"
                          placeholder="Enter your email"
                        />
                      </div>
                    </div>

                    <div className="flex space-x-3">
                      <button 
                        type="submit" 
                        className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-xl transition-all duration-300 transform hover:scale-105 flex items-center space-x-2"
                      >
                        <CheckIcon className="w-4 h-4" />
                        <span>Save Changes</span>
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="space-y-6">
                    <div className="flex items-center space-x-4 p-4 bg-gray-800/50 rounded-xl">
                      <div className="p-2 bg-blue-500/20 rounded-lg">
                        <UserIcon className="w-5 h-5 text-blue-400" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-400">Full Name</p>
                        <p className="text-white font-semibold">{user?.name || 'Not set'}</p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-4 p-4 bg-gray-800/50 rounded-xl">
                      <div className="p-2 bg-emerald-500/20 rounded-lg">
                        <EnvelopeIcon className="w-5 h-5 text-emerald-400" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-400">Email Address</p>
                        <p className="text-white font-semibold">{user?.email}</p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-4 p-4 bg-gray-800/50 rounded-xl">
                      <div className="p-2 bg-purple-500/20 rounded-lg">
                        <CalendarDaysIcon className="w-5 h-5 text-purple-400" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-400">Member Since</p>
                        <p className="text-white font-semibold">
                          {stats.accountCreated 
                            ? new Date(stats.accountCreated).toLocaleDateString()
                            : 'N/A'
                          }
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Password Settings */}
              <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-white">Password & Security</h2>
                  <button
                    onClick={() => setShowPasswordForm(!showPasswordForm)}
                    className="px-4 py-2 bg-gray-800 text-gray-300 font-semibold rounded-xl border border-gray-700 hover:border-gray-600 transition-all duration-300 hover:bg-gray-700 hover:text-white flex items-center space-x-2"
                  >
                    <KeyIcon className="w-4 h-4" />
                    <span>Change Password</span>
                  </button>
                </div>

                {showPasswordForm && (
                  <form onSubmit={handlePasswordSubmit} className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Current Password
                      </label>
                      <input
                        type="password"
                        value={passwordForm.currentPassword}
                        onChange={(e) => setPasswordForm(prev => ({ ...prev, currentPassword: e.target.value }))}
                        className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-transparent transition-all duration-300"
                        placeholder="Enter current password"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        New Password
                      </label>
                      <input
                        type="password"
                        value={passwordForm.newPassword}
                        onChange={(e) => setPasswordForm(prev => ({ ...prev, newPassword: e.target.value }))}
                        className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-transparent transition-all duration-300"
                        placeholder="Enter new password"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Confirm New Password
                      </label>
                      <input
                        type="password"
                        value={passwordForm.confirmPassword}
                        onChange={(e) => setPasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                        className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-transparent transition-all duration-300"
                        placeholder="Confirm new password"
                      />
                    </div>

                    <div className="flex space-x-3">
                      <button 
                        type="submit" 
                        className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-xl transition-all duration-300 transform hover:scale-105"
                      >
                        Update Password
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowPasswordForm(false)}
                        className="px-6 py-3 bg-gray-800 text-gray-300 font-semibold rounded-xl border border-gray-700 hover:border-gray-600 transition-all duration-300 hover:bg-gray-700 hover:text-white"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                )}
              </div>

              {/* Account Actions */}
              <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
                <h2 className="text-2xl font-bold text-white mb-6">Account Actions</h2>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-xl border border-gray-700">
                    <div>
                      <h3 className="text-white font-semibold">Export Data</h3>
                      <p className="text-gray-400 text-sm">Download all your videos and data</p>
                    </div>
                    <button className="px-6 py-3 bg-transparent text-white font-semibold rounded-xl border border-purple-500/50 hover:border-purple-400 transition-all duration-300 hover:bg-purple-500/10">
                      Export
                    </button>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-red-900/20 rounded-xl border border-red-800/50">
                    <div>
                      <h3 className="text-white font-semibold">Delete Account</h3>
                      <p className="text-gray-400 text-sm">Permanently delete your account and data</p>
                    </div>
                    <button className="px-6 py-3 bg-red-600/20 text-red-400 font-semibold rounded-xl border border-red-500/30 hover:border-red-400/50 transition-all duration-300 hover:bg-red-600/30">
                      Delete Account
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Statistics */}
              <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
                <h3 className="text-xl font-bold text-white mb-6">Your Statistics</h3>
                <div className="space-y-4">
                  {statCards.map((stat) => {
                    const Icon = stat.icon
                    return (
                      <div key={stat.title} className="flex items-center space-x-4 p-4 bg-gray-800/50 rounded-xl hover:bg-gray-800 transition-all duration-300">
                        <div className={`w-12 h-12 ${stat.color} rounded-xl flex items-center justify-center`}>
                          <Icon className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <p className="text-sm text-gray-400">{stat.title}</p>
                          <p className="text-xl font-bold text-white">{stat.value}</p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Recent Activity */}
              <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
                <h3 className="text-xl font-bold text-white mb-6">Recent Videos</h3>
                {recentVideos.length > 0 ? (
                  <div className="space-y-3">
                    {recentVideos.map((video) => (
                      <div key={video._id} className="flex items-center space-x-3 p-3 bg-gray-800/50 rounded-xl hover:bg-gray-800 transition-all duration-300">
                        <div className="w-12 h-8 bg-gray-700 rounded flex-shrink-0 overflow-hidden">
                          {video.thumbnail ? (
                            <img
                              src={video.thumbnail}
                              alt={video.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <PlayIcon className="w-3 h-3 text-gray-400" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-white truncate font-medium">{video.title}</p>
                          <p className="text-xs text-gray-400">
                            {new Date(video.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-400 text-sm">No videos uploaded yet</p>
                )}
              </div>

              {/* Quick Actions */}
              <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
                <h3 className="text-xl font-bold text-white mb-6">Quick Actions</h3>
                <div className="space-y-3">
                  <button
                    onClick={logout}
                    className="w-full px-6 py-3 bg-transparent text-white font-semibold rounded-xl border border-purple-500/50 hover:border-purple-400 transition-all duration-300 hover:bg-purple-500/10"
                  >
                    Sign Out
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Profile
