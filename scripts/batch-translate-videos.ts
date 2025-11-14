/**
 * Batch Translation Script: Auto-translate all videos to Vietnamese
 * Use after migration to fill Vietnamese content using AI
 *
 * Usage: npx tsx scripts/batch-translate-videos.ts
 */

import { getAllVideos, saveVideo } from '../lib/videoManager'
import { translateToVietnamese, estimateTranslationCost } from '../lib/translateVideo'

async function batchTranslateVideos() {
  console.log('🌐 Starting batch translation to Vietnamese...\n')

  try {
    // Fetch all videos
    const allVideos = await getAllVideos(1000)
    console.log(`📊 Total videos in database: ${allVideos.length}`)

    // Filter videos that need translation (Vietnamese title is empty)
    const untranslatedVideos = allVideos.filter(
      (v) => !v.vi?.title || v.vi.title.trim() === ''
    )

    console.log(`📝 Videos needing translation: ${untranslatedVideos.length}`)

    if (untranslatedVideos.length === 0) {
      console.log('\n✨ All videos are already translated! No action needed.')
      return
    }

    // Estimate total cost
    let totalCost = 0
    let totalTokens = 0

    console.log('\n💰 Estimating translation costs...')
    untranslatedVideos.forEach((video, index) => {
      const { estimatedCost, estimatedTokens } = estimateTranslationCost(video.en)
      totalCost += estimatedCost
      totalTokens += estimatedTokens

      if (index < 3) {
        // Show first 3 as examples
        console.log(
          `   ${index + 1}. "${video.en.title.substring(0, 50)}..." - $${estimatedCost.toFixed(4)}`
        )
      }
    })

    if (untranslatedVideos.length > 3) {
      console.log(`   ... and ${untranslatedVideos.length - 3} more`)
    }

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('💸 Cost Estimation:')
    console.log(`   📊 Videos to translate: ${untranslatedVideos.length}`)
    console.log(`   🔢 Estimated tokens: ~${totalTokens.toLocaleString()}`)
    console.log(`   💵 Estimated cost: ~$${totalCost.toFixed(4)} USD`)
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

    // Confirmation prompt
    console.log('⏰ Starting in 5 seconds... (Press Ctrl+C to cancel)')
    await new Promise((resolve) => setTimeout(resolve, 5000))

    console.log('\n🚀 Beginning translation process...\n')

    let successCount = 0
    let errorCount = 0
    const errors: Array<{ title: string; error: string }> = []

    for (let i = 0; i < untranslatedVideos.length; i++) {
      const video = untranslatedVideos[i]
      const progress = `[${i + 1}/${untranslatedVideos.length}]`

      try {
        console.log(`${progress} Translating: "${video.en.title.substring(0, 60)}..."`)

        // Translate to Vietnamese
        const translated = await translateToVietnamese(video.en)

        // Update video with Vietnamese content
        video.vi = translated
        video.translationStatus = {
          viTranslated: true,
          translatedAt: Date.now(),
          translationMethod: 'auto',
          translatedBy: 'batch-script',
        }

        // Save to database
        await saveVideo(video)

        console.log(`   ✅ Success: "${translated.title.substring(0, 60)}..."\n`)
        successCount++

        // Rate limiting: 1 second between requests to avoid overwhelming OpenAI API
        await new Promise((resolve) => setTimeout(resolve, 1000))
      } catch (error: any) {
        console.error(`   ❌ Error: ${error.message}\n`)
        errorCount++
        errors.push({
          title: video.en.title,
          error: error.message,
        })

        // Continue with next video despite error
      }
    }

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('📊 Translation Summary:')
    console.log(`   ✅ Successfully translated: ${successCount}`)
    console.log(`   ❌ Errors: ${errorCount}`)
    console.log(`   💵 Actual cost: ~$${(totalCost * (successCount / untranslatedVideos.length)).toFixed(4)} USD`)
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

    if (errors.length > 0) {
      console.log('⚠️  Failed translations:')
      errors.forEach((err, idx) => {
        console.log(`   ${idx + 1}. "${err.title.substring(0, 50)}..." - ${err.error}`)
      })
      console.log('')
    }

    if (successCount > 0) {
      console.log('🎉 Batch translation completed!')
      console.log('\n📌 Next steps:')
      console.log('   1. Review translations in admin panel')
      console.log('   2. Edit/improve AI translations as needed')
      console.log('   3. Test language switching on frontend')
      console.log('   4. Deploy to production\n')
    }
  } catch (error: any) {
    console.error('\n❌ Fatal error during batch translation:', error.message)
    console.error(error.stack)
    process.exit(1)
  }
}

// Run batch translation
console.log('╔══════════════════════════════════════════════════════════╗')
console.log('║  Batch Video Translation (English → Vietnamese)         ║')
console.log('║  Uses OpenAI GPT-4o-mini for AI-powered translation     ║')
console.log('╚══════════════════════════════════════════════════════════╝\n')

batchTranslateVideos()
  .then(() => {
    console.log('\n✅ Batch translation script completed.')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ Batch translation script failed:', error)
    process.exit(1)
  })
