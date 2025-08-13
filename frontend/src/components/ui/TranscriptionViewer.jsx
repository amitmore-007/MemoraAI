import React, { useState } from 'react'
import {
  DocumentTextIcon,
  ClockIcon,
  PlayIcon,
  PauseIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'

const TranscriptionViewer = ({ transcription, videoRef = null, className = '', speakerDiarization = [] }) => {
  const [searchTerm, setSearchTerm] = useState('')
  const [currentSegment, setCurrentSegment] = useState(null)

  const transcriptionText = typeof transcription === 'string' 
    ? transcription 
    : transcription?.text || ''

  const segments = transcription?.segments || []

  // Merge speaker labels into segments if available
  const segmentsWithSpeakers = segments.map((seg, idx) => {
    const speaker = speakerDiarization?.find(s =>
      seg.start >= s.start && seg.end <= s.end
    )?.speaker || `Speaker ${idx % 2 + 1}`
    return { ...seg, speaker }
  })

  const handleSegmentClick = (segment) => {
    if (videoRef?.current) {
      videoRef.current.currentTime = segment.start
      videoRef.current.play()
      setCurrentSegment(segment)
    }
  }

  const highlightText = (text, searchTerm) => {
    if (!searchTerm) return text
    const regex = new RegExp(`(${searchTerm})`, 'gi')
    return text.replace(regex, '<mark class="bg-yellow-400/30 text-yellow-200 px-1 rounded">$1</mark>')
  }

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = Math.floor(seconds % 60)
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  return (
    <div className={`bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl overflow-hidden ${className}`}>
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600/10 to-purple-600/10 border-b border-gray-800 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-500/20 rounded-lg">
              <DocumentTextIcon className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">AI Transcription</h3>
              <p className="text-gray-400 text-sm">
                {transcriptionText.split(' ').length} words • {segments.length} segments
              </p>
            </div>
          </div>
          
          {/* Search */}
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search transcription..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 w-64"
            />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {/* Segments View */}
        {segmentsWithSpeakers.length > 0 && (
          <div className="mb-8">
            <h4 className="text-lg font-semibold text-white mb-4 flex items-center space-x-2">
              <ClockIcon className="w-5 h-5 text-blue-400" />
              <span>Interactive Timeline</span>
            </h4>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {segmentsWithSpeakers
                .filter(segment => 
                  !searchTerm || segment.text.toLowerCase().includes(searchTerm.toLowerCase())
                )
                .map((segment, index) => (
                <button
                  key={index}
                  onClick={() => handleSegmentClick(segment)}
                  className={`w-full text-left p-4 rounded-lg border transition-all duration-200 hover:bg-gray-700/50 ${
                    currentSegment === segment
                      ? 'bg-blue-600/20 border-blue-500/50'
                      : 'bg-gray-800/50 border-gray-700/50'
                  }`}
                >
                  <div className="flex items-start space-x-4">
                    <div className="text-center min-w-0 flex-shrink-0">
                      <div className="text-sm font-mono text-blue-400">
                        {formatTime(segment.start)}
                      </div>
                      <PlayIcon className="w-4 h-4 text-gray-400 mx-auto mt-1" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="text-xs text-purple-400 font-bold mr-2">{segment.speaker}</span>
                      <p 
                        className="text-gray-300 text-sm leading-relaxed"
                        dangerouslySetInnerHTML={{
                          __html: highlightText(segment.text, searchTerm)
                        }}
                      />
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Full Text View */}
        <div className="bg-gray-800/30 rounded-xl p-6 border border-gray-700/50">
          <h4 className="text-lg font-semibold text-white mb-4">Full Transcription</h4>
          <div 
            className="text-gray-200 leading-relaxed space-y-4"
            style={{ 
              fontFamily: 'Inter, system-ui, sans-serif',
              lineHeight: '1.7'
            }}
          >
            {transcriptionText.split(/[.!?]+\s+/).map((sentence, index) => {
              if (!sentence.trim()) return null
              
              const isHighlighted = searchTerm && 
                sentence.toLowerCase().includes(searchTerm.toLowerCase())
              
              return (
                <p 
                  key={index} 
                  className={`transition-all duration-200 cursor-pointer p-2 rounded-lg ${
                    isHighlighted 
                      ? 'bg-yellow-400/10 border border-yellow-400/30' 
                      : 'hover:bg-gray-700/30'
                  }`}
                  onClick={() => {
                    navigator.clipboard.writeText(sentence.trim() + '.')
                    toast.success('Sentence copied!')
                  }}
                >
                  <span className="text-blue-400 font-semibold mr-2 text-sm">
                    [{String(index + 1).padStart(2, '0')}]
                  </span>
                  <span 
                    dangerouslySetInnerHTML={{
                      __html: highlightText(sentence.trim() + '.', searchTerm)
                    }}
                  />
                </p>
              )
            })}
          </div>
        </div>

        {/* Actions */}
        <div className="mt-6 flex flex-wrap gap-3">
          <button
            onClick={() => {
              navigator.clipboard.writeText(transcriptionText)
              toast.success('Full transcription copied!')
            }}
            className="px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold rounded-lg transition-all duration-300 transform hover:scale-105 text-sm"
          >
            Copy All
          </button>
          
          <button
            onClick={() => {
              const blob = new Blob([transcriptionText], { type: 'text/plain' })
              const url = URL.createObjectURL(blob)
              const a = document.createElement('a')
              a.href = url
              a.download = 'transcription.txt'
              a.click()
              URL.revokeObjectURL(url)
            }}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-all duration-300 text-sm"
          >
            Download
          </button>

          {searchTerm && (
            <span className="px-4 py-2 bg-gray-700 text-gray-300 rounded-lg text-sm">
              Found in {segments.filter(s => s.text.toLowerCase().includes(searchTerm.toLowerCase())).length} segments
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

export default TranscriptionViewer
