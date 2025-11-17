/**
 * Migration script: MDX Projects → Vercel KV
 *
 * Usage: npx tsx scripts/migrate-projects-to-kv.ts
 *
 * This script migrates existing MDX project files to the CMS.
 * It reads from content/projects/*.mdx and creates entries in Vercel KV.
 */

import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'
import { saveProject, generateSlug, generateId } from '../lib/contentManager'
import type { Project } from '../lib/contentManager'

const PROJECTS_DIR = path.join(process.cwd(), 'content', 'projects')

async function migrateProjects() {
  console.log('🚀 Starting Projects migration to KV...\n')

  // Check if directory exists
  if (!fs.existsSync(PROJECTS_DIR)) {
    console.log(`❌ Projects directory not found: ${PROJECTS_DIR}`)
    console.log('ℹ️  No projects to migrate.')
    return
  }

  // Read all MDX files
  const files = fs.readdirSync(PROJECTS_DIR).filter(f => f.endsWith('.mdx'))

  if (files.length === 0) {
    console.log('ℹ️  No MDX files found in content/projects/')
    return
  }

  console.log(`📁 Found ${files.length} project(s) to migrate\n`)

  let successCount = 0
  let errorCount = 0

  for (const file of files) {
    try {
      const filePath = path.join(PROJECTS_DIR, file)
      const fileContent = fs.readFileSync(filePath, 'utf-8')
      const { data: frontmatter, content } = matter(fileContent)

      // Extract project slug from filename
      const slug = frontmatter.slug || generateSlug(file.replace('.mdx', ''))

      const now = Date.now()
      const createdAt = frontmatter.date ? new Date(frontmatter.date).getTime() : now
      const project: Project = {
        id: generateId(),
        slug,
        status: frontmatter.published === false ? 'draft' : 'published',
        featured: frontmatter.featured === true,
        createdAt,
        updatedAt: now,
        publishedAt: frontmatter.published !== false ? createdAt : undefined,
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
        techStack: Array.isArray(frontmatter.tech) ? frontmatter.tech : [],
        learnings: Array.isArray(frontmatter.learnings) ? frontmatter.learnings : [],
        githubUrl: frontmatter.github || frontmatter.githubUrl,
        demoUrl: frontmatter.demo || frontmatter.demoUrl,
        featuredImage: frontmatter.image || frontmatter.featuredImage,
        screenshots: Array.isArray(frontmatter.screenshots) ? frontmatter.screenshots : [],
      }

      await saveProject(project)

      console.log(`✅ Migrated: ${project.en.title} (${slug})`)
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
migrateProjects()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Fatal error:', error)
    process.exit(1)
  })
