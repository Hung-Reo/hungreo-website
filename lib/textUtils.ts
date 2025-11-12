/**
 * Text utility functions
 * Shared utilities for text processing without heavy dependencies
 */

/**
 * Split text into chunks with overlap
 * Used for embedding and processing large texts
 *
 * Optimized chunk size: 200 words for better RAG retrieval accuracy
 * - Smaller chunks = more precise context matching
 * - 50-word overlap ensures continuity and prevents information loss
 */
export function chunkText(text: string, maxTokens: number = 200, overlap: number = 50): string[] {
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
