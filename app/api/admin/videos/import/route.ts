import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { batchImportVideos, type VideoCategory } from '@/lib/videoManager'
import { getPineconeIndex } from '@/lib/pinecone'
import { createEmbedding } from '@/lib/openai'
import { chunkText } from '@/lib/documentProcessor'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  try {
    // Check authentication
    const session = await auth()
    if (!session?.user || (session.user as any).role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { urls, category, generateEmbeddings } = await req.json()

    if (!urls || !Array.isArray(urls) || urls.length === 0) {
      return NextResponse.json({ error: 'URLs array is required' }, { status: 400 })
    }

    if (!category) {
      return NextResponse.json({ error: 'Category is required' }, { status: 400 })
    }

    // Import videos
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
