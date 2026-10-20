import { NextRequest, NextResponse } from 'next/server'
import { kv } from '@/lib/kv'
import {
  generateId,
  generateSlug,
  getBlogPost,
  getBlogPostBySlug,
  saveBlogPost,
} from '@/lib/contentManager'
import { checkIngestToken, buildIngestDraft } from '@/lib/thoughtIngest'
import { thoughtIngestRateLimit } from '@/lib/rateLimit'

export const runtime = 'nodejs'

const MAX_BODY_BYTES = 100_000

/**
 * POST /api/ingest/thought — OpenClaw creates a Living Thought DRAFT.
 * Auth: `Authorization: Bearer <THOUGHT_INGEST_TOKEN>` (fails closed when unset).
 * Never publishes and never edits an existing post; resending the same
 * externalId returns the draft created the first time.
 * Contract: docs/THOUGHT_INGEST_API.md
 */
export async function POST(req: NextRequest) {
  const tokenCheck = checkIngestToken(req.headers.get('authorization'), process.env.THOUGHT_INGEST_TOKEN)
  if (tokenCheck === 'not-configured') {
    return NextResponse.json({ error: 'Ingest is not enabled' }, { status: 503 })
  }
  if (tokenCheck !== 'ok') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { success } = await thoughtIngestRateLimit.limit('openclaw')
  if (!success) {
    return NextResponse.json({ error: 'Too many drafts, try again later' }, { status: 429 })
  }

  const raw = await req.text()
  if (raw.length > MAX_BODY_BYTES) {
    return NextResponse.json({ error: 'Body too large' }, { status: 413 })
  }
  let body: unknown
  try {
    body = JSON.parse(raw)
  } catch {
    return NextResponse.json({ error: 'Body must be valid JSON' }, { status: 400 })
  }

  const draft = buildIngestDraft(body, generateId(), Date.now())
  if (!draft.ok) {
    return NextResponse.json({ error: draft.error }, { status: 400 })
  }

  const origin = new URL(req.url).origin
  const mappingKey = `ingest:thought:${draft.externalId}`

  // Idempotent: the agent may retry after a timeout.
  const existingId = await kv.get<string>(mappingKey)
  if (existingId) {
    const existing = await getBlogPost(existingId)
    if (existing) {
      return NextResponse.json({
        success: true,
        duplicate: true,
        id: existing.id,
        status: existing.status,
        adminUrl: `${origin}/admin/content/blog/${existing.id}`,
      })
    }
  }

  // Never take over another post's URL.
  let slug = generateSlug(draft.post.en.title) || 'thought'
  if (await getBlogPostBySlug(slug)) {
    slug = `${slug}-${draft.post.id.slice(0, 8)}`
  }

  await saveBlogPost({ ...draft.post, slug })
  await kv.set(mappingKey, draft.post.id)

  console.log(`[Ingest] Draft ${draft.post.id} created from ${draft.externalId}`)

  return NextResponse.json(
    {
      success: true,
      duplicate: false,
      id: draft.post.id,
      status: 'draft',
      adminUrl: `${origin}/admin/content/blog/${draft.post.id}`,
    },
    { status: 201 }
  )
}
