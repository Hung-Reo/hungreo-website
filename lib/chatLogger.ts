/**
 * Chat logger for tracking conversations and analytics
 * Uses Vercel KV (Redis) for storage
 */

import { kv } from '@vercel/kv'
import { notifyHungAboutChat } from './emailNotifier'

export interface ChatLog {
  id: string
  sessionId: string
  userMessage: string
  assistantResponse: string
  timestamp: number
  pageContext?: {
    page: string
    category?: string
    videoId?: string
  }
  relevantDocs?: number
  responseTime?: number
  needsHumanReply?: boolean
}

export interface ChatStats {
  totalChats: number
  chatsToday: number
  chatsThisWeek: number
  chatsThisMonth: number
  topQuestions: Array<{ question: string; count: number }>
  needsReply: number
}

/**
 * Log a chat interaction
 */
export async function logChat(log: ChatLog): Promise<void> {
  try {
    const date = new Date(log.timestamp).toISOString().split('T')[0] // YYYY-MM-DD
    const key = `chat:${log.id}`

    // Store the chat log (90-day TTL)
    await kv.set(key, log, { ex: 60 * 60 * 24 * 90 })

    // Add to daily list
    await kv.lpush(`chats:${date}`, log.id)

    // Increment total chats counter
    await kv.incr('stats:total-chats')

    // Track top questions (sorted set by frequency)
    const questionKey = log.userMessage.toLowerCase().trim().substring(0, 100)
    await kv.zincrby('stats:top-questions', 1, questionKey)

    // Add to needs-reply inbox if flagged
    if (log.needsHumanReply) {
      await kv.lpush('inbox:needs-reply', log.id)

      // Send email notification (async, don't wait)
      notifyHungAboutChat(log).catch((error) => {
        console.error('Failed to send email notification:', error)
      })
    }
  } catch (error) {
    console.error('Failed to log chat:', error)
  }
}

/**
 * Get chat statistics
 */
export async function getChatStats(): Promise<ChatStats> {
  try {
    const now = new Date()
    const today = now.toISOString().split('T')[0]

    // Calculate dates
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

    // Get total chats
    const totalChats = (await kv.get('stats:total-chats')) || 0

    // Get chats today
    const chatsTodayIds = (await kv.lrange(`chats:${today}`, 0, -1)) || []
    const chatsToday = chatsTodayIds.length

    // Get chats this week (sum last 7 days)
    let chatsThisWeek = 0
    for (let i = 0; i < 7; i++) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      const count = (await kv.llen(`chats:${date}`)) || 0
      chatsThisWeek += count
    }

    // Get chats this month (sum last 30 days)
    let chatsThisMonth = 0
    for (let i = 0; i < 30; i++) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      const count = (await kv.llen(`chats:${date}`)) || 0
      chatsThisMonth += count
    }

    // Get top questions (top 10)
    const topQuestionsRaw = await kv.zrange('stats:top-questions', 0, 9, { rev: true, withScores: true })
    const topQuestions = []
    for (let i = 0; i < topQuestionsRaw.length; i += 2) {
      topQuestions.push({
        question: topQuestionsRaw[i] as string,
        count: topQuestionsRaw[i + 1] as number,
      })
    }

    // Get needs-reply count
    const needsReply = (await kv.llen('inbox:needs-reply')) || 0

    return {
      totalChats: Number(totalChats),
      chatsToday,
      chatsThisWeek,
      chatsThisMonth,
      topQuestions,
      needsReply,
    }
  } catch (error) {
    console.error('Failed to get chat stats:', error)
    return {
      totalChats: 0,
      chatsToday: 0,
      chatsThisWeek: 0,
      chatsThisMonth: 0,
      topQuestions: [],
      needsReply: 0,
    }
  }
}

/**
 * Get chat logs for a specific date range
 */
export async function getChatLogs(startDate: Date, endDate: Date): Promise<ChatLog[]> {
  try {
    const logs: ChatLog[] = []
    const currentDate = new Date(startDate)

    while (currentDate <= endDate) {
      const dateStr = currentDate.toISOString().split('T')[0]
      const chatIds = (await kv.lrange(`chats:${dateStr}`, 0, -1)) || []

      for (const chatId of chatIds) {
        const log = await kv.get(`chat:${chatId}`)
        if (log) {
          logs.push(log as ChatLog)
        }
      }

      currentDate.setDate(currentDate.getDate() + 1)
    }

    return logs.sort((a, b) => b.timestamp - a.timestamp)
  } catch (error) {
    console.error('Failed to get chat logs:', error)
    return []
  }
}

/**
 * Get chats that need human reply
 */
export async function getNeedsReplyChats(): Promise<ChatLog[]> {
  try {
    const chatIds = (await kv.lrange('inbox:needs-reply', 0, -1)) || []
    const logs: ChatLog[] = []

    for (const chatId of chatIds) {
      const log = await kv.get(`chat:${chatId}`)
      if (log) {
        logs.push(log as ChatLog)
      }
    }

    return logs
  } catch (error) {
    console.error('Failed to get needs-reply chats:', error)
    return []
  }
}

/**
 * Mark a chat as replied
 */
export async function markAsReplied(chatId: string): Promise<void> {
  try {
    // Remove from needs-reply list
    const chatIds = (await kv.lrange('inbox:needs-reply', 0, -1)) || []
    const filteredIds = chatIds.filter((id) => id !== chatId)

    // Clear and rebuild the list
    await kv.del('inbox:needs-reply')
    if (filteredIds.length > 0) {
      await kv.lpush('inbox:needs-reply', ...filteredIds)
    }
  } catch (error) {
    console.error('Failed to mark as replied:', error)
  }
}

/**
 * Detect if chat needs human reply
 * Returns true if AI couldn't answer confidently
 */
export function shouldNotifyHuman(assistantResponse: string): boolean {
  const lowConfidenceIndicators = [
    "i don't have that information",
    "i'm not sure",
    "i cannot answer",
    "i don't know",
    "please contact",
    "suggest they contact",
    "tôi không có thông tin",
    "tôi không chắc",
    "liên hệ trực tiếp",
  ]

  const responseLower = assistantResponse.toLowerCase()
  return lowConfidenceIndicators.some((indicator) => responseLower.includes(indicator))
}
