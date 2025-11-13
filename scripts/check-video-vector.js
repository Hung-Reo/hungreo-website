require('dotenv').config({ path: '.env.local' })
const { Pinecone } = require('@pinecone-database/pinecone')

async function checkVideoVector() {
  try {
    const pinecone = new Pinecone({
      apiKey: process.env.PINECONE_API_KEY,
    })

    const indexName = process.env.PINECONE_INDEX_NAME
    if (!indexName) {
      throw new Error('PINECONE_INDEX_NAME is not set')
    }

    const index = pinecone.index(indexName)

    // Fetch video vector
    const videoId = 'OesPjXh_M_o'
    console.log(`[Debug] Fetching video vector: video_${videoId}_chunk_0`)

    const result = await index.fetch([`video_${videoId}_chunk_0`])
    const vector = result.records[`video_${videoId}_chunk_0`]

    if (vector && vector.metadata) {
      console.log('\n========== VIDEO VECTOR CONTENT ==========')
      console.log('Vector ID:', vector.id)
      console.log('Video ID:', vector.metadata.videoId)
      console.log('Title:', vector.metadata.title)
      console.log('Chunk Index:', vector.metadata.chunkIndex)

      const description = vector.metadata.description || ''
      const wordCount = description.split(/\s+/).filter(w => w.trim()).length

      console.log('\nContent Stats:')
      console.log('  - Word Count:', wordCount, 'words')
      console.log('  - Character Length:', description.length, 'chars')

      console.log('\n--- FULL METADATA ---')
      console.log(JSON.stringify(vector.metadata, null, 2))

      console.log('\n--- TRANSCRIPT CONTENT (first 500 chars) ---')
      console.log(description.substring(0, 500))

      if (description.length < 200) {
        console.log('\n❌ WARNING: Transcript content is too short!')
        console.log('   Expected: Full video transcript')
        console.log('   Got: Only', description.length, 'characters')
      } else {
        console.log('\n✅ Transcript content looks good')
      }

      // Check if vectorType field exists
      if (!vector.metadata.vectorType) {
        console.log('\n❌ MISSING FIELD: vectorType is not set!')
        console.log('   This vector was created before vectorType field was added')
        console.log('   Delete API cannot find this vector (filters by vectorType)')
      } else {
        console.log(`\n✅ vectorType field present: ${vector.metadata.vectorType}`)
      }

    } else {
      console.log(`\n❌ Video vector not found: video_${videoId}_chunk_0`)
    }

  } catch (error) {
    console.error('[Error]', error.message)
  }
}

checkVideoVector()
