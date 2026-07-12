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
 *   npx tsx scripts/repair-video-transcripts.ts
 *   npx tsx scripts/repair-video-transcripts.ts --video-id=<youtube-id>
 *   npx tsx scripts/repair-video-transcripts.ts --apply \
 *     --environment=production --video-id=<youtube-id>
 *
 * Scans all videos and repairs any with an empty EN transcript.
 */
import { config } from 'dotenv'
import { resolve } from 'path'
import {
  parseRepairArguments,
  validateTranscript,
} from '../lib/videoVectorLifecycle'
config({ path: resolve(process.cwd(), '.env.local') })

const repairArguments = parseRepairArguments(process.argv.slice(2))
const DRY_RUN = !repairArguments.apply

async function main() {
  const { getAllVideosComplete, getVideo, saveVideo, getVideoTranscriptResult } = await import('../lib/videoManager')
  const { replaceVideoEmbeddings } = await import('../lib/videoEmbeddingManager')

  console.log(DRY_RUN ? '=== DRY RUN (no writes) ===' : '=== LIVE MODE ===')
  if (!DRY_RUN) {
    const kvUrl = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL
    if (!process.env.PINECONE_INDEX_NAME || !kvUrl) {
      throw new Error('Pinecone/KV target configuration is incomplete')
    }
    console.log(`Target environment: ${repairArguments.environment}`)
    console.log(`Target video: ${repairArguments.videoId}`)
    console.log(`Target Pinecone index: ${process.env.PINECONE_INDEX_NAME}`)
    console.log(`Target KV host: ${new URL(kvUrl).hostname}`)
  }

  const allVideos = await getAllVideosComplete()
  const missingTranscript = allVideos.filter(v => !(v.en.transcript || '').trim())
  const broken = repairArguments.videoId
    ? missingTranscript.filter(
        (video) =>
          video.id === repairArguments.videoId ||
          video.videoId === repairArguments.videoId
      )
    : missingTranscript
  console.log(`Videos total: ${allVideos.length}, missing transcript: ${broken.length}`)

  if (DRY_RUN && !repairArguments.videoId) {
    console.table(
      broken.map((video) => ({
        id: video.videoId,
        title: video.en.title,
        status: video.transcriptStatus || 'unknown',
      }))
    )
    console.log('Audit only. Add --video-id=<youtube-id> to test transcript fetching.')
    return
  }

  if (repairArguments.videoId && broken.length === 0) {
    throw new Error(
      `Target video ${repairArguments.videoId} was not found or already has a transcript`
    )
  }

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

      let transcriptResult = await getVideoTranscriptResult(video.videoId)
      const retryDelaysMs = [2_000, 5_000]
      for (
        let retry = 0;
        !transcriptResult.ok &&
        transcriptResult.retryable &&
        retry < retryDelaysMs.length;
        retry++
      ) {
        console.warn(
          `  ${transcriptResult.code}; retrying in ${retryDelaysMs[retry] / 1000}s...`
        )
        await new Promise((resolveDelay) =>
          setTimeout(resolveDelay, retryDelaysMs[retry])
        )
        transcriptResult = await getVideoTranscriptResult(video.videoId)
      }

      if (!transcriptResult.ok) {
        console.error(
          `  FAIL [${transcriptResult.code}]: ${transcriptResult.message}`
        )
        results.push({ id, status: transcriptResult.code.toLowerCase() })
        continue
      }
      const transcript = transcriptResult.transcript
      const validated = validateTranscript(transcript)
      const words = validated.words
      console.log(`  Transcript fetched: ${words} words`)

      if (DRY_RUN) {
        results.push({ id, status: 'dry-run-ok', words })
        continue
      }

      const replacement = await replaceVideoEmbeddings({
        video,
        transcript: validated.transcript,
        saveVideoRecord: saveVideo,
        onProgress: (completed, total) => {
          process.stdout.write(`  vector ${completed}/${total}\r`)
        },
        onCleanupError: (_error, ids) => {
          console.error(
            `\n  WARN: ${ids.length} stale vectors could not be deleted; run vector audit`
          )
        },
      })
      console.log(`\n  Upserted ${replacement.vectorIds.length} staged vectors`)
      console.log(
        `  Saved to KV: transcript (${words} words) + ${replacement.vectorIds.length} pineconeIds`
      )

      results.push({
        id,
        status: replacement.cleanupSucceeded
          ? 'repaired'
          : 'repaired-with-cleanup-warning',
        words,
        vectors: replacement.vectorIds.length,
      })
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
