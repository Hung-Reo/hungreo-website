/**
 * Draft ingestion from OpenClaw (Hung's Telegram agent) into the blog CMS.
 *
 * The agent works on untrusted material (YouTube/X content, chat logs), so the
 * endpoint can only ever create a DRAFT: no publish, no edits to existing posts,
 * no featured flag. Every draft also carries a privacy check that Hung must tick
 * himself before the publish gate in lib/livingThought.ts lets it go public.
 */

import { createHash, timingSafeEqual } from 'crypto'
import { normalizeLivingThought, type Uncertainty } from './livingThought'
import type { BlogPost } from './contentManager'

export const PRIVACY_CHECK_ID = 'privacy-check'
const PRIVACY_CHECK_QUESTION =
  'Kiểm tra quyền riêng tư: bài không có tên, ảnh, trường học hay chi tiết nhận dạng của con hoặc người khác?'

const MIN_TOKEN_LENGTH = 32
const EXTERNAL_ID_RE = /^[A-Za-z0-9:_-]{1,100}$/
const MAX_TAGS = 10
const MAX_CONTENT = 60_000 // Markdown per language; the route also caps the body at 100 KB

export type TokenCheck = 'ok' | 'unauthorized' | 'not-configured'

function digest(value: string): Buffer {
  return createHash('sha256').update(value).digest()
}

/** Constant-time check of `Authorization: Bearer <token>` against the env token. */
export function checkIngestToken(header: string | null, expected: string | undefined): TokenCheck {
  if (!expected || expected.length < MIN_TOKEN_LENGTH) return 'not-configured'
  if (!header || !header.startsWith('Bearer ')) return 'unauthorized'
  const provided = header.slice('Bearer '.length)
  return timingSafeEqual(digest(provided), digest(expected)) ? 'ok' : 'unauthorized'
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function text(value: unknown, max: number): string {
  return typeof value === 'string' ? value.trim().slice(0, max) : ''
}

function wordCount(value: string): number {
  return value ? value.split(/\s+/).filter(Boolean).length : 0
}

function slugTag(tag: unknown): string {
  return text(tag, 50)
    .toLowerCase()
    .replace(/[^\p{L}\p{N}_\s-]/gu, '')
    .replace(/\s+/g, '-')
}

export type IngestDraftResult =
  | { ok: true; externalId: string; post: Omit<BlogPost, 'slug'> }
  | { ok: false; error: string }

/** Validates the agent payload and builds a draft post (slug is set by the route). */
export function buildIngestDraft(input: unknown, id: string, now: number): IngestDraftResult {
  if (!isRecord(input)) return { ok: false, error: 'Body must be a JSON object' }

  const externalId = typeof input.externalId === 'string' ? input.externalId : ''
  if (!EXTERNAL_ID_RE.test(externalId)) {
    return { ok: false, error: 'externalId is required (1-100 chars: letters, digits, : _ -)' }
  }

  const en = isRecord(input.en) ? input.en : {}
  const vi = isRecord(input.vi) ? input.vi : {}
  const enTitle = text(en.title, 150)
  const enExcerpt = text(en.excerpt, 300)
  const viTitle = text(vi.title, 150)
  const viExcerpt = text(vi.excerpt, 300)
  if (!enTitle || !enExcerpt || !viTitle || !viExcerpt) {
    return { ok: false, error: 'en.title, en.excerpt, vi.title and vi.excerpt are required' }
  }

  // Article mode: an already-approved Markdown body, kept verbatim (no truncation).
  const rawViContent = typeof vi.content === 'string' ? vi.content.trim() : ''
  const rawEnContent = typeof en.content === 'string' ? en.content.trim() : ''
  if (rawViContent.length > MAX_CONTENT || rawEnContent.length > MAX_CONTENT) {
    return { ok: false, error: `vi.content / en.content must be at most ${MAX_CONTENT} characters` }
  }

  const living = normalizeLivingThought({
    occurredAt: input.occurredAt,
    structuredContent: input.structuredContent,
    uncertainties: input.uncertainties,
  })
  if (!living.structuredContent && !rawViContent && !rawEnContent) {
    return {
      ok: false,
      error: 'structuredContent (Living Thought) or vi.content / en.content (article Markdown) is required',
    }
  }

  // Only Hung resolves questions, in the admin UI.
  const uncertainties: Uncertainty[] = (living.uncertainties || [])
    .filter((item) => item.id !== PRIVACY_CHECK_ID)
    .map((item) => ({ ...item, resolved: false }))
  uncertainties.unshift({ id: PRIVACY_CHECK_ID, question: PRIVACY_CHECK_QUESTION, resolved: false })

  const tags = (Array.isArray(input.tags) ? input.tags : [])
    .map(slugTag)
    .filter(Boolean)
    .filter((tag, i, all) => all.indexOf(tag) === i)
    .slice(0, MAX_TAGS)

  return {
    ok: true,
    externalId,
    post: {
      id,
      status: 'draft',
      featured: false,
      createdAt: now,
      updatedAt: now,
      createdBy: 'openclaw',
      en: { title: enTitle, excerpt: enExcerpt, content: rawEnContent },
      vi: { title: viTitle, excerpt: viExcerpt, content: rawViContent },
      category: text(input.category, 50) || 'Uncategorized',
      tags,
      readTime: Math.max(1, Math.ceil(wordCount(rawViContent || rawEnContent) / 200)),
      occurredAt: living.occurredAt,
      structuredContent: living.structuredContent,
      uncertainties,
    },
  }
}
