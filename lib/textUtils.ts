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
 * - Minimum chunk size: 100 words (small chunks merged into previous chunk)
 */
export function chunkText(text: string, maxTokens: number = 200, overlap: number = 50): string[] {
  const words = text.split(/\s+/).filter(w => w.trim())
  const chunks: string[] = []
  const wordsPerChunk = maxTokens // Approximate: 1 token ≈ 1 word for English
  const step = wordsPerChunk - overlap
  const minChunkSize = 100 // Minimum words for a valid chunk

  for (let i = 0; i < words.length; i += step) {
    const chunk = words.slice(i, i + wordsPerChunk).join(' ')

    if (chunk.trim()) {
      const chunkWordCount = chunk.split(/\s+/).filter(w => w.trim()).length

      // If this is the last chunk and it's too small, merge with previous chunk
      if (i + wordsPerChunk >= words.length && chunkWordCount < minChunkSize && chunks.length > 0) {
        // Merge with previous chunk
        const prevChunk = chunks[chunks.length - 1]
        const mergedChunk = words.slice(i - step, words.length).join(' ')
        chunks[chunks.length - 1] = mergedChunk
      } else {
        chunks.push(chunk)
      }
    }
  }

  return chunks
}
