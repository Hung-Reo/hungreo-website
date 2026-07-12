/**
 * Repair videos saved without transcripts.
 *
 * Background: YouTube's get_transcript endpoint started returning HTTP 400
 * around early 2026, so getVideoTranscript() silently returned '' and every
 * video imported after 2025-11-27 was saved without a transcript. The bot
 * then only had title+description to answer from. getVideoTranscript() now
 * downloads the caption track directly; this script backfills the affected
 * videos: re-fetch transcript → delete thin vectors → re-chunk → re-embed.
 *
 * Usage:
 *   npx tsx scripts/repair-video-transcripts.ts --dry-run   # fetch only, no writes
 *   npx tsx scripts/repair-video-transcripts.ts             # full repair
 *
 * Scans all videos and repairs any with an empty EN transcript.
 */
import { config } from 'dotenv'
import { resolve } from 'path'
config({ path: resolve(process.cwd(), '.env.local') })

const DRY_RUN = process.argv.includes('--dry-run')

async function main() {
  const { getAllVideosComplete, getVideo, saveVideo, getVideoTranscript } = await import('../lib/videoManager')
  const { getPineconeIndex } = await import('../lib/pinecone')
  const { createEmbedding } = await import('../lib/openai')
  const { chunkText } = await import('../lib/documentProcessor')

  console.log(DRY_RUN ? '=== DRY RUN (no writes) ===' : '=== LIVE MODE ===')

  const allVideos = await getAllVideosComplete()
  const broken = allVideos.filter(v => !(v.en.transcript || '').trim())
  console.log(`Videos total: ${allVideos.length}, missing transcript: ${broken.length}`)

  const results: Array<{ id: string; status: string; words?: number; vectors?: number }> = []

  for (const stale of broken) {
    const id = stale.id
    console.log(`\n========== ${id} ==========`)
    try {
      // Re-read inside the loop so we never save a stale copy
      const video = await getVideo(id)
      if (!video) {
        results.push({ id, status: 'not-found' })
        continue
      }
      console.log(`  Title: ${video.en.title}`)

      const transcript = await getVideoTranscript(id)
      const words = transcript.split(/\s+/).filter(Boolean).length
      if (!transcript) {
        console.error('  FAIL: transcript still empty (no captions or YouTube blocked)')
        results.push({ id, status: 'no-transcript' })
        continue
      }
      console.log(`  Transcript fetched: ${words} words`)

      if (DRY_RUN) {
        results.push({ id, status: 'dry-run-ok', words })
        continue
      }

      const index = await getPineconeIndex()

      // Delete the old thin vectors before re-embedding
      if (video.pineconeIds && video.pineconeIds.length > 0) {
        await index.deleteMany(video.pineconeIds)
        console.log(`  Deleted ${video.pineconeIds.length} old vectors`)
      }

      // Same formula and metadata as PATCH /api/admin/videos/[id]
      const content = `${video.en.title}\n${video.en.description}\n${transcript}`
      const chunks = chunkText(content, 500, 100)
      console.log(`  Creating ${chunks.length} chunks...`)

      const pineconeIds: string[] = []
      for (let i = 0; i < chunks.length; i++) {
        const embedding = await createEmbedding(chunks[i])
        const vectorId = `video_${video.videoId}_chunk_${i}`
        await index.upsert([
          {
            id: vectorId,
            values: embedding,
            metadata: {
              title: video.en.title,
              content: chunks[i],
              description: chunks[i],
              type: 'video',
              vectorType: 'video',
              category: video.category,
              videoId: video.videoId,
              channelTitle: video.channelTitle,
              chunkIndex: i,
              totalChunks: chunks.length,
            },
          },
        ])
        pineconeIds.push(vectorId)
        process.stdout.write(`  vector ${i + 1}/${chunks.length}\r`)
      }
      console.log(`\n  Upserted ${pineconeIds.length} vectors`)

      video.en.transcript = transcript
      video.pineconeIds = pineconeIds
      await saveVideo(video)
      console.log(`  Saved to KV: transcript (${words} words) + ${pineconeIds.length} pineconeIds`)

      results.push({ id, status: 'repaired', words, vectors: pineconeIds.length })
    } catch (e: any) {
      console.error(`  ERROR:`, e.message)
      results.push({ id, status: 'error: ' + e.message.slice(0, 60) })
    }
  }

  console.log('\n=== SUMMARY ===')
  console.table(results)
}

main().catch(e => {
  console.error(e)
  process.exit(1)
})
