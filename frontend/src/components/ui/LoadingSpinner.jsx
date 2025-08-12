import React from 'react'

const LoadingSpinner = ({ size = 'large', message = 'Loading...' }) => {
  const sizeClasses = {
    small: 'w-6 h-6',
    medium: 'w-8 h-8',
    large: 'w-16 h-16'
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen particle-container">
      <div className="relative">
        {/* Outer ring */}
        <div className={`${sizeClasses[size]} border-4 border-gray-800 border-t-purple-500 rounded-full animate-spin`}></div>
        
        {/* Middle ring */}
        <div className={`${sizeClasses[size]} border-4 border-transparent border-t-violet-500 rounded-full animate-spin absolute top-0 left-0`} 
             style={{ animationDelay: '-0.15s', animationDirection: 'reverse' }}></div>
        
        {/* Inner ring */}
        <div className={`${sizeClasses[size]} border-2 border-transparent border-t-pink-500 rounded-full animate-spin absolute top-0 left-0`} 
             style={{ animationDelay: '-0.3s' }}></div>
        
        {/* Center glow */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-purple-500 rounded-full animate-pulse"></div>
      </div>
      
      {message && (
        <div className="mt-8 text-center animate-fadeInUp">
          <p className="text-gray-300 text-lg font-medium animate-pulse">{message}</p>
          <div className="flex justify-center space-x-1 mt-2">
            <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce"></div>
            <div className="w-2 h-2 bg-violet-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
            <div className="w-2 h-2 bg-pink-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
          </div>
        </div>
      )}
      
      {/* Background effects */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl animate-pulse-slow"></div>
        <div className="absolute bottom-1/4 right-1/4 w-40 h-40 bg-violet-500/10 rounded-full blur-3xl animate-pulse-slow" 
             style={{ animationDelay: '1s' }}></div>
      </div>
    </div>
  )
}

export default LoadingSpinner
