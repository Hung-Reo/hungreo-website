'use client'

import { useState, useRef, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Button } from './ui/Button'
import { useChatHistory } from '@/lib/hooks/useChatHistory'
import type { Message } from '@/lib/hooks/useChatHistory'

// Mini Turtle Walker for ChatBot Header
function MiniTurtleWalker() {
  const [currentFrame, setCurrentFrame] = useState(0)
  const [imagesLoaded, setImagesLoaded] = useState(false)

  const FRAMES = [
    '/turtle-frame-1.png',
    '/turtle-frame-2.png',
    '/turtle-frame-3.png',
    '/turtle-frame-4.png',
    '/turtle-frame-5.png',
    '/turtle-frame-6.png',
    '/turtle-frame-7.png',
    '/turtle-frame-8.png',
    '/turtle-frame-9.png',
    '/turtle-frame-10.png',
    '/turtle-frame-11.png',
    '/turtle-frame-12.png',
  ]

  // Preload all frames
  useEffect(() => {
    let loadedCount = 0
    FRAMES.forEach((src) => {
      const img = new Image()
      img.onload = () => {
        loadedCount++
        if (loadedCount === FRAMES.length) {
          setImagesLoaded(true)
        }
      }
      img.src = src
    })
  }, [])

  // Animate frames
  useEffect(() => {
    if (!imagesLoaded) return
    const frameInterval = setInterval(() => {
      setCurrentFrame((prev) => (prev + 1) % FRAMES.length)
    }, 450)
    return () => clearInterval(frameInterval)
  }, [imagesLoaded])

  if (!imagesLoaded) {
    return (
      <div className="mini-turtle-track">
        <div className="mini-turtle-sprite">
          <img src="/robot-rua.png?v=2" alt="Loading..." className="mini-turtle-img" />
        </div>
      </div>
    )
  }

  return (
    <div className="mini-turtle-track">
      <div className="mini-turtle-sprite">
        <div className="mini-turtle-frames">
          {FRAMES.map((src, index) => (
            <img
              key={src}
              src={src}
              alt="Turtle"
              className="mini-turtle-img"
              style={{
                opacity: index === currentFrame ? 1 : 0,
                position: index === 0 ? 'relative' : 'absolute',
                top: 0,
                left: 0,
              }}
              draggable={false}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

// Detect if message indicates chatbot can't answer (fallback)
function isFallbackResponse(message: string): boolean {
  const fallbackIndicators = [
    // English
    "i don't have that information",
    "i don't have information",
    "i'm not sure",
    "i cannot answer",
    "i don't know",
    "please contact",
    "suggest they contact",
    "not in my database",
    "not in the database",
    "outside my knowledge",
    "beyond my knowledge",
    // Vietnamese
    "tôi không có thông tin",
    "không có thông tin về",
    "tôi không chắc",
    "liên hệ trực tiếp",
    "không có trong cơ sở dữ liệu",
    "ngoài phạm vi",
  ]

  const messageLower = message.toLowerCase()
  return fallbackIndicators.some((indicator) => messageLower.includes(indicator))
}

// Detect if user is asking to contact human
function isContactRequest(message: string): boolean {
  const contactIndicators = [
    // Vietnamese
    'liên hệ',
    'liên lạc',
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
    'contact hung',
    'talk to hung',
    'email hung',
  ]

  const messageLower = message.toLowerCase()
  return contactIndicators.some((indicator) => messageLower.includes(indicator))
}

// Detect language from messages
function detectLanguage(messages: Message[]): 'vi' | 'en' {
  const recentMessages = messages.slice(-5)
  const text = recentMessages.map(m => m.content).join(' ').toLowerCase()

  const vietnameseIndicators = ['xin chào', 'cảm ơn', 'tôi', 'bạn', 'của', 'được', 'không', 'này', 'đây', 'làm', 'gì', 'sao']
  const vietnameseCount = vietnameseIndicators.filter(word => text.includes(word)).length

  return vietnameseCount >= 2 ? 'vi' : 'en'
}

// Contact form messages
const messages_i18n = {
  vi: {
    fallbackPrompt: 'Mình chưa có thông tin này trong cơ sở dữ liệu. Mình có thể giúp bạn liên hệ Hưng qua email - bạn có muốn để lại email không?',
    directContactPrompt: 'Mình sẽ giúp bạn liên hệ với Hưng qua email. Bạn vui lòng để lại thông tin nhé!',
    leaveEmail: 'Để lại email',
    noThanks: 'Không, cảm ơn',
    emailPlaceholder: 'Email',
    namePlaceholder: 'Tên (không bắt buộc)',
    submit: 'Gửi',
    submitting: 'Đang gửi...',
    successMessage: (name?: string) => `Cảm ơn${name ? ` ${name}` : ''}! Hưng sẽ reply qua email trong vòng 48 giờ. Bạn có câu hỏi khác không?`,
    errorMessage: 'Có lỗi xảy ra. Vui lòng thử lại.',
    invalidEmail: 'Email không hợp lệ.',
    contactPageHint: 'Bạn cũng có thể xem thông tin liên hệ tại trang Contact.',
  },
  en: {
    fallbackPrompt: "I don't have this information in my database. I can help you contact Hung via email - would you like to leave your email?",
    directContactPrompt: "I'll help you contact Hung via email. Please leave your information!",
    leaveEmail: 'Leave email',
    noThanks: 'No, thanks',
    emailPlaceholder: 'Email',
    namePlaceholder: 'Name (optional)',
    submit: 'Send',
    submitting: 'Sending...',
    successMessage: (name?: string) => `Thank you${name ? ` ${name}` : ''}! Hung will reply via email within 48 hours. Any other questions?`,
    errorMessage: 'Something went wrong. Please try again.',
    invalidEmail: 'Invalid email format.',
    contactPageHint: 'You can also find contact info on the Contact page.',
  },
}

// Email validation
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

interface ContactFormState {
  show: boolean
  triggerType: 'fallback' | 'direct_request' | null
  originalQuestion: string
  status: 'idle' | 'form' | 'submitting' | 'success' | 'error'
  errorMessage?: string
}

export function ChatBot() {
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [videoId, setVideoId] = useState<string | undefined>(undefined)
  const [streamingMessage, setStreamingMessage] = useState<string>('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Contact form state
  const [contactForm, setContactForm] = useState<ContactFormState>({
    show: false,
    triggerType: null,
    originalQuestion: '',
    status: 'idle',
  })
  const [contactEmail, setContactEmail] = useState('')
  const [contactName, setContactName] = useState('')

  // Listen for custom event from TurtleWalker
  useEffect(() => {
    const handleOpenChatbot = () => {
      setIsOpen(true)
    }
    window.addEventListener('openChatbot', handleOpenChatbot)
    return () => window.removeEventListener('openChatbot', handleOpenChatbot)
  }, [])

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

  // Detect language
  const lang = detectLanguage(messages)
  const t = messages_i18n[lang]

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
  }, [messages, streamingMessage, contactForm.show])

  // Reset contact form when chat is closed
  useEffect(() => {
    if (!isOpen) {
      setContactForm({ show: false, triggerType: null, originalQuestion: '', status: 'idle' })
      setContactEmail('')
      setContactName('')
    }
  }, [isOpen])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!input.trim() || isLoading || historyLoading) return

    const userMessage = input.trim()
    setInput('')

    // Reset contact form when user sends new message
    setContactForm({ show: false, triggerType: null, originalQuestion: '', status: 'idle' })

    // Check if user is directly asking to contact human
    if (isContactRequest(userMessage)) {
      addMessage('user', userMessage)
      // Show contact form directly
      setTimeout(() => {
        addMessage('assistant', t.directContactPrompt)
        setContactForm({
          show: true,
          triggerType: 'direct_request',
          originalQuestion: userMessage,
          status: 'idle',
        })
      }, 500)
      return
    }

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

        // Check if this is a fallback response - show contact form option
        if (isFallbackResponse(assistantMessage)) {
          setTimeout(() => {
            setContactForm({
              show: true,
              triggerType: 'fallback',
              originalQuestion: userMessage,
              status: 'idle',
            })
          }, 500)
        }
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

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validate email
    if (!EMAIL_REGEX.test(contactEmail)) {
      setContactForm(prev => ({ ...prev, status: 'error', errorMessage: t.invalidEmail }))
      return
    }

    setContactForm(prev => ({ ...prev, status: 'submitting' }))

    try {
      const response = await fetch('/api/chat/contact-request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: contactEmail.trim().toLowerCase(),
          name: contactName.trim() || undefined,
          originalQuestion: contactForm.originalQuestion,
          chatSessionId: currentSession?.id || 'unknown',
          pageContext: pathname,
          triggerType: contactForm.triggerType,
        }),
      })

      const data = await response.json()

      if (response.ok && data.success) {
        setContactForm(prev => ({ ...prev, status: 'success' }))
        // Add success message to chat
        addMessage('assistant', t.successMessage(contactName.trim() || undefined))
        // Reset form fields
        setContactEmail('')
        setContactName('')
        // Hide form after short delay
        setTimeout(() => {
          setContactForm({ show: false, triggerType: null, originalQuestion: '', status: 'idle' })
        }, 1000)
      } else {
        setContactForm(prev => ({
          ...prev,
          status: 'error',
          errorMessage: data.message || t.errorMessage,
        }))
      }
    } catch (error) {
      console.error('Contact form error:', error)
      setContactForm(prev => ({
        ...prev,
        status: 'error',
        errorMessage: t.errorMessage,
      }))
    }
  }

  const handleDeclineContact = () => {
    setContactForm({ show: false, triggerType: null, originalQuestion: '', status: 'idle' })
    addMessage('assistant', t.contactPageHint)
  }

  const handleClearHistory = () => {
    if (window.confirm('Are you sure you want to clear the chat history?')) {
      clearSession()
      setContactForm({ show: false, triggerType: null, originalQuestion: '', status: 'idle' })
    }
  }

  // SECURITY: Don't render ChatBot on sensitive auth pages to prevent token leakage
  const isAuthPage = pathname.startsWith('/admin/login') ||
                     pathname.startsWith('/admin/forgot-password') ||
                     pathname.startsWith('/admin/reset-password')

  if (isAuthPage) {
    return null
  }

  return (
    <>
      {/* Chat Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-24 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-white shadow-lg transition-transform hover:scale-110 overflow-hidden"
          aria-label="Open chat"
          title="Chat with Robot Rùa"
        >
          {/* Robot Rùa Icon */}
          <img
            src="/robot-rua.png?v=2"
            alt="Robot Rùa"
            className="h-full w-full object-cover"
          />
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-0 right-0 sm:bottom-6 sm:right-6 z-50 flex h-full sm:h-[600px] w-full sm:w-[420px] sm:max-w-[95vw] flex-col sm:rounded-lg border bg-white shadow-xl">
          {/* Header */}
          <div className="flex items-center justify-between border-b bg-primary-600 p-4 text-white relative">
            <h3 className="font-semibold">Chat with AI</h3>
            <MiniTurtleWalker />
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

            {/* Contact Form - Inline in chat */}
            {contactForm.show && contactForm.status !== 'success' && (
              <div className="flex justify-start">
                <div className="max-w-[90%] rounded-lg bg-slate-50 border border-slate-200 p-4">
                  {contactForm.status === 'idle' && (
                    <div className="space-y-3">
                      <p className="text-sm text-slate-700">
                        {contactForm.triggerType === 'fallback' ? t.fallbackPrompt : t.directContactPrompt}
                      </p>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setContactForm(prev => ({ ...prev, status: 'form' }))}
                          className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition-colors"
                        >
                          {t.leaveEmail}
                        </button>
                        <button
                          onClick={handleDeclineContact}
                          className="px-4 py-2 text-sm font-medium text-slate-600 bg-slate-200 rounded-lg hover:bg-slate-300 transition-colors"
                        >
                          {t.noThanks}
                        </button>
                      </div>
                    </div>
                  )}

                  {(contactForm.status === 'form' || contactForm.status === 'submitting' || contactForm.status === 'error') && (
                    <form onSubmit={handleContactSubmit} className="space-y-3">
                      <div>
                        <input
                          type="email"
                          value={contactEmail}
                          onChange={(e) => setContactEmail(e.target.value)}
                          placeholder={t.emailPlaceholder}
                          className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                          required
                          disabled={contactForm.status === 'submitting'}
                        />
                      </div>
                      <div>
                        <input
                          type="text"
                          value={contactName}
                          onChange={(e) => setContactName(e.target.value)}
                          placeholder={t.namePlaceholder}
                          className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                          disabled={contactForm.status === 'submitting'}
                        />
                      </div>
                      {contactForm.status === 'error' && contactForm.errorMessage && (
                        <p className="text-xs text-red-600">{contactForm.errorMessage}</p>
                      )}
                      <div className="flex gap-2">
                        <button
                          type="submit"
                          disabled={contactForm.status === 'submitting'}
                          className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {contactForm.status === 'submitting' ? t.submitting : t.submit}
                        </button>
                        <button
                          type="button"
                          onClick={handleDeclineContact}
                          disabled={contactForm.status === 'submitting'}
                          className="px-4 py-2 text-sm font-medium text-slate-600 bg-slate-200 rounded-lg hover:bg-slate-300 transition-colors disabled:opacity-50"
                        >
                          {t.noThanks}
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              </div>
            )}

            {isLoading && !streamingMessage && (
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
            <p className="mt-2 text-[10px] text-slate-500 flex items-center gap-1">
              <svg className="h-3 w-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
