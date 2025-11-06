import OpenAI from 'openai'

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
    model: 'text-embedding-3-small',
    input: text,
  })

  return response.data[0].embedding
}

export async function generateChatCompletion(
  messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>,
  stream = false
) {
  const openai = getOpenAIClient()

  return await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages,
    stream,
    temperature: 0.7,
    max_tokens: 1000,
  })
}
