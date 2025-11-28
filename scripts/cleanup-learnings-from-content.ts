/**
 * Cleanup Script: Remove "Key Learnings" section from project content
 *
 * This script removes the Key Learnings section from project.en.content and project.vi.content
 * to avoid duplication with the structured learnings array.
 * Run with: npx tsx scripts/cleanup-learnings-from-content.ts
 */

import { kv } from '@vercel/kv'

interface Project {
  id: string
  en: {
    title: string
    description: string
    content: string
  }
  vi: {
    title: string
    description: string
    content: string
  }
  [key: string]: any
}

function removeKeyLearningsSection(content: string): string {
  if (!content) return content

  // Remove Key Learnings section with various heading formats
  // Matches: ## Key Learnings, ### Key Learnings, <h2>Key Learnings</h2>, etc.
  const patterns = [
    // Markdown format
    /#{1,6}\s*Key Learnings[\s\S]*?(?=#{1,6}\s|\n\n---|\n\n##|$)/gi,
    // HTML format
    /<h[1-6][^>]*>Key Learnings<\/h[1-6]>[\s\S]*?(?=<h[1-6]|$)/gi,
    // Vietnamese
    /#{1,6}\s*Bài học quan trọng[\s\S]*?(?=#{1,6}\s|\n\n---|\n\n##|$)/gi,
    /<h[1-6][^>]*>Bài học quan trọng<\/h[1-6]>[\s\S]*?(?=<h[1-6]|$)/gi,
  ]

  let cleanedContent = content

  for (const pattern of patterns) {
    cleanedContent = cleanedContent.replace(pattern, '')
  }

  // Clean up multiple consecutive newlines
  cleanedContent = cleanedContent.replace(/\n{3,}/g, '\n\n')

  // Trim whitespace
  cleanedContent = cleanedContent.trim()

  return cleanedContent
}

async function cleanupLearningsFromContent() {
  console.log('[Cleanup] Starting removal of Key Learnings from project content...\n')

  try {
    // Get all project keys (format: project:UUID)
    const projectKeys = await kv.keys('project:*')
    // Filter out slug keys (we only want UUID keys)
    const projectUUIDKeys = projectKeys.filter(key => !key.includes(':slug:'))

    console.log(`[Cleanup] Found ${projectUUIDKeys.length} projects to process\n`)

    if (projectUUIDKeys.length === 0) {
      console.log('[Cleanup] No projects to process. Exiting.')
      return
    }

    let cleanedCount = 0
    let skippedCount = 0
    let errorCount = 0

    for (const projectKey of projectUUIDKeys) {
      try {
        const project = await kv.get(projectKey) as Project | null
        const projectId = projectKey.replace('project:', '')

        if (!project) {
          console.log(`⚠️  Project ${projectId} not found, skipping...`)
          skippedCount++
          continue
        }

        const originalEnContent = project.en?.content || ''
        const originalViContent = project.vi?.content || ''

        const cleanedEnContent = removeKeyLearningsSection(originalEnContent)
        const cleanedViContent = removeKeyLearningsSection(originalViContent)

        // Check if any changes were made
        const enChanged = cleanedEnContent !== originalEnContent
        const viChanged = cleanedViContent !== originalViContent

        if (!enChanged && !viChanged) {
          console.log(`✓ Project "${project.id || projectId}" - No Key Learnings section found, skipping...`)
          skippedCount++
          continue
        }

        // Update project with cleaned content
        const updatedProject = {
          ...project,
          en: {
            ...project.en,
            content: cleanedEnContent
          },
          vi: {
            ...project.vi,
            content: cleanedViContent
          }
        }

        await kv.set(projectKey, updatedProject)

        console.log(`✅ Cleaned project "${project.id || projectId}"`)
        if (enChanged) {
          console.log(`   EN: Removed Key Learnings section (${originalEnContent.length} → ${cleanedEnContent.length} chars)`)
        }
        if (viChanged) {
          console.log(`   VI: Removed Key Learnings section (${originalViContent.length} → ${cleanedViContent.length} chars)`)
        }
        console.log()

        cleanedCount++
      } catch (error: any) {
        console.error(`❌ Error processing project ${projectKey}:`, error.message)
        errorCount++
      }
    }

    console.log('\n[Cleanup] Summary:')
    console.log(`✅ Successfully cleaned: ${cleanedCount}`)
    console.log(`⏭️  Skipped (no changes needed): ${skippedCount}`)
    console.log(`❌ Errors: ${errorCount}`)
    console.log(`📊 Total: ${projectUUIDKeys.length}`)

    if (errorCount > 0) {
      console.log('\n⚠️  Some projects failed to process. Please check the errors above.')
    } else {
      console.log('\n🎉 Cleanup completed successfully!')
    }

  } catch (error: any) {
    console.error('[Cleanup] Fatal error:', error)
    throw error
  }
}

// Run cleanup
cleanupLearningsFromContent()
  .then(() => {
    console.log('\n[Cleanup] Script finished.')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n[Cleanup] Script failed:', error)
    process.exit(1)
  })
