/**
 * Script to clear ALL vectors from Pinecone index
 *
 * WARNING: This will delete EVERYTHING including:
 * - Website vectors (scraped content)
 * - Document vectors (uploaded files)
 * - Video vectors (YouTube transcripts)
 *
 * Usage: node scripts/clear-pinecone.js
 *
 * For selective deletion, use:
 * - clear-pinecone-website.js
 * - clear-pinecone-documents.js
 * - clear-pinecone-videos.js
 */

require('dotenv').config({ path: '.env.local' })
const { Pinecone } = require('@pinecone-database/pinecone')
const readline = require('readline')

async function clearPinecone() {
  try {
    console.log('⚠️  WARNING: This will delete ALL vectors from Pinecone!')
    console.log('This includes:')
    console.log('  - Website vectors (scraped content)')
    console.log('  - Document vectors (uploaded files)')
    console.log('  - Video vectors (YouTube transcripts)')
    console.log('')

    // Ask for confirmation
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    })

    const answer = await new Promise((resolve) => {
      rl.question('Type "DELETE ALL" to confirm: ', resolve)
    })
    rl.close()

    if (answer !== 'DELETE ALL') {
      console.log('❌ Aborted. No vectors were deleted.')
      process.exit(0)
    }

    console.log('Connecting to Pinecone...')

    const pinecone = new Pinecone({
      apiKey: process.env.PINECONE_API_KEY,
    })

    const indexName = process.env.PINECONE_INDEX_NAME
    console.log(`Using index: ${indexName}`)

    const index = pinecone.index(indexName)

    // Get stats before deletion
    const statsBefore = await index.describeIndexStats()
    console.log(`\nCurrent vector count: ${statsBefore.totalRecordCount || 0}`)

    console.log('\nDeleting all vectors...')

    // Delete all vectors in the index
    await index.deleteAll()

    console.log('✅ All vectors deleted successfully!')
    console.log('Pinecone index is now empty.')
    console.log('\nTo repopulate:')
    console.log('  - Website: Use scraping functionality')
    console.log('  - Documents: Re-upload and approve documents')
    console.log('  - Videos: Re-process YouTube videos')

  } catch (error) {
    console.error('❌ Error clearing Pinecone:', error)
    process.exit(1)
  }
}

clearPinecone()
