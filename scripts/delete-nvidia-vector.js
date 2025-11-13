require('dotenv').config({ path: '.env.local' })
const { Pinecone } = require('@pinecone-database/pinecone')

async function deleteNvidiaVector() {
  try {
    const pinecone = new Pinecone({
      apiKey: process.env.PINECONE_API_KEY,
    })

    const indexName = process.env.PINECONE_INDEX_NAME
    if (!indexName) {
      throw new Error('PINECONE_INDEX_NAME is not set')
    }

    const index = pinecone.index(indexName)

    // Nvidia video ID from previous logs
    const videoId = 'OesPjXh_M_o'

    console.log(`[Delete] Searching for vectors with videoId: ${videoId}`)

    // Query to find all vectors with this videoId
    const queryResponse = await index.query({
      vector: new Array(1536).fill(0), // Dummy vector
      topK: 10000,
      includeMetadata: true,
      filter: {
        videoId: { $eq: videoId },
      },
    })

    console.log(`[Delete] Found ${queryResponse.matches?.length || 0} vectors`)

    if (queryResponse.matches && queryResponse.matches.length > 0) {
      queryResponse.matches.forEach((match, i) => {
        console.log(`  ${i + 1}. ${match.id} (score: ${match.score?.toFixed(3)})`)
        console.log(`     Title: ${match.metadata?.title}`)
      })

      const vectorIds = queryResponse.matches.map((match) => match.id)

      console.log(`\n[Delete] Deleting ${vectorIds.length} vectors...`)
      await index.deleteMany(vectorIds)

      console.log(`✅ Successfully deleted ${vectorIds.length} Nvidia vectors`)
    } else {
      console.log('❌ No vectors found with this videoId')
      console.log('\nTrying alternative search by vector ID pattern...')

      // Try deleting by ID pattern
      const vectorId = `video_${videoId}_chunk_0`
      console.log(`[Delete] Attempting to delete: ${vectorId}`)

      await index.deleteOne(vectorId)
      console.log(`✅ Deleted vector: ${vectorId}`)
    }

  } catch (error) {
    console.error('❌ [Error]', error.message)
    console.error(error.stack)
  }
}

deleteNvidiaVector()
