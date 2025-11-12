import { NextRequest, NextResponse } from 'next/server'
import { createEmbedding, getOpenAIClient } from '@/lib/openai'
import { getPineconeIndex } from '@/lib/pinecone'
import { logChat, shouldNotifyHuman, type ChatLog } from '@/lib/chatLogger'

// Use Node.js runtime for Pinecone compatibility
export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  const startTime = Date.now()
  let assistantMessage = ''

  try {
    const { message, history, pageContext } = await req.json()

    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 })
    }

    // Step 1: Create embedding for user's question
    const questionEmbedding = await createEmbedding(message)

    // Step 2: Query Pinecone for relevant context
    const index = await getPineconeIndex()
    const queryResponse = await index.query({
      vector: questionEmbedding,
      topK: 5, // Retrieve top 5 most relevant chunks
      includeMetadata: true,
    })

    // Debug: Log retrieved vectors
    console.log(`[Chat] Retrieved ${queryResponse.matches.length} vectors for query: "${message}"`)
    queryResponse.matches.forEach((match, i) => {
      const meta = match.metadata as any
      console.log(`[Chat] Vector ${i+1}: ${match.id} (score: ${match.score?.toFixed(3)})`)
      console.log(`[Chat]   Title: ${meta.title}`)
      console.log(`[Chat]   Preview: ${(meta.description || meta.text || '').substring(0, 150)}...`)
    })

    // Step 3: Build context from relevant documents
    const context = queryResponse.matches
      .map((match) => {
        const metadata = match.metadata as any
        const title = metadata.title || 'Untitled'
        const description = metadata.description || metadata.text || 'No description'
        const type = metadata.vectorType || metadata.type || 'unknown'

        return `Title: ${title}\nContent: ${description}\nType: ${type}\n`
      })
      .join('\n---\n')

    // Step 4: Build context-aware system prompt
    let contextInfo = ''
    if (pageContext) {
      if (pageContext.videoId) {
        contextInfo = `\n\nThe user is currently viewing a YouTube video (ID: ${pageContext.videoId}). If they ask about "this video" or "the video", they're referring to this one.`
      } else if (pageContext.page) {
        contextInfo = `\n\nThe user is currently on page: ${pageContext.page}`
      }
    }

    // Step 5: Generate response with OpenAI
    const openai = getOpenAIClient()

    const systemPrompt = `You are a helpful AI assistant for Hung Dinh's personal website.
You help visitors learn about Hung's background, projects, blog posts, and uploaded documents (including his CV/resume).

Use the following context from Hung's website and documents to answer questions:

${context}${contextInfo}

IMPORTANT INSTRUCTIONS:
- When you see "Training & Development" section, the format is: "[Training Name] - [Company Name]"
  Example: "Leader as a Coach - Samsung Vina" means training "Leader as a Coach" was done AT Samsung Vina
- Always match the training course with the EXACT company listed after the dash (-)
- Do NOT mix up trainings between different companies
- When answering questions about Hung's experience, skills, or background, use information from both website pages and uploaded documents (like his CV)
- If the question cannot be answered using the context, politely say you don't have that information and suggest they contact Hung directly at hungreo2005@gmail.com

Answer in a friendly, professional tone. If the user asks in Vietnamese, respond in Vietnamese.`

    // Step 6: Build messages array with conversation history
    const messages: any[] = [{ role: 'system', content: systemPrompt }]

    // Add conversation history (last 10 messages for context)
    if (history && Array.isArray(history) && history.length > 0) {
      messages.push(...history.slice(-10))
    }

    // Add current user message
    messages.push({ role: 'user', content: message })

    const stream = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages,
      stream: true,
      temperature: 0.7,
      max_tokens: 500,
    })

    // Step 7: Stream the response and collect full message
    const encoder = new TextEncoder()
    const sessionId = `session_${startTime}_${Math.random().toString(36).substr(2, 9)}`

    const readableStream = new ReadableStream({
      async start(controller) {
        for await (const chunk of stream) {
          const text = chunk.choices[0]?.delta?.content || ''
          if (text) {
            assistantMessage += text
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text })}\n\n`))
          }
        }
        controller.enqueue(encoder.encode('data: [DONE]\n\n'))
        controller.close()

        // Step 8: Log the chat interaction after streaming completes
        const responseTime = Date.now() - startTime
        const needsHumanReply = shouldNotifyHuman(assistantMessage)

        const chatLog: ChatLog = {
          id: `chat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          sessionId,
          userMessage: message,
          assistantResponse: assistantMessage,
          timestamp: Date.now(),
          pageContext,
          relevantDocs: queryResponse.matches.length,
          responseTime,
          needsHumanReply,
        }

        // Log asynchronously (don't block response)
        logChat(chatLog).catch((error) => {
          console.error('Failed to log chat:', error)
        })
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
