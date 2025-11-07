import { NextRequest, NextResponse } from 'next/server'
import { getOpenAIClient } from '@/lib/openai'
import axios from 'axios'

// Use Node.js runtime for better compatibility
export const runtime = 'nodejs'

interface TranscriptSegment {
  text: string
  start: number
  duration: number
}

// Function to extract video ID from YouTube URL
function extractVideoId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/,
    /youtube\.com\/embed\/([^&\n?#]+)/,
  ]

  for (const pattern of patterns) {
    const match = url.match(pattern)
    if (match) return match[1]
  }

  return null
}

// Function to get video metadata
async function getVideoMetadata(videoId: string) {
  const apiKey = process.env.YOUTUBE_API_KEY

  if (!apiKey) {
    throw new Error('YouTube API key not configured')
  }

  const response = await axios.get(
    `https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails&id=${videoId}&key=${apiKey}`
  )

  const video = response.data.items?.[0]

  if (!video) {
    throw new Error('Video not found')
  }

  return {
    title: video.snippet.title,
    description: video.snippet.description,
    channelTitle: video.snippet.channelTitle,
    publishedAt: video.snippet.publishedAt,
    duration: video.contentDetails.duration,
  }
}

// Function to get transcript (using YouTube Transcript API alternative)
// Note: For production, you might want to use youtube-transcript package or similar
async function getTranscript(videoId: string): Promise<string> {
  // For now, we'll use video description as fallback
  // In production, you should integrate with youtube-transcript or similar service
  const metadata = await getVideoMetadata(videoId)
  return metadata.description
}

export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json()

    if (!url) {
      return NextResponse.json({ error: 'YouTube URL is required' }, { status: 400 })
    }

    // Extract video ID
    const videoId = extractVideoId(url)

    if (!videoId) {
      return NextResponse.json({ error: 'Invalid YouTube URL' }, { status: 400 })
    }

    // Get video metadata
    const metadata = await getVideoMetadata(videoId)

    // Get transcript (or use description as fallback)
    const transcript = await getTranscript(videoId)

    // Generate summary with OpenAI
    const openai = getOpenAIClient()

    const prompt = `Summarize the following YouTube video content in Vietnamese. Include:
1. Main topic/theme
2. Key points (3-5 bullet points)
3. Conclusion or takeaway

Video Title: ${metadata.title}
Channel: ${metadata.channelTitle}
Content: ${transcript}

Please provide a concise, informative summary.`

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content:
            'You are a helpful assistant that summarizes YouTube videos in Vietnamese. Provide clear, concise summaries.',
        },
        { role: 'user', content: prompt },
      ],
      temperature: 0.7,
      max_tokens: 1000,
    })

    const summary = response.choices[0].message.content

    return NextResponse.json({
      success: true,
      videoId,
      metadata,
      summary,
    })
  } catch (error: any) {
    console.error('YouTube API error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to process YouTube video' },
      { status: 500 }
    )
  }
}
