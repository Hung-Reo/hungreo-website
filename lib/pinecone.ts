import { Pinecone } from '@pinecone-database/pinecone'

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
