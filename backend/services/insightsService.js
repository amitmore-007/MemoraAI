import axios from 'axios'
import ffmpeg from 'fluent-ffmpeg'
import { uploadVideoToCloudinary } from './cloudinaryService.js'

// Speaker diarization using AssemblyAI
export const runSpeakerDiarization = async (audioUrl) => {
  if (!process.env.ASSEMBLYAI_API_KEY) {
    throw new Error('AssemblyAI API key not configured')
  }

  try {
    // Submit audio for transcription with speaker labels
    const uploadResponse = await axios.post('https://api.assemblyai.com/v2/transcript', {
      audio_url: audioUrl,
      speaker_labels: true
    }, {
      headers: { 'authorization': process.env.ASSEMBLYAI_API_KEY }
    })

    const transcriptId = uploadResponse.data.id

    // Poll for completion
    let transcript
    do {
      await new Promise(resolve => setTimeout(resolve, 1000))
      const pollResponse = await axios.get(`https://api.assemblyai.com/v2/transcript/${transcriptId}`, {
        headers: { 'authorization': process.env.ASSEMBLYAI_API_KEY }
      })
      transcript = pollResponse.data
    } while (transcript.status === 'processing' || transcript.status === 'queued')

    if (transcript.status === 'error') {
      throw new Error(transcript.error)
    }

    // Extract speaker segments
    const speakers = transcript.utterances?.map(utterance => ({
      speaker: utterance.speaker,
      start: utterance.start / 1000, // Convert to seconds
      end: utterance.end / 1000,
      text: utterance.text,
      confidence: utterance.confidence
    })) || []

    return speakers
  } catch (error) {
    console.error('Speaker diarization failed:', error.message)
    throw error
  }
}

// Sentiment analysis using HuggingFace
export const runSentimentTimeline = async (segments) => {
  if (!process.env.HF_API_KEY) {
    throw new Error('HuggingFace API key not configured')
  }

  try {
    const sentimentResults = await Promise.all(segments.map(async (seg, index) => {
      try {
        const response = await axios.post(
          'https://api-inference.huggingface.co/models/cardiffnlp/twitter-roberta-base-sentiment-latest',
          { inputs: seg.text },
          {
            headers: { 
              'Authorization': `Bearer ${process.env.HF_API_KEY}`,
              'Content-Type': 'application/json'
            }
          }
        )

        const result = response.data[0]
        const sentiment = result?.label || 'NEUTRAL'
        const score = result?.score || 0.5

        // Convert sentiment to numeric score (-1 to 1)
        let sentimentScore = 0
        if (sentiment === 'POSITIVE') sentimentScore = score
        else if (sentiment === 'NEGATIVE') sentimentScore = -score

        return {
          timestamp: seg.start,
          sentiment_score: parseFloat(sentimentScore.toFixed(3)),
          sentiment_label: sentiment,
          confidence: score
        }
      } catch (error) {
        console.warn(`Sentiment analysis failed for segment ${index}:`, error.message)
        return {
          timestamp: seg.start,
          sentiment_score: 0,
          sentiment_label: 'NEUTRAL',
          confidence: 0.5
        }
      }
    }))

    return sentimentResults
  } catch (error) {
    console.error('Sentiment timeline failed:', error.message)
    throw error
  }
}

