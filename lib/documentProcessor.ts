/**
 * Document processing utilities
 * Handles PDF, TXT, and DOCX file extraction
 */

import mammoth from 'mammoth'
import { extractText, getDocumentProxy } from 'unpdf'

export interface ExtractedDocument {
  text: string
  metadata: {
    fileName: string
    fileType: string
    fileSize: number
    pageCount?: number
    wordCount: number
  }
}

/**
 * Extract text from PDF file using unpdf
 * unpdf is compatible with Next.js and edge runtime
 */
export async function extractPDF(buffer: Buffer, fileName: string, fileSize: number): Promise<ExtractedDocument> {
  try {
    // Convert Buffer to Uint8Array for unpdf
    const uint8Array = new Uint8Array(buffer)

    // Extract text using unpdf
    const { text, totalPages } = await extractText(uint8Array, { mergePages: true })

    return {
      text,
      metadata: {
        fileName,
        fileType: 'pdf',
        fileSize,
        pageCount: totalPages,
        wordCount: text.split(/\s+/).filter(w => w.length > 0).length,
      },
    }
  } catch (error) {
    console.error('PDF extraction error:', error)
    throw new Error(`Failed to extract PDF: ${error}`)
  }
}

/**
 * Extract text from DOCX file
 */
export async function extractDOCX(buffer: Buffer, fileName: string, fileSize: number): Promise<ExtractedDocument> {
  try {
    const result = await mammoth.extractRawText({ buffer })

    return {
      text: result.value,
      metadata: {
        fileName,
        fileType: 'docx',
        fileSize,
        wordCount: result.value.split(/\s+/).length,
      },
    }
  } catch (error) {
    throw new Error(`Failed to extract DOCX: ${error}`)
  }
}

/**
 * Extract text from TXT file
 */
export async function extractTXT(buffer: Buffer, fileName: string, fileSize: number): Promise<ExtractedDocument> {
  try {
    const text = buffer.toString('utf-8')

    return {
      text,
      metadata: {
        fileName,
        fileType: 'txt',
        fileSize,
        wordCount: text.split(/\s+/).length,
      },
    }
  } catch (error) {
    throw new Error(`Failed to extract TXT: ${error}`)
  }
}

/**
 * Process document based on file type
 */
export async function processDocument(file: File): Promise<ExtractedDocument> {
  const buffer = Buffer.from(await file.arrayBuffer())
  const extension = file.name.split('.').pop()?.toLowerCase()

  switch (extension) {
    case 'pdf':
      return extractPDF(buffer, file.name, file.size)
    case 'docx':
    case 'doc':
      return extractDOCX(buffer, file.name, file.size)
    case 'txt':
      return extractTXT(buffer, file.name, file.size)
    default:
      throw new Error(`Unsupported file type: ${extension}`)
  }
}

/**
 * Chunk text into smaller pieces for embeddings
 * Uses 512-token chunks with 50-token overlap
 */
export function chunkText(text: string, maxTokens: number = 512, overlap: number = 50): string[] {
  const words = text.split(/\s+/)
  const chunks: string[] = []
  const wordsPerChunk = maxTokens // Approximate: 1 token ≈ 1 word for English
  const step = wordsPerChunk - overlap

  for (let i = 0; i < words.length; i += step) {
    const chunk = words.slice(i, i + wordsPerChunk).join(' ')
    if (chunk.trim()) {
      chunks.push(chunk)
    }
  }

  return chunks
}

/**
 * Validate file before processing
 */
export function validateFile(file: File): { valid: boolean; error?: string } {
  const MAX_SIZE = 20 * 1024 * 1024 // 20MB
  const ALLOWED_TYPES = ['pdf', 'txt', 'docx', 'doc']

  const extension = file.name.split('.').pop()?.toLowerCase()

  if (!extension || !ALLOWED_TYPES.includes(extension)) {
    return {
      valid: false,
      error: `Invalid file type. Allowed: ${ALLOWED_TYPES.join(', ')}`,
    }
  }

  if (file.size > MAX_SIZE) {
    return {
      valid: false,
      error: `File too large. Maximum size: 20MB`,
    }
  }

  return { valid: true }
}
