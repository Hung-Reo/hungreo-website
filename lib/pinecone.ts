import { Pinecone } from '@pinecone-database/pinecone'
import { collectVideoVectorIds } from './videoVectorLifecycle'

let pineconeClient: Pinecone | null = null

export function getPineconeClient() {
  if (!pineconeClient) {
    if (!process.env.PINECONE_API_KEY) {
      throw new Error('PINECONE_API_KEY is not set')
    }

    pineconeClient = new Pinecone({
      apiKey: process.env.PINECONE_API_KEY,
    })
  }

  return pineconeClient
}

export async function getPineconeIndex() {
  const client = getPineconeClient()
  const indexName = process.env.PINECONE_INDEX_NAME

  if (!indexName) {
    throw new Error('PINECONE_INDEX_NAME is not set')
  }

  return client.index(indexName)
}

/**
 * List all vector IDs matching a filter using pagination
 * This properly handles large vector sets without topK limitations
 */
export async function listAllVectorIds(
  filter: Record<string, any>
): Promise<string[]> {
  const index = await getPineconeIndex()
  const allIds: string[] = []

  try {
    // Use listPaginated with pagination token to get all vector IDs
    let paginationToken: string | undefined = undefined

    do {
      const listResponse = await index.listPaginated({
        prefix: '',
        limit: 100,
        paginationToken,
      })

      if (listResponse.vectors) {
        const ids = listResponse.vectors.map(v => v.id).filter((id): id is string => id !== undefined)
        allIds.push(...ids)
      }

      paginationToken = listResponse.pagination?.next
    } while (paginationToken)

    console.log(`[Pinecone] Listed ${allIds.length} total vector IDs`)

    // If we need to filter, we'll need to fetch metadata in batches
    if (Object.keys(filter).length > 0) {
      console.log(`[Pinecone] Fetching metadata for ${allIds.length} vectors to apply filter...`)

      const FETCH_BATCH_SIZE = 1000
      const filteredIds: string[] = []

      for (let i = 0; i < allIds.length; i += FETCH_BATCH_SIZE) {
        const batch = allIds.slice(i, i + FETCH_BATCH_SIZE)
        const fetchResponse = await index.fetch(batch)

        // Check each vector's metadata against filter
        for (const [id, vector] of Object.entries(fetchResponse.records)) {
          const metadata = vector.metadata || {}
          let matches = true

          for (const [key, value] of Object.entries(filter)) {
            if (metadata[key] !== value) {
              matches = false
              break
            }
          }

          if (matches) {
            filteredIds.push(id)
          }
        }
      }

      console.log(`[Pinecone] Filter matched ${filteredIds.length}/${allIds.length} vectors`)
      return filteredIds
    }

    return allIds
  } catch (error) {
    console.error('[Pinecone] Failed to list vector IDs:', error)
    throw error
  }
}

/**
 * Find every vector belonging to a video, including historical/orphan IDs
 * that are no longer referenced by the KV video record.
 */
export async function listVideoVectorIds(
  videoId: string,
  trackedIds: string[] = []
): Promise<string[]> {
  if (!/^[A-Za-z0-9_-]{6,32}$/.test(videoId)) {
    throw new Error('Invalid YouTube video ID')
  }

  const index = await getPineconeIndex()
  const prefixIds: string[] = []
  let paginationToken: string | undefined

  do {
    const response = await index.listPaginated({
      prefix: `video_${videoId}_`,
      limit: 100,
      paginationToken,
    })
    prefixIds.push(
      ...(response.vectors || [])
        .map((vector) => vector.id)
        .filter((id): id is string => Boolean(id))
    )
    paginationToken = response.pagination?.next
  } while (paginationToken)

  // Metadata lookup catches older/non-standard IDs that do not use the
  // current video_<videoId>_ prefix.
  const metadataIds = await listAllVectorIds({ videoId })
  const metadataSet = new Set(metadataIds)
  const expectedPrefix = `video_${videoId}_`
  const validatedTrackedIds = trackedIds.filter(
    (id) => id.startsWith(expectedPrefix) || metadataSet.has(id)
  )
  return collectVideoVectorIds(validatedTrackedIds, metadataIds, prefixIds)
}

/** Delete every known vector for one video. Throws so callers can safely retry. */
export async function deleteVideoVectors(
  videoId: string,
  trackedIds: string[] = []
): Promise<string[]> {
  const index = await getPineconeIndex()
  const vectorIds = await listVideoVectorIds(videoId, trackedIds)

  for (let i = 0; i < vectorIds.length; i += 1000) {
    await index.deleteMany(vectorIds.slice(i, i + 1000))
  }

  return vectorIds
}
