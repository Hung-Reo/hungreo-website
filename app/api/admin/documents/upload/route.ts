import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { processDocument } from '@/lib/documentProcessor'
import { chunkText } from '@/lib/textUtils'
import { saveDocument, uploadToBlob, type Document } from '@/lib/documentManager'
import { validateUpload } from '@/lib/uploadValidator'
import { fileUploadRateLimit, getClientIp } from '@/lib/rateLimit'
import { createJob, emitProgress, appendLog, completeJob, failJob } from '@/lib/jobTracker'

export const runtime = 'nodejs'

// Body size limit is configured in next.config.js
// Max upload size: 20MB
export const maxDuration = 60 // 60 seconds

export async function POST(req: NextRequest) {
  const jobId = `doc-upload-${Date.now()}`

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

    // Create job tracker with 5 steps
    await createJob(jobId, 'document-upload', 5)
    await appendLog(jobId, 'info', `Starting upload for ${file.name}`)

    // Step 1: File validation (5%)
    await emitProgress(jobId, `Validating ${file.name}...`, 1, 5)

    // SECURITY: Enhanced file validation (MIME type, size, sanitization)
    const validation = validateUpload(file, 'document')

    if (!validation.valid) {
      console.warn(`[Upload] Invalid file from IP: ${ip}`, {
        error: validation.error,
        fileName: file.name,
        fileSize: file.size,
        mimeType: file.type,
      })
      await failJob(jobId, validation.error || 'Invalid file')
      return NextResponse.json({ error: validation.error }, { status: 400 })
    }

    await appendLog(jobId, 'info', 'File validation passed')

    // Step 2: Process document (extract text) - 30%
    await emitProgress(jobId, `Extracting text from ${file.name}...`, 2, 5)

    const extracted = await processDocument(file)
    await appendLog(jobId, 'info', `Extracted ${extracted.metadata.wordCount} words from ${file.name}`)

    // Step 3: Chunk text for embeddings - 10%
    await emitProgress(jobId, 'Creating text chunks...', 3, 5)

    const chunks = chunkText(extracted.text)
    await appendLog(jobId, 'info', `Created ${chunks.length} chunks`)

    // Step 4: Upload to Blob if needed - 20%
    await emitProgress(jobId, 'Saving file...', 4, 5)

    let blobUrl: string | undefined
    if (file.size > 4.5 * 1024 * 1024) {
      await appendLog(jobId, 'info', 'Uploading to blob storage (large file)')
      blobUrl = await uploadToBlob(file)
    }

    // Create document object with sanitized filename
    const sanitizedFileName = validation.sanitizedName
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

    // Step 5: Save to Vercel KV - 35%
    await emitProgress(jobId, 'Finalizing document...', 5, 5)
    await saveDocument(document)
    await appendLog(jobId, 'info', 'Document saved successfully')

    // Calculate cost estimate for embeddings
    // OpenAI text-embedding-3-small: $0.00002 per 1K tokens
    // Average chunk is ~500 tokens, so ~$0.00001 per chunk
    const estimatedTokens = chunks.length * 500
    const costEstimate = (estimatedTokens / 1000) * 0.00002

    await completeJob(jobId, {
      documentId: document.id,
      fileName: document.fileName,
      wordCount: document.metadata.wordCount,
      chunks: chunks.length,
    })

    return NextResponse.json({
      success: true,
      jobId,
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
    await failJob(jobId, error.message || 'Failed to upload document')
    return NextResponse.json({ error: error.message || 'Failed to upload document' }, { status: 500 })
  }
}
