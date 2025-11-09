/**
 * Script to delete only DOCUMENT vectors from Pinecone
 * This will only delete vectors created from uploaded documents
 *
 * Usage: node scripts/clear-pinecone-documents.js
 */

require('dotenv').config({ path: '.env.local' })
const { Pinecone } = require('@pinecone-database/pinecone')

async function clearDocumentVectors() {
  try {
    console.log('Connecting to Pinecone...')

    const pinecone = new Pinecone({
      apiKey: process.env.PINECONE_API_KEY,
    })

    const indexName = process.env.PINECONE_INDEX_NAME
    console.log(`Using index: ${indexName}`)

    const index = pinecone.index(indexName)

    console.log('\nQuerying for document vectors...')

    // Query to find all document vectors
    const queryResponse = await index.query({
      vector: new Array(1536).fill(0), // Dummy vector
      topK: 10000,
      includeMetadata: true,
      filter: {
        vectorType: { $eq: 'document' },
      },
    })

    const vectorIds = queryResponse.matches?.map((match) => match.id) || []

    if (vectorIds.length === 0) {
      console.log('ℹ️  No document vectors found.')
      return
    }

    console.log(`Found ${vectorIds.length} document vectors`)

    // Delete in batches
    const batchSize = 1000
    let deletedCount = 0

    for (let i = 0; i < vectorIds.length; i += batchSize) {
      const batch = vectorIds.slice(i, i + batchSize)
      await index.deleteMany(batch)
      deletedCount += batch.length
      console.log(`Deleted ${deletedCount}/${vectorIds.length} vectors...`)
    }

    console.log('✅ Document vectors deleted successfully!')
    console.log(`Deleted ${deletedCount} document vectors.`)

  } catch (error) {
    console.error('❌ Error clearing document vectors:', error)
    process.exit(1)
  }
}

clearDocumentVectors()
