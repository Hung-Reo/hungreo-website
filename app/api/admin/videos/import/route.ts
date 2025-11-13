import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { batchImportVideos, type VideoCategory, extractVideoId } from '@/lib/videoManager'
import { getPineconeIndex } from '@/lib/pinecone'
import { createEmbedding } from '@/lib/openai'
import { chunkText } from '@/lib/documentProcessor'
import { validateUrl, validateYouTubeVideoId } from '@/lib/inputValidator'
import { adminApiRateLimit, getClientIp } from '@/lib/rateLimit'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  try {
    // Check authentication
    const session = await auth()
    if (!session?.user || (session.user as any).role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // SECURITY: Rate limiting for admin API (30 req/min)
    const ip = getClientIp(req)
    const { success, reset } = await adminApiRateLimit.limit(ip)

    if (!success) {
      const retryAfter = Math.ceil((reset - Date.now()) / 1000)
      console.warn(`[VideoImport] Rate limit exceeded for IP: ${ip}`)
      return new NextResponse(
        JSON.stringify({
          error: 'Too Many Requests',
          message: 'Quá nhiều yêu cầu. Vui lòng thử lại sau. / Too many requests. Please try again later.',
          retryAfter,
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': retryAfter.toString(),
          },
        }
      )
    }

    const { urls, category, generateEmbeddings } = await req.json()

    if (!urls || !Array.isArray(urls) || urls.length === 0) {
      return NextResponse.json({ error: 'URLs array is required' }, { status: 400 })
    }

    // Limit batch size to prevent abuse
    if (urls.length > 50) {
      return NextResponse.json(
        { error: 'Too many URLs. Maximum 50 videos per batch.' },
        { status: 400 }
      )
    }

    if (!category) {
      return NextResponse.json({ error: 'Category is required' }, { status: 400 })
    }

    // SECURITY: Validate all URLs before processing
    const validationErrors: Array<{ url: string; error: string }> = []

    for (const url of urls) {
      // Validate URL format and ensure it's a YouTube URL
      const urlValidation = validateUrl(url, ['youtube.com', 'youtu.be'])

      if (!urlValidation.isValid) {
        validationErrors.push({ url, error: urlValidation.error! })
        continue
      }

      // Extract and validate video ID
      const videoId = extractVideoId(url)

      if (!videoId) {
        validationErrors.push({
          url,
          error: 'Could not extract video ID from URL',
        })
        continue
      }

      const videoIdValidation = validateYouTubeVideoId(videoId)

      if (!videoIdValidation.isValid) {
        validationErrors.push({
          url,
          error: `Invalid video ID: ${videoIdValidation.error}`,
        })
      }
    }

    // If all URLs failed validation, return error
    if (validationErrors.length === urls.length) {
      console.warn(`[VideoImport] All URLs invalid from IP: ${ip}`, validationErrors)
      return NextResponse.json(
        {
          error: 'All URLs are invalid',
          validationErrors,
        },
        { status: 400 }
      )
    }

    // Log validation warnings if some URLs failed
    if (validationErrors.length > 0) {
      console.warn(`[VideoImport] Some URLs invalid from IP: ${ip}`, validationErrors)
    }

    // Import videos (batchImportVideos will skip invalid URLs internally as well)
    const result = await batchImportVideos(urls, category as VideoCategory, session.user.email || 'admin')

    // Generate embeddings if requested
    if (generateEmbeddings && result.success > 0) {
      // This will be handled in a separate API call or background job
      // For now, we'll skip automatic embedding generation during import
    }

    return NextResponse.json({
      success: true,
      result,
    })
  } catch (error: any) {
    console.error('Video import error:', error)
    return NextResponse.json({ error: error.message || 'Failed to import videos' }, { status: 500 })
  }
}
