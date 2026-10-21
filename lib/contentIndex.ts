/**
 * Content Index (MVP-3)
 * Keeps the chatbot's Pinecone index in step with the CMS: saving a published blog
 * post or project re-indexes that one page; unpublishing, deleting or changing the
 * slug removes the old page. Before this, the admin had to press "Scrape Website".
 *
 * Vector IDs and metadata match lib/websiteScraper.ts (`website_<path>_chunk_<n>`,
 * type 'website'), so a later full "Scrape Website" overwrites these chunks in place.
 */

import { chunkText } from './textUtils'
import type { BlogPost, Project } from './contentManager'

export type ContentKind = 'blog' | 'projects'

export interface IndexDocument {
  page: string
  title: string
  text: string
}

export interface IndexResult {
  status: 'updated' | 'removed' | 'skipped' | 'failed'
  page?: string
  vectors: number
  removed: number
  error?: string
}

interface VectorRecord {
  id: string
  values: number[]
  metadata: Record<string, string | number>
}

export interface IndexDeps {
  /** One embedding per input text, in input order */
  embed: (texts: string[]) => Promise<number[][]>
  index: {
    listPaginated: (options: { prefix?: string; limit?: number; paginationToken?: string }) => Promise<{
      vectors?: Array<{ id?: string }>
      pagination?: { next?: string }
    }>
    upsert: (records: VectorRecord[]) => Promise<unknown>
    deleteMany: (ids: string[]) => Promise<unknown>
  }
}

// Same chunking as the scraper uses for blog/project pages
const CHUNK_WORDS = 500
const CHUNK_OVERLAP = 100
// 3072-dim vectors + chunk text are ~100 KB each; keep requests well under Pinecone's 2 MB limit
const UPSERT_BATCH = 20
const DELETE_BATCH = 100

export function pageVectorPrefix(page: string): string {
  return `website_${page.replace(/\//g, '_')}_chunk_`
}

/**
 * The public page sanitizes Markdown with DOMPurify, which drops HTML comments and
 * <script>/<style>. Remove the same here so nothing hidden from readers is indexed.
 */
function visibleText(value: string | undefined): string {
  return (value || '')
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1\s*>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .trim()
}

function section(label: string, body: string | undefined): string {
  const text = visibleText(body)
  return text ? `${label}\n${text}` : ''
}

function joinBlocks(blocks: string[]): string {
  return blocks.filter(Boolean).join('\n\n')
}

/**
 * Text a reader sees on /blog/[slug], in both languages. AI editorial notes and
 * uncertainties are left out: the page marks AI notes data-index-exclude so the
 * chatbot never quotes them as Hung's words, and uncertainties are admin-only.
 */
export function buildBlogIndexDocument(post: BlogPost): IndexDocument {
  const languages = [
    { lang: 'en' as const, labels: { context: 'Context', voice: "Hung's own words", evolution: 'How my thinking changed', article: 'Article' } },
    { lang: 'vi' as const, labels: { context: 'Bối cảnh', voice: 'Lời gốc của Hưng', evolution: 'Tư duy thay đổi theo thời gian', article: 'Bài viết' } },
  ]

  const blocks = languages.map(({ lang, labels }) => {
    const fields = post[lang]
    const thought = post.structuredContent?.[lang]
    const evolution = (post.thoughtEvolution || [])
      .map((entry) => {
        const note = lang === 'en' ? entry.noteEn : entry.noteVi
        return note?.trim() ? `${entry.date}: ${note.trim()}` : ''
      })
      .filter(Boolean)
      .join('\n')

    const body = joinBlocks([
      section(labels.context, thought?.context),
      section(labels.voice, thought?.originalVoice),
      section(labels.evolution, evolution),
      section(labels.article, fields?.content),
    ])
    const header = joinBlocks([fields?.title?.trim() || '', fields?.excerpt?.trim() || ''])
    return body || header ? joinBlocks([header, body]) : ''
  })

  return {
    page: `/blog/${post.slug}`,
    title: post.en?.title || post.vi?.title || post.slug,
    text: joinBlocks(blocks),
  }
}

export function buildProjectIndexDocument(project: Project): IndexDocument {
  const languages = [
    { lang: 'en' as const, project: 'Project', tech: 'Tech stack', learnings: 'Key Learnings' },
    { lang: 'vi' as const, project: 'Dự án', tech: 'Công nghệ', learnings: 'Bài học' },
  ]

  const blocks = languages.map(({ lang, ...labels }) => {
    const fields = project[lang]
    const body = joinBlocks([
      fields?.title?.trim() || '',
      fields?.description?.trim() || '',
      section(labels.project, fields?.content),
    ])
    return body
  })

  return {
    page: `/projects/${project.slug}`,
    title: project.en?.title || project.vi?.title || project.slug,
    text: joinBlocks([
      ...blocks,
      section('Tech stack', (project.techStack || []).join(', ')),
      section('Key Learnings', (project.learnings || []).join('\n')),
    ]),
  }
}

