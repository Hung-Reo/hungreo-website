#!/usr/bin/env tsx

/**
 * CLI tool to scrape website content and prepare it for document ingestion
 *
 * Usage:
 *   npx tsx scripts/scrape-website.ts <url> [options]
 *
 * Options:
 *   --output, -o    Output file path (default: scraped-content.txt)
 *   --selector, -s  CSS selector to extract specific content (optional)
 *   --help, -h      Show help
 *
 * Examples:
 *   npx tsx scripts/scrape-website.ts https://example.com
 *   npx tsx scripts/scrape-website.ts https://example.com -o output.txt
 *   npx tsx scripts/scrape-website.ts https://example.com -s "article.main-content"
 */

import * as fs from 'fs'
import * as path from 'path'

interface ScraperOptions {
  url: string
  output: string
  selector?: string
}

async function scrapeWebsite(options: ScraperOptions): Promise<void> {
  try {
    console.log(`📡 Fetching content from: ${options.url}`)

    const response = await fetch(options.url)
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const html = await response.text()
    console.log(`✅ Fetched ${html.length} characters`)

    // Extract text from HTML (simple version)
    let text = extractTextFromHTML(html, options.selector)

    // Clean up whitespace
    text = text
      .replace(/\s+/g, ' ')
      .replace(/\n\s*\n/g, '\n\n')
      .trim()

    console.log(`📝 Extracted ${text.length} characters of text`)

    // Save to file
    const outputPath = path.resolve(process.cwd(), options.output)
    fs.writeFileSync(outputPath, text, 'utf-8')

    console.log(`💾 Saved to: ${outputPath}`)
    console.log(`\n✨ Done! You can now upload this file to the admin document manager.`)
  } catch (error) {
    console.error('❌ Error:', error instanceof Error ? error.message : error)
    process.exit(1)
  }
}

function extractTextFromHTML(html: string, selector?: string): string {
  // Remove script and style tags
  let cleaned = html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
    .replace(/<!--[\s\S]*?-->/g, '')

  // If selector is provided, try to extract that specific content
  if (selector) {
    const selectorRegex = new RegExp(
      `<[^>]*class=["']?[^"']*${selector.replace('.', '')}[^"']*["']?[^>]*>([\\s\\S]*?)<\\/[^>]+>`,
      'gi'
    )
    const matches = cleaned.match(selectorRegex)
    if (matches && matches.length > 0) {
      cleaned = matches.join('\n')
    }
  }

  // Remove HTML tags
  cleaned = cleaned.replace(/<[^>]+>/g, ' ')

  // Decode HTML entities
  cleaned = cleaned
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&mdash;/g, '—')
    .replace(/&ndash;/g, '–')

  return cleaned
}

function showHelp() {
  console.log(`
Website Scraper CLI

Usage:
  npx tsx scripts/scrape-website.ts <url> [options]

Options:
  --output, -o <path>     Output file path (default: scraped-content.txt)
  --selector, -s <css>    CSS selector to extract specific content (optional)
  --help, -h              Show this help message

Examples:
  npx tsx scripts/scrape-website.ts https://example.com
  npx tsx scripts/scrape-website.ts https://example.com -o docs/content.txt
  npx tsx scripts/scrape-website.ts https://example.com -s ".main-article"
  `)
}

// Parse command line arguments
function parseArgs(): ScraperOptions | null {
  const args = process.argv.slice(2)

  if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
    showHelp()
    return null
  }

  const url = args[0]
  if (!url.startsWith('http')) {
    console.error('❌ Error: URL must start with http:// or https://')
    return null
  }

  let output = 'scraped-content.txt'
  let selector: string | undefined

  for (let i = 1; i < args.length; i++) {
    if ((args[i] === '--output' || args[i] === '-o') && args[i + 1]) {
      output = args[i + 1]
      i++
    } else if ((args[i] === '--selector' || args[i] === '-s') && args[i + 1]) {
      selector = args[i + 1]
      i++
    }
  }

  return { url, output, selector }
}

// Main execution
async function main() {
  const options = parseArgs()
  if (options) {
    await scrapeWebsite(options)
  }
}

main()