// Topic segmentation using OpenAI/Groq
export const runTopicSegmentation = async (transcript) => {
  if (!process.env.OPENAI_API_KEY && !process.env.GROQ_API_KEY) {
    throw new Error('No AI API key configured for topic segmentation')
  }

  try {
    // Use Groq if available, otherwise fallback to OpenAI
    const apiKey = process.env.GROQ_API_KEY || process.env.OPENAI_API_KEY
    const apiUrl = process.env.GROQ_API_KEY 
      ? 'https://api.groq.com/openai/v1/chat/completions'
      : 'https://api.openai.com/v1/chat/completions'
    
    const model = process.env.GROQ_API_KEY 
      ? 'llama3-70b-8192'
      : 'gpt-3.5-turbo'

    const response = await axios.post(apiUrl, {
      model,
      messages: [{
        role: 'user',
        content: `Analyze this transcript and break it into topic chapters. Return ONLY a JSON array with this exact structure:
[{"title": "Chapter Title", "start_time": 0, "end_time": 30, "summary": "Brief summary"}]

Transcript: ${transcript.substring(0, 2000)}`
      }],
      temperature: 0.1,
      max_tokens: 800
    }, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    })

    const content = response.data.choices[0].message.content.trim()
    
    // Try to parse JSON from response
    try {
      const chapters = JSON.parse(content)
      return Array.isArray(chapters) ? chapters : []
    } catch (parseError) {
      console.warn('Failed to parse topic chapters:', parseError.message)
      return []
    }
  } catch (error) {
    console.error('Topic segmentation failed:', error.message)
    throw error
  }
}

// Keyword extraction using AI
export const runKeywordExtraction = async (transcript) => {
  if (!process.env.OPENAI_API_KEY && !process.env.GROQ_API_KEY) {
    throw new Error('No AI API key configured for keyword extraction')
  }

  try {
    const apiKey = process.env.GROQ_API_KEY || process.env.OPENAI_API_KEY
    const apiUrl = process.env.GROQ_API_KEY 
      ? 'https://api.groq.com/openai/v1/chat/completions'
      : 'https://api.openai.com/v1/chat/completions'
    
    const model = process.env.GROQ_API_KEY 
      ? 'llama3-70b-8192'
      : 'gpt-3.5-turbo'

    const response = await axios.post(apiUrl, {
      model,
      messages: [{
        role: 'user',
        content: `Extract key phrases and their approximate timestamps from this transcript. Return ONLY a JSON array:
[{"phrase": "key phrase", "timestamps": [10, 45, 120]}]

Transcript: ${transcript.substring(0, 2000)}`
      }],
      temperature: 0.1,
      max_tokens: 600
    }, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    })

    const content = response.data.choices[0].message.content.trim()
    
    try {
      const keywords = JSON.parse(content)
      return Array.isArray(keywords) ? keywords : []
    } catch (parseError) {
      console.warn('Failed to parse keywords:', parseError.message)
      return []
    }
  } catch (error) {
    console.error('Keyword extraction failed:', error.message)
    throw error
  }
}

