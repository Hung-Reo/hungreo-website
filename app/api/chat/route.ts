import { NextRequest, NextResponse } from 'next/server'
import { createEmbedding, getOpenAIClient } from '@/lib/openai'
import { getPineconeIndex } from '@/lib/pinecone'

export const runtime = 'edge'

export async function POST(req: NextRequest) {
  try {
    const { message } = await req.json()

    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 })
    }

    // Step 1: Create embedding for user's question
    const questionEmbedding = await createEmbedding(message)

    // Step 2: Query Pinecone for relevant context
    const index = await getPineconeIndex()
    const queryResponse = await index.query({
      vector: questionEmbedding,
      topK: 3,
      includeMetadata: true,
    })

    // Step 3: Build context from relevant documents
    const context = queryResponse.matches
      .map((match) => {
        const metadata = match.metadata as any
        return `Title: ${metadata.title}\nDescription: ${metadata.description}\nType: ${metadata.type}\n`
      })
      .join('\n---\n')

    // Step 4: Generate response with OpenAI
    const openai = getOpenAIClient()

    const systemPrompt = `You are a helpful AI assistant for Hung Dinh's personal website.
You help visitors learn about Hung's background, projects, and blog posts.

Use the following context from Hung's website to answer questions:

${context}

If the question cannot be answered using the context, politely say you don't have that information and suggest they contact Hung directly.

Answer in a friendly, professional tone. If the user asks in Vietnamese, respond in Vietnamese.`

    const stream = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: message },
      ],
      stream: true,
      temperature: 0.7,
      max_tokens: 500,
    })

    // Step 5: Stream the response
    const encoder = new TextEncoder()
    const readableStream = new ReadableStream({
      async start(controller) {
        for await (const chunk of stream) {
          const text = chunk.choices[0]?.delta?.content || ''
          if (text) {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text })}\n\n`))
          }
        }
        controller.enqueue(encoder.encode('data: [DONE]\n\n'))
        controller.close()
      },
    })

    return new Response(readableStream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    })
  } catch (error) {
    console.error('Chat API error:', error)
    return NextResponse.json(
      { error: 'Failed to process chat request' },
      { status: 500 }
    )
  }
}
