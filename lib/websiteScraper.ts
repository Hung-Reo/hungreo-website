/**
 * Website Auto-Scraper
 * Automatically scrapes content from all public pages and updates knowledge base
 */

import * as cheerio from 'cheerio'
import { getPineconeIndex } from './pinecone'
import { createEmbedding } from './openai'
import { chunkText } from './textUtils'

export interface ScrapedPage {
  url: string
  title: string
  description: string
  content: string
  lastScraped: number
}

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

const PAGES_TO_SCRAPE = [
  '/',
  '/about',
  '/projects',
  '/blog',
  '/contact',
]

/**
 * Scrape a single page
 */
export async function scrapePage(path: string): Promise<ScrapedPage> {
  try {
    const url = `${BASE_URL}${path}`
    const response = await fetch(url)
    const html = await response.text()

    const $ = cheerio.load(html)

    // Remove script tags, style tags, and navigation
    $('script, style, nav, header, footer').remove()

    // Extract title
    const title = $('title').text() || $('h1').first().text() || 'Untitled Page'

    // Extract description from meta tag
    const description = $('meta[name="description"]').attr('content') || ''

    // Extract main content
    const content = $('main').text() || $('body').text()

    // Clean up content
    const cleanedContent = content
      .replace(/\s+/g, ' ')
      .replace(/\n+/g, '\n')
      .trim()

    return {
      url: path,
      title,
      description,
      content: cleanedContent,
      lastScraped: Date.now(),
    }
  } catch (error) {
    console.error(`Failed to scrape ${path}:`, error)
    throw new Error(`Failed to scrape ${path}`)
  }
}

/**
 * Scrape all website pages
 */
export async function scrapeAllPages(): Promise<ScrapedPage[]> {
  const pages: ScrapedPage[] = []

  for (const path of PAGES_TO_SCRAPE) {
    try {
      const page = await scrapePage(path)
      pages.push(page)
    } catch (error) {
      console.error(`Skipping ${path} due to error`)
    }
  }

  return pages
}

/**
 * Update Pinecone with scraped content
 */
export async function updateKnowledgeBase(pages: ScrapedPage[]): Promise<number> {
  const index = await getPineconeIndex()
  let totalVectors = 0

  // First, delete existing website vectors
  try {
    await index.deleteMany({ type: 'website' })
  } catch (error) {
    console.error('Failed to delete existing website vectors:', error)
  }

  for (const page of pages) {
    const fullContent = `${page.title}\n${page.description}\n${page.content}`
    const chunks = chunkText(fullContent, 512)

    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i]
      const embedding = await createEmbedding(chunk)

      const vectorId = `website_${page.url.replace(/\//g, '_')}_chunk_${i}`

      await index.upsert([
        {
          id: vectorId,
          values: embedding,
          metadata: {
            title: page.title,
            description: chunk.substring(0, 500),
            type: 'website',
            page: page.url,
            chunkIndex: i,
            totalChunks: chunks.length,
            lastScraped: page.lastScraped,
          },
        },
      ])

      totalVectors++
    }
  }

  return totalVectors
}

/**
 * Main function to scrape website and update knowledge base
 */
export async function scrapeAndUpdate(): Promise<{
  pagesScraped: number
  vectorsCreated: number
  errors: string[]
}> {
  const errors: string[] = []

  try {
    // Scrape all pages
    const pages = await scrapeAllPages()

    if (pages.length === 0) {
      errors.push('No pages were successfully scraped')
      return { pagesScraped: 0, vectorsCreated: 0, errors }
    }

    // Update knowledge base
    const vectorsCreated = await updateKnowledgeBase(pages)

    return {
      pagesScraped: pages.length,
      vectorsCreated,
      errors,
    }
  } catch (error: any) {
    errors.push(error.message || 'Unknown error occurred')
    return {
      pagesScraped: 0,
      vectorsCreated: 0,
      errors,
    }
  }
}