async function listPageVectorIds(page: string, deps: IndexDeps): Promise<string[]> {
  const prefix = pageVectorPrefix(page)
  // Prefix "…_blog_foo_chunk_" cannot match "…_blog_foo-bar_chunk_", but check the
  // whole shape anyway so an unexpected ID is never deleted.
  const exact = new RegExp(`^${prefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\d+$`)
  const ids: string[] = []
  let paginationToken: string | undefined
  do {
    const response = await deps.index.listPaginated({ prefix, limit: 100, paginationToken })
    for (const vector of response.vectors || []) {
      if (vector.id && exact.test(vector.id)) ids.push(vector.id)
    }
    paginationToken = response.pagination?.next
  } while (paginationToken)
  return ids
}

async function deleteIds(ids: string[], deps: IndexDeps) {
  for (let i = 0; i < ids.length; i += DELETE_BATCH) {
    await deps.index.deleteMany(ids.slice(i, i + DELETE_BATCH))
  }
}

/**
 * Embeds every chunk first, then upserts, then deletes leftover chunks of this page.
 * An embedding failure therefore writes nothing and the old vectors stay live.
 */
async function indexPage(doc: IndexDocument, deps: IndexDeps): Promise<{ vectors: number; removed: number }> {
  const existing = await listPageVectorIds(doc.page, deps)
  const chunks = chunkText(doc.text, CHUNK_WORDS, CHUNK_OVERLAP)
  const prefix = pageVectorPrefix(doc.page)
  const lastScraped = Date.now()

  const embeddings = chunks.length > 0 ? await deps.embed(chunks) : []
  if (embeddings.length !== chunks.length) {
    throw new Error(`Expected ${chunks.length} embeddings, got ${embeddings.length}`)
  }

  const records: VectorRecord[] = []
  for (let i = 0; i < chunks.length; i++) {
    records.push({
      id: `${prefix}${i}`,
      values: embeddings[i],
      metadata: {
        title: doc.title,
        description: chunks[i],
        type: 'website',
        vectorType: 'website',
        page: doc.page,
        chunkIndex: i,
        totalChunks: chunks.length,
        lastScraped,
        indexedFrom: 'cms',
      },
    })
  }

  for (let i = 0; i < records.length; i += UPSERT_BATCH) {
    await deps.index.upsert(records.slice(i, i + UPSERT_BATCH))
  }

  const written = new Set(records.map((r) => r.id))
  const stale = existing.filter((id) => !written.has(id))
  await deleteIds(stale, deps)
  return { vectors: records.length, removed: stale.length }
}

async function removePage(page: string, deps: IndexDeps): Promise<number> {
  const ids = await listPageVectorIds(page, deps)
  await deleteIds(ids, deps)
  return ids.length
}

async function defaultDeps(): Promise<IndexDeps> {
  const [{ getPineconeIndex }, { createEmbeddings }] = await Promise.all([import('./pinecone'), import('./openai')])
  const index = await getPineconeIndex()
  return { index: index as unknown as IndexDeps['index'], embed: createEmbeddings }
}

function isPublished(item: { status?: string } | null | undefined): boolean {
  return item?.status === 'published'
}

/**
 * Brings the index in line with a save or delete. `before` is the stored item
 * before the change (null when creating), `after` the stored item afterwards
 * (null when deleting). Never throws: the CMS save already succeeded, so a
 * failure is reported to the admin instead of turning the save into an error.
 */
export async function syncContentIndex<T extends BlogPost | Project>(
  kind: ContentKind,
  before: T | null,
  after: T | null,
  deps?: IndexDeps
): Promise<IndexResult> {
  // A brand-new draft has never been indexed: nothing to do, no Pinecone call.
  if (!before && !isPublished(after)) return { status: 'skipped', vectors: 0, removed: 0 }

  let page: string | undefined
  let vectors = 0
  let removed = 0

  try {
    const afterDoc = isPublished(after)
      ? kind === 'blog'
        ? buildBlogIndexDocument(after as BlogPost)
        : buildProjectIndexDocument(after as Project)
      : null
    page = afterDoc?.page

    // Every page this item may still occupy besides the one indexed below: its
    // previous slug, and its current slug when it is not published. Removing them
    // regardless of the previous status makes a retry clean up after a failed
    // unpublish/delete, instead of being skipped because `before` is now a draft.
    const otherPages = new Set(
      [before?.slug, after?.slug].filter((slug): slug is string => Boolean(slug)).map((slug) => `/${kind}/${slug}`)
    )
    if (afterDoc) otherPages.delete(afterDoc.page)
    if (!afterDoc && otherPages.size === 0) return { status: 'skipped', vectors: 0, removed: 0 }

    const resolved = deps || (await defaultDeps())

    // Index the new page before removing the old one, so a failure leaves the
    // previous version answerable rather than nothing.
    if (afterDoc) {
      const result = await indexPage(afterDoc, resolved)
      vectors = result.vectors
      removed += result.removed
    }
    for (const other of otherPages) {
      page = page || other
      removed += await removePage(other, resolved)
    }

    if (afterDoc) return { status: 'updated', page: afterDoc.page, vectors, removed }
    return removed > 0 ? { status: 'removed', page, vectors: 0, removed } : { status: 'skipped', vectors: 0, removed: 0 }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    console.error(`[ContentIndex] Failed to sync ${kind} index:`, error)
    return { status: 'failed', page, vectors, removed, error: message }
  }
}
