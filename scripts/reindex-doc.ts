/**
 * Re-index an approved document into the current Pinecone index.
 * Reads env from .env.local, works independently of the Next.js server.
 *
 * Usage: npx tsx scripts/reindex-doc.ts
 */
import { config } from 'dotenv'
import { resolve } from 'path'

config({ path: resolve(process.cwd(), '.env.local') })

import { Pinecone } from '@pinecone-database/pinecone'
import OpenAI from 'openai'
import { createClient } from '@vercel/kv'

const KV_URL = process.env.KV_REST_API_URL!
const KV_TOKEN = process.env.KV_REST_API_TOKEN!
const PINECONE_API_KEY = process.env.PINECONE_API_KEY!
const PINECONE_INDEX_NAME = process.env.PINECONE_INDEX_NAME!
const OPENAI_API_KEY = process.env.OPENAI_API_KEY!
const EMBEDDING_MODEL = process.env.OPENAI_EMBEDDING_MODEL ?? 'text-embedding-3-large'

console.log(`\n=== Re-index Document Script ===`)
console.log(`Pinecone index: ${PINECONE_INDEX_NAME}`)
console.log(`Embedding model: ${EMBEDDING_MODEL}`)

const kv = createClient({ url: KV_URL, token: KV_TOKEN })
const openai = new OpenAI({ apiKey: OPENAI_API_KEY })
const pinecone = new Pinecone({ apiKey: PINECONE_API_KEY })

async function main() {
  const index = pinecone.index(PINECONE_INDEX_NAME)

  // Get all document IDs from KV
  const docIds: string[] = await kv.smembers('docs:approved')
  console.log(`\nApproved documents in KV: ${docIds.length}`)

  if (docIds.length === 0) {
    // Fallback: check docs:all
    const allIds: string[] = await kv.zrange('docs:all', 0, -1)
    console.log(`No approved docs found. All docs in KV: ${allIds.length}`)
    if (allIds.length > 0) console.log('IDs:', allIds)
    return
  }

  for (const docId of docIds) {
    const doc: any = await kv.get(`doc:${docId}`)
    if (!doc) {
      console.log(`  Skipping ${docId} — not found in KV`)
      continue
    }

    const chunks: string[] = Array.isArray(doc.chunks)
      ? doc.chunks
      : (typeof doc.chunks === 'string' ? JSON.parse(doc.chunks) : [])

    console.log(`\nDocument: ${doc.fileName}`)
    console.log(`  ID: ${docId}`)
    console.log(`  Chunks: ${chunks.length}`)

    if (chunks.length === 0) {
      console.log('  No chunks found, skipping.')
      continue
    }

    const pineconeIds: string[] = []

    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i]
      process.stdout.write(`  Embedding chunk ${i + 1}/${chunks.length}...`)

      const response = await openai.embeddings.create({
        model: EMBEDDING_MODEL,
        input: chunk,
      })
      const embedding = response.data[0].embedding

      const vectorId = `${docId}_chunk_${i}`
      await index.upsert([{
        id: vectorId,
        values: embedding,
        metadata: {
          title: doc.fileName,
          content: chunk,
          description: chunk.substring(0, 500),
          type: 'document',
          vectorType: 'document',
          fileType: doc.fileType,
          chunkIndex: i,
          totalChunks: chunks.length,
          documentId: docId,
          uploadedAt: doc.uploadedAt,
          uploadedBy: doc.uploadedBy,
        },
      }])

      pineconeIds.push(vectorId)
      process.stdout.write(` done (${embedding.length} dims)\n`)
    }

    // Update pineconeIds in KV
    // Update pineconeIds in KV (merge into existing doc object)
    await kv.set(`doc:${docId}`, { ...doc, pineconeIds })
    console.log(`  ✓ ${pineconeIds.length} vectors upserted to ${PINECONE_INDEX_NAME}`)
  }

  console.log('\n=== Done ===\n')
}

main().catch(err => {
  console.error('Error:', err)
  process.exit(1)
})
