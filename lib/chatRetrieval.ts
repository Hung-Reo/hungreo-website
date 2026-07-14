export interface RetrievalMatchLike {
  id: string
  score?: number
  metadata?: Record<string, unknown>
}

export interface VideoRetrievalScope {
  videoId: string
  source: 'page-context' | 'title'
}

interface ResolveVideoRetrievalScopeOptions {
  query: string
  pageContextVideoId?: unknown
  matches: ReadonlyArray<RetrievalMatchLike>
}

const YOUTUBE_VIDEO_ID_PATTERN = /^[A-Za-z0-9_-]{11}$/

// Generic chat/video words are intentionally excluded so a request such as
// "lesson learn của video" cannot accidentally select an unrelated video.
const TITLE_STOP_WORDS = new Set([
  'about',
  'and',
  'anything',
  'ban',
  'cho',
  'chi',
  'cua',
  'detail',
  'details',
  'for',
  'from',
  'hello',
  'how',
  'learn',
  'learning',
  'lesson',
  'minh',
  'nhe',
  'noi',
  'the',
  'this',
  'tiet',
  'to',
  'video',
  'what',
  'with',
  'your',
])

function normalizeTokens(value: string): string[] {
  return (
    value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .match(/[a-z0-9]+/g) || []
  )
}

function getDistinctiveTokens(value: string): string[] {
  return [
    ...new Set(
      normalizeTokens(value).filter(
        (token) => token.length >= 2 && !TITLE_STOP_WORDS.has(token)
      )
    ),
  ]
}

function getValidVideoId(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined
  const trimmed = value.trim()
  return YOUTUBE_VIDEO_ID_PATTERN.test(trimmed) ? trimmed : undefined
}

function isVideoMetadata(
  metadata: Record<string, unknown>
): boolean {
  return metadata.vectorType === 'video' || metadata.type === 'video'
}

/**
 * Resolve an optional video scope without trusting raw user input.
 * A validated page context wins; otherwise a scope is selected only when the
 * query overlaps at least two distinctive title tokens with sufficient signal.
 */
export function resolveVideoRetrievalScope({
  query,
  pageContextVideoId,
  matches,
}: ResolveVideoRetrievalScopeOptions): VideoRetrievalScope | undefined {
  const contextVideoId = getValidVideoId(pageContextVideoId)
  if (contextVideoId) {
    return { videoId: contextVideoId, source: 'page-context' }
  }

  const queryTokens = new Set(getDistinctiveTokens(query))
  const candidates = new Map<
    string,
    { videoId: string; matchingTokens: number; coverage: number; score: number }
  >()

  for (const match of matches) {
    const metadata = match.metadata
    if (!metadata || !isVideoMetadata(metadata)) continue

    const videoId = getValidVideoId(metadata.videoId)
    const title = typeof metadata.title === 'string' ? metadata.title : ''
    if (!videoId || !title) continue

    const titleTokens = getDistinctiveTokens(title)
    if (titleTokens.length < 2) continue

    const matchingTokens = titleTokens.filter((token) =>
      queryTokens.has(token)
    ).length
    const coverage = matchingTokens / titleTokens.length

    // Two matches are enough for concise titles; longer titles require either
    // stronger coverage or at least three matching tokens.
    if (matchingTokens < 2 || (coverage < 0.4 && matchingTokens < 3)) continue

    const candidate = {
      videoId,
      matchingTokens,
      coverage,
      score: match.score || 0,
    }
    const existing = candidates.get(videoId)

    if (
      !existing ||
      candidate.matchingTokens > existing.matchingTokens ||
      (candidate.matchingTokens === existing.matchingTokens &&
        candidate.coverage > existing.coverage) ||
      (candidate.matchingTokens === existing.matchingTokens &&
        candidate.coverage === existing.coverage &&
        candidate.score > existing.score)
    ) {
      candidates.set(videoId, candidate)
    }
  }

  const best = [...candidates.values()].sort(
    (a, b) =>
      b.matchingTokens - a.matchingTokens ||
      b.coverage - a.coverage ||
      b.score - a.score
  )[0]

  return best ? { videoId: best.videoId, source: 'title' } : undefined
}
