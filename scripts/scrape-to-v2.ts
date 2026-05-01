/**
 * Scrape all website pages and embed into current Pinecone index (v2).
 * Reads env from .env.local. Requires Chrome at default Mac path.
 *
 * Usage: npx tsx scripts/scrape-to-v2.ts
 */
import { config } from 'dotenv'
import { resolve } from 'path'

config({ path: resolve(process.cwd(), '.env.local') })

import { scrapeAndUpdate } from '../lib/websiteScraper'

console.log('\n=== Website Scrape → Pinecone v2 ===')
console.log(`Index: ${process.env.PINECONE_INDEX_NAME}`)
console.log(`Model: ${process.env.OPENAI_EMBEDDING_MODEL ?? 'text-embedding-3-large'}`)
console.log(`Base URL: ${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}`)
console.log('=====================================\n')

scrapeAndUpdate()
  .then(result => {
    console.log('\n=== Done ===')
    console.log(`Pages scraped : ${result.pagesScraped}`)
    console.log(`Vectors created: ${result.vectorsCreated}`)
    if (result.errors?.length) {
      console.log(`Errors (${result.errors.length}):`, result.errors)
    }
    process.exit(0)
  })
  .catch(err => {
    console.error('\nFailed:', err)
    process.exit(1)
  })