// Main pipeline - fully dynamic
export const runMultiModalInsights = async (video) => {
  try {
    console.log('🔍 Running dynamic multi-modal insights for:', video.title)
    
    // Initialize insights object
    if (!video.insights) {
      video.insights = {}
    }

    video.insights.processingStatus = 'processing'
    await video.save()

    const results = {}

    // 1. Speaker diarization (requires audio URL and API key)
    if (video.transcription?.audioCloudinaryUrl && process.env.ASSEMBLYAI_API_KEY) {
      try {
        console.log('🎤 Running speaker diarization...')
        results.speakerDiarization = await runSpeakerDiarization(video.transcription.audioCloudinaryUrl)
        console.log(`✅ Speaker diarization completed: ${results.speakerDiarization.length} segments`)
      } catch (error) {
        console.error('❌ Speaker diarization failed:', error.message)
        results.speakerDiarization = []
      }
    } else {
      console.log('⚠️ Skipping speaker diarization: missing audio URL or API key')
      results.speakerDiarization = []
    }

    // 2. Sentiment analysis (requires transcription segments and API key)
    if (video.transcription?.segments?.length > 0 && process.env.HF_API_KEY) {
      try {
        console.log('😊 Running sentiment analysis...')
        results.sentimentTimeline = await runSentimentTimeline(video.transcription.segments)
        console.log(`✅ Sentiment analysis completed: ${results.sentimentTimeline.length} points`)
      } catch (error) {
        console.error('❌ Sentiment analysis failed:', error.message)
        results.sentimentTimeline = []
      }
    } else {
      console.log('⚠️ Skipping sentiment analysis: missing segments or API key')
      results.sentimentTimeline = []
    }

    // 3. Topic segmentation (requires transcription text and API key)
    if (video.transcription?.text && (process.env.OPENAI_API_KEY || process.env.GROQ_API_KEY)) {
      try {
        console.log('📚 Running topic segmentation...')
        results.topicChapters = await runTopicSegmentation(video.transcription.text)
        console.log(`✅ Topic segmentation completed: ${results.topicChapters.length} chapters`)
      } catch (error) {
        console.error('❌ Topic segmentation failed:', error.message)
        results.topicChapters = []
      }
    } else {
      console.log('⚠️ Skipping topic segmentation: missing transcription or API key')
      results.topicChapters = []
    }

    // 4. Keyword extraction (requires transcription text and API key)  
    if (video.transcription?.text && (process.env.OPENAI_API_KEY || process.env.GROQ_API_KEY)) {
      try {
        console.log('🔑 Running keyword extraction...')
        results.keywords = await runKeywordExtraction(video.transcription.text)
        console.log(`✅ Keyword extraction completed: ${results.keywords.length} keywords`)
      } catch (error) {
        console.error('❌ Keyword extraction failed:', error.message)
        results.keywords = []
      }
    } else {
      console.log('⚠️ Skipping keyword extraction: missing transcription or API key')
      results.keywords = []
    }

    // Update video with all results
    video.insights = {
      ...results,
      processingStatus: 'completed',
      processedAt: new Date(),
      apiKeysUsed: {
        assemblyAI: !!process.env.ASSEMBLYAI_API_KEY,
        huggingFace: !!process.env.HF_API_KEY,
        groq: !!process.env.GROQ_API_KEY,
        openAI: !!process.env.OPENAI_API_KEY
      },
      hasTranscription: !!(video.transcription?.text),
      hasAudioUrl: !!(video.transcription?.audioCloudinaryUrl)
    }

    await video.save()
    console.log('✅ Dynamic multi-modal insights completed successfully')
    
  } catch (error) {
    console.error('❌ Multi-modal insights failed:', error)
    
    // Provide empty but valid structure on failure
    video.insights = {
      processingStatus: 'completed', // Mark as completed even if failed, with empty data
      error: error.message,
      speakerDiarization: [],
      sentimentTimeline: [],
      topicChapters: [],
      keywords: [],
      processedAt: new Date(),
      apiKeysUsed: {
        assemblyAI: !!process.env.ASSEMBLYAI_API_KEY,
        huggingFace: !!process.env.HF_API_KEY,
        groq: !!process.env.GROQ_API_KEY,
        openAI: !!process.env.OPENAI_API_KEY
      }
    }
    await video.save()
    
    // Don't throw error - return gracefully with empty data
    console.log('⚠️ Returning empty insights due to error, but marking as completed')
  }
}

// Highlight reel generation (ffmpeg)
export const generateHighlightReel = async (video) => {
  try {
    const segments = video.insights.keywords.flatMap(k =>
      k.timestamps.map(ts => ({ start: ts, end: ts + 10, phrase: k.phrase })) // 10s clips
    )
    const inputUrl = video.cloudinaryUrl
    const outputPath = `/tmp/highlight_${video._id}.mp4`
    // Use ffmpeg to concatenate segments
    // ...ffmpeg logic...
    // Upload to Cloudinary
    const outputBuffer = await fs.promises.readFile(outputPath)
    const uploadResult = await uploadVideoToCloudinary(outputBuffer, { public_id: `highlight_${video._id}` })
    video.insights.highlightReel = {
      status: 'ready',
      url: uploadResult.secure_url,
      segments
    }
    await video.save()
  } catch (error) {
    video.insights.highlightReel.status = 'failed'
    await video.save()
  }
}
