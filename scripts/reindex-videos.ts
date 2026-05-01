/**
 * Re-index all videos into the current Pinecone index (v2, 3072 dims).
 * - Deletes old vectors from v2 (if any)
 * - Re-creates embeddings from stored transcript/description using text-embedding-3-large
 *
 * Usage: npx tsx scripts/reindex-videos.ts
 */
import { config } from 'dotenv'
import { resolve } from 'path'
config({ path: resolve(process.cwd(), '.env.local') })

import { createClient } from '@vercel/kv'
import { Pinecone } from '@pinecone-database/pinecone'
import OpenAI from 'openai'

const kv = createClient({ url: process.env.KV_REST_API_URL!, token: process.env.KV_REST_API_TOKEN! })
const pinecone = new Pinecone({ apiKey: process.env.PINECONE_API_KEY! })
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! })
const EMBEDDING_MODEL = process.env.OPENAI_EMBEDDING_MODEL ?? 'text-embedding-3-large'
const INDEX_NAME = process.env.PINECONE_INDEX_NAME!

console.log('\n=== Re-index Videos → Pinecone v2 ===')
console.log(`Index : ${INDEX_NAME}`)
console.log(`Model : ${EMBEDDING_MODEL}`)
console.log('======================================\n')

function chunkText(text: string, maxWords = 500): string[] {
  const words = text.split(/\s+/).filter(Boolean)
  const chunks: string[] = []
  for (let i = 0; i < words.length; i += maxWords) {
    chunks.push(words.slice(i, i + maxWords).join(' '))
  }
  return chunks.length > 0 ? chunks : [text]
}

async function main() {
  const index = pinecone.index(INDEX_NAME)

  // Get actual dimension
  const { dimension = 3072 } = await index.describeIndexStats()
  console.log(`Index dimension: ${dimension}\n`)

  const videoIds = await kv.zrange('videos:all', 0, -1)
  console.log(`Found ${videoIds.length} videos in KV\n`)

  let totalVectors = 0
  let skipped = 0

  for (const videoId of videoIds) {
    const video: any = await kv.get(`video:${videoId}`)
    if (!video) {
      console.log(`⚠️  ${videoId}: not found in KV, skipping`)
      skipped++
      continue
    }

    // Video structure: bilingual with video.en.title / video.en.transcript / video.vi.*
    const en = video.en || {}
    const title = en.title || video.title || String(videoId)
    const description = en.description || video.description || ''
    const transcript = en.transcript || video.transcript || ''
    const tags = Array.isArray(video.tags) ? video.tags.join(', ') : ''

    const fullText = transcript
      ? `${title}\n\n${transcript}`
      : `${title}\n\n${description}\n\nTags: ${tags}`.trim()

    if (!fullText.trim() || fullText.length < 10) {
      console.log(`⚠️  ${videoId} (${title}): no text content, skipping`)
      skipped++
      continue
    }

    const chunks = chunkText(fullText)
    console.log(`📹 ${videoId} | "${String(title).substring(0, 50)}"`)
    console.log(`   Chunks: ${chunks.length} | Text: ${fullText.split(/\s+/).length} words`)

    // Delete existing vectors for this video from v2
    if (video.pineconeIds?.length > 0) {
      try {
        await index.deleteMany(video.pineconeIds)
        console.log(`   Deleted ${video.pineconeIds.length} old vectors`)
      } catch {
        console.log(`   (No old vectors to delete in v2)`)
      }
    }

    // Create new embeddings and upsert
    const newPineconeIds: string[] = []
    for (let i = 0; i < chunks.length; i++) {
      process.stdout.write(`   Embedding chunk ${i + 1}/${chunks.length}...`)
      const response = await openai.embeddings.create({ model: EMBEDDING_MODEL, input: chunks[i] })
      const embedding = response.data[0].embedding

      const vectorId = `video_${videoId}_chunk_${i}`
      await index.upsert([{
        id: vectorId,
        values: embedding,
        metadata: {
          type: 'video',
          vectorType: 'video',
          videoId: String(videoId),
          title: String(title),
          description: String(description).substring(0, 500),
          content: chunks[i],
          chunkIndex: i,
          totalChunks: chunks.length,
          tags: tags,
          url: `https://youtube.com/watch?v=${videoId}`,
        },
      }])
      newPineconeIds.push(vectorId)
      process.stdout.write(` ✓ (${embedding.length} dims)\n`)
    }

    // Update pineconeIds in KV
    await kv.set(`video:${videoId}`, { ...video, pineconeIds: newPineconeIds })
    console.log(`   ✅ ${newPineconeIds.length} vectors upserted\n`)
    totalVectors += newPineconeIds.length
  }

  console.log('=== Done ===')
  console.log(`Videos processed : ${videoIds.length - skipped}`)
  console.log(`Videos skipped   : ${skipped}`)
  console.log(`Total vectors    : ${totalVectors}`)
}

main().catch(err => {
  console.error('Error:', err)
  process.exit(1)
})
