import React from 'react'
import { Link } from 'react-router-dom'
import { 
  PlayIcon, 
  SparklesIcon, 
  MagnifyingGlassIcon,
  CloudArrowUpIcon,
  ArrowRightIcon,
  CheckIcon
} from '@heroicons/react/24/outline'

const Landing = () => {
  const features = [
    {
      icon: CloudArrowUpIcon,
      title: 'Smart Video Upload',
      description: 'Upload your videos with automatic AI-powered transcription and tagging.',
      gradient: 'from-blue-500 to-cyan-500'
    },
    {
      icon: MagnifyingGlassIcon,
      title: 'Intelligent Search',
      description: 'Search through your videos using natural language and find exact moments.',
      gradient: 'from-green-500 to-emerald-500'
    },
    {
      icon: SparklesIcon,
      title: 'AI Story Generation',
      description: 'Let AI create compelling stories from your video collection automatically.',
      gradient: 'from-purple-500 to-violet-500'
    },
    {
      icon: PlayIcon,
      title: 'Video Analytics',
      description: 'Get insights about your videos with advanced AI-powered analytics.',
      gradient: 'from-pink-500 to-rose-500'
    }
  ]

  const benefits = [
    'AI-powered video transcription',
    'Smart tagging and categorization',
    'Natural language search',
    'Automated story creation',
    'Cloud storage integration',
    'Advanced video analytics'
  ]

  return (
    <div className="min-h-screen bg-black text-white relative overflow-hidden">
      {/* Animated background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-black to-violet-900/20"></div>
        <div className="absolute top-20 left-10 w-20 h-20 bg-purple-500/20 rounded-full blur-xl animate-pulse"></div>
        <div className="absolute top-40 right-10 w-32 h-32 bg-violet-500/20 rounded-full blur-xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute bottom-20 left-1/4 w-16 h-16 bg-pink-500/20 rounded-full blur-xl animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      {/* Hero Section */}
      <section className="relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
          <div className="text-center">
            <h1 className="text-5xl md:text-7xl font-bold mb-6 transform transition-all duration-1000 opacity-0 translate-y-10 animate-[fadeInUp_1s_ease-out_forwards]">
              Transform Your Videos Into
              <span className="block bg-gradient-to-r from-white via-purple-400 to-violet-400 bg-clip-text text-transparent animate-pulse">
                AI-Powered Stories
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-300 mb-8 max-w-3xl mx-auto transform transition-all duration-1000 opacity-0 translate-y-10 animate-[fadeInUp_1s_ease-out_0.2s_forwards]">
              Upload, search, and create compelling stories from your video collection using advanced AI technology.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center transform transition-all duration-1000 opacity-0 translate-y-10 animate-[fadeInUp_1s_ease-out_0.4s_forwards]">
              <Link 
                to="/register" 
                className="px-8 py-4 bg-gradient-to-r from-purple-600 via-violet-600 to-purple-700 text-white font-semibold rounded-xl transition-all duration-300 transform hover:scale-105 hover:shadow-lg hover:shadow-purple-500/25 border border-purple-500/20 hover:border-purple-400/40 group"
              >
                Get Started Free
                <ArrowRightIcon className="w-5 h-5 ml-2 inline transition-transform group-hover:translate-x-1" />
              </Link>
              <Link 
                to="/login" 
                className="px-8 py-4 bg-transparent text-white font-semibold rounded-xl border border-purple-500/50 hover:border-purple-400 transition-all duration-300 hover:bg-purple-500/10"
              >
                Sign In
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gradient-to-b from-transparent to-gray-900/50 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-white via-purple-400 to-violet-400 bg-clip-text text-transparent">
              Powerful AI Features
            </h2>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              Experience the future of video management with our cutting-edge AI technology.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon
              return (
                <div 
                  key={feature.title}
                  className="p-6 bg-white/[0.02] backdrop-blur-sm border border-white/10 rounded-2xl transition-all duration-300 hover:bg-white/[0.05] hover:border-purple-500/30 hover:transform hover:-translate-y-2 hover:shadow-2xl hover:shadow-purple-500/10 group cursor-pointer text-center"
                  style={{ 
                    animationDelay: `${index * 0.1}s`,
                    animation: 'fadeInUp 0.8s ease-out forwards'
                  }}
                >
                  <div className={`w-16 h-16 bg-gradient-to-r ${feature.gradient} rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg`}>
                    <Icon className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2 text-white">{feature.title}</h3>
                  <p className="text-gray-300">{feature.description}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <h2 className="text-4xl md:text-5xl font-bold text-white">
                Why Choose
                <span className="block bg-gradient-to-r from-purple-400 to-violet-400 bg-clip-text text-transparent">
                  VideoStory AI?
                </span>
              </h2>
              <p className="text-xl text-gray-300">
                Our platform combines the power of artificial intelligence with intuitive design to revolutionize how you manage and create stories from your videos.
              </p>
              
              <div className="space-y-4">
                {benefits.map((benefit, index) => (
                  <div 
                    key={benefit}
                    className="flex items-center space-x-3 group cursor-pointer hover:bg-white/[0.02] p-2 rounded-lg transition-all duration-300"
                    style={{ 
                      animationDelay: `${index * 0.1}s`,
                      animation: 'slideInRight 0.6s ease-out forwards'
                    }}
                  >
                    <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0 shadow-lg shadow-green-500/25">
                      <CheckIcon className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-gray-300 group-hover:text-white transition-colors">{benefit}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white/[0.03] backdrop-blur-sm border border-white/10 rounded-2xl p-8 hover:bg-white/[0.05] hover:border-purple-500/30 transition-all duration-300 hover:shadow-2xl hover:shadow-purple-500/10">
              <div className="text-center">
                <div className="w-24 h-24 bg-gradient-to-r from-purple-500 to-violet-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-purple-500/25 animate-pulse">
                  <SparklesIcon className="w-12 h-12 text-white" />
                </div>
                <h3 className="text-2xl font-bold mb-4 text-white">Ready to Get Started?</h3>
                <p className="text-gray-300 mb-6">
                  Join thousands of creators who are already using AI to transform their video content.
                </p>
                <Link 
                  to="/register" 
                  className="w-full inline-block px-6 py-3 bg-gradient-to-r from-purple-600 via-violet-600 to-purple-700 text-white font-semibold rounded-xl transition-all duration-300 transform hover:scale-105 hover:shadow-lg hover:shadow-purple-500/25"
                >
                  Create Your Account
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-purple-900/30 to-violet-900/30 backdrop-blur-sm border-t border-white/10">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl md:text-5xl font-bold mb-6 text-white">
            Start Creating Amazing Stories Today
          </h2>
          <p className="text-xl text-gray-300 mb-8">
            Transform your video collection into compelling narratives with the power of AI.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              to="/register" 
              className="px-8 py-4 bg-gradient-to-r from-purple-600 via-violet-600 to-purple-700 text-white font-semibold rounded-xl transition-all duration-300 transform hover:scale-105 hover:shadow-lg hover:shadow-purple-500/25 group"
            >
              Get Started Now
              <ArrowRightIcon className="w-5 h-5 ml-2 inline transition-transform group-hover:translate-x-1" />
            </Link>
            <a 
              href="#features" 
              className="px-8 py-4 bg-transparent text-white font-semibold rounded-xl border border-purple-500/50 hover:border-purple-400 transition-all duration-300 hover:bg-purple-500/10"
            >
              Learn More
            </a>
          </div>
        </div>
      </section>

      <style jsx>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
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
    </div>
  )
}

export default Landing
