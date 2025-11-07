import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { processDocument, chunkText, validateFile } from '@/lib/documentProcessor'
import { saveDocument, uploadToBlob, type Document } from '@/lib/documentManager'

export const runtime = 'nodejs'

// Increase upload size limit
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '20mb',
    },
  },
}

export async function POST(req: NextRequest) {
  try {
    // Check authentication
    const session = await auth()
    if (!session?.user || (session.user as any).role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await req.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Validate file
    const validation = validateFile(file)
    if (!validation.valid) {
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

    // Create document object
    const document: Document = {
      id: `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      fileName: file.name,
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
      },
    })
  } catch (error: any) {
    console.error('Document upload error:', error)
    return NextResponse.json({ error: error.message || 'Failed to upload document' }, { status: 500 })
  }
}
