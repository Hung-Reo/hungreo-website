/**
 * Analytics utilities for tracking user interactions
 * Uses Vercel Analytics for page views and custom events
 */

import { track } from '@vercel/analytics'

export interface AnalyticsEvent {
  name: string
  properties?: Record<string, any>
}

/**
 * Track a custom analytics event
 */
export function trackEvent(event: AnalyticsEvent) {
  try {
    track(event.name, event.properties)
  } catch (error) {
    console.error('Failed to track event:', error)
  }
}

/**
 * Track chatbot interaction
 */
export function trackChatMessage(userMessage: string, hasContext: boolean) {
  trackEvent({
    name: 'chat_message',
    properties: {
      message_length: userMessage.length,
      has_context: hasContext,
      timestamp: Date.now(),
    },
  })
}

/**
 * Track YouTube video summary request
 */
export function trackYouTubeSummary(videoId: string) {
  trackEvent({
    name: 'youtube_summary',
    properties: {
      video_id: videoId,
      timestamp: Date.now(),
    },
  })
}

/**
 * Track document upload
 */
export function trackDocumentUpload(fileType: string, fileSize: number) {
  trackEvent({
    name: 'document_upload',
    properties: {
      file_type: fileType,
      file_size: fileSize,
      timestamp: Date.now(),
    },
  })
}

/**
 * Track admin login
 */
export function trackAdminLogin(success: boolean) {
  trackEvent({
    name: 'admin_login',
    properties: {
      success,
      timestamp: Date.now(),
    },
  })
}
