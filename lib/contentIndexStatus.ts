/**
 * Client-safe (no Pinecone/OpenAI imports): turns the `index` field returned by the
 * admin blog/project save and delete APIs into a toast for the admin.
 */

import type { IndexResult } from './contentIndex'

export function describeIndexResult(
  index: IndexResult | undefined
): { kind: 'success' | 'warning'; message: string } | null {
  if (!index) return null
  switch (index.status) {
    case 'updated':
      return { kind: 'success', message: `Chatbot updated: ${index.vectors} chunk(s) for ${index.page}` }
    case 'removed':
      return { kind: 'success', message: `Removed from chatbot: ${index.page}` }
    case 'failed':
      return {
        kind: 'warning',
        message: `Saved, but the chatbot was not updated (${index.error || 'unknown error'}). Save again or run Scrape Website.`,
      }
    default:
      return null
  }
}
