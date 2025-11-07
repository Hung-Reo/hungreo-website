/**
 * Custom hook for managing chat history with LocalStorage
 * Provides context-aware chat sessions with automatic persistence
 */

import { useState, useEffect, useCallback, useMemo } from 'react'

export interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: number
}

export interface PageContext {
  page: string
  category?: string
  videoId?: string
}

export interface ChatSession {
  id: string
  messages: Message[]
  createdAt: number
  updatedAt: number
  pageContext?: PageContext
}

const STORAGE_KEY = 'hungreo_chat_history'
const MAX_SESSIONS = 10
const MAX_MESSAGES_PER_SESSION = 20

export function useChatHistory(pageContext?: PageContext) {
  const [currentSession, setCurrentSession] = useState<ChatSession | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Memoize pageContext to prevent infinite loop
  const contextKey = useMemo(() => {
    if (!pageContext) return 'no-context'
    return `${pageContext.page}|${pageContext.category || ''}|${pageContext.videoId || ''}`
  }, [pageContext?.page, pageContext?.category, pageContext?.videoId])

  // Load or create session on mount
  useEffect(() => {
    const loadSession = () => {
      try {
        const stored = localStorage.getItem(STORAGE_KEY)
        let sessions: ChatSession[] = stored ? JSON.parse(stored) : []

        // Clean corrupted data: filter out empty messages
        sessions = sessions.map(session => ({
          ...session,
          messages: session.messages.filter(m => m.content?.trim())
        }))

        // Remove old sessions with no valid messages (keep recent ones for 30min)
        const thirtyMinutesAgo = Date.now() - 1800000 // 30 minutes in ms
        sessions = sessions.filter(s =>
          s.messages.length > 0 || s.updatedAt > thirtyMinutesAgo
        )

        // Save cleaned sessions back to localStorage
        if (stored) {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions))
        }

        // Find existing session for current context or create new one
        let session = sessions.find((s) => {
          if (!pageContext) return !s.pageContext
          if (!s.pageContext) return false
          return (
            s.pageContext.page === pageContext.page &&
            s.pageContext.category === pageContext.category &&
            s.pageContext.videoId === pageContext.videoId
          )
        })

        if (!session) {
          session = {
            id: `session_${Date.now()}`,
            messages: [],
            createdAt: Date.now(),
            updatedAt: Date.now(),
            pageContext,
          }
        }

        setCurrentSession(session)
      } catch (error) {
        console.error('Failed to load chat history:', error)
        // Clear corrupted localStorage
        localStorage.removeItem(STORAGE_KEY)
        // Create new session on error
        setCurrentSession({
          id: `session_${Date.now()}`,
          messages: [],
          createdAt: Date.now(),
          updatedAt: Date.now(),
          pageContext,
        })
      } finally {
        setIsLoading(false)
      }
    }

    loadSession()
  }, [contextKey])

  // Save session to localStorage
  const saveSession = useCallback((session: ChatSession) => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      let sessions: ChatSession[] = stored ? JSON.parse(stored) : []

      // Remove existing session with same ID
      sessions = sessions.filter((s) => s.id !== session.id)

      // Add updated session to beginning
      sessions.unshift(session)

      // Keep only MAX_SESSIONS
      sessions = sessions.slice(0, MAX_SESSIONS)

      localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions))
    } catch (error) {
      console.error('Failed to save chat history:', error)
    }
  }, [])

  // Add message to current session
  const addMessage = useCallback(
    (role: 'user' | 'assistant', content: string) => {
      if (!currentSession) return

      // Validate content: don't save empty messages
      if (!content || !content.trim()) {
        console.warn('Attempting to add empty message, skipping')
        return
      }

      const message: Message = {
        id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        role,
        content: content.trim(), // Trim whitespace
        timestamp: Date.now(),
      }

      const updatedSession = {
        ...currentSession,
        messages: [...currentSession.messages, message],
        updatedAt: Date.now(),
      }

      // Keep only last MAX_MESSAGES_PER_SESSION
      if (updatedSession.messages.length > MAX_MESSAGES_PER_SESSION) {
        updatedSession.messages = updatedSession.messages.slice(-MAX_MESSAGES_PER_SESSION)
      }

      setCurrentSession(updatedSession)
      saveSession(updatedSession)

      return message
    },
    [currentSession, saveSession]
  )

  // Get conversation context (last 10 messages for API)
  const getConversationContext = useCallback((): Message[] => {
    if (!currentSession) return []
    return currentSession.messages.slice(-10)
  }, [currentSession])

  // Clear current session
  const clearSession = useCallback(() => {
    if (!currentSession) return

    const clearedSession = {
      ...currentSession,
      messages: [],
      updatedAt: Date.now(),
    }

    setCurrentSession(clearedSession)
    saveSession(clearedSession)
  }, [currentSession, saveSession])

  // Get all sessions from localStorage
  const getAllSessions = useCallback((): ChatSession[] => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      return stored ? JSON.parse(stored) : []
    } catch (error) {
      console.error('Failed to get all sessions:', error)
      return []
    }
  }, [])

  // Delete a specific session
  const deleteSession = useCallback((sessionId: string) => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      let sessions: ChatSession[] = stored ? JSON.parse(stored) : []
      sessions = sessions.filter((s) => s.id !== sessionId)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions))

      // If current session was deleted, create new one
      if (currentSession?.id === sessionId) {
        const newSession = {
          id: `session_${Date.now()}`,
          messages: [],
          createdAt: Date.now(),
          updatedAt: Date.now(),
          pageContext: currentSession.pageContext,
        }
        setCurrentSession(newSession)
      }
    } catch (error) {
      console.error('Failed to delete session:', error)
    }
  }, [currentSession])

  return {
    currentSession,
    isLoading,
    addMessage,
    clearSession,
    getConversationContext,
    getAllSessions,
    deleteSession,
  }
}
