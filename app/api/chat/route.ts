import { NextRequest, NextResponse } from 'next/server'
import { createEmbedding, getOpenAIClient } from '@/lib/openai'
import { getPineconeIndex } from '@/lib/pinecone'
import { logChat, shouldNotifyHuman, type ChatLog } from '@/lib/chatLogger'
import {
  chatbotRateLimit,
  chatbotHourlyRateLimit,
  getClientIp,
} from '@/lib/rateLimit'
import { validateChatMessage, sanitizeChatHistory } from '@/lib/inputValidator'
import {
  resolveVideoRetrievalScope,
  retrieveChatMatches,
  extractVideoIdsFromHistory,
} from '@/lib/chatRetrieval'
import { buildContext } from '@/lib/chatContext'

// Use Node.js runtime for Pinecone compatibility
export const runtime = 'nodejs'

// Debug mode control (only enable in development or when explicitly needed)
const DEBUG_MODE = process.env.ENABLE_DEBUG_LOGS === 'true'
const DISCOVERY_TOP_K = 20
const CONTEXT_TOP_K = 5

export async function POST(req: NextRequest) {
  const startTime = Date.now()
  let assistantMessage = ''

  try {
    // SECURITY: Rate limiting check
    const ip = getClientIp(req)
    if (DEBUG_MODE) {
      console.log(`[Chat] Request from IP: ${ip}`)
    }

    // Check per-minute rate limit (10 requests/min)
    const { success: minuteSuccess, reset: minuteReset } =
      await chatbotRateLimit.limit(ip)

    if (!minuteSuccess) {
      const retryAfter = Math.ceil((minuteReset - Date.now()) / 1000)
      console.warn(`[Chat] Rate limit exceeded for IP: ${ip} (per-minute)`)
      return new NextResponse(
        JSON.stringify({
          error: 'Too Many Requests',
          message:
            'Bạn đã gửi quá nhiều tin nhắn. Vui lòng thử lại sau ít phút. / You have sent too many messages. Please try again in a few minutes.',
          retryAfter,
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': retryAfter.toString(),
          },
        }
      )
    }

    // Check hourly rate limit (50 requests/hour)
    const { success: hourlySuccess, reset: hourlyReset } =
      await chatbotHourlyRateLimit.limit(ip)

    if (!hourlySuccess) {
      const retryAfter = Math.ceil((hourlyReset - Date.now()) / 1000)
      console.warn(`[Chat] Hourly rate limit exceeded for IP: ${ip}`)
      return new NextResponse(
        JSON.stringify({
          error: 'Too Many Requests',
          message:
            'Bạn đã vượt quá giới hạn tin nhắn trong giờ. Vui lòng thử lại sau. / You have exceeded the hourly message limit. Please try again later.',
          retryAfter,
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': retryAfter.toString(),
          },
        }
      )
    }

    const { message, history, pageContext } = await req.json()

    // SECURITY: Input validation
    const validation = validateChatMessage(message)
    if (!validation.isValid) {
      console.warn(`[Chat] Invalid message from IP: ${ip}`, {
        error: validation.error,
        messageLength: message?.length || 0,
      })
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      )
    }

    // Use sanitized message
    const sanitizedMessage = validation.sanitized!

    // Step 1: Create embedding for user's question
    // Sanitized first: the client controls this array, and a forged `system`
    // turn would otherwise replace the system instructions built below.
    const safeHistory = sanitizeChatHistory(history)
    const historyVideoIds = extractVideoIdsFromHistory(safeHistory)

    const questionEmbedding = await createEmbedding(sanitizedMessage)

    // Step 2: Query Pinecone for relevant context
    const index = await getPineconeIndex()
    const discoveryResponse = await index.query({
      vector: questionEmbedding,
      topK: DISCOVERY_TOP_K,
      includeMetadata: true,
    })

    const videoScope = resolveVideoRetrievalScope({
      query: sanitizedMessage,
      pageContextVideoId:
        pageContext && typeof pageContext === 'object'
          ? pageContext.videoId
          : undefined,
      matches: discoveryResponse.matches,
      historyVideoIds,
    })

    const contextMatches = await retrieveChatMatches({
      query: sanitizedMessage,
      pageContextVideoId:
        pageContext && typeof pageContext === 'object' ? pageContext.videoId : undefined,
      discoveryMatches: discoveryResponse.matches,
      queryVideo: async (videoId) => {
        const response = await index.query({
          vector: questionEmbedding,
          topK: CONTEXT_TOP_K,
          includeMetadata: true,
          filter: { videoId: { $eq: videoId } },
        })
        return response.matches
      },
      onScopeError: () => console.warn('[Chat] Scoped video retrieval failed; keeping available context'),
      historyVideoIds,
    })

    // Debug: Log retrieved vectors (only in debug mode to prevent data leakage)
    if (DEBUG_MODE) {
      console.log(
        `[Chat] Retrieved ${contextMatches.length} context vectors` +
          (videoScope ? ` with ${videoScope.source} video scope` : '')
      )
      contextMatches.forEach((match, i) => {
        const meta = match.metadata as any
        console.log(`[Chat] Vector ${i+1}: ${match.id} (score: ${match.score?.toFixed(3)})`)
        console.log(`[Chat]   RAW METADATA:`, JSON.stringify(meta, null, 2))
        console.log(`[Chat]   Title: ${meta?.title}`)
        console.log(`[Chat]   Preview: ${(meta?.description || meta?.text || '').substring(0, 150)}...`)
      })
    }

    // Step 3: Build context from relevant documents. Each source carries its
    // author/channel and a locator so the answer can be attributed and checked.
    const context = buildContext(contextMatches)

    // Step 4: Build context-aware system prompt
    let contextInfo = ''
    if (pageContext) {
      if (videoScope?.source === 'page-context') {
        contextInfo = `\n\nThe user is currently viewing a YouTube video (ID: ${videoScope.videoId}). If they ask about "this video" or "the video", they're referring to this one.`
      } else if (pageContext.page) {
        contextInfo = `\n\nThe user is currently on page: ${pageContext.page}`
      }
    }

    // Step 5: Generate response with OpenAI
    const openai = getOpenAIClient()

    const systemPrompt = `You are a helpful AI assistant for Hung Dinh's personal website.
You help visitors learn about Hung's background, projects, blog posts, and uploaded documents (including his CV/resume).

Use the following context from Hung's website and documents to answer questions.
Each source is labelled "Source 1:", "Source 2:"... and carries its own Author/Channel and URL:

${context}${contextInfo}

SOURCE ATTRIBUTION (do not get this wrong):
- "Author/Channel" tells you WHO produced that source. A video's Author/Channel
  is the YouTube channel that published it, NOT Hung.
- Only describe something as Hung's own work, words or opinion when the source's
  Author/Channel is Hung Dinh. For any other source, name the actual author or
  channel, e.g. "video của kênh The Mindset Mentor Podcast".
- Never write that Hung presented, created, hosted or taught third-party content.
  Hung curated it into his library; that is a different claim.
- When a source has a URL, cite it as a markdown link so the reader can verify.
- When a source has a "Reference" instead of a URL, it is a private uploaded
  document: name it by Title only, and never invent or guess a link to it.

CRITICAL RESTRICTION:
- You can ONLY answer questions using information from the provided context above
- If the context does not contain relevant information to answer the question, you MUST respond: "Xin lỗi, tôi không có thông tin về điều này trong cơ sở dữ liệu. Vui lòng liên hệ Hung tại hungreo2005@gmail.com để biết thêm chi tiết."
- NEVER use your pre-trained knowledge to answer questions
- NEVER make assumptions or provide general information not found in the context
- NEVER answer questions about topics, videos, or documents that are not explicitly mentioned in the context above

MISSING SOURCES (this outranks the user's requested format):
- Before answering a question that names more than one source, match each named
  source against the Title lines above. A source counts as available ONLY if one
  of the "Source N:" blocks is actually that source. Its name appearing in the
  question, or a different source discussing a similar topic, is not evidence
  that you have it.
- If the user names several sources and one is missing, you MUST NOT describe,
  summarise, compare, contrast or tabulate that missing one. Producing a
  comparison table, a "2 điểm chung", or any shared-theme claim that spans a
  source you do not have is a fabrication, even when it sounds plausible.
- In that case: say which named source is missing, then answer ONLY for the
  sources you actually have, and stop. Do not fill the gap from the question's
  wording, from the source's title, or from your own knowledge.
- This covers hypothetical framings too. Do not write "nếu X tập trung vào...",
  "dựa trên giả định", "thông thường X sẽ...", "suy luận", or any conditional that
  smuggles in content for a source you do not have. Omit that half entirely.
- If the question's requested shape (a comparison, "2 điểm chung", a table) is
  impossible with the sources you have, say so and drop the shape. Do not
  reinterpret it as being about one source so the shape can survive.
- Hard rule you can check before sending: once you have declared a named source
  missing, its name must not appear anywhere else in your answer. Not in a
  heading, not in a bullet, not after "giả sử", "có thể", "nếu" or "thông
  thường". Write only about the sources you actually have.

IMPORTANT INSTRUCTIONS:
- When you see "Training & Development" section, the format is: "[Training Name] - [Company Name]"
  Example: "Leader as a Coach - Samsung Vina" means training "Leader as a Coach" was done AT Samsung Vina
- Always match the training course with the EXACT company listed after the dash (-)
- Do NOT mix up trainings between different companies
- When answering questions about Hung's experience, skills, or background, use information from both website pages and uploaded documents (like his CV)

FORMATTING GUIDELINES:
- Use **bold text** for key points, names, important terms, and emphasis
- Use bullet points (•) for lists with 2 or more items
- Add relevant emojis strategically (1-2 per response) to enhance engagement:
  * 🎓 for education, learning, degrees
  * 💼 for work, career, professional experience
  * 🚀 for projects, innovations, achievements
  * 🏆 for awards, accomplishments, success
  * 💡 for skills, expertise, insights
  * 🌟 for highlights, special mentions
  * 🏠 for family, personal life, values
  * 💪 for strengths, resilience, growth
  * 🎯 for goals, focus areas, objectives
- Structure longer answers with clear sections using bold headings
- Keep paragraphs short (2-3 sentences maximum) for readability
- Use natural markdown formatting throughout your response
- IMPORTANT: Cite sources with the URL given in the source block:
  * Use markdown links: [the source's Title](URL from that source's URL line)
  * The "Source N:" labels are internal bookkeeping: never print them, never
    append them after a citation, and never use one as link text
  * Copy the URL exactly as provided; do NOT build one from an ID yourself
  * Do NOT use placeholder text like "VIDEO_ID"
  * Do NOT write bare URLs without markdown link format
  * A source with no URL line has no public link — name it, do not link it

Answer in a friendly, professional tone. If the user asks in Vietnamese, respond in Vietnamese.`

    // Step 6: Build messages array with conversation history
    const messages: any[] = [{ role: 'system', content: systemPrompt }]

    // Sanitized above, before retrieval, so both uses share one safe copy.
    if (safeHistory.length > 0) {
      messages.push(...safeHistory)
    }

    // Add current user message
    messages.push({ role: 'user', content: sanitizedMessage })

    const stream = await openai.chat.completions.create({
      model: 'gpt-4.1-mini',
      messages,
      stream: true,
      temperature: 0.7,
      max_tokens: 2000, // Increased from 500 to allow longer, detailed responses
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
          userMessage: sanitizedMessage,
          assistantResponse: assistantMessage,
          timestamp: Date.now(),
          pageContext,
          relevantDocs: contextMatches.length,
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
