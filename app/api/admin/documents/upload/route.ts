import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { processDocument } from '@/lib/documentProcessor'
import { chunkText } from '@/lib/textUtils'
import { saveDocument, uploadToBlob, type Document } from '@/lib/documentManager'
import { validateFile } from '@/lib/inputValidator'
import { fileUploadRateLimit, getClientIp } from '@/lib/rateLimit'

export const runtime = 'nodejs'

// Body size limit is configured in next.config.js
// Max upload size: 20MB
export const maxDuration = 60 // 60 seconds

export async function POST(req: NextRequest) {
  try {
    // Check authentication
    const session = await auth()
    if (!session?.user || (session.user as any).role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // SECURITY: Rate limiting for file uploads (5 uploads per 10 minutes)
    const ip = getClientIp(req)
    const { success, reset } = await fileUploadRateLimit.limit(ip)

    if (!success) {
      const retryAfter = Math.ceil((reset - Date.now()) / 1000)
      console.warn(`[Upload] Rate limit exceeded for IP: ${ip}`)
      return new NextResponse(
        JSON.stringify({
          error: 'Too Many Uploads',
          message:
            'Quá nhiều file upload. Vui lòng thử lại sau. / Too many file uploads. Please try again later.',
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

    const formData = await req.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // SECURITY: Enhanced file validation (MIME type, size, sanitization)
    const validation = validateFile(file, {
      maxSizeBytes: 20 * 1024 * 1024, // 20MB
      allowedTypes: ['pdf', 'txt', 'docx', 'doc'],
    })

    if (!validation.isValid) {
      console.warn(`[Upload] Invalid file from IP: ${ip}`, {
        error: validation.error,
        fileName: file.name,
        fileSize: file.size,
        mimeType: file.type,
      })
      return NextResponse.json({ error: validation.error }, { status: 400 })
    }

    // Process document (extract text)
    const extracted = await processDocument(file)

    // Chunk text for embeddings
    const chunks = chunkText(extracted.text)

    // Upload to Blob if file is large (>4.5MB)
    let blobUrl: string | undefined
    if (file.size > 4.5 * 1024 * 1024) {
      blobUrl = await uploadToBlob(file)
    }

    // Create document object with sanitized filename
    const sanitizedFileName = validation.sanitized || file.name
    const document: Document = {
      id: `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      fileName: sanitizedFileName,
      fileType: extracted.metadata.fileType,
      fileSize: file.size,
      status: 'draft',
      uploadedAt: Date.now(),
      uploadedBy: session.user.email || 'admin',
      extractedText: extracted.text,
      chunks,
      metadata: {
        pageCount: extracted.metadata.pageCount,
        wordCount: extracted.metadata.wordCount,
      },
      blobUrl,
    }

    // Save to Vercel KV
    await saveDocument(document)

    // Calculate cost estimate for embeddings
    // OpenAI text-embedding-3-small: $0.00002 per 1K tokens
    // Average chunk is ~500 tokens, so ~$0.00001 per chunk
    const estimatedTokens = chunks.length * 500
    const costEstimate = (estimatedTokens / 1000) * 0.00002

    return NextResponse.json({
      success: true,
      document: {
        id: document.id,
        fileName: document.fileName,
        fileType: document.fileType,
        fileSize: document.fileSize,
        status: document.status,
        wordCount: document.metadata.wordCount,
        chunkCount: chunks.length,
        extractedText: extracted.text,
        chunks: chunks.slice(0, 5), // Preview first 5 chunks
        totalChunks: chunks.length,
        costEstimate,
      },
    })
  } catch (error: any) {
    console.error('Document upload error:', error)
    return NextResponse.json({ error: error.message || 'Failed to upload document' }, { status: 500 })
  }
}
