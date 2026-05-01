import { config } from 'dotenv'
import { resolve } from 'path'
config({ path: resolve(process.cwd(), '.env.local') })

import { createClient } from '@vercel/kv'

async function main() {
  const kv = createClient({ url: process.env.KV_REST_API_URL!, token: process.env.KV_REST_API_TOKEN! })
  const ids = await kv.zrange('videos:all', 0, -1)
  console.log('Total videos:', ids.length, '\n')

  // Dump full structure of first video
  const firstId = ids[0]
  const video: any = await kv.get(`video:${firstId}`)
  console.log(`=== Full structure of video [${firstId}] ===`)
  console.log(JSON.stringify(video, null, 2).substring(0, 2000))
}

main().catch(console.error)
