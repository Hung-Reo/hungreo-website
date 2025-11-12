/**
 * Check the actual content stored in a specific Pinecone vector
 */

require('dotenv').config({ path: '.env.local' })
const { Pinecone } = require('@pinecone-database/pinecone')

async function checkChunkContent() {
  try {
    const pinecone = new Pinecone({
      apiKey: process.env.PINECONE_API_KEY,
    })

    const indexName = process.env.PINECONE_INDEX_NAME
    if (!indexName) {
      throw new Error('PINECONE_INDEX_NAME is not set')
    }

    const index = pinecone.index(indexName)

    // Fetch ALL about chunks
    console.log('[Debug] Fetching all /about chunks: chunk_0, chunk_1, chunk_2')
    const result = await index.fetch([
      'website__about_chunk_0',
      'website__about_chunk_1',
      'website__about_chunk_2'
    ])

    // Check all chunks
    for (let i = 0; i <= 2; i++) {
      const vectorId = `website__about_chunk_${i}`
      const vector = result.records[vectorId]

      if (vector && vector.metadata) {
        const description = vector.metadata.description || ''
        const wordCount = description.split(/\s+/).filter(w => w.trim()).length

        console.log(`\n========== CHUNK ${i} ==========`)
        console.log('Vector ID:', vectorId)
        console.log('Chunk Index:', vector.metadata.chunkIndex)
        console.log('Word Count:', wordCount, 'words')
        console.log('Character Length:', description.length, 'chars')

        // Key phrase detection
        const hasBeyondWork = description.includes('Beyond Work')
        const hasRunning = description.includes('running')
        const hasTraveling = description.includes('traveling')
        const hasBorn = description.includes('Born') || description.includes('March 9')

        console.log('\nKey Phrases:')
        console.log('  - "Beyond Work":', hasBeyondWork ? '✅' : '❌')
        console.log('  - "running":', hasRunning ? '✅' : '❌')
        console.log('  - "traveling":', hasTraveling ? '✅' : '❌')
        console.log('  - "Born" or "March 9":', hasBorn ? '✅' : '❌')

        console.log('\n--- FULL CONTENT ---')
        console.log(description)

        if (hasBeyondWork || hasRunning || hasTraveling) {
          console.log('\n🎯 FOUND: This chunk contains "Beyond Work" section!')
        }

      } else {
        console.log(`\n❌ Chunk ${i} not found in Pinecone`)
      }
    }

    console.log('\n\n=== SUMMARY ===')
    const allVectors = Object.values(result.records)
    const chunksWithBeyondWork = allVectors.filter(v => {
      const desc = v.metadata?.description || ''
      return desc.includes('Beyond Work') || desc.includes('running') || desc.includes('traveling')
    })

    if (chunksWithBeyondWork.length === 0) {
      console.log('❌ CRITICAL PROBLEM: "Beyond Work" section is NOT in ANY chunk!')
      console.log('   The merge logic FAILED - the last portion of the scraped content was lost.')
      console.log('   Root cause: Merge calculation is incorrect in chunkText() function.')
    } else {
      console.log(`✅ "Beyond Work" section found in ${chunksWithBeyondWork.length} chunk(s)`)
      chunksWithBeyondWork.forEach(v => {
        console.log(`   - ${v.id} (chunk ${v.metadata.chunkIndex})`)
      })
    }

  } catch (error) {
    console.error('[Error]', error.message)
  }
}

checkChunkContent()
