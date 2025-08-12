import React, { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { 
  HomeIcon, 
  MagnifyingGlassIcon, 
  CloudArrowUpIcon,
  SparklesIcon,
  UserIcon,
  Bars3Icon,
  XMarkIcon,
  ArrowRightOnRectangleIcon
} from '@heroicons/react/24/outline'

const Navbar = () => {
  const { user, logout } = useAuth()
  const location = useLocation()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
    { name: 'Upload', href: '/upload', icon: CloudArrowUpIcon },
    { name: 'Search', href: '/search', icon: MagnifyingGlassIcon },
    { name: 'Story Generator', href: '/story-generator', icon: SparklesIcon },
  ]

  const isActive = (path) => location.pathname === path

  return (
    <>
      {/* Animated Background Glow */}
      <div className="fixed top-0 left-0 right-0 h-20 pointer-events-none z-40">
        <div className="absolute inset-0 bg-gradient-to-b from-purple-900/20 via-transparent to-transparent"></div>
        <div className="absolute top-0 left-1/4 w-96 h-32 bg-purple-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-0 right-1/4 w-96 h-32 bg-violet-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
      </div>

      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled 
          ? 'bg-black/70 backdrop-blur-xl border-b border-white/20 shadow-2xl shadow-purple-500/10' 
          : 'bg-black/30 backdrop-blur-md border-b border-white/10'
      }`}>
        {/* Animated top border */}
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-purple-500 via-violet-500 to-pink-500 opacity-60"></div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo Section */}
            <div className="flex items-center">
              <Link to="/" className="flex items-center space-x-3 group">
                <div className="relative">
                  {/* Animated logo background */}
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-600 via-violet-600 to-pink-600 rounded-xl blur-sm opacity-75 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div className="relative w-10 h-10 bg-gradient-to-r from-purple-500 to-violet-500 rounded-xl flex items-center justify-center shadow-lg transform group-hover:scale-110 transition-all duration-300">
                    <SparklesIcon className="w-6 h-6 text-white animate-pulse" />
                  </div>
                  {/* Floating particles */}
                  <div className="absolute -top-1 -right-1 w-2 h-2 bg-purple-400 rounded-full animate-ping"></div>
                  <div className="absolute -bottom-1 -left-1 w-1.5 h-1.5 bg-violet-400 rounded-full animate-pulse" style={{ animationDelay: '0.5s' }}></div>
                </div>
                <div>
                  <h1 className="text-xl font-bold bg-gradient-to-r from-white via-purple-200 to-violet-200 bg-clip-text text-transparent group-hover:from-purple-300 group-hover:to-pink-300 transition-all duration-300">
                    Footage-Flow
                  </h1>
                  <div className="h-0.5 bg-gradient-to-r from-purple-500 to-violet-500 scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></div>
                </div>
              </Link>
            </div>

            {/* Desktop Navigation */}
            {user && (
              <div className="hidden md:flex items-center space-x-2">
                {navigation.map((item, index) => {
                  const Icon = item.icon
                  return (
                    <Link
                      key={item.name}
                      to={item.href}
                      className={`relative flex items-center space-x-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 group overflow-hidden ${
                        isActive(item.href)
                          ? 'text-white'
                          : 'text-gray-300 hover:text-white'
                      }`}
                      style={{ animationDelay: `${index * 0.1}s` }}
                    >
                      {/* Background Effects */}
                      {isActive(item.href) ? (
                        <>
                          <div className="absolute inset-0 bg-gradient-to-r from-purple-600 via-violet-600 to-purple-700 rounded-xl"></div>
                          <div className="absolute inset-0 bg-gradient-to-r from-purple-500/50 to-violet-500/50 rounded-xl blur-sm"></div>
                          <div className="absolute inset-0 bg-white/10 rounded-xl animate-pulse"></div>
                        </>
                      ) : (
                        <>
                          <div className="absolute inset-0 bg-white/5 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                          <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-violet-500/10 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                        </>
                      )}
                      
                      {/* Shine effect */}
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 rounded-xl"></div>
                      
                      {/* Content */}
                      <div className="relative z-10 flex items-center space-x-2">
                        <Icon className={`w-4 h-4 transition-all duration-300 ${
                          isActive(item.href) ? 'text-white scale-110' : 'text-gray-400 group-hover:text-purple-300 group-hover:scale-110'
                        }`} />
                        <span className="font-medium">{item.name}</span>
                      </div>
                      
                      {/* Active indicator */}
                      {isActive(item.href) && (
                        <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-white rounded-full animate-pulse"></div>
                      )}
                    </Link>
                  )
                })}
              </div>
            )}

            {/* User Menu */}
            <div className="flex items-center space-x-4">
              {user ? (
                <>
                  <div className="hidden md:flex items-center space-x-3">
                    {/* Profile Link */}
                    <Link
                      to="/profile"
                      className={`relative flex items-center space-x-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 group overflow-hidden ${
                        isActive('/profile')
                          ? 'text-white'
                          : 'text-gray-300 hover:text-white'
                      }`}
                    >
                      {/* Background */}
                      {isActive('/profile') ? (
                        <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-violet-600 rounded-xl"></div>
                      ) : (
                        <div className="absolute inset-0 bg-white/5 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                      )}
                      
                      {/* Shine effect */}
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 rounded-xl"></div>
                      
                      <div className="relative z-10 flex items-center space-x-3">
                        <div className="relative">
                          <div className="w-8 h-8 bg-gradient-to-r from-purple-500 via-violet-500 to-pink-500 rounded-full flex items-center justify-center shadow-lg">
                            <UserIcon className="w-4 h-4 text-white" />
                          </div>
                          <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-black animate-pulse"></div>
                        </div>
                        <span className="font-medium truncate max-w-24">{user.name}</span>
                      </div>
                    </Link>

                    {/* Logout Button */}
                    <button
                      onClick={logout}
                      className="relative flex items-center space-x-2 px-4 py-2.5 rounded-xl text-sm font-medium text-gray-300 hover:text-red-300 transition-all duration-300 group overflow-hidden border border-red-500/20 hover:border-red-400/40"
                    >
                      <div className="absolute inset-0 bg-red-500/10 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-red-400/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 rounded-xl"></div>
                      
                      <div className="relative z-10 flex items-center space-x-2">
                        <ArrowRightOnRectangleIcon className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
                        <span>Logout</span>
                      </div>
                    </button>
                  </div>

                  {/* Mobile menu button */}
                  <button
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                    className="md:hidden relative p-2.5 rounded-xl text-gray-300 hover:text-white transition-all duration-300 group overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-white/5 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 rounded-xl"></div>
                    
                    <div className="relative z-10 transition-transform duration-300 group-hover:scale-110">
                      {isMenuOpen ? (
                        <XMarkIcon className="w-6 h-6" />
                      ) : (
                        <Bars3Icon className="w-6 h-6" />
                      )}
                    </div>
                  </button>
                </>
              ) : (
                <div className="flex items-center space-x-4">
                  <Link
                    to="/login"
                    className="relative px-4 py-2.5 rounded-xl text-sm font-medium text-gray-300 hover:text-white transition-all duration-300 group overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-white/5 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 rounded-xl"></div>
                    <span className="relative z-10">Login</span>
                  </Link>
                  
                  <Link
                    to="/register"
                    className="relative px-6 py-2.5 bg-gradient-to-r from-purple-600 via-violet-600 to-purple-700 text-white font-semibold rounded-xl transition-all duration-300 transform hover:scale-105 active:scale-95 shadow-lg hover:shadow-purple-500/25 border border-purple-500/20 hover:border-purple-400/40 group overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-purple-500/50 to-violet-500/50 rounded-xl blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 rounded-xl"></div>
                    <span className="relative z-10">Sign Up</span>
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Mobile Navigation Menu */}
          {user && isMenuOpen && (
            <div className="md:hidden transform transition-all duration-300 ease-out">
              <div className="px-2 pt-4 pb-6 space-y-2 border-t border-white/10 backdrop-blur-xl bg-black/20">
                {navigation.map((item, index) => {
                  const Icon = item.icon
                  return (
                    <Link
                      key={item.name}
                      to={item.href}
                      onClick={() => setIsMenuOpen(false)}
                      className={`relative flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300 group overflow-hidden ${
                        isActive(item.href)
                          ? 'text-white bg-gradient-to-r from-purple-600 to-violet-600'
                          : 'text-gray-300 hover:text-white hover:bg-white/5'
                      }`}
                      style={{ 
                        animationDelay: `${index * 0.1}s`,
                        animation: 'slideInRight 0.5s ease-out forwards'
                      }}
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 rounded-xl"></div>
                      
                      <div className="relative z-10 flex items-center space-x-3">
                        <Icon className={`w-5 h-5 transition-all duration-300 ${
                          isActive(item.href) ? 'text-white' : 'text-gray-400 group-hover:text-purple-300'
                        }`} />
                        <span>{item.name}</span>
                      </div>
                    </Link>
                  )
                })}
                
                {/* Mobile Profile Link */}
                <Link
                  to="/profile"
                  onClick={() => setIsMenuOpen(false)}
                  className={`relative flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300 group overflow-hidden ${
                    isActive('/profile')
                      ? 'text-white bg-gradient-to-r from-purple-600 to-violet-600'
                      : 'text-gray-300 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 rounded-xl"></div>
                  
                  <div className="relative z-10 flex items-center space-x-3">
                    <UserIcon className="w-5 h-5" />
                    <span>Profile</span>
                  </div>
                </Link>
                
                {/* Mobile Logout Button */}
                <button
                  onClick={() => {
                    logout()
                    setIsMenuOpen(false)
                  }}
                  className="relative flex items-center space-x-3 w-full px-4 py-3 rounded-xl text-sm font-medium text-gray-300 hover:text-red-300 transition-all duration-300 group overflow-hidden hover:bg-red-500/10"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-red-400/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 rounded-xl"></div>
                  
                  <div className="relative z-10 flex items-center space-x-3">
                    <ArrowRightOnRectangleIcon className="w-5 h-5" />
                    <span>Logout</span>
                  </div>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Bottom glow effect */}
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-purple-500/50 to-transparent"></div>
      </nav>

      <style jsx>{`
        @keyframes slideInRight {
          from {
            opacity: 0;
            transform: translateX(30px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
      `}</style>
    </>
  )
}

export default Navbar
