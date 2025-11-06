/**
 * Script to generate embeddings for blog posts and projects
 * Run this script to populate Pinecone with vector embeddings
 *
 * Usage: npx tsx scripts/generate-embeddings.ts
 */

import * as fs from 'fs'
import * as path from 'path'
import { createEmbedding } from '../lib/openai'
import { getPineconeIndex } from '../lib/pinecone'

interface ContentMetadata {
  id: string
  title: string
  description: string
  type: 'blog' | 'project'
  slug: string
  date: string
  tags?: string[]
}

async function getContentFromDirectory(
  dir: string,
  type: 'blog' | 'project'
): Promise<ContentMetadata[]> {
  const contentPath = path.join(process.cwd(), 'content', dir)
  const files = fs.readdirSync(contentPath)

  const content: ContentMetadata[] = []

  for (const file of files) {
    if (!file.endsWith('.mdx')) continue

    const filePath = path.join(contentPath, file)
    const fileContent = fs.readFileSync(filePath, 'utf-8')

    // Extract frontmatter (simple regex)
    const frontmatterMatch = fileContent.match(/---\n([\s\S]*?)\n---/)
    if (!frontmatterMatch) continue

    const frontmatter = frontmatterMatch[1]
    const lines = frontmatter.split('\n')
    const meta: any = {}

    lines.forEach((line) => {
      const match = line.match(/^(\w+):\s*(.+)$/)
      if (match) {
        const key = match[1]
        let value = match[2].replace(/^["']|["']$/g, '')
        if (key === 'tags' && value.startsWith('[')) {
          value = JSON.parse(value.replace(/'/g, '"'))
        }
        meta[key] = value
      }
    })

    // Extract content (remove frontmatter)
    const contentBody = fileContent.replace(/---\n[\s\S]*?\n---\n/, '')

    content.push({
      id: `${type}-${file.replace('.mdx', '')}`,
      title: meta.title || '',
      description: meta.description || contentBody.substring(0, 200),
      type,
      slug: file.replace('.mdx', ''),
      date: meta.date || new Date().toISOString(),
      tags: Array.isArray(meta.tags) ? meta.tags : [],
    })
  }

  return content
}

async function generateEmbeddings() {
  console.log('🚀 Starting embedding generation...')

  // Get all blog posts and projects
  const blogPosts = await getContentFromDirectory('blog', 'blog')
  const projects = await getContentFromDirectory('projects', 'project')
  const allContent = [...blogPosts, ...projects]

  console.log(`📄 Found ${allContent.length} items to process`)

  // Get Pinecone index
  const index = await getPineconeIndex()

  // Generate embeddings and upsert to Pinecone
  for (const item of allContent) {
    console.log(`Processing: ${item.title}`)

    // Create text to embed (combine title, description, and tags)
    const textToEmbed = `${item.title}\n${item.description}\n${item.tags?.join(', ') || ''}`

    // Generate embedding
    const embedding = await createEmbedding(textToEmbed)

    // Upsert to Pinecone
    await index.upsert([
      {
        id: item.id,
        values: embedding,
        metadata: {
          title: item.title,
          description: item.description,
          type: item.type,
          slug: item.slug,
          date: item.date,
          tags: item.tags?.join(',') || '',
        },
      },
    ])

    console.log(`✅ Embedded: ${item.title}`)
  }

  console.log('🎉 Embedding generation complete!')
}

// Run the script
generateEmbeddings().catch((error) => {
  console.error('Error generating embeddings:', error)
  process.exit(1)
})
