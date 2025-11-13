'use client'

import { useState, useRef, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Button } from './ui/Button'
import { useChatHistory } from '@/lib/hooks/useChatHistory'
import type { Message } from '@/lib/hooks/useChatHistory'

export function ChatBot() {
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [videoId, setVideoId] = useState<string | undefined>(undefined)
  const [streamingMessage, setStreamingMessage] = useState<string>('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Extract videoId from URL on client side only
  useEffect(() => {
    if (typeof window !== 'undefined' && pathname.includes('/tools/youtube')) {
      const params = new URLSearchParams(window.location.search)
      setVideoId(params.get('v') || undefined)
    } else {
      setVideoId(undefined)
    }
  }, [pathname])

  // Determine page context
  const pageContext = {
    page: pathname,
    videoId,
  }

  const { currentSession, isLoading: historyLoading, addMessage, clearSession, getConversationContext } = useChatHistory(pageContext)

  // Display messages from current session, filter out empty messages
  const messages = (currentSession?.messages || []).filter(m => m.content?.trim())

  // Add welcome message if no messages
  let displayMessages = messages.length === 0
    ? [{ id: 'welcome', role: 'assistant' as const, content: 'Hi! I can help you learn about Hung Dinh. Ask me anything!', timestamp: Date.now() }]
    : messages

  // Add streaming message if currently streaming
  if (streamingMessage) {
    displayMessages = [
      ...displayMessages,
      { id: 'streaming', role: 'assistant' as const, content: streamingMessage, timestamp: Date.now() }
    ]
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages, streamingMessage])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!input.trim() || isLoading || historyLoading) return

    const userMessage = input.trim()
    setInput('')

    // Add user message to history
    addMessage('user', userMessage)
    setIsLoading(true)
    setStreamingMessage('') // Clear any previous streaming message

    try {
      // Get conversation context (last 10 messages)
      const conversationHistory = getConversationContext()

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMessage,
          history: conversationHistory.map(m => ({ role: m.role, content: m.content })),
          pageContext,
        }),
      })

      if (!response.ok) throw new Error('Failed to get response')

      const reader = response.body?.getReader()
      const decoder = new TextDecoder()

      if (!reader) throw new Error('No reader available')

      let assistantMessage = ''

      // Stream and display message in real-time
      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value)
        const lines = chunk.split('\n')

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6)
            if (data === '[DONE]') break

            try {
              const parsed = JSON.parse(data)
              assistantMessage += parsed.text
              setStreamingMessage(assistantMessage) // Update streaming display
            } catch (e) {
              // Skip invalid JSON
            }
          }
        }
      }

      // After streaming is complete, save the full message
      if (assistantMessage.trim()) {
        addMessage('assistant', assistantMessage)
      }

      // Clear streaming state
      setStreamingMessage('')
    } catch (error) {
      console.error('Chat error:', error)
      setStreamingMessage('') // Clear streaming state on error
      addMessage('assistant', 'Sorry, I encountered an error. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleClearHistory = () => {
    if (window.confirm('Are you sure you want to clear the chat history?')) {
      clearSession()
    }
  }

  return (
    <>
      {/* Chat Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-primary-600 text-white shadow-lg transition-transform hover:scale-110"
          aria-label="Open chat"
        >
          <svg
            className="h-6 w-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
            />
          </svg>
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 z-50 flex h-[600px] w-[420px] flex-col rounded-lg border bg-white shadow-xl">
          {/* Header */}
          <div className="flex items-center justify-between border-b bg-primary-600 p-4 text-white">
            <h3 className="font-semibold">Chat with AI</h3>
            <div className="flex items-center gap-2">
              {messages.length > 0 && (
                <button
                  onClick={handleClearHistory}
                  className="hover:text-gray-200 text-xs"
                  aria-label="Clear history"
                  title="Clear chat history"
                >
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="hover:text-gray-200"
                aria-label="Close chat"
              >
                <svg
                  className="h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {displayMessages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-lg px-4 py-2 ${
                    message.role === 'user'
                      ? 'bg-primary-600 text-white'
                      : 'bg-slate-100 text-slate-900'
                  }`}
                >
                  {message.role === 'user' ? (
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  ) : (
                    <div className="text-sm">
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm as any]}
                        components={{
                          // Custom styling for markdown elements
                          p: ({children}) => <p className="my-2 leading-relaxed">{children}</p>,
                          strong: ({children}) => <strong className="font-semibold text-slate-900">{children}</strong>,
                          ul: ({children}) => <ul className="my-2 ml-5 space-y-1 list-disc">{children}</ul>,
                          ol: ({children}) => <ol className="my-2 ml-5 space-y-1 list-decimal">{children}</ol>,
                          li: ({children}) => <li className="leading-relaxed">{children}</li>,
                          h3: ({children}) => <h3 className="font-semibold text-base mt-3 mb-2">{children}</h3>,
                          a: ({href, children}) => (
                            <a
                              href={href}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-primary-600 hover:text-primary-700 underline font-medium"
                            >
                              {children}
                            </a>
                          ),
                        }}
                      >
                        {message.content}
                      </ReactMarkdown>
                    </div>
                  )}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-slate-100 rounded-lg px-4 py-2">
                  <div className="flex space-x-2">
                    <div className="h-2 w-2 animate-bounce rounded-full bg-slate-400"></div>
                    <div className="h-2 w-2 animate-bounce rounded-full bg-slate-400 [animation-delay:0.2s]"></div>
                    <div className="h-2 w-2 animate-bounce rounded-full bg-slate-400 [animation-delay:0.4s]"></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <form onSubmit={handleSubmit} className="border-t p-4">
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask me anything..."
                className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                disabled={isLoading}
              />
              <Button type="submit" disabled={isLoading || !input.trim()} size="sm">
                Send
              </Button>
            </div>
            <p className="mt-2 text-xs text-slate-500 flex items-center gap-1">
              <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              Your messages are encrypted and auto-deleted after 90 days.
              <a href="/security" target="_blank" className="underline hover:text-primary-600">
                Privacy Policy
              </a>
            </p>
          </form>
        </div>
      )}
    </>
  )
}
