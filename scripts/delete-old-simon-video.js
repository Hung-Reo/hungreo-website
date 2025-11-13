require('dotenv').config({ path: '.env.local' })
const { kv } = require('@vercel/kv')
const { Pinecone } = require('@pinecone-database/pinecone')

async function deleteOldVideo() {
  try {
    // Video ID from the vector manager screenshot
    const videoId = 'L3RbhSM3z40'

    console.log(`[Delete] Deleting old video: ${videoId}\n`)

    // Step 1: Delete from Redis
    console.log('[1/2] Deleting from Redis...')
    const redisKey = `video:${videoId}`
    const video = await kv.hgetall(redisKey)

    if (video) {
      console.log(`  Found video in Redis: "${video.title}"`)
      await kv.del(redisKey)
      console.log(`  ✅ Deleted from Redis: ${redisKey}`)
    } else {
      console.log(`  ⚠️  Video not found in Redis (key: ${redisKey})`)
    }

    // Step 2: Delete from Pinecone
    console.log('\n[2/2] Deleting from Pinecone...')
    const pinecone = new Pinecone({
      apiKey: process.env.PINECONE_API_KEY,
    })

    const indexName = process.env.PINECONE_INDEX_NAME
    if (!indexName) {
      throw new Error('PINECONE_INDEX_NAME is not set')
    }

    const index = pinecone.index(indexName)

    // Delete the vector (old video only has 1 chunk with index 0)
    const vectorId = `video_${videoId}_chunk_0`
    console.log(`  Deleting vector: ${vectorId}`)
    await index.deleteOne(vectorId)
    console.log(`  ✅ Deleted from Pinecone: ${vectorId}`)

    console.log('\n' + '='.repeat(50))
    console.log('✅ OLD VIDEO DELETED SUCCESSFULLY!')
    console.log('='.repeat(50))
    console.log('\nNow you can:')
    console.log('  1. Delete the Nvidia video (if needed)')
    console.log('  2. Upload fresh videos with the fixes')
    console.log('  3. Test chatbot with proper transcript content')

  } catch (error) {
    console.error('\n❌ [Error]', error.message)
    console.error(error.stack)
  }
}

deleteOldVideo()
