import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { put } from '@vercel/blob'
import {
  extractTextFromFile,
  detectLanguage,
  parseProject,
} from '@/lib/projectParser'

/**
 * POST /api/admin/content/projects/upload
 * Upload project document (PDF/DOCX) and extract with AI
 */
export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user || (session.user as any).role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    console.log('[Project Upload] Starting upload process...')

    const formData = await req.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 })
    }

    // Validate file type
    const fileName = file.name
    if (!fileName.endsWith('.pdf') && !fileName.endsWith('.docx')) {
      return NextResponse.json(
        { error: 'Invalid file type. Only PDF and DOCX are supported.' },
        { status: 400 }
      )
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'File too large. Maximum size is 10MB.' },
        { status: 400 }
      )
    }

    console.log(`[Project Upload] File: ${fileName}, Size: ${file.size} bytes`)

    // Upload to Vercel Blob (optional: for record keeping)
    console.log('[Project Upload] Uploading to Vercel Blob...')
    const blob = await put(`projects/${Date.now()}-${fileName}`, file, {
      access: 'public',
    })
    console.log(`[Project Upload] ✅ Uploaded to: ${blob.url}`)

    // Extract text
    console.log('[Project Upload] Extracting text...')
    const text = await extractTextFromFile(blob.url, fileName)

    if (!text || text.trim().length < 100) {
      return NextResponse.json(
        { error: 'Failed to extract text from file. File may be empty or corrupted.' },
        { status: 400 }
      )
    }

    console.log(`[Project Upload] ✅ Extracted ${text.length} characters`)

    // Detect language
    console.log('[Project Upload] Detecting language...')
    const detectedLanguage = await detectLanguage(text)
    console.log(`[Project Upload] ✅ Detected language: ${detectedLanguage}`)

    // Parse with AI
    console.log('[Project Upload] Parsing project with AI...')
    const parsed = await parseProject(text, detectedLanguage)

    console.log('[Project Upload] ✅ Success! Project parsed.')

    return NextResponse.json({
      success: true,
      source: {
        type: 'upload',
        fileName,
        rawContent: text,
      },
      parsedData: parsed,
      detectedLanguage,
    })
  } catch (error) {
    console.error('[Project Upload] Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to process file' },
      { status: 500 }
    )
  }
}
