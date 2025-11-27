/**
 * Website Auto-Scraper with Puppeteer
 * Automatically scrapes content from all public pages with full React rendering
 */

import puppeteer from 'puppeteer-core'
import chromium from '@sparticuz/chromium'
import { getPineconeIndex, listAllVectorIds } from './pinecone'
import { createEmbedding } from './openai'
import { chunkText } from './textUtils'
import { getAllProjects, getAllBlogPosts } from './contentManager'

export interface ScrapedPage {
  url: string
  title: string
  description: string
  content: string
  lastScraped: number
}

type ProgressCallback = (info: {
  message: string
  current?: number
  total?: number
}) => Promise<void> | void

// Use production URL on Vercel, localhost for local development
const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ||
                 (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000')

const STATIC_PAGES = [
  '/',
  '/about',
  '/projects',
  '/blog',
  '/contact',
]

/**
 * Get all dynamic pages (blog posts and projects)
 */
async function getDynamicPages(): Promise<string[]> {
  const dynamicPages: string[] = []

  try {
    // Get all published projects
    const projects = await getAllProjects()
    const publishedProjects = projects.filter(p => p.status === 'published')
    publishedProjects.forEach(p => {
      dynamicPages.push(`/projects/${p.slug}`)
    })

    // Get all published blog posts
    const blogPosts = await getAllBlogPosts()
    const publishedPosts = blogPosts.filter(p => p.status === 'published')
    publishedPosts.forEach(p => {
      dynamicPages.push(`/blog/${p.slug}`)
    })

    console.log(`[Scraper] Found ${publishedProjects.length} projects and ${publishedPosts.length} blog posts`)
  } catch (error) {
    console.error('[Scraper] Failed to fetch dynamic pages:', error)
  }

  return dynamicPages
}

/**
 * Expand selected pages to include dynamic children
 * If user selects /blog, include all /blog/[slug] pages
 * If user selects /projects, include all /projects/[slug] pages
 */
export async function expandSelectedPages(selectedPages: string[]): Promise<string[]> {
  const expandedPages = new Set<string>()

  // Add all originally selected pages
  selectedPages.forEach(page => expandedPages.add(page))

  // Check if /blog or /projects is selected
  const needsBlogPages = selectedPages.includes('/blog')
  const needsProjectPages = selectedPages.includes('/projects')

  if (needsBlogPages || needsProjectPages) {
    try {
      if (needsBlogPages) {
        const blogPosts = await getAllBlogPosts()
        const publishedPosts = blogPosts.filter(p => p.status === 'published')
        publishedPosts.forEach(p => {
          expandedPages.add(`/blog/${p.slug}`)
        })
        console.log(`[Scraper] Expanded /blog to include ${publishedPosts.length} blog posts`)
      }

      if (needsProjectPages) {
        const projects = await getAllProjects()
        const publishedProjects = projects.filter(p => p.status === 'published')
        publishedProjects.forEach(p => {
          expandedPages.add(`/projects/${p.slug}`)
        })
        console.log(`[Scraper] Expanded /projects to include ${publishedProjects.length} projects`)
      }
    } catch (error) {
      console.error('[Scraper] Failed to expand pages:', error)
    }
  }

  return Array.from(expandedPages)
}

/**
 * Get browser launch options based on environment
 */
async function getBrowserOptions() {
  // Check if running locally (has Chrome/Chromium installed)
  // Vercel sets VERCEL=1 and AWS_REGION, check both
  const isProduction = process.env.VERCEL === '1' || process.env.AWS_EXECUTION_ENV || process.env.AWS_REGION
  const isLocal = process.env.NODE_ENV === 'development' && !isProduction

  if (isLocal) {
    // Local development - use system Chrome
    return {
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
      executablePath: process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    }
  } else {
    // Production (Vercel) - use serverless Chromium
    console.log('[Scraper] Using serverless Chromium for production')

    return {
      args: chromium.args,
      executablePath: await chromium.executablePath(), // NO argument - let package handle it
      headless: true, // Always headless in serverless
    }
  }
}

/**
 * Scrape a single page using Puppeteer for full React rendering
 * @param browser - Existing browser instance (reused across pages)
 * @param path - Path to scrape
 */
async function scrapePageWithBrowser(browser: any, path: string): Promise<ScrapedPage> {
  let page

  try {
    const url = `${BASE_URL}${path}`
    console.log(`[Scraper] Navigating to ${url}`)

    // Create new page in existing browser
    page = await browser.newPage()

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

    console.log(`[Scraper] Page loaded, extracting content from ${url}`)

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

    // Close page but NOT browser (reused across scrapes)
    await page.close()

    return {
      url: path,
      title: pageData.title.trim(),
      description: pageData.description.trim(),
      content: cleanedContent,
      lastScraped: Date.now(),
    }
  } catch (error) {
    console.error(`[Scraper] Failed to scrape ${path}:`, error)
    if (page) {
      await page.close().catch(() => {})
    }
    throw new Error(`Failed to scrape ${path}: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Scrape all website pages using a single browser instance
 * Includes both static pages and dynamic content (blog posts, projects)
 */
export async function scrapeAllPages(): Promise<ScrapedPage[]> {
  const pages: ScrapedPage[] = []
  let browser

  // Get all pages to scrape (static + dynamic)
  const dynamicPages = await getDynamicPages()
  const allPages = [...STATIC_PAGES, ...dynamicPages]

  console.log(`[Scraper] Starting to scrape ${allPages.length} pages (${STATIC_PAGES.length} static + ${dynamicPages.length} dynamic)`)

  try {
    // Launch browser ONCE
    console.log('[Scraper] Launching browser...')
    browser = await puppeteer.launch(await getBrowserOptions())
    console.log('[Scraper] Browser launched successfully')

    // Scrape each page sequentially using the same browser
    for (const path of allPages) {
      try {
        const page = await scrapePageWithBrowser(browser, path)
        pages.push(page)
        console.log(`[Scraper] ✅ Successfully scraped ${path}`)
      } catch (error) {
        console.error(`[Scraper] ❌ Skipping ${path} due to error:`, error)
      }
    }
  } catch (error) {
    console.error('[Scraper] Failed to launch browser:', error)
  } finally {
    // Always close browser at the end
    if (browser) {
      console.log('[Scraper] Closing browser...')
      await browser.close().catch(() => {})
      console.log('[Scraper] Browser closed')
    }
  }

  console.log(`[Scraper] Scraped ${pages.length}/${allPages.length} pages successfully`)

  return pages
}

/**
 * Update Pinecone with scraped content
 */
export async function updateKnowledgeBase(pages: ScrapedPage[]): Promise<number> {
  const index = await getPineconeIndex()
  let totalVectors = 0

  console.log('[Scraper] Updating Pinecone knowledge base')

  // First, delete existing website vectors using proper pagination (no topK limit)
  try {
    console.log('[Scraper] Listing all existing website vectors...')
    const vectorIdsToDelete = await listAllVectorIds({ vectorType: 'website' })

    if (vectorIdsToDelete.length > 0) {
      console.log(`[Scraper] Deleting ${vectorIdsToDelete.length} existing website vectors...`)
      const BATCH_SIZE = 100
      for (let i = 0; i < vectorIdsToDelete.length; i += BATCH_SIZE) {
        const batch = vectorIdsToDelete.slice(i, i + BATCH_SIZE)
        await index.deleteMany(batch)
      }
      console.log('[Scraper] Deleted existing website vectors')
    } else {
      console.log('[Scraper] No existing website vectors to delete')
    }
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

/**
 * Scrape and update only specific pages
 * @param pagePaths - Array of page paths to scrape (e.g., ['/contact', '/about'])
 */
export async function scrapeSelectedPages(
  pagePaths: string[],
  onProgress?: ProgressCallback
): Promise<{
  pagesScraped: number
  totalVectors: number
  errors: string[]
}> {
  const errors: string[] = []
  const pages: ScrapedPage[] = []
  let browser

  console.log(`[Selective Scraper] Starting to scrape ${pagePaths.length} pages:`, pagePaths)
  await onProgress?.({
    message: `Starting to scrape ${pagePaths.length} page(s)`,
    current: 0,
    total: pagePaths.length,
  })

  try {
    // Launch browser
    console.log('[Selective Scraper] Launching browser...')
    browser = await puppeteer.launch(await getBrowserOptions())
    console.log('[Selective Scraper] Browser launched successfully')

    // Scrape each selected page
    for (let i = 0; i < pagePaths.length; i++) {
      const path = pagePaths[i]
      try {
        await onProgress?.({
          message: `Scraping ${path} (${i + 1}/${pagePaths.length})`,
          current: i + 1,
          total: pagePaths.length,
        })
        const page = await scrapePageWithBrowser(browser, path)
        pages.push(page)
        console.log(`[Selective Scraper] ✅ Successfully scraped ${path}`)
      } catch (error: any) {
        console.error(`[Selective Scraper] ❌ Failed to scrape ${path}:`, error)
        errors.push(`${path}: ${error.message}`)
      }
    }
  } catch (error: any) {
    console.error('[Selective Scraper] Failed to launch browser:', error)
    errors.push(`Browser launch failed: ${error.message}`)
    return { pagesScraped: 0, totalVectors: 0, errors }
  } finally {
    if (browser) {
      console.log('[Selective Scraper] Closing browser...')
      await browser.close().catch(() => {})
    }
  }

  if (pages.length === 0) {
    errors.push('No pages were successfully scraped')
    return { pagesScraped: 0, totalVectors: 0, errors }
  }

  // Create embeddings and store in Pinecone
  const index = await getPineconeIndex()
  let totalVectors = 0

  for (let pageIndex = 0; pageIndex < pages.length; pageIndex++) {
    const page = pages[pageIndex]
    const fullContent = `${page.title}\n${page.description}\n${page.content}`
    // Allow smaller chunks for website pages
    const chunks = chunkText(fullContent, 200, 50)

    console.log(`[Selective Scraper] Creating ${chunks.length} chunks for ${page.url}`)
    await onProgress?.({
      message: `Embedding ${page.url} (${pageIndex + 1}/${pages.length}) with ${chunks.length} chunks`,
      current: pageIndex + 1,
      total: pages.length,
    })

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
            description: chunk,
            type: 'website',
            vectorType: 'website',
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

  console.log(`[Selective Scraper] Successfully scraped ${pages.length} pages with ${totalVectors} vectors`)

  return {
    pagesScraped: pages.length,
    totalVectors,
    errors,
  }
}
