/**
 * Reverse Migration Script: Convert project.learnings from { en: string[], vi: string[] } to string[]
 *
 * This script reverts the bilingual learnings structure back to a simple array.
 * English learnings will be kept as the unified learnings.
 * Run with: npx tsx scripts/revert-project-learnings.ts
 */

import { kv } from '@vercel/kv'

interface BilingualProject {
  id: string
  learnings: {
    en: string[]
    vi: string[]
  }
  [key: string]: any
}

interface SimpleProject {
  id: string
  learnings: string[]
  [key: string]: any
}

async function revertProjectLearnings() {
  console.log('[Reversion] Starting project learnings reversion...\n')

  try {
    // Get all project keys (format: project:UUID)
    const projectKeys = await kv.keys('project:*')
    // Filter out slug keys (we only want UUID keys)
    const projectUUIDKeys = projectKeys.filter(key => !key.includes(':slug:'))

    console.log(`[Reversion] Found ${projectUUIDKeys.length} projects to revert\n`)

    if (projectUUIDKeys.length === 0) {
      console.log('[Reversion] No projects to revert. Exiting.')
      return
    }

    let revertedCount = 0
    let skippedCount = 0
    let errorCount = 0

    for (const projectKey of projectUUIDKeys) {
      try {
        const project = await kv.get(projectKey) as BilingualProject | null
        const projectId = projectKey.replace('project:', '')

        if (!project) {
          console.log(`⚠️  Project ${projectId} not found, skipping...`)
          skippedCount++
          continue
        }

        // Check if already reverted (simple array)
        if (Array.isArray(project.learnings)) {
          console.log(`✓ Project "${project.id}" already has simple array format, skipping...`)
          skippedCount++
          continue
        }

        // Check if it has the bilingual structure
        if (project.learnings && typeof project.learnings === 'object' && 'en' in project.learnings) {
          // Revert: Use English learnings as the unified learnings
          const englishLearnings = Array.isArray(project.learnings.en) ? project.learnings.en : []

          // Update project with simple learnings format
          const updatedProject: SimpleProject = {
            ...project,
            learnings: englishLearnings
          }

          await kv.set(projectKey, updatedProject)

          console.log(`✅ Reverted project "${project.id}"`)
          console.log(`   Old format: { en: ${project.learnings.en.length} items, vi: ${project.learnings.vi?.length || 0} items }`)
          console.log(`   New format: ${englishLearnings.length} items (from English)`)
          console.log(`   Content: ${JSON.stringify(englishLearnings)}\n`)

          revertedCount++
        } else {
          // Learnings field has unexpected format
          console.log(`⚠️  Project "${project.id}" has unexpected learnings format, setting to empty array...`)
          const updatedProject = {
            ...project,
            learnings: []
          }
          await kv.set(projectKey, updatedProject)
          revertedCount++
        }
      } catch (error: any) {
        console.error(`❌ Error reverting project ${projectKey}:`, error.message)
        errorCount++
      }
    }

    console.log('\n[Reversion] Summary:')
    console.log(`✅ Successfully reverted: ${revertedCount}`)
    console.log(`⏭️  Skipped (already simple): ${skippedCount}`)
    console.log(`❌ Errors: ${errorCount}`)
    console.log(`📊 Total: ${projectUUIDKeys.length}`)

    if (errorCount > 0) {
      console.log('\n⚠️  Some projects failed to revert. Please check the errors above.')
    } else {
      console.log('\n🎉 Reversion completed successfully!')
    }

  } catch (error: any) {
    console.error('[Reversion] Fatal error:', error)
    throw error
  }
}

// Run reversion
revertProjectLearnings()
  .then(() => {
    console.log('\n[Reversion] Script finished.')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n[Reversion] Script failed:', error)
    process.exit(1)
  })
