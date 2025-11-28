/**
 * Migration Script: Convert project.learnings from string[] to { en: string[], vi: string[] }
 *
 * This script migrates existing projects to support bilingual learnings.
 * Run with: npx tsx scripts/migrate-project-learnings.ts
 */

import { kv } from '@vercel/kv'

interface OldProject {
  id: string
  learnings: string[] // Old format
  [key: string]: any
}

interface NewProject {
  id: string
  learnings: {
    en: string[]
    vi: string[]
  }
  [key: string]: any
}

async function migrateProjectLearnings() {
  console.log('[Migration] Starting project learnings migration...\n')

  try {
    // Get all project keys (format: project:UUID)
    const projectKeys = await kv.keys('project:*')
    // Filter out slug keys (we only want UUID keys)
    const projectUUIDKeys = projectKeys.filter(key => !key.includes(':slug:'))

    console.log(`[Migration] Found ${projectUUIDKeys.length} projects to migrate\n`)

    if (projectUUIDKeys.length === 0) {
      console.log('[Migration] No projects to migrate. Exiting.')
      return
    }

    let migratedCount = 0
    let skippedCount = 0
    let errorCount = 0

    for (const projectKey of projectUUIDKeys) {
      try {
        const project = await kv.get(projectKey) as OldProject | null
        const projectId = projectKey.replace('project:', '')

        if (!project) {
          console.log(`⚠️  Project ${projectId} not found, skipping...`)
          skippedCount++
          continue
        }

        // Check if already migrated
        if (project.learnings && typeof project.learnings === 'object' && 'en' in project.learnings) {
          console.log(`✓ Project "${project.id}" already migrated, skipping...`)
          skippedCount++
          continue
        }

        // Migrate: convert string[] to { en: string[], vi: [] }
        const oldLearnings = Array.isArray(project.learnings) ? project.learnings : []
        const newLearnings = {
          en: oldLearnings, // Keep existing learnings as English
          vi: [] // Empty Vietnamese learnings (to be filled by admin)
        }

        // Update project with new learnings format
        const updatedProject: NewProject = {
          ...project,
          learnings: newLearnings
        }

        await kv.set(projectKey, updatedProject)

        console.log(`✅ Migrated project "${project.id}"`)
        console.log(`   Old learnings (${oldLearnings.length} items): ${JSON.stringify(oldLearnings)}`)
        console.log(`   New learnings: { en: ${newLearnings.en.length} items, vi: ${newLearnings.vi.length} items }\n`)

        migratedCount++
      } catch (error: any) {
        console.error(`❌ Error migrating project ${projectKey}:`, error.message)
        errorCount++
      }
    }

    console.log('\n[Migration] Summary:')
    console.log(`✅ Successfully migrated: ${migratedCount}`)
    console.log(`⏭️  Skipped (already migrated): ${skippedCount}`)
    console.log(`❌ Errors: ${errorCount}`)
    console.log(`📊 Total: ${projectUUIDKeys.length}`)

    if (errorCount > 0) {
      console.log('\n⚠️  Some projects failed to migrate. Please check the errors above.')
    } else {
      console.log('\n🎉 Migration completed successfully!')
    }

  } catch (error: any) {
    console.error('[Migration] Fatal error:', error)
    throw error
  }
}

// Run migration
migrateProjectLearnings()
  .then(() => {
    console.log('\n[Migration] Script finished.')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n[Migration] Script failed:', error)
    process.exit(1)
  })
