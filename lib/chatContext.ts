import { BASE_URL } from './metadata'

/**
 * Turns a Pinecone match into the source block the chat prompt sees.
 *
 * The previous builder passed only title/content/type/videoId, which dropped
 * every field that identifies WHO produced a chunk and WHERE it can be
 * verified. That is what let the assistant credit a third-party podcast
 * episode to Hung. Attribution and locator fields are therefore explicit here.
 */

export interface SourceDescriptor {
  label: string
  type: string
  title: string
  /** Who produced this content, when it is not Hung himself. */
  attribution?: string
  /** Public URL a reader can open to verify the claim. */
  url?: string
  /** Stable identifier for sources with no public URL (uploaded documents). */
  reference?: string
  content: string
}

function firstString(...values: unknown[]): string | undefined {
  for (const value of values) {
    if (typeof value === 'string' && value.trim()) return value.trim()
    if (typeof value === 'number') return String(value)
  }
  return undefined
}

/** Website chunks store a path (`/about`); turn it into an absolute URL. */
export function websiteUrlFromPage(page: string): string {
  const path = page.startsWith('/') ? page : `/${page}`
  return path === '/' ? BASE_URL : `${BASE_URL}${path}`
}

export function describeSource(metadata: Record<string, any>, position: number): SourceDescriptor {
  const type = firstString(metadata?.vectorType, metadata?.type) || 'unknown'
  const title = firstString(metadata?.title, type === 'document' ? metadata?.fileName : undefined) || 'Untitled'
  // Both approval paths store the full chunk in content. Legacy videos may
  // have a repeated promotional description while content holds the transcript.
  const fullContent = (type === 'video' || type === 'document') && typeof metadata?.content === 'string'
    ? metadata.content.trim() : ''
  const content = fullContent || firstString(metadata?.description, metadata?.text) || 'No description'

  const descriptor: SourceDescriptor = {
    label: `Source ${position}`,
    type,
    title,
    content,
  }

  if (type === 'video') {
    const videoId = firstString(metadata?.videoId)
    // channelTitle is the publisher. Older vectors predate the field, so fall
    // back to the stored url and leave attribution unstated rather than guessed.
    descriptor.attribution = firstString(metadata?.channelTitle)
    descriptor.url =
      (videoId && `https://www.youtube.com/watch?v=${videoId}`) || firstString(metadata?.url)
    return descriptor
  }

  if (type === 'website') {
    const page = firstString(metadata?.page)
    descriptor.attribution = 'Hung Dinh (hungreo.com)'
    descriptor.url = page ? websiteUrlFromPage(page) : BASE_URL
    return descriptor
  }

  if (type === 'document') {
    // Uploaded documents have no public URL. Expose an identifier only, so the
    // model can name the source without inventing a link to a private file.
    descriptor.reference = firstString(metadata?.documentId, metadata?.fileName)
    return descriptor
  }

  descriptor.url = firstString(metadata?.url)
  return descriptor
}

export function formatSource(source: SourceDescriptor): string {
  const lines = [
    `${source.label}:`,
    `Type: ${source.type}`,
    `Title: ${source.title}`,
  ]
  if (source.attribution) lines.push(`Author/Channel: ${source.attribution}`)
  if (source.url) lines.push(`URL: ${source.url}`)
  if (source.reference) lines.push(`Reference: ${source.reference} (not publicly accessible)`)
  lines.push(`Content: ${source.content}`)
  return lines.join('\n')
}

export function buildContext(matches: Array<{ metadata?: Record<string, any> | null }>): string {
  return matches
    .map((match, i) => formatSource(describeSource(match.metadata || {}, i + 1)))
    .join('\n---\n')
}
