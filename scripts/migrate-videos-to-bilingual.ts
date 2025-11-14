/**
 * Migration Script: Convert existing videos to bilingual structure
 * Run once to update all existing videos from old format to new bilingual format
 *
 * Usage: npx tsx scripts/migrate-videos-to-bilingual.ts
 */

import { getAllVideos, saveVideo, type Video } from '../lib/videoManager'

async function migrateVideosToBilingual() {
  console.log('🚀 Starting video migration to bilingual structure...\n')

  try {
    // Fetch all existing videos
    const videos = await getAllVideos(1000)
    console.log(`📊 Found ${videos.length} videos to process\n`)

    let migratedCount = 0
    let skippedCount = 0
    let errorCount = 0

    for (const video of videos) {
      try {
        // Check if already in new format (has both 'en' and 'vi' objects)
        if (video.en && video.vi && video.en.title && !video.title) {
          console.log(`⏭️  Skipping: ${video.en.title} (already migrated)`)
          skippedCount++
          continue
        }

        // Check if in legacy format (has top-level title field)
        if (!video.en || !video.en.title) {
          console.log(`\n🔄 Migrating: ${video.title || video.id}`)

          // Create migrated video with bilingual structure
          const migratedVideo: Video = {
            ...video,
            // English content (from existing fields)
            en: {
              title: video.title || '',
              description: video.description || '',
              transcript: video.transcript,
              summary: video.summary,
            },
            // Vietnamese content (empty, to be filled later)
            vi: {
              title: '',
              description: '',
              transcript: undefined,
              summary: undefined,
            },
            // Translation status
            translationStatus: {
              viTranslated: false,
            },
          }

          // Remove old top-level fields (clean up)
          delete (migratedVideo as any).title
          delete (migratedVideo as any).description
          delete (migratedVideo as any).transcript
          delete (migratedVideo as any).summary

          // Save migrated video
          await saveVideo(migratedVideo)

          console.log(`   ✅ Success: ${migratedVideo.en.title}`)
          migratedCount++
        } else {
          console.log(`⏭️  Skipping: ${video.en.title} (already in new format)`)
          skippedCount++
        }

        // Rate limiting to avoid overwhelming the database
        await new Promise((resolve) => setTimeout(resolve, 100))
      } catch (error: any) {
        console.error(`   ❌ Error migrating video ${video.id}:`, error.message)
        errorCount++
      }
    }

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('📊 Migration Summary:')
    console.log(`   ✅ Successfully migrated: ${migratedCount}`)
    console.log(`   ⏭️  Skipped (already migrated): ${skippedCount}`)
    console.log(`   ❌ Errors: ${errorCount}`)
    console.log(`   📝 Total processed: ${videos.length}`)
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

    if (errorCount === 0 && migratedCount > 0) {
      console.log('🎉 Migration completed successfully!')
      console.log('\n📌 Next steps:')
      console.log('   1. Review migrated videos in admin panel')
      console.log('   2. Run batch translation script: npx tsx scripts/batch-translate-videos.ts')
      console.log('   3. Review and edit AI translations as needed\n')
    } else if (migratedCount === 0 && skippedCount > 0) {
      console.log('✨ All videos are already migrated! No action needed.')
    } else {
      console.log('⚠️  Migration completed with some errors. Please review above.')
    }
  } catch (error: any) {
    console.error('\n❌ Fatal error during migration:', error.message)
    console.error(error.stack)
    process.exit(1)
  }
}

// Run migration
console.log('╔══════════════════════════════════════════════════════════╗')
console.log('║  Video Migration to Bilingual Structure                 ║')
console.log('║  This will convert existing videos to EN/VI format      ║')
console.log('╚══════════════════════════════════════════════════════════╝\n')

migrateVideosToBilingual()
  .then(() => {
    console.log('\n✅ Migration script completed.')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ Migration script failed:', error)
    process.exit(1)
  })
