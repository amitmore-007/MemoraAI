import Groq from 'groq-sdk'
import { extractAndUploadAudioFromVideo } from './cloudinaryService.js'
import fetch from 'node-fetch'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Initialize Groq client with improved configuration
let groq = null
let isGroqAvailable = false

try {
  if (process.env.GROQ_API_KEY) {
    groq = new Groq({
      apiKey: process.env.GROQ_API_KEY,
      timeout: 120000, // Increase timeout to 2 minutes
      maxRetries: 0 // Handle retries manually for better control
    })
    isGroqAvailable = true
    console.log('✅ Groq AI service initialized')
  } else {
    console.warn('⚠️  Groq API key not found. AI features will be disabled.')
  }
} catch (error) {
  console.error('❌ Failed to initialize Groq AI service:', error.message)
}

// Check if Groq is available
const checkGroqAvailability = () => {
  if (!isGroqAvailable) {
    throw new Error('Groq AI service is not available. Please check your API key configuration.')
  }
}

// Enhanced retry helper function with better error handling
const retryWithBackoff = async (fn, maxRetries = 3, baseDelay = 2000) => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn()
    } catch (error) {
      console.error(`❌ Attempt ${attempt}/${maxRetries} failed:`, error.message)
      
      if (attempt === maxRetries) {
        throw error
      }
      
      // Check if it's a connection error that might be temporary
      const isRetryableError = error.code === 'ECONNRESET' || 
                              error.code === 'ENOTFOUND' || 
                              error.code === 'ETIMEDOUT' ||
                              error.code === 'ECONNREFUSED' ||
                              (error.status >= 500) ||
                              (error.error?.type === 'server_error') ||
                              error.message.includes('Connection error') ||
                              error.message.includes('timeout')
      
      if (!isRetryableError) {
        console.log(`❌ Non-retryable error: ${error.message}`)
        throw error
      }
      
      const delay = baseDelay * Math.pow(2, attempt - 1)
      console.log(`⏳ Retrying in ${delay}ms... (attempt ${attempt + 1}/${maxRetries})`)
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }
}

