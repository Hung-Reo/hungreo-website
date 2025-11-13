require('dotenv').config({ path: '.env.local' })
const { kv } = require('@vercel/kv')

async function deleteVideoFromRedis() {
  try {
    const videoId = 'OesPjXh_M_o'
    const key = `video:${videoId}`

    console.log(`[Redis] Attempting to delete video from Upstash: ${key}`)

    // Get video info first
    const video = await kv.hgetall(key)
    if (video) {
      console.log('Found video:', video.title)
      console.log('Status:', video.status)
      console.log('Category:', video.category)
    } else {
      console.log('❌ Video not found in Redis')
      return
    }

    // Delete from Redis
    await kv.del(key)

    console.log(`✅ Successfully deleted video from Redis: ${key}`)
    console.log('\nNow run: node scripts/delete-video-by-id.js')
    console.log('Then re-import the video with fixes!')

  } catch (error) {
    console.error('[Error]', error.message)
    console.error(error.stack)
  }
}

deleteVideoFromRedis()
