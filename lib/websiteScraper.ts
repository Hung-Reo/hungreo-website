/**
 * Website Auto-Scraper with Puppeteer
 * Automatically scrapes content from all public pages with full React rendering
 */

import puppeteer from 'puppeteer-core'
import chromium from '@sparticuz/chromium'
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
 * Get browser launch options based on environment
 */
function getBrowserOptions() {
  // Check if running locally (has Chrome/Chromium installed)
  const isLocal = process.env.NODE_ENV === 'development' || !process.env.AWS_EXECUTION_ENV

  if (isLocal) {
    // Local development - use system Chrome
    return {
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
      executablePath: process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    }
  } else {
    // Production (Vercel) - use serverless Chromium
    return {
      args: chromium.args,
      executablePath: chromium.executablePath(),
      headless: chromium.headless,
    }
  }
}

/**
 * Scrape a single page using Puppeteer for full React rendering
 */
export async function scrapePage(path: string): Promise<ScrapedPage> {
  let browser

  try {
    const url = `${BASE_URL}${path}`
    console.log(`[Scraper] Launching browser for ${url}`)

    // Launch browser with appropriate options
    browser = await puppeteer.launch(await getBrowserOptions())
    const page = await browser.newPage()

    // Set viewport and user agent
    await page.setViewport({ width: 1280, height: 800 })
    await page.setUserAgent(
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    )

    console.log(`[Scraper] Navigating to ${url}`)

    // Navigate to page and wait for network to be idle (React rendered)
    await page.goto(url, {
      waitUntil: 'networkidle0', // Wait until no network activity
      timeout: 30000, // 30 second timeout
    })

    console.log(`[Scraper] Page loaded, extracting content`)

    // Extract content after React has rendered
    const pageData = await page.evaluate(() => {
      // Get title
      const title = document.title || document.querySelector('h1')?.textContent || 'Untitled Page'

      // Get description from meta tag
      const descriptionMeta = document.querySelector('meta[name="description"]')
      const description = descriptionMeta?.getAttribute('content') || ''

      // Get main content with smart structured extraction
      const mainElement = document.querySelector('main')
      if (!mainElement) {
        return { title, description, content: document.body.innerText }
      }

      // Smart extraction: detect and properly format structured sections
      let content = ''
      const sections = mainElement.querySelectorAll('section')

      if (sections.length > 0) {
        // Page has structured sections - extract each section intelligently
        sections.forEach((section) => {
          const heading = section.querySelector('h2, h3')?.textContent?.trim() || ''

          if (heading === 'Training & Development') {
            // Special handling for Training section to preserve card structure
            content += `\n\n${heading}\n`
            const cards = section.querySelectorAll('.rounded-lg.border')
            cards.forEach((card) => {
              const paragraphs = card.querySelectorAll('p')
              if (paragraphs.length >= 2) {
                const trainingName = paragraphs[0].textContent?.trim() || ''
                const company = paragraphs[1].textContent?.trim() || ''
                content += `${trainingName} - ${company}\n`
              }
            })
          } else if (heading === 'Education & Expertise') {
            // Special handling for Education section with multiple cards
            content += `\n\n${heading}\n`
            const cards = section.querySelectorAll('.rounded-lg.border')
            cards.forEach((card) => {
              const cardHeading = card.querySelector('h3')?.textContent?.trim() || ''
              content += `\n${cardHeading}\n`
              const listItems = card.querySelectorAll('li')
              listItems.forEach((li) => {
                content += `${li.textContent?.trim()}\n`
              })
            })
          } else if (heading === 'Core Competencies') {
            // Special handling for Core Competencies - extract as list
            content += `\n\n${heading}\n`
            const competencies = section.querySelectorAll('.rounded-lg.border span:last-child')
            competencies.forEach((comp) => {
              content += `• ${comp.textContent?.trim()}\n`
            })
          } else {
            // Default: extract section heading + content
            content += `\n\n${heading}\n`
            const sectionText = section.innerText
            // Remove the heading from content to avoid duplication
            const contentWithoutHeading = sectionText.replace(heading, '').trim()
            content += contentWithoutHeading + '\n'
          }
        })
      } else {
        // Fallback: no structured sections, use simple innerText
        content = mainElement.innerText
      }

      return { title, description, content: content.trim() }
    })

    // Clean up content
    const cleanedContent = pageData.content
      .replace(/[ \t]+/g, ' ') // Multiple spaces/tabs → single space (preserve newlines)
      .replace(/\n\s*\n\s*\n+/g, '\n\n') // Multiple newlines → double newline
      .trim()

    const wordCount = cleanedContent.split(/\s+/).length
    console.log(`[Scraper] Extracted ${cleanedContent.length} characters (${wordCount} words) from ${path}`)

    // Debug: Check if important sections are included
    if (path === '/about') {
      const hasBeyondWork = cleanedContent.includes('Beyond Work') || cleanedContent.includes('running') || cleanedContent.includes('traveling')
      const hasEducation = cleanedContent.includes('MBA') || cleanedContent.includes('Bachelor')
      const hasCoreComp = cleanedContent.includes('Core Competencies') || cleanedContent.includes('Integrity')
      console.log(`[Scraper] /about sections check:`)
      console.log(`  - Education: ${hasEducation ? '✅' : '❌'}`)
      console.log(`  - Core Competencies: ${hasCoreComp ? '✅' : '❌'}`)
      console.log(`  - Beyond Work: ${hasBeyondWork ? '✅' : '❌'}`)

      // Log last 200 chars to see if Beyond Work section is at the end
      console.log(`[Scraper] Last 200 chars: ...${cleanedContent.substring(cleanedContent.length - 200)}`)
    }

    await browser.close()

    return {
      url: path,
      title: pageData.title.trim(),
      description: pageData.description.trim(),
      content: cleanedContent,
      lastScraped: Date.now(),
    }
  } catch (error) {
    console.error(`[Scraper] Failed to scrape ${path}:`, error)
    if (browser) {
      await browser.close().catch(() => {})
    }
    throw new Error(`Failed to scrape ${path}: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Scrape all website pages
 */
export async function scrapeAllPages(): Promise<ScrapedPage[]> {
  const pages: ScrapedPage[] = []

  console.log(`[Scraper] Starting to scrape ${PAGES_TO_SCRAPE.length} pages`)

  for (const path of PAGES_TO_SCRAPE) {
    try {
      const page = await scrapePage(path)
      pages.push(page)
      console.log(`[Scraper] ✅ Successfully scraped ${path}`)
    } catch (error) {
      console.error(`[Scraper] ❌ Skipping ${path} due to error:`, error)
    }
  }

  console.log(`[Scraper] Scraped ${pages.length}/${PAGES_TO_SCRAPE.length} pages successfully`)

  return pages
}

/**
 * Update Pinecone with scraped content
 */
export async function updateKnowledgeBase(pages: ScrapedPage[]): Promise<number> {
  const index = await getPineconeIndex()
  let totalVectors = 0

  console.log('[Scraper] Updating Pinecone knowledge base')

  // First, delete existing website vectors
  try {
    await index.deleteMany({ type: 'website' })
    console.log('[Scraper] Deleted existing website vectors')
  } catch (error) {
    console.error('[Scraper] Failed to delete existing website vectors:', error)
  }

  for (const page of pages) {
    const fullContent = `${page.title}\n${page.description}\n${page.content}`
    const chunks = chunkText(fullContent) // Uses default 200 words for better RAG accuracy

    const fullWordCount = fullContent.split(/\s+/).length
    console.log(`[Scraper] Creating ${chunks.length} chunks for ${page.url} (${fullWordCount} words total, ${page.content.split(/\s+/).length} content words)`)

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
            description: chunk, // Store FULL chunk (no truncation)
            type: 'website',
            vectorType: 'website', // For vector type filtering
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

  console.log(`[Scraper] Created ${totalVectors} vectors in Pinecone`)

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