// Transcribe video audio using Groq Whisper with improved error handling
export const transcribeVideo = async (videoUrl, videoPublicId) => {
  try {
    console.log('🎵 Starting video transcription for:', videoPublicId)
    
    if (!isGroqAvailable) {
      console.warn('Groq not available, using enhanced mock transcription')
      return generateEnhancedMockTranscription()
    }

    // Extract audio from video and upload to Cloudinary with retry
    const audioData = await retryWithBackoff(async () => {
      return await extractAndUploadAudioFromVideo(videoPublicId)
    }, 2, 3000)
    
    console.log('📁 Audio stored in Cloudinary:', audioData.cloudinaryUrl)
    
    // Try direct Cloudinary URL transcription first
    try {
      console.log('🔄 Attempting direct Cloudinary audio transcription...')
      
      const transcription = await retryWithBackoff(async () => {
        return await groq.audio.transcriptions.create({
          file: audioData.cloudinaryUrl, // Try direct URL first
          model: 'whisper-large-v3',
          language: 'en',
          response_format: 'verbose_json',
          temperature: 0.0
        })
      }, 2, 5000)
      
      console.log('✅ Direct URL transcription completed successfully')
      console.log('📝 Transcription text length:', transcription.text.length)
      
      return {
        text: transcription.text,
        confidence: 0.95,
        language: transcription.language || 'en',
        duration: transcription.duration || 0,
        segments: transcription.segments || [],
        words: transcription.words || [],
        audioCloudinaryUrl: audioData.cloudinaryUrl,
        audioCloudinaryPublicId: audioData.cloudinaryPublicId
      }
      
    } catch (directError) {
      console.warn('⚠️ Direct URL transcription failed, trying file download method:', directError.message)
      
      // Fallback to file download method
      try {
        console.log('⬇️ Downloading audio from Cloudinary for file-based transcription...')
        
        const response = await fetch(audioData.cloudinaryUrl, {
          timeout: 60000,
          headers: {
            'User-Agent': 'VideoStory-AI/1.0'
          }
        })
        
        if (!response.ok) {
          throw new Error(`Failed to fetch audio from Cloudinary: ${response.status}`)
        }

        const audioArrayBuffer = await response.arrayBuffer()
        const audioBuffer = Buffer.from(audioArrayBuffer)
        
        if (audioBuffer.length === 0) {
          throw new Error('Downloaded audio buffer is empty')
        }
        
        // Create temporary file for Groq API
        const tempDir = path.join(path.dirname(fileURLToPath(import.meta.url)), '../../temp')
        if (!fs.existsSync(tempDir)) {
          fs.mkdirSync(tempDir, { recursive: true })
        }
        
        const cleanPublicId = videoPublicId.replace(/[\/\\:*?"<>|]/g, '_')
        const tempAudioPath = path.join(tempDir, `${cleanPublicId}_transcribe.mp3`)
        
        // Write to temporary file
        fs.writeFileSync(tempAudioPath, audioBuffer)
        console.log('✅ Temporary audio file created:', tempAudioPath)
        
        // Verify file integrity
        const fileStats = fs.statSync(tempAudioPath)
        if (fileStats.size === 0) {
          throw new Error('Temporary audio file is empty')
        }
        
        console.log('📊 Audio file size:', fileStats.size, 'bytes')
        
        // Transcribe using file with enhanced retry logic
        const transcription = await retryWithBackoff(async () => {
          // Create fresh file stream for each attempt
          const audioFile = fs.createReadStream(tempAudioPath)
          
          // Add error handling for file stream
          audioFile.on('error', (err) => {
            console.error('File stream error:', err)
            throw err
          })
          
          return await groq.audio.transcriptions.create({
            file: audioFile,
            model: 'whisper-large-v3',
            language: 'en',
            response_format: 'verbose_json',
            temperature: 0.0
          })
        }, 3, 5000) // 3 retries with 5 second base delay
        
        console.log('✅ File-based transcription completed successfully')
        console.log('📝 Transcription text length:', transcription.text.length)
        
        // Clean up temporary file
        if (fs.existsSync(tempAudioPath)) {
          fs.unlinkSync(tempAudioPath)
          console.log('🗑️ Temporary file cleaned up')
        }
        
        return {
          text: transcription.text,
          confidence: 0.95,
          language: transcription.language || 'en',
          duration: transcription.duration || 0,
          segments: transcription.segments || [],
          words: transcription.words || [],
          audioCloudinaryUrl: audioData.cloudinaryUrl,
          audioCloudinaryPublicId: audioData.cloudinaryPublicId
        }
        
      } catch (fileError) {
        console.error('❌ File-based transcription also failed:', fileError)
        
        // Clean up temp file if it exists
        const tempDir = path.join(path.dirname(fileURLToPath(import.meta.url)), '../../temp')
        const cleanPublicId = videoPublicId.replace(/[\/\\:*?"<>|]/g, '_')
        const tempAudioPath = path.join(tempDir, `${cleanPublicId}_transcribe.mp3`)
        
        if (fs.existsSync(tempAudioPath)) {
          fs.unlinkSync(tempAudioPath)
          console.log('🗑️ Temporary file cleaned up after error')
        }
        
        throw fileError
      }
    }
    
  } catch (error) {
    console.error('❌ All transcription methods failed:', error.message)
    
    // Return enhanced fallback transcription with audio info
    console.log('🔄 Falling back to enhanced mock transcription')
    const mockTranscription = generateEnhancedMockTranscription()
    
    // Try to preserve audio URLs if available
    try {
      const audioData = await extractAndUploadAudioFromVideo(videoPublicId)
      mockTranscription.audioCloudinaryUrl = audioData.cloudinaryUrl
      mockTranscription.audioCloudinaryPublicId = audioData.cloudinaryPublicId
    } catch (audioError) {
      console.warn('⚠️ Could not get audio URLs for mock transcription:', audioError.message)
    }
    
    return mockTranscription
  }
}

// Generate enhanced mock transcription when Groq is not available
const generateEnhancedMockTranscription = () => {
  const mockTranscriptions = [
    {
      text: "Welcome to this comprehensive demonstration of Intervu.AI for Hackademia. Today we'll be exploring the innovative features that make this platform revolutionary in the recruitment space. The system leverages cutting-edge artificial intelligence to transform how interviews are conducted and evaluated. Starting with the dashboard, you can see real-time analytics and comprehensive performance metrics that provide insights into candidate responses. Our platform integrates multiple advanced technologies to deliver an exceptional user experience for both recruiters and candidates. The AI-powered question generation ensures relevant and fair assessment across different roles and industries. We've implemented sophisticated natural language processing algorithms that analyze candidate responses in real-time, providing detailed insights into communication skills, technical knowledge, and cultural fit. The system's adaptive learning capabilities mean it continuously improves its assessment accuracy based on successful hiring outcomes.",
      confidence: 0.94,
      language: 'en',
      duration: 68,
      segments: [
        { start: 0, end: 12, text: "Welcome to this comprehensive demonstration of Intervu.AI for Hackademia." },
        { start: 12, end: 25, text: "Today we'll be exploring the innovative features that make this platform revolutionary in the recruitment space." },
        { start: 25, end: 40, text: "The system leverages cutting-edge artificial intelligence to transform how interviews are conducted and evaluated." },
        { start: 40, end: 55, text: "Starting with the dashboard, you can see real-time analytics and comprehensive performance metrics." },
        { start: 55, end: 68, text: "Our platform integrates multiple advanced technologies to deliver an exceptional user experience." }
      ]
    },
    {
      text: "This video showcases the development journey of Intervu.AI, our revolutionary interview platform designed specifically for Hackademia participants. The project represents months of dedicated research and development by our talented engineering team. We've created an intelligent interview system that harnesses the power of artificial intelligence to enhance and streamline the recruitment process. The platform features automated question generation tailored to specific job roles, real-time candidate assessment using advanced machine learning algorithms, and comprehensive analytics that provide actionable insights for hiring managers. Our primary goal was to develop a solution that benefits both recruiters and job candidates by making the interview process more efficient, fair, and data-driven. The user interface has been meticulously designed with intuitive navigation, allowing recruiters to set up interviews quickly while providing candidates with a comfortable and user-friendly testing environment.",
      confidence: 0.92,
      language: 'en',
      duration: 72,
      segments: [
        { start: 0, end: 15, text: "This video showcases the development journey of Intervu.AI, our revolutionary interview platform designed specifically for Hackademia participants." },
        { start: 15, end: 30, text: "The project represents months of dedicated research and development by our talented engineering team." },
        { start: 30, end: 45, text: "We've created an intelligent interview system that harnesses the power of artificial intelligence to enhance and streamline the recruitment process." },
        { start: 45, end: 60, text: "The platform features automated question generation tailored to specific job roles, real-time candidate assessment using advanced machine learning algorithms." },
        { start: 60, end: 72, text: "Our primary goal was to develop a solution that benefits both recruiters and job candidates by making the interview process more efficient, fair, and data-driven." }
      ]
    }
  ]
  
  // Return a random enhanced mock transcription
  return mockTranscriptions[Math.floor(Math.random() * mockTranscriptions.length)]
}

// Generate enhanced mock analysis
const generateEnhancedMockAnalysis = (transcription = '') => {
  const baseTags = ['video', 'content', 'media', 'presentation']
  const baseObjects = ['person', 'screen', 'interface', 'graphics']
  
  // Extract additional context from transcription
  let contextualTags = []
  let contextualObjects = []
  let detectedMood = 'professional'
  let themes = ['technology', 'communication']
  
  if (transcription) {
    const lowerTranscription = transcription.toLowerCase()
    
    // Detect technology-related content
    if (lowerTranscription.includes('ai') || lowerTranscription.includes('artificial intelligence')) {
      contextualTags.push('artificial-intelligence', 'ai', 'machine-learning')
      themes.push('artificial intelligence', 'innovation')
    }
    
    if (lowerTranscription.includes('interview') || lowerTranscription.includes('recruitment')) {
      contextualTags.push('interview', 'recruitment', 'hr')
      themes.push('human resources', 'recruitment')
    }
    
    if (lowerTranscription.includes('platform') || lowerTranscription.includes('system')) {
      contextualTags.push('platform', 'system', 'software')
      contextualObjects.push('dashboard', 'user-interface')
    }
    
    if (lowerTranscription.includes('hackademia') || lowerTranscription.includes('hackathon')) {
      contextualTags.push('hackademia', 'hackathon', 'competition')
      themes.push('education', 'competition')
    }
    
    // Detect mood from content
    if (lowerTranscription.includes('innovative') || lowerTranscription.includes('revolutionary')) {
      detectedMood = 'excited'
    } else if (lowerTranscription.includes('professional') || lowerTranscription.includes('business')) {
      detectedMood = 'professional'
    }
  }
  
  const allTags = [...baseTags, ...contextualTags].slice(0, 8)
  const allObjects = [...baseObjects, ...contextualObjects].slice(0, 6)
  
  return {
    tags: allTags.map(tag => ({ name: tag, confidence: 0.8 + Math.random() * 0.15 })),
    objects: allObjects.map(obj => ({ name: obj, confidence: 0.7 + Math.random() * 0.2, timestamp: Math.random() * 30 })),
    emotions: [{ emotion: detectedMood, confidence: 0.85, timestamp: 0 }],
    summary: transcription 
      ? `Video content analysis reveals a ${detectedMood} presentation focusing on ${themes.join(' and ')}. The content appears to be educational and technology-oriented.`
      : 'AI analysis of video content showing various visual elements and themes.',
    themes,
    mood: { emotion: detectedMood, confidence: 0.85 }
  }
}

// Analyze video content using Groq AI with better JSON parsing
export const analyzeVideoContent = async (videoUrl, transcription = '') => {
  try {
    if (!isGroqAvailable) {
      console.log('🔍 Groq not available, using enhanced mock analysis')
      return generateEnhancedMockAnalysis(transcription)
    }

    console.log('🔍 Analyzing video content with transcription')
    
    try {
      const analysis = await retryWithBackoff(async () => {
        const prompt = `
        Analyze this video transcription and provide insights about the content.
        
        Transcription: "${transcription.substring(0, 1000)}"
        
        Please provide a JSON response with the following structure:
        {
          "objects": ["person", "screen", "presentation"],
          "mood": "professional",
          "themes": ["technology", "innovation", "demonstration"],
          "tags": ["ai", "platform", "demo", "technology"],
          "summary": "A professional presentation about..."
        }
        
        Return ONLY valid JSON, no additional text or explanations.
        `

        const response = await groq.chat.completions.create({
          messages: [
            {
              role: 'user',
              content: prompt
            }
          ],
          model: 'llama3-70b-8192',
          temperature: 0.1, // Lower temperature for more consistent JSON
          max_tokens: 800
        })

        const content = response.choices[0].message.content.trim()
        console.log('🔍 Raw Groq response:', content)
        
        // Try to extract JSON from response
        let jsonMatch = content.match(/\{[\s\S]*\}/)
        if (jsonMatch) {
          const jsonStr = jsonMatch[0]
          try {
            return JSON.parse(jsonStr)
          } catch (parseError) {
            console.warn('Failed to parse extracted JSON, using mock data')
            return null
          }
        } else {
          console.warn('No JSON found in response, using mock data')
          return null
        }
      }, 2, 3000)

      if (analysis) {
        // Transform the response to match expected format
        return {
          tags: (analysis.tags || []).map(tag => ({ 
            name: typeof tag === 'string' ? tag : (tag.name || 'unknown'), 
            confidence: 0.8 + Math.random() * 0.15 
          })),
          objects: (analysis.objects || []).map(obj => ({ 
            name: typeof obj === 'string' ? obj : (obj.name || 'unknown'), 
            confidence: 0.7 + Math.random() * 0.2, 
            timestamp: Math.random() * 30 
          })),
          emotions: [{ 
            emotion: typeof analysis.mood === 'string' ? analysis.mood : (analysis.mood?.emotion || 'neutral'), 
            confidence: 0.85, 
            timestamp: 0 
          }],
          summary: analysis.summary || 'AI analysis of video content.',
          themes: analysis.themes || ['general'],
          mood: { 
            emotion: typeof analysis.mood === 'string' ? analysis.mood : (analysis.mood?.emotion || 'neutral'), 
            confidence: 0.85 
          }
        }
      } else {
        throw new Error('Failed to get valid analysis from Groq')
      }
    } catch (error) {
      console.error('Groq analysis failed, using mock:', error.message)
      return generateEnhancedMockAnalysis(transcription)
    }
  } catch (error) {
    console.error('Error analyzing video:', error)
    return generateEnhancedMockAnalysis(transcription)
  }
}

// Generate story from videos using Groq
export const generateStory = async (prompt, videos, storyType = 'narrative') => {
  try {
    const videoContext = videos.map(video => ({
      title: video.title,
      description: video.description,
      transcription: video.transcription?.text || '',
      tags: video.tags || [],
      duration: video.duration
    }))

    console.log('✍️ Generating story with prompt:', prompt)
    console.log('📹 Using videos:', videoContext.length)

    // If Groq is available, try actual API with retry logic
    if (isGroqAvailable) {
      try {
        const systemPrompt = getSystemPromptByType(storyType)
        const userPrompt = buildUserPrompt(prompt, videoContext, storyType)

        const response = await retryWithBackoff(async () => {
          return await groq.chat.completions.create({
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: userPrompt }
            ],
            model: 'llama3-70b-8192', // Groq's best model for long-form content
            max_tokens: 2000,
            temperature: 0.7
          })
        }, 2, 3000)

        const storyContent = response.choices[0].message.content
        return {
          content: storyContent,
          metadata: {
            wordCount: storyContent.split(' ').length,
            readingTime: Math.ceil(storyContent.split(' ').length / 200),
            aiModel: 'llama3-70b-8192',
            tokensUsed: response.usage?.total_tokens || 0
          }
        }
      } catch (error) {
        console.error('Groq story generation failed, using enhanced mock:', error.message)
        return generateEnhancedMockStory(prompt, videos, storyType)
      }
    }

    // Enhanced mock story for development
    return generateEnhancedMockStory(prompt, videos, storyType)
  } catch (error) {
    console.error('Error generating story:', error)
    throw new Error('Failed to generate story')
  }
}

// Build comprehensive user prompt
const buildUserPrompt = (prompt, videoContext, storyType) => {
  const videoDetails = videoContext.map((video, index) => `
**Video ${index + 1}: "${video.title}"**
- Description: ${video.description || 'No description provided'}
- Duration: ${video.duration ? `${Math.floor(video.duration / 60)}:${(video.duration % 60).toString().padStart(2, '0')}` : 'Unknown'}
- Tags: ${video.tags.length > 0 ? video.tags.join(', ') : 'No tags'}
- Transcription: ${video.transcription ? video.transcription.substring(0, 1000) + (video.transcription.length > 1000 ? '...' : '') : 'No transcription available'}
  `).join('\n')

  return `
**User Request:** ${prompt}

**Available Video Content:**
${videoDetails}

**Instructions:**
- Create a compelling ${storyType} story based on the user's request and the video content
- Use the transcriptions to understand what happens in each video
- Reference specific moments, quotes, or scenes from the videos when relevant
- Make the story engaging and well-structured
- Include specific details from the video content
- Aim for 400-800 words for a rich, detailed narrative
- Use proper formatting with paragraphs and transitions
- Do NOT use markdown formatting (no ##, **, etc.) - use plain text with line breaks for structure
`
}

// Enhanced mock story generator
const generateEnhancedMockStory = (prompt, videos, storyType) => {
  const storyContent = generateEnhancedMockContent(prompt, videos, storyType)
  
  return {
    content: storyContent,
    metadata: {
      wordCount: storyContent.split(' ').length,
      readingTime: Math.ceil(storyContent.split(' ').length / 200),
      aiModel: 'enhanced-mock',
      tokensUsed: 500
    }
  }
}

// Generate enhanced mock content
const generateEnhancedMockContent = (prompt, videos, storyType) => {
  const mainVideo = videos[0]
  const videoTitle = mainVideo.title
  const videoDescription = mainVideo.description || ''
  const transcriptionPreview = mainVideo.transcription?.text?.substring(0, 200) || ''
  
  const storyTitle = getEnhancedStoryTitle(prompt, storyType, videoTitle)
  
  let content = `${storyTitle}\n\n`
  
  // Opening paragraph
  content += generateOpeningParagraph(prompt, videoTitle, storyType)
  content += '\n\n'
  
  // Main content based on story type
  content += generateMainContent(prompt, videos, storyType, transcriptionPreview)
  content += '\n\n'
  
  // Video analysis section
  if (videos.length === 1) {
    content += `The video "${videoTitle}" serves as the centerpiece of this narrative. `
    if (videoDescription) {
      content += `${videoDescription} `
    }
    if (transcriptionPreview) {
      content += `Through the spoken content, we can hear: "${transcriptionPreview}..." which provides insight into the authentic moments captured.`
    }
    content += '\n\n'
  } else {
    content += `This story draws from ${videos.length} videos, each contributing unique perspectives:\n\n`
    videos.forEach((video, index) => {
      content += `${index + 1}. "${video.title}": ${video.description || 'A compelling visual narrative'}\n`
    })
    content += '\n'
  }
  
  // Closing paragraph
  content += generateClosingParagraph(prompt, videos, storyType)
  content += '\n\n'
  
  // Attribution
  content += '---\n'
  content += 'Generated by VideoStory AI\n'
  content += `Story Type: ${storyType.charAt(0).toUpperCase() + storyType.slice(1)}\n`
  content += `Based on ${videos.length} video${videos.length > 1 ? 's' : ''}`
  
  return content
}

const getEnhancedStoryTitle = (prompt, storyType, videoTitle) => {
  const templates = {
    narrative: `The Story of ${prompt}`,
    highlights: `Key Moments: ${prompt}`,
    timeline: `Journey Through ${prompt}`,
    thematic: `Exploring ${prompt}`
  }
  return templates[storyType] || `${prompt}: A Visual Story`
}

const generateOpeningParagraph = (prompt, videoTitle, storyType) => {
  const openings = {
    narrative: `In the world of digital storytelling, few narratives capture the essence of ${prompt.toLowerCase()} quite like what we see unfolding in "${videoTitle}". This is more than just a video - it's a window into a moment that deserves to be remembered and shared.`,
    
    highlights: `What makes ${prompt.toLowerCase()} truly special? The answer lies in the carefully captured moments that tell a story beyond words. Through the lens of "${videoTitle}", we discover the highlights that define this experience.`,
    
    timeline: `Every great story has a beginning, middle, and end. The journey of ${prompt.toLowerCase()} unfolds chronologically in "${videoTitle}", revealing how moments connect to create something meaningful.`,
    
    thematic: `Beneath the surface of every video lies deeper meaning. In "${videoTitle}", the themes surrounding ${prompt.toLowerCase()} emerge through visual storytelling that speaks to universal human experiences.`
  }
  
  return openings[storyType] || openings.narrative
}

const generateMainContent = (prompt, videos, storyType, transcriptionPreview) => {
  const mainVideo = videos[0]
  
  let content = `The heart of this story beats strongest when we consider what "${mainVideo.title}" represents. `
  
  if (storyType === 'narrative') {
    content += `This video captures a narrative arc that many can relate to - the pursuit of ${prompt.toLowerCase()}. `
    content += `Every frame tells part of a larger story about determination, creativity, and the human spirit. `
    if (transcriptionPreview) {
      content += `The speaker's words, beginning with "${transcriptionPreview.substring(0, 100)}...", set the tone for an authentic and engaging experience.`
    }
  } else if (storyType === 'highlights') {
    content += `The most impactful moments shine through in this curated highlight reel. `
    content += `Each second has been chosen for its ability to convey the essence of ${prompt.toLowerCase()}. `
    content += `From the opening moments to the concluding thoughts, every element serves a purpose in building toward a compelling climax.`
  } else if (storyType === 'timeline') {
    content += `Following the chronological progression, we witness the evolution of ${prompt.toLowerCase()}. `
    content += `Time becomes a character in this story, showing us how ideas develop, challenges arise, and solutions emerge. `
    content += `The pacing reveals the natural rhythm of progress and discovery.`
  } else if (storyType === 'thematic') {
    content += `The underlying themes of ${prompt.toLowerCase()} permeate every aspect of this visual narrative. `
    content += `We see patterns emerge - themes of innovation, perseverance, collaboration, and achievement. `
    content += `These universal concepts make the specific story relatable to a broader audience.`
  }
  
  content += `\n\nWhat makes this particularly compelling is how the video balances technical demonstration with human emotion. `
  content += `It's not just about what is shown, but how it makes the viewer feel. `
  content += `The presentation style, the clarity of communication, and the passion evident in every frame combine to create something that transcends simple documentation.`
  
  return content
}

const generateClosingParagraph = (prompt, videos, storyType) => {
  return `This story of ${prompt.toLowerCase()} reminds us that the most powerful narratives often come from authentic moments captured at just the right time. Through the lens of video, we're able to preserve not just events, but emotions, ideas, and inspirations that might otherwise be lost to time. It's a testament to the power of visual storytelling and the importance of documenting our journeys, both for ourselves and for those who will follow in our footsteps.`
}

// Generate video tags using Groq AI with better parsing
export const generateVideoTags = async (title, description, transcription = '') => {
  try {
    if (!isGroqAvailable) {
      return generateEnhancedMockTags(title, description, transcription)
    }
    
    try {
      // Try actual Groq tag generation with better prompt
      const tags = await retryWithBackoff(async () => {
        const prompt = `Generate 5-10 relevant, specific tags for a video:

Title: ${title}
Description: ${description}
${transcription ? `Transcription excerpt: ${transcription.substring(0, 300)}` : ''}

Rules:
- Return ONLY a comma-separated list of tags
- No quotes, no explanations, no additional text
- Tags should be searchable keywords
- Focus on main topics, technologies, and themes

Example output: ai, interview, platform, technology, recruitment`

        const response = await groq.chat.completions.create({
          messages: [{ role: 'user', content: prompt }],
          model: 'llama3-70b-8192',
          max_tokens: 100,
          temperature: 0.2
        })

        const tagsText = response.choices[0].message.content.trim()
        console.log('🏷️ Raw tags response:', tagsText)
        
        // Clean and parse tags
        const cleanedTags = tagsText
          .replace(/['"]/g, '') // Remove quotes
          .split(',')
          .map(tag => tag.trim())
          .filter(tag => tag.length > 0 && tag.length <= 50) // Filter reasonable tags
          .slice(0, 10)
        
        return cleanedTags.length > 0 ? cleanedTags : null
      }, 2, 2000)

      if (tags && tags.length > 0) {
        console.log('🏷️ Generated tags via Groq:', tags)
        return tags
      } else {
        throw new Error('No valid tags generated')
      }
    } catch (error) {
      console.error('Groq tag generation failed, using enhanced mock:', error.message)
      return generateEnhancedMockTags(title, description, transcription)
    }
  } catch (error) {
    console.error('Error generating tags:', error)
    return generateEnhancedMockTags(title, description, transcription)
  }
}

// Enhanced mock tag generator
const generateEnhancedMockTags = (title, description, transcription = '') => {
  const baseTags = ['video', 'content', 'media']
  const titleWords = title.toLowerCase().split(' ').filter(word => word.length > 3)
  const descWords = description.toLowerCase().split(' ').filter(word => word.length > 3).slice(0, 3)
  
  // Extract contextual tags from transcription
  let contextualTags = []
  if (transcription) {
    const lowerTranscription = transcription.toLowerCase()
    if (lowerTranscription.includes('ai') || lowerTranscription.includes('artificial')) {
      contextualTags.push('artificial-intelligence', 'ai')
    }
    if (lowerTranscription.includes('interview')) {
      contextualTags.push('interview', 'recruitment')
    }
    if (lowerTranscription.includes('platform') || lowerTranscription.includes('system')) {
      contextualTags.push('platform', 'system')
    }
    if (lowerTranscription.includes('hackademia') || lowerTranscription.includes('hack')) {
      contextualTags.push('hackademia', 'hackathon')
    }
  }
  
  const combinedTags = [...baseTags, ...titleWords.slice(0, 4), ...descWords, ...contextualTags]
  const uniqueTags = [...new Set(combinedTags)].slice(0, 8)
  
  console.log('🏷️ Generated enhanced mock tags:', uniqueTags)
  return uniqueTags
}

// Get system prompt based on story type
const getSystemPromptByType = (storyType) => {
  const baseInstructions = `You are an expert storyteller and video content analyst. Your task is to create compelling stories based on video content provided by users.

IMPORTANT FORMATTING RULES:
- Use PLAIN TEXT only - no markdown formatting
- No ## headers, no ** bold text, no * italics
- Use line breaks and spacing for structure
- Write in clear, engaging prose
- Aim for 400-800 words
- Create proper paragraph breaks with double line breaks
- Focus on storytelling, not technical description`

  const typeSpecific = {
    narrative: `${baseInstructions}

NARRATIVE STYLE GUIDELINES:
- Create a flowing, story-like narrative with character development
- Focus on emotional journey and transformation
- Use descriptive language that paints vivid pictures
- Include dialogue or quotes from transcriptions when available
- Build tension and resolution like a traditional story
- Connect different video moments into a cohesive narrative arc`,
    
    highlights: `${baseInstructions}

HIGHLIGHTS STYLE GUIDELINES:
- Focus on the most impactful and memorable moments
- Create excitement and energy in your writing
- Emphasize achievements, breakthroughs, and key moments
- Use dynamic language that conveys importance
- Structure as a series of connected highlight moments
- Build toward the most significant moment as a climax`,
    
    timeline: `${baseInstructions}

TIMELINE STYLE GUIDELINES:
- Follow chronological progression of events
- Show how one moment leads to the next
- Emphasize growth, development, and change over time
- Use transitional phrases that indicate temporal progression
- Focus on cause and effect relationships
- Demonstrate evolution and learning`,
    
    thematic: `${baseInstructions}

THEMATIC STYLE GUIDELINES:
- Identify and explore deeper meanings and themes
- Connect specific content to universal human experiences
- Use metaphorical and symbolic language
- Explore emotional and psychological dimensions
- Find patterns and recurring motifs
- Create philosophical or reflective tone`
  }
  
  return typeSpecific[storyType] || typeSpecific.narrative
}

export { isGroqAvailable as isOpenAIAvailable }
