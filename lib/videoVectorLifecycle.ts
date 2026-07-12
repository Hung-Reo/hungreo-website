export type RepairEnvironment = 'development' | 'preview' | 'production'

export interface RepairArguments {
  apply: boolean
  environment?: RepairEnvironment
  videoId?: string
}

const REPAIR_ENVIRONMENTS = new Set<RepairEnvironment>([
  'development',
  'preview',
  'production',
])

export function parseRepairArguments(argv: string[]): RepairArguments {
  const apply = argv.includes('--apply')
  const environmentValue = argv
    .find((arg) => arg.startsWith('--environment='))
    ?.slice('--environment='.length)
  const videoId = argv
    .find((arg) => arg.startsWith('--video-id='))
    ?.slice('--video-id='.length)

  if (
    environmentValue &&
    !REPAIR_ENVIRONMENTS.has(environmentValue as RepairEnvironment)
  ) {
    throw new Error(
      '--environment must be development, preview, or production'
    )
  }

  if (apply && !videoId) {
    throw new Error('--video-id is required with --apply')
  }

  if (apply && !environmentValue) {
    throw new Error('--environment is required with --apply')
  }

  return {
    apply,
    environment: environmentValue as RepairEnvironment | undefined,
    videoId: videoId || undefined,
  }
}

export function validateTranscript(
  transcript: string,
  maxWords: number = 100_000
): { transcript: string; words: number } {
  const normalized = transcript.replace(/\s+/g, ' ').trim()
  if (!normalized) {
    throw new Error('Transcript is empty')
  }

  const words = normalized.split(' ').length
  if (words > maxWords) {
    throw new Error(`Transcript exceeds the safety limit of ${maxWords} words`)
  }

  return { transcript: normalized, words }
}

export function collectVideoVectorIds(
  trackedIds: string[] = [],
  metadataIds: string[] = [],
  prefixIds: string[] = []
): string[] {
  return [...new Set([...trackedIds, ...metadataIds, ...prefixIds])]
    .filter((id) => Boolean(id) && id !== '__GENERATING__')
    .sort()
}

interface ReplaceVectorSetOptions {
  chunks: string[]
  previousIds: string[]
  makeVectorId: (index: number) => string
  upsertChunk: (input: {
    id: string
    chunk: string
    index: number
    totalChunks: number
  }) => Promise<void>
  saveVectorIds: (ids: string[]) => Promise<void>
  verifySavedVectorIds?: (ids: string[]) => Promise<boolean>
  deleteVectors: (ids: string[]) => Promise<void>
  onProgress?: (completed: number, total: number) => Promise<void> | void
  onCleanupError?: (error: unknown, ids: string[]) => Promise<void> | void
}

export interface ReplaceVectorSetResult {
  vectorIds: string[]
  staleIds: string[]
  cleanupSucceeded: boolean
}

/**
 * Safely replace a vector set without deleting the currently-live set first.
 * The new set is staged under fresh IDs, persisted to the source record, and
 * only then are the previous/orphan IDs retired.
 */
export async function replaceVectorSet(
  options: ReplaceVectorSetOptions
): Promise<ReplaceVectorSetResult> {
  if (options.chunks.length === 0) {
    throw new Error('Cannot create an empty vector set')
  }

  const stagedIds: string[] = []
  let sourceRecordCommitted = false

  try {
    for (let index = 0; index < options.chunks.length; index++) {
      const id = options.makeVectorId(index)
      // Track the ID before awaiting the write. If Pinecone commits the write
      // but the client receives a timeout, rollback still targets that ID.
      stagedIds.push(id)
      await options.upsertChunk({
        id,
        chunk: options.chunks[index],
        index,
        totalChunks: options.chunks.length,
      })
      await options.onProgress?.(index + 1, options.chunks.length)
    }

    try {
      await options.saveVectorIds(stagedIds)
      sourceRecordCommitted = true
    } catch (saveError) {
      // A database client can throw after the server committed the write. Read
      // the source record back before deciding whether staged vectors are safe
      // to roll back.
      sourceRecordCommitted = options.verifySavedVectorIds
        ? await options.verifySavedVectorIds(stagedIds)
        : false
      if (!sourceRecordCommitted) throw saveError
    }
  } catch (error) {
    if (!sourceRecordCommitted && stagedIds.length > 0) {
      try {
        await options.deleteVectors(stagedIds)
      } catch (cleanupError) {
        await options.onCleanupError?.(cleanupError, stagedIds)
      }
    }
    throw error
  }

  const stagedSet = new Set(stagedIds)
  const staleIds = [...new Set(options.previousIds)]
    .filter((id) => id && id !== '__GENERATING__' && !stagedSet.has(id))
    .sort()

  let cleanupSucceeded = true
  if (staleIds.length > 0) {
    try {
      await options.deleteVectors(staleIds)
    } catch (error) {
      cleanupSucceeded = false
      await options.onCleanupError?.(error, staleIds)
    }
  }

  return { vectorIds: stagedIds, staleIds, cleanupSucceeded }
}
