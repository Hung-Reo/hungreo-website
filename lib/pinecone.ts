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
