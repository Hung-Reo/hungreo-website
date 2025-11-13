require('dotenv').config({ path: '.env.local' })
const { kv } = require('@vercel/kv')

async function listAllVideos() {
  try {
    console.log('[Redis] Fetching all videos from Upstash...\n')

    // Scan for all keys matching "video:*"
    let cursor = 0
    let allKeys = []

    do {
      const result = await kv.scan(cursor, { match: 'video:*', count: 100 })
      cursor = result[0]
      allKeys = allKeys.concat(result[1])
    } while (cursor !== 0)

    console.log(`Found ${allKeys.length} videos in Redis:\n`)

    for (const key of allKeys) {
      const video = await kv.hgetall(key)
      if (video) {
        console.log('=====================================')
        console.log('Key:', key)
        console.log('Video ID:', video.videoId || 'N/A')
        console.log('Title:', video.title || 'N/A')
        console.log('Category:', video.category || 'N/A')
        console.log('Status:', video.status || 'N/A')
        console.log('Channel:', video.channelTitle || 'N/A')
        console.log('=====================================\n')
      }
    }

  } catch (error) {
    console.error('[Error]', error.message)
    console.error(error.stack)
  }
}

listAllVideos()
