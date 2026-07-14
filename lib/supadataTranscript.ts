import type { TranscriptFetchResult } from './videoManager'

const SUPADATA_TRANSCRIPT_ENDPOINT = 'https://api.supadata.ai/v1/transcript'
const YOUTUBE_VIDEO_ID_PATTERN = /^[A-Za-z0-9_-]{6,32}$/
const MAX_TRANSCRIPT_WORDS = 100_000
const PROVIDER_TIMEOUT_MS = 20_000

type FetchImplementation = (
  input: RequestInfo | URL,
  init?: RequestInit
) => Promise<Response>

interface SupadataFallbackOptions {
  videoId: string
  primaryResult: TranscriptFetchResult
  apiKey?: string
  fetchImpl?: FetchImplementation
}

function providerFailure(
  code: 'NO_CAPTIONS' | 'RATE_LIMITED' | 'UPSTREAM_ERROR',
  retryable: boolean,
  message: string
): TranscriptFetchResult {
  return { ok: false, code, retryable, message }
}

/**
 * Use Supadata only as a native-caption fallback. AI generation stays opt-in so
 * an admin retry cannot create an unexpected transcription bill.
 */
export async function trySupadataTranscriptFallback({
  videoId,
  primaryResult,
  apiKey = process.env.SUPADATA_API_KEY,
  fetchImpl = fetch,
}: SupadataFallbackOptions): Promise<TranscriptFetchResult> {
  if (primaryResult.ok || !apiKey?.trim()) return primaryResult

  if (!YOUTUBE_VIDEO_ID_PATTERN.test(videoId)) {
    return providerFailure('UPSTREAM_ERROR', false, 'Invalid YouTube video ID.')
  }

  const requestUrl = new URL(SUPADATA_TRANSCRIPT_ENDPOINT)
  requestUrl.searchParams.set('url', `https://www.youtube.com/watch?v=${videoId}`)
  requestUrl.searchParams.set('mode', 'native')
  requestUrl.searchParams.set('text', 'true')

  let response: Response
  try {
    response = await fetchImpl(requestUrl, {
      method: 'GET',
      headers: {
        accept: 'application/json',
        'x-api-key': apiKey.trim(),
      },
      redirect: 'error',
      signal: AbortSignal.timeout(PROVIDER_TIMEOUT_MS),
    })
  } catch {
    return providerFailure(
      'UPSTREAM_ERROR',
      true,
      'Transcript provider request failed.'
    )
  }

  if (response.status === 206) {
    return providerFailure(
      'NO_CAPTIONS',
      false,
      'No caption tracks are available for this video.'
    )
  }

  if (response.status === 429) {
    return providerFailure(
      'RATE_LIMITED',
      true,
      'Transcript provider rate-limited the request.'
    )
  }

  if (response.status === 202) {
    return providerFailure(
      'UPSTREAM_ERROR',
      true,
      'Transcript provider is still processing this video.'
    )
  }

  if (response.status === 401 || response.status === 403) {
    return providerFailure(
      'UPSTREAM_ERROR',
      false,
      'Transcript provider authentication failed.'
    )
  }

  if (!response.ok) {
    return providerFailure(
      'UPSTREAM_ERROR',
      response.status >= 500,
      'Transcript provider request failed.'
    )
  }

  let body: unknown
  try {
    body = await response.json()
  } catch {
    return providerFailure(
      'UPSTREAM_ERROR',
      true,
      'Transcript provider returned an invalid response.'
    )
  }

  if (!body || typeof body !== 'object') {
    return providerFailure(
      'UPSTREAM_ERROR',
      true,
      'Transcript provider returned an invalid response.'
    )
  }

  const content = 'content' in body ? (body as { content?: unknown }).content : undefined
  const transcript = typeof content === 'string' ? content.replace(/\s+/g, ' ').trim() : ''
  const words = transcript ? transcript.split(/\s+/).length : 0

  if (!transcript || words > MAX_TRANSCRIPT_WORDS) {
    return providerFailure(
      'UPSTREAM_ERROR',
      false,
      'Transcript provider returned unusable content.'
    )
  }

  const rawLanguage = 'lang' in body ? (body as { lang?: unknown }).lang : undefined
  const language =
    typeof rawLanguage === 'string' && /^[A-Za-z]{2,3}(?:-[A-Za-z0-9]{2,8})?$/.test(rawLanguage)
      ? rawLanguage
      : undefined

  console.log(
    `[VideoManager] Fetched transcript for ${videoId} via Supadata native fallback: ${words} words`
  )

  return {
    ok: true,
    transcript,
    language,
    source: 'supadata-native',
  }
}
