import type { VideoCategory } from './videoManager'

/**
 * URL slug ↔ video category. Single source of truth for the /tools/knowledge
 * routes and the sitemap; previously duplicated in both page files.
 */
export const CATEGORY_MAPPINGS: Record<string, { name: string; category: VideoCategory }> = {
  'leadership': { name: 'Leadership', category: 'Leadership' },
  'ai-works': { name: 'AI Works', category: 'AI Works' },
  'health': { name: 'Health', category: 'Health' },
  'entertaining': { name: 'Entertaining', category: 'Entertaining' },
  'human-philosophy': { name: 'Human Philosophy', category: 'Human Philosophy' },
}

export const CATEGORY_SLUGS = Object.keys(CATEGORY_MAPPINGS)

/** Reverse lookup so a stored category can be turned back into its URL slug. */
export function categorySlugFor(category: VideoCategory): string | undefined {
  return CATEGORY_SLUGS.find((slug) => CATEGORY_MAPPINGS[slug].category === category)
}

/**
 * Build the detail-page slug. The route resolves a video by the trailing 11
 * characters, so the title part is cosmetic — but sitemap and links must agree.
 */
export function createVideoSlug(videoId: string, title: string, fallbackTitle?: string): string {
  const effectiveTitle = title.trim() || fallbackTitle || 'video'
  const titleSlug = effectiveTitle
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .substring(0, 50)
  return `${titleSlug}-${videoId}`
}
