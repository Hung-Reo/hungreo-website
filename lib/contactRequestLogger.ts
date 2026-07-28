/**
 * Contact Request Logger for tracking user contact requests from chatbot
 * Uses Vercel KV (Redis) for storage
 *
 * Scenarios that trigger contact requests:
 * 1. Fallback: Chatbot can't answer → user opts to leave email
 * 2. Direct request: User asks "how to contact", "talk to human", etc.
 */

import { kv } from '@vercel/kv'

// Contact request records and the daily indexes pointing at them share a lifetime.
const CONTACT_REQUEST_TTL_SECONDS = 60 * 60 * 24 * 90

export interface ContactRequest {
  id: string
  email: string
  name?: string
  originalQuestion: string
  chatSessionId: string
  pageContext?: string
  status: 'pending' | 'resolved'
  triggerType: 'fallback' | 'direct_request'
  createdAt: number
  resolvedAt?: number
  adminReply?: string
}

export interface ContactRequestStats {
  total: number
  pending: number
  resolved: number
  todayCount: number
}

/**
 * Generate unique ID for contact request
 */
function generateId(): string {
  return `cr_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
}

/**
 * Save a new contact request
 */
export async function saveContactRequest(data: {
  email: string
  name?: string
  originalQuestion: string
  chatSessionId: string
  pageContext?: string
  triggerType: 'fallback' | 'direct_request'
}): Promise<ContactRequest> {
  const id = generateId()
  const now = Date.now()
  const date = new Date(now).toISOString().split('T')[0] // YYYY-MM-DD

  const request: ContactRequest = {
    id,
    email: data.email,
    name: data.name,
    originalQuestion: data.originalQuestion,
    chatSessionId: data.chatSessionId,
    pageContext: data.pageContext,
    status: 'pending',
    triggerType: data.triggerType,
    createdAt: now,
  }

  // Store the contact request (90-day TTL)
  await kv.set(`contact-request:${id}`, request, { ex: CONTACT_REQUEST_TTL_SECONDS })

  // Add to pending list
  await kv.lpush('contact-requests:pending', id)

  // Add to daily list for stats, expiring on the same clock as the records it
  // points at so the index cannot outlive them (see chats:<date> in chatLogger).
  await kv.lpush(`contact-requests:${date}`, id)
  await kv.expire(`contact-requests:${date}`, CONTACT_REQUEST_TTL_SECONDS)

  // Increment total counter
  await kv.incr('stats:contact-requests-total')

  return request
}

/**
 * Get contact requests with optional filter
 */
export async function getContactRequests(filter: {
  status?: 'pending' | 'resolved' | 'all'
  limit?: number
  offset?: number
}): Promise<{ requests: ContactRequest[]; total: number }> {
  const { status = 'all', limit = 50, offset = 0 } = filter

  let requestIds: string[] = []

  if (status === 'pending') {
    requestIds = (await kv.lrange('contact-requests:pending', 0, -1)) || []
  } else if (status === 'resolved') {
    requestIds = (await kv.lrange('contact-requests:resolved', 0, -1)) || []
  } else {
    // Get all - combine pending and resolved
    const pending = (await kv.lrange('contact-requests:pending', 0, -1)) || []
    const resolved = (await kv.lrange('contact-requests:resolved', 0, -1)) || []
    requestIds = [...pending, ...resolved]
  }

  const total = requestIds.length

  // Apply pagination
  const paginatedIds = requestIds.slice(offset, offset + limit)

  // Fetch full request objects
  const requests: ContactRequest[] = []
  for (const id of paginatedIds) {
    const request = await kv.get<ContactRequest>(`contact-request:${id}`)
    if (request) {
      requests.push(request)
    }
  }

  // Sort by createdAt descending (newest first)
  requests.sort((a, b) => b.createdAt - a.createdAt)

  return { requests, total }
}

/**
 * Get a single contact request by ID
 */
export async function getContactRequestById(id: string): Promise<ContactRequest | null> {
  return await kv.get<ContactRequest>(`contact-request:${id}`)
}

/**
 * Update contact request status and optionally add admin reply
 */
export async function updateContactRequest(
  id: string,
  updates: {
    status?: 'pending' | 'resolved'
    adminReply?: string
  }
): Promise<ContactRequest | null> {
  const request = await kv.get<ContactRequest>(`contact-request:${id}`)
  if (!request) {
    return null
  }

  const updatedRequest: ContactRequest = {
    ...request,
    ...updates,
    resolvedAt: updates.status === 'resolved' ? Date.now() : request.resolvedAt,
  }

  // Update the request
  await kv.set(`contact-request:${id}`, updatedRequest, { ex: CONTACT_REQUEST_TTL_SECONDS })

  // Move between lists if status changed
  if (updates.status && updates.status !== request.status) {
    if (updates.status === 'resolved') {
      // Remove from pending, add to resolved
      await kv.lrem('contact-requests:pending', 0, id)
      await kv.lpush('contact-requests:resolved', id)
    } else {
      // Remove from resolved, add to pending
      await kv.lrem('contact-requests:resolved', 0, id)
      await kv.lpush('contact-requests:pending', id)
    }
  }

  return updatedRequest
}

/**
 * Mark a contact request as resolved
 */
export async function markAsResolved(id: string, adminReply?: string): Promise<ContactRequest | null> {
  return updateContactRequest(id, {
    status: 'resolved',
    adminReply,
  })
}

/**
 * Get contact request statistics
 */
export async function getContactRequestStats(): Promise<ContactRequestStats> {
  try {
    const today = new Date().toISOString().split('T')[0]

    const total = (await kv.get<number>('stats:contact-requests-total')) || 0
    const pendingIds = (await kv.lrange('contact-requests:pending', 0, -1)) || []
    const resolvedIds = (await kv.lrange('contact-requests:resolved', 0, -1)) || []
    const todayIds = (await kv.lrange(`contact-requests:${today}`, 0, -1)) || []

    return {
      total,
      pending: pendingIds.length,
      resolved: resolvedIds.length,
      todayCount: todayIds.length,
    }
  } catch (error) {
    console.error('Failed to get contact request stats:', error)
    return {
      total: 0,
      pending: 0,
      resolved: 0,
      todayCount: 0,
    }
  }
}

/**
 * Delete a contact request (for cleanup/GDPR)
 */
export async function deleteContactRequest(id: string): Promise<boolean> {
  try {
    // Remove from all lists
    await kv.lrem('contact-requests:pending', 0, id)
    await kv.lrem('contact-requests:resolved', 0, id)

    // Delete the request itself
    await kv.del(`contact-request:${id}`)

    return true
  } catch (error) {
    console.error('Failed to delete contact request:', error)
    return false
  }
}

/**
 * Detect if user message is asking to contact human
 * Used to proactively show contact form
 */
export function isContactRequest(message: string): boolean {
  const contactIndicators = [
    // Vietnamese
    'liên hệ',
    'liên lạc',
    'contact',
    'gặp người thật',
    'nói chuyện với người',
    'gặp hưng',
    'nói chuyện với hưng',
    'email cho',
    'gửi email',
    'để lại email',
    'muốn hỏi trực tiếp',
    'hỏi trực tiếp',
    'tư vấn trực tiếp',
    'hỗ trợ trực tiếp',
    // English
    'talk to human',
    'speak to human',
    'contact human',
    'real person',
    'talk to someone',
    'speak with someone',
    'get in touch',
    'reach out',
    'send email',
    'leave email',
    'direct contact',
    'personal assistance',
  ]

  const messageLower = message.toLowerCase()
  return contactIndicators.some((indicator) => messageLower.includes(indicator))
}
