require('dotenv').config({ path: '.env.local' })
const { Pinecone } = require('@pinecone-database/pinecone')

async function deleteVideoById() {
  try {
    const pinecone = new Pinecone({
      apiKey: process.env.PINECONE_API_KEY,
    })

    const indexName = process.env.PINECONE_INDEX_NAME
    if (!indexName) {
      throw new Error('PINECONE_INDEX_NAME is not set')
    }

    const index = pinecone.index(indexName)

    const videoId = 'OesPjXh_M_o'
    const vectorId = `video_${videoId}_chunk_0`

    console.log(`[Delete] Attempting to delete vector: ${vectorId}`)

    await index.deleteOne(vectorId)

    console.log(`✅ Successfully deleted vector: ${vectorId}`)
    console.log('\nYou can now re-import the video with the fixes:')
    console.log('  1. Full transcript content (no 500 char truncation)')
    console.log('  2. vectorType field for Vector Manager filtering')

  } catch (error) {
    console.error('[Error]', error.message)
  }
}

deleteVideoById()
