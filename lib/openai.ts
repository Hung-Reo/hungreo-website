import OpenAI from 'openai'
import { AI_MODEL, reasoningParams } from './aiModel'

let openaiClient: OpenAI | null = null

export function getOpenAIClient() {
  if (!openaiClient) {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY is not set')
    }

    openaiClient = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })
  }

  return openaiClient
}

export async function createEmbedding(text: string) {
  const openai = getOpenAIClient()

  const response = await openai.embeddings.create({
    model: process.env.OPENAI_EMBEDDING_MODEL ?? 'text-embedding-3-large',
    input: text,
  })

  return response.data[0].embedding
}

/**
 * Embed many texts in as few requests as possible (one per 100 inputs), keeping
 * input order. Used when indexing a whole page so a save stays fast.
 */
export async function createEmbeddings(texts: string[]): Promise<number[][]> {
  const openai = getOpenAIClient()
  const embeddings: number[][] = []

  for (let i = 0; i < texts.length; i += 100) {
    const response = await openai.embeddings.create({
      model: process.env.OPENAI_EMBEDDING_MODEL ?? 'text-embedding-3-large',
      input: texts.slice(i, i + 100),
    })
    const ordered = [...response.data].sort((a, b) => a.index - b.index)
    embeddings.push(...ordered.map((item) => item.embedding))
  }

  return embeddings
}

export async function generateChatCompletion(
  messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>,
  stream = false
) {
  const openai = getOpenAIClient()

  return await openai.chat.completions.create({
    model: AI_MODEL,
    ...reasoningParams(),
    messages,
    stream,
    max_completion_tokens: 4000,
  })
}
