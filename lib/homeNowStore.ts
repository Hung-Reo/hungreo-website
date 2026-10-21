/**
 * KV storage for the homepage "Building now / Learning now" block (server only).
 */

import { kv } from './kv'
import { parseHomeNow, type HomeNowContent } from './homeNow'

const KEY = 'content:home-now'

/** Stored block, or null when nothing is stored, the read fails or the data is invalid. */
export async function getHomeNow(): Promise<HomeNowContent | null> {
  try {
    const stored = await kv.get<unknown>(KEY)
    if (!stored) return null
    const parsed = parseHomeNow(stored)
    if (!parsed.ok) {
      console.error('[HomeNow] Stored content is invalid, using defaults:', parsed.error)
      return null
    }
    return parsed.content
  } catch (error) {
    // The homepage must render even if KV is down; it falls back to the defaults.
    console.error('[HomeNow] Failed to read content, using defaults:', error)
    return null
  }
}

export async function saveHomeNow(content: HomeNowContent, updatedBy: string): Promise<void> {
  await kv.set(KEY, { ...content, updatedAt: Date.now(), updatedBy })
}
