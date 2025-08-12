import React, { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { useVideo } from '../contexts/VideoContext'
import {
  MagnifyingGlassIcon,
  PlayIcon,
  ClockIcon,
  TagIcon,
  CalendarDaysIcon,
  FunnelIcon,
  XMarkIcon
} from '@heroicons/react/24/outline'
import LoadingSpinner from '../components/ui/LoadingSpinner'

const Search = () => {
  const { searchVideos, searchResults, videos, loading, fetchVideos } = useVideo()
  const [query, setQuery] = useState('')
  const [filters, setFilters] = useState({
    dateRange: '',
    duration: '',
    tags: []
  })
  const [showFilters, setShowFilters] = useState(false)
  const [recentSearches, setRecentSearches] = useState([])
  const searchTimeoutRef = useRef(null)

  useEffect(() => {
    fetchVideos()
    // Load recent searches from localStorage
    const saved = localStorage.getItem('recentSearches')
    if (saved) {
      setRecentSearches(JSON.parse(saved))
    }
  }, [])

  useEffect(() => {
    // Debounced search
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }

    if (query.trim()) {
      searchTimeoutRef.current = setTimeout(() => {
        handleSearch()
      }, 300)
    }

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current)
      }
    }
  }, [query, filters])

  const handleSearch = async () => {
    if (!query.trim()) return

    await searchVideos(query, filters)
    
    // Save to recent searches
    const newRecentSearches = [query, ...recentSearches.filter(s => s !== query)].slice(0, 5)
    setRecentSearches(newRecentSearches)
    localStorage.setItem('recentSearches', JSON.stringify(newRecentSearches))
  }

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }))
  }

  const clearFilters = () => {
    setFilters({
      dateRange: '',
      duration: '',
      tags: []
    })
  }

  const formatDuration = (seconds) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  const highlightText = (text, query) => {
    if (!query.trim()) return text
    const regex = new RegExp(`(${query})`, 'gi')
    return text.replace(regex, '<mark class="bg-purple-500/30 text-purple-200 px-1 rounded">$1</mark>')
  }

  const displayVideos = query.trim() ? searchResults : videos

  return (
    <div className="min-h-screen bg-black">
      <div className="pt-20 pb-8">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          {/* Header */}
          <div className="mb-12">
            <div className="text-center space-y-4">
              <h1 className="text-4xl md:text-6xl font-bold text-white">
                <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-emerald-400 bg-clip-text text-transparent">Search</span> Your Videos
              </h1>
              <p className="text-xl text-gray-400 max-w-2xl mx-auto">
                Find exactly what you're looking for using AI-powered search across transcriptions, titles, and tags
              </p>
            </div>
          </div>

          {/* Search Bar */}
          <div className="bg-gray-900/50 backdrop-blur-xl border border-gray-800/50 rounded-2xl p-8 mb-8">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1 relative">
                <MagnifyingGlassIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 w-6 h-6 text-gray-400" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search by transcription, tags, title, or description..."
                  className="w-full pl-12 pr-6 py-4 bg-gray-800/50 border border-gray-700 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-transparent transition-all duration-300 text-lg"
                />
              </div>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`px-8 py-4 border border-gray-700 text-white rounded-xl hover:bg-gray-800/50 transition-all duration-300 flex items-center space-x-3 font-semibold ${showFilters ? 'bg-purple-600 border-purple-600' : ''}`}
              >
                <FunnelIcon className="w-5 h-5" />
                <span>Filters</span>
              </button>
            </div>

            {/* Recent Searches */}
            {!query && recentSearches.length > 0 && (
              <div className="mt-6 pt-6 border-t border-gray-700">
                <p className="text-sm text-gray-400 mb-3">Recent searches:</p>
                <div className="flex flex-wrap gap-3">
                  {recentSearches.map((search, index) => (
                    <button
                      key={index}
                      onClick={() => setQuery(search)}
                      className="px-4 py-2 bg-gray-800 text-gray-300 rounded-lg text-sm hover:bg-gray-700 hover:text-white transition-all duration-300 border border-gray-700 hover:border-gray-600"
                    >
                      {search}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Filters Panel */}
            {showFilters && (
              <div className="mt-8 pt-8 border-t border-gray-700">
                <h3 className="text-lg font-semibold text-white mb-6">Filter Results</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Date Range */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-3">
                      Date Range
                    </label>
                    <select
                      value={filters.dateRange}
                      onChange={(e) => handleFilterChange('dateRange', e.target.value)}
                      className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-transparent transition-all duration-300"
                    >
                      <option value="">All time</option>
                      <option value="today">Today</option>
                      <option value="week">This week</option>
                      <option value="month">This month</option>
                      <option value="year">This year</option>
                    </select>
                  </div>

                  {/* Duration */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-3">
                      Duration
                    </label>
                    <select
                      value={filters.duration}
                      onChange={(e) => handleFilterChange('duration', e.target.value)}
                      className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-transparent transition-all duration-300"
                    >
                      <option value="">Any duration</option>
                      <option value="short">Under 5 minutes</option>
                      <option value="medium">5-20 minutes</option>
                      <option value="long">Over 20 minutes</option>
                    </select>
                  </div>

                  {/* Clear Filters */}
                  <div className="flex items-end">
                    <button
                      onClick={clearFilters}
                      className="w-full px-6 py-3 border border-gray-700 text-white rounded-xl hover:bg-gray-800/50 transition-all duration-300 flex items-center justify-center space-x-2 font-semibold"
                    >
                      <XMarkIcon className="w-5 h-5" />
                      <span>Clear Filters</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Results */}
          <div className="space-y-8">
            {/* Results Header */}
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-white">
                {query.trim() ? (
                  <>
                    Search results for <span className="text-purple-400">"{query}"</span>
                    <span className="text-gray-400 font-normal ml-2">({displayVideos.length} found)</span>
                  </>
                ) : (
                  <>
                    All Videos
                    <span className="text-gray-400 font-normal ml-2">({displayVideos.length} total)</span>
                  </>
                )}
              </h2>
            </div>

            {/* Loading State */}
            {loading && (
              <div className="flex justify-center py-16">
                <LoadingSpinner size="large" message="Searching your videos..." />
              </div>
            )}

            {/* Results Grid */}
            {!loading && (
              <>
                {displayVideos.length > 0 ? (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {displayVideos.map((video) => (
                      <Link
                        key={video._id}
                        to={`/video/${video._id}`}
                        className="bg-gray-900/50 backdrop-blur-xl border border-gray-800/50 rounded-2xl p-6 hover:bg-gray-800/50 hover:border-gray-700 transition-all duration-300 group hover:transform hover:-translate-y-1"
                      >
                        <div className="flex space-x-6">
                          {/* Thumbnail */}
                          <div className="w-36 h-24 bg-gray-700 rounded-xl flex-shrink-0 overflow-hidden relative">
                            {video.thumbnail ? (
                              <img
                                src={video.thumbnail}
                                alt={video.title}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <PlayIcon className="w-10 h-10 text-gray-400" />
                              </div>
                            )}
                            <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-all duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100">
                              <PlayIcon className="w-8 h-8 text-white" />
                            </div>
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0 space-y-3">
                            <h3 
                              className="text-xl font-bold text-white group-hover:text-purple-300 transition-colors line-clamp-2"
                              dangerouslySetInnerHTML={{
                                __html: highlightText(video.title, query)
                              }}
                            />
                            
                            {video.description && (
                              <p 
                                className="text-gray-300 text-sm line-clamp-2"
                                dangerouslySetInnerHTML={{
                                  __html: highlightText(video.description, query)
                                }}
                              />
                            )}

                            {/* Metadata */}
                            <div className="flex items-center space-x-4 text-sm text-gray-400">
                              <div className="flex items-center space-x-1">
                                <ClockIcon className="w-4 h-4" />
                                <span>{video.duration ? formatDuration(video.duration) : 'Unknown'}</span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <CalendarDaysIcon className="w-4 h-4" />
                                <span>{new Date(video.createdAt).toLocaleDateString()}</span>
                              </div>
                            </div>

                            {/* Tags */}
                            {video.tags && video.tags.length > 0 && (
                              <div className="flex items-center space-x-2">
                                <TagIcon className="w-4 h-4 text-gray-400" />
                                <div className="flex flex-wrap gap-2">
                                  {video.tags.slice(0, 3).map((tag, index) => (
                                    <span
                                      key={index}
                                      className="px-2 py-1 bg-purple-600/20 text-purple-300 text-xs rounded-full border border-purple-500/30"
                                    >
                                      {tag}
                                    </span>
                                  ))}
                                  {video.tags.length > 3 && (
                                    <span className="px-2 py-1 bg-gray-600/20 text-gray-400 text-xs rounded-full border border-gray-600/30">
                                      +{video.tags.length - 3} more
                                    </span>
                                  )}
                                </div>
                              </div>
                            )}

                            {/* Transcript Preview */}
                            {query.trim() && video.transcription && (
                              <div className="mt-4 p-4 bg-gray-700/30 rounded-xl border border-gray-600/30">
                                <p className="text-xs text-gray-400 mb-2 font-medium">Transcript Match:</p>
                                <p 
                                  className="text-sm text-gray-300 line-clamp-3"
                                  dangerouslySetInnerHTML={{
                                    __html: highlightText(
                                      (typeof video.transcription === 'string' 
                                        ? video.transcription 
                                        : video.transcription.text || ''
                                      ).substring(0, 300) + '...',
                                      query
                                    )
                                  }}
                                />
                              </div>
                            )}
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-20">
                    <div className="bg-gray-900/50 backdrop-blur-xl border border-gray-800/50 rounded-2xl p-12 max-w-lg mx-auto">
                      <MagnifyingGlassIcon className="w-20 h-20 text-gray-600 mx-auto mb-6" />
                      <h3 className="text-2xl font-bold text-white mb-4">
                        {query.trim() ? 'No results found' : 'No videos uploaded yet'}
                      </h3>
                      <p className="text-gray-400 mb-8 text-lg">
                        {query.trim() 
                          ? 'Try adjusting your search terms or filters to find what you\'re looking for'
                          : 'Upload your first video to start building your searchable video library'
                        }
                      </p>
                      <Link 
                        to="/upload" 
                        className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold rounded-xl transition-all duration-300 transform hover:scale-105"
                      >
                        <PlayIcon className="w-5 h-5 mr-2" />
                        Upload Your First Video
                      </Link>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      <style jsx>{`
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        
        .line-clamp-3 {
          display: -webkit-box;
          -webkit-line-clamp: 3;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </div>
  )
}

export default Search
