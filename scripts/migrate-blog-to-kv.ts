/**
 * Migration script: MDX Blog Posts → Vercel KV
 *
 * Usage: npx tsx scripts/migrate-blog-to-kv.ts
 *
 * This script migrates existing MDX blog post files to the CMS.
 * It reads from content/blog/*.mdx and creates entries in Vercel KV.
 */

import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'
import { saveBlogPost, generateSlug, generateId, calculateReadingTime } from '../lib/contentManager'
import type { BlogPost } from '../lib/contentManager'

const BLOG_DIR = path.join(process.cwd(), 'content', 'blog')

async function migrateBlogPosts() {
  console.log('🚀 Starting Blog Posts migration to KV...\n')

  // Check if directory exists
  if (!fs.existsSync(BLOG_DIR)) {
    console.log(`❌ Blog directory not found: ${BLOG_DIR}`)
    console.log('ℹ️  No blog posts to migrate.')
    return
  }

  // Read all MDX files
  const files = fs.readdirSync(BLOG_DIR).filter(f => f.endsWith('.mdx'))

  if (files.length === 0) {
    console.log('ℹ️  No MDX files found in content/blog/')
    return
  }

  console.log(`📁 Found ${files.length} blog post(s) to migrate\n`)

  let successCount = 0
  let errorCount = 0

  for (const file of files) {
    try {
      const filePath = path.join(BLOG_DIR, file)
      const fileContent = fs.readFileSync(filePath, 'utf-8')
      const { data: frontmatter, content } = matter(fileContent)

      // Extract slug from filename
      const slug = frontmatter.slug || generateSlug(file.replace('.mdx', ''))

      const publishedAt = frontmatter.date ? new Date(frontmatter.date).getTime() : undefined
      const readingTime = calculateReadingTime(content || '')

      const post: BlogPost = {
        id: generateId(),
        slug,
        status: frontmatter.published === false ? 'draft' : 'published',
        createdAt: publishedAt || Date.now(),
        updatedAt: Date.now(),
        publishedAt: frontmatter.published !== false ? publishedAt : undefined,
        createdBy: 'migration-script',
        en: {
          title: frontmatter.title || '',
          description: frontmatter.description || '',
          content: content || '',
        },
        vi: {
          title: frontmatter.titleVi || '',
          description: frontmatter.descriptionVi || '',
          content: frontmatter.contentVi || '',
        },
        tags: Array.isArray(frontmatter.tags) ? frontmatter.tags : [],
        image: frontmatter.image,
        featured: frontmatter.featured === true,
        readingTime,
      }

      await saveBlogPost(post)

      console.log(`✅ Migrated: ${post.en.title} (${slug})`)
      successCount++
    } catch (error) {
      console.error(`❌ Error migrating ${file}:`, error)
      errorCount++
    }
  }

  console.log(`\n✨ Migration complete!`)
  console.log(`   ✅ Success: ${successCount}`)
  console.log(`   ❌ Errors: ${errorCount}`)
}

// Run migration
migrateBlogPosts()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Fatal error:', error)
    process.exit(1)
  })
