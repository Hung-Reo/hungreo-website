# Phase 2 Complete: AI Features + Admin Dashboard + Analytics

**Status:** Final Design Document - Ready for Review
**Timeline:** 30 hours implementation (~1 week focused work)
**Monthly Cost:** $2-4 (OpenAI API only, all other services free)
**Database:** Pinecone Free Tier (100K vectors)

---

## 📋 Table of Contents

1. [Executive Summary](#executive-summary)
2. [Complete Feature List](#complete-feature-list)
3. [Architecture Overview](#architecture-overview)
4. [Feature Specifications](#feature-specifications)
   - [Chat History System](#1-chat-history-system)
   - [Analytics & Logging](#2-analytics--logging)
   - [Admin Dashboard](#3-admin-dashboard)
   - [Document Management](#4-document-management)
   - [YouTube Video System](#5-youtube-video-system)
   - [Website Auto-Scraper](#6-website-auto-scraper)
   - [AI Tools Tab](#7-ai-tools-tab)
   - [Email Notifications](#8-email-notifications)
5. [Database Schema](#database-schema)
6. [Implementation Plan](#implementation-plan)
7. [Cost Analysis](#cost-analysis)
8. [Security & Privacy](#security--privacy)
9. [Testing Strategy](#testing-strategy)
10. [Deployment Checklist](#deployment-checklist)

---

## Executive Summary

### What We're Building

A comprehensive AI-powered personal website with:
- **Smart Chatbot** - RAG-powered with conversation history and context awareness
- **Admin Dashboard** - Secure content management for documents, videos, and analytics
- **Analytics System** - Track sessions, chat logs, and user engagement
- **Knowledge Management** - Upload PDFs, manage YouTube videos, auto-scrape website
- **Email Notifications** - Auto-notify when users need help
- **Public AI Tools** - Categorized video library for visitors

### Key Architectural Decisions

✅ **Single Unified Chatbot** - One AI assistant with access to all knowledge
✅ **Pinecone Free Tier** - 100K vectors (14.6% usage, 85.4% headroom)
✅ **LocalStorage Chat History** - Privacy-friendly, zero cost
✅ **Vercel Analytics + KV** - Free tier analytics and logging
✅ **Resend Email API** - Free email notifications (100/day)
✅ **NextAuth v5** - Secure admin authentication

### Success Metrics

- Monthly cost: **$2-4** (vs $50+ alternatives)
- Implementation time: **30 hours** (1 week focused)
- Vector capacity: **85K remaining** (can add 3,714 videos)
- Analytics: **100% coverage** (all interactions tracked)
- Privacy: **GDPR compliant** (user controls their data)

---

## Complete Feature List

### Public Features (All Users)

| Feature | Description | Status |
|---------|-------------|--------|
| **AI Chatbot** | RAG-powered assistant on all pages | ✅ Built |
| **Chat History** | Remember last 10 messages | 🔨 To build |
| **Context Awareness** | Knows current page/video context | 🔨 To build |
| **YouTube Summarizer** | Generate AI summaries of videos | ✅ Built |
| **AI Tools Tab** | Browse videos by category | 🔨 To build |
| **Video Library** | Public categorized collection | 🔨 To build |
| **Thumbs Up/Down** | Rate chatbot responses | 🔨 To build |
| **Email Collection** | Voluntary contact sharing | 🔨 To build |

### Admin Features (Authenticated Only)

| Feature | Description | Status |
|---------|-------------|--------|
| **Admin Login** | Secure email + password auth | 🔨 To build |
| **Analytics Dashboard** | Session stats, chat logs | 🔨 To build |
| **Document Upload** | PDF/TXT/DOCX with review | 🔨 To build |
| **YouTube Management** | Batch import, categorize | 🔨 To build |
| **Website Scraper** | Auto-update knowledge base | 🔨 To build |
| **Chat Log Viewer** | Review all conversations | 🔨 To build |
| **Email Inbox** | Manage contact requests | 🔨 To build |
| **Vector Monitor** | Track Pinecone usage | 🔨 To build |

### Backend Services

| Service | Purpose | Cost |
|---------|---------|------|
| **OpenAI GPT-4o-mini** | Chat responses | $2-3/mo |
| **OpenAI Embeddings** | Text to vectors | $0.50-1/mo |
| **Pinecone Free** | Vector database | $0 |
| **Vercel Analytics** | Page views, events | $0 |
| **Vercel KV** | Chat logs, session data | $0 |
| **Resend API** | Email notifications | $0 |
| **YouTube Data API** | Video metadata | $0 |
| **NextAuth** | Authentication | $0 |

---

## Architecture Overview

### System Diagram

```
┌─────────────────────────────────────────────────────────┐
│                  Frontend (Next.js 14)                  │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  Public Pages:                                           │
│  ├── All Pages                                          │
│  │   └── Single Chatbot (with history + analytics)     │
│  ├── AI Tools Tab                                       │
│  │   ├── Leadership (Simon Sinek, Mel Robbins...)      │
│  │   ├── AI Works                                       │
│  │   ├── Health                                         │
│  │   ├── Entertaining                                   │
│  │   └── Human Philosophy (TS. Giản Tư Trung...)       │
│  └── YouTube Summarizer                                 │
│                                                          │
│  Admin Pages (Protected by NextAuth):                   │
│  ├── /admin/login                                       │
│  └── /admin/dashboard                                   │
│      ├── Overview (stats, charts)                       │
│      ├── Analytics Tab                                  │
│      │   ├── Session statistics                         │
│      │   ├── Chat logs viewer                           │
│      │   ├── Top questions                              │
│      │   └── User feedback                              │
│      ├── Documents Tab                                  │
│      │   ├── Upload PDF/TXT/DOCX                        │
│      │   ├── Review & Edit                              │
│      │   ├── Pending approval                           │
│      │   └── Active knowledge base                      │
│      ├── Videos Tab                                     │
│      │   ├── Add YouTube URLs (single/batch)            │
│      │   ├── Assign categories                          │
│      │   ├── Video library (550+ videos)                │
│      │   └── Manage transcripts                         │
│      ├── Website Scraper Tab                            │
│      │   ├── Auto-scrape trigger                        │
│      │   ├── Last scraped timestamp                     │
│      │   └── Pages indexed                              │
│      └── Email Inbox Tab                                │
│          ├── Contact requests                           │
│          ├── Needs reply queue                          │
│          └── Reply directly                             │
│                                                          │
└─────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────┐
│              API Routes (Vercel Serverless)             │
├─────────────────────────────────────────────────────────┤
│  Public APIs:                                            │
│  ├── /api/chat (RAG chatbot with history logging)      │
│  ├── /api/youtube (video summarizer)                    │
│  └── /api/feedback (thumbs up/down)                     │
│                                                          │
│  Admin APIs (Auth Required):                             │
│  ├── /api/admin/upload (document upload)                │
│  ├── /api/admin/documents (CRUD operations)             │
│  ├── /api/admin/videos (YouTube management)             │
│  ├── /api/admin/scrape (website scraper)                │
│  ├── /api/admin/analytics (get stats)                   │
│  ├── /api/admin/chats (get chat logs)                   │
│  └── /api/admin/emails (contact management)             │
│                                                          │
│  Auth APIs:                                              │
│  └── /api/auth/[...nextauth] (NextAuth routes)         │
└─────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────┐
│                   External Services                      │
├─────────────────────────────────────────────────────────┤
│  ├── OpenAI API                                         │
│  │   ├── GPT-4o-mini (chat completions)                │
│  │   └── text-embedding-3-small (embeddings)           │
│  ├── Pinecone Free                                      │
│  │   ├── Vector storage (100K capacity)                │
│  │   └── Semantic search                               │
│  ├── Vercel Platform                                    │
│  │   ├── Analytics (page views, custom events)         │
│  │   ├── KV (Redis - chat logs, session data)          │
│  │   └── Blob (file storage for >4.5MB files)          │
│  ├── Resend API                                         │
│  │   └── Email notifications (100/day free)            │
│  ├── YouTube Data API v3                                │
│  │   └── Video metadata fetching                       │
│  └── youtube-transcript package                         │
│      └── Extract video captions                         │
└─────────────────────────────────────────────────────────┘
```

### Data Flow

**User Chat Interaction:**
```
User types message
       ↓
Frontend (ChatBot component)
       ↓
Check LocalStorage for history
       ↓
POST /api/chat with message + history
       ↓
API: Create embedding → Query Pinecone → Get context
       ↓
API: Call OpenAI GPT-4o-mini with context + history
       ↓
API: Stream response back to frontend
       ↓
API: Log to Vercel KV (async)
       ↓
API: Check if needs email notification
       ↓
Frontend: Display response + Update LocalStorage
       ↓
Frontend: Track event in Vercel Analytics
```

**Admin Upload Document:**
```
Admin uploads PDF
       ↓
If > 4.5MB → Upload to Vercel Blob
       ↓
API: Parse PDF (pdf-parse)
       ↓
Admin: Review & Edit extracted text
       ↓
Admin: Approve
       ↓
API: Chunk text (512 tokens each)
       ↓
API: Generate embeddings (OpenAI)
       ↓
API: Upload vectors to Pinecone
       ↓
Success → Show in active knowledge base
```

---

## Feature Specifications

## 1. Chat History System

### Requirements

- ✅ Store last **10 messages** (5 Q&A pairs) per session
- ✅ **30-minute session timeout** (auto-clear old data)
- ✅ **Context-aware responses** (AI remembers conversation)
- ✅ **Clear history button** (user privacy control)
- ✅ **Page context detection** (knows current page/video)
- ✅ **Privacy-friendly** (data stays on device)

### Technical Implementation

**Storage:** Browser LocalStorage

**Data Structure:**

```typescript
interface Message {
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: number
}

interface ChatSession {
  id: string                    // Unique session ID
  messages: Message[]           // Conversation history
  createdAt: number             // Session start time
  updatedAt: number             // Last activity
  pageContext?: {
    page: string                // Current URL path
    category?: string           // If on AI Tools
    videoId?: string            // If watching specific video
  }
}
```

**Hook Implementation:**

File: `lib/hooks/useChatHistory.ts`

```typescript
export function useChatHistory() {
  const [session, setSession] = useState<ChatSession | null>(null)
  const pathname = usePathname() // Next.js hook

  // Initialize session from LocalStorage or create new
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      const parsed: ChatSession = JSON.parse(stored)
      const isExpired = Date.now() - parsed.updatedAt > SESSION_TIMEOUT

      if (!isExpired) {
        setSession(parsed)
        return
      }
    }

    // Create new session
    const newSession = {
      id: `session-${Date.now()}`,
      messages: [{
        role: 'assistant',
        content: 'Hi! I can help you learn about Hung Dinh. Ask me anything!',
        timestamp: Date.now(),
      }],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }
    setSession(newSession)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newSession))
  }, [])

  // Update page context when pathname changes
  useEffect(() => {
    if (!session) return

    const updatedSession = {
      ...session,
      pageContext: {
        page: pathname,
        // Extract category/videoId from URL if applicable
      },
    }
    setSession(updatedSession)
  }, [pathname])

  // Add message (user or assistant)
  const addMessage = (role: 'user' | 'assistant', content: string) => {
    // ... implementation
  }

  // Clear all history
  const clearHistory = () => {
    // ... implementation
  }

  // Get messages formatted for OpenAI API
  const getContextMessages = () => {
    return session?.messages.map(({ role, content }) => ({ role, content })) || []
  }

  return { messages, addMessage, clearHistory, getContextMessages, pageContext }
}
```

**ChatBot Component Updates:**

File: `components/ChatBot.tsx`

- Replace `useState` for messages with `useChatHistory` hook
- Pass history to `/api/chat` endpoint
- Add "Clear History" button in header
- Show page context hint (e.g., "You're viewing: Start With Why")

**API Route Updates:**

File: `app/api/chat/route.ts`

```typescript
export async function POST(req: NextRequest) {
  const { message, history, pageContext } = await req.json()

  // Build context-aware system prompt
  let systemPrompt = BASE_SYSTEM_PROMPT

  if (pageContext?.videoId) {
    systemPrompt += `\n\nThe user is currently watching the video: ${pageContext.videoId}. Prioritize information from this video in your response.`
  }

  // Build messages with history
  const messages = [
    { role: 'system', content: systemPrompt },
    ...history.slice(-10), // Last 10 messages for context
  ]

  // ... rest of RAG logic
}
```

### User Experience

**Before (no history):**
```
User: "Tell me about Hung's projects"
Bot: "Hung has worked on K12 Chatbot..."

User: "What technologies did he use?"
Bot: "I need more context. What project are you asking about?"
```

**After (with history):**
```
User: "Tell me about Hung's projects"
Bot: "Hung has worked on K12 Chatbot..."

User: "What technologies did he use?"
Bot: "For the K12 Chatbot project you just asked about, Hung used OpenAI GPT-4.1-mini, RAG method, and OpenUI."
```

---

## 2. Analytics & Logging

### Requirements

- ✅ **Page view tracking** (real-time visitor stats)
- ✅ **Session analytics** (today/week/month/total)
- ✅ **Chat logging** (save all Q&A for improvement)
- ✅ **Top questions** (identify popular topics)
- ✅ **User feedback** (thumbs up/down on responses)
- ✅ **Contact requests** (track who needs help)
- ✅ **Custom events** (video views, document downloads)

### Technical Implementation

**Analytics Stack:**

| Component | Tool | Purpose |
|-----------|------|---------|
| Page Analytics | Vercel Analytics | Page views, visitors, referrers |
| Event Tracking | Vercel Analytics | Custom events (chat, video views) |
| Chat Logs | Vercel KV (Redis) | Conversation storage |
| Session Data | Vercel KV | User sessions, stats |

**Vercel Analytics Setup:**

File: `app/layout.tsx`

```typescript
import { Analytics } from '@vercel/analytics/react'

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <Analytics /> {/* Add this line */}
      </body>
    </html>
  )
}
```

**Custom Event Tracking:**

File: `lib/analytics.ts`

```typescript
import { track } from '@vercel/analytics'

export const analytics = {
  // Chat events
  chatStarted: (page: string) => {
    track('chat_started', { page })
  },

  chatMessage: (data: {
    hasHistory: boolean
    category?: string
    needsReply?: boolean
  }) => {
    track('chat_message', data)
  },

  chatFeedback: (helpful: boolean, chatId: string) => {
    track('chat_feedback', { helpful, chatId })
  },

  // Video events
  videoViewed: (videoId: string, category: string) => {
    track('video_viewed', { videoId, category })
  },

  videoSummarized: (videoId: string) => {
    track('video_summarized', { videoId })
  },

  // Document events
  documentViewed: (fileName: string) => {
    track('document_viewed', { fileName })
  },
}
```

**Chat Logging to Vercel KV:**

File: `lib/chat-logger.ts`

```typescript
import { kv } from '@vercel/kv'
import { nanoid } from 'nanoid'

export interface ChatLog {
  id: string
  timestamp: number
  sessionId: string
  userMessage: string
  assistantResponse: string
  sources: string[]              // Documents used from RAG
  pageContext?: {
    page: string
    category?: string
    videoId?: string
  }
  userEmail?: string             // If voluntarily provided
  needsHumanReply?: boolean      // Low confidence or explicit request
  feedback?: 'positive' | 'negative'
  responseTime?: number          // Milliseconds
}

export async function logChat(log: ChatLog) {
  const key = `chat:${log.id}`

  // Store individual chat (90-day TTL)
  await kv.set(key, log, { ex: 60 * 60 * 24 * 90 })

  // Add to daily index
  const date = new Date().toISOString().split('T')[0]
  await kv.lpush(`chats:${date}`, log.id)

  // Increment counters
  await kv.incr('stats:total-chats')
  await kv.incr(`stats:chats:${date}`)

  // Track top questions
  const questionKey = log.userMessage.toLowerCase().substring(0, 100)
  await kv.zincrby('stats:top-questions', 1, questionKey)

  // If needs reply, add to inbox
  if (log.needsHumanReply) {
    await kv.lpush('inbox:needs-reply', log.id)
  }
}

export async function getChatStats(period: 'today' | 'week' | 'month' | 'all') {
  const now = new Date()
  let days = 1

  switch (period) {
    case 'week': days = 7; break
    case 'month': days = 30; break
    case 'all': days = 365; break // Max 1 year
  }

  let totalChats = 0
  const chatsByDay: Record<string, number> = {}

  for (let i = 0; i < days; i++) {
    const date = new Date(now)
    date.setDate(date.getDate() - i)
    const dateKey = date.toISOString().split('T')[0]

    const count = await kv.get<number>(`stats:chats:${dateKey}`) || 0
    totalChats += count
    chatsByDay[dateKey] = count
  }

  // Get top questions
  const topQuestions = await kv.zrange('stats:top-questions', 0, 9, { rev: true, withScores: true })

  // Get needs reply count
  const needsReplyCount = await kv.llen('inbox:needs-reply')

  return {
    totalChats,
    chatsByDay,
    topQuestions,
    needsReplyCount,
  }
}
```

**Update Chat API to Log:**

File: `app/api/chat/route.ts`

```typescript
import { logChat } from '@/lib/chat-logger'
import { nanoid } from 'nanoid'

export async function POST(req: NextRequest) {
  const startTime = Date.now()
  const chatId = nanoid()
  const { message, history, pageContext } = await req.json()

  // ... RAG logic to get response ...

  const responseTime = Date.now() - startTime

  // Log to KV (async, don't block response)
  logChat({
    id: chatId,
    timestamp: Date.now(),
    sessionId: req.cookies.get('session-id')?.value || 'anonymous',
    userMessage: message,
    assistantResponse: fullResponse,
    sources: matches.map(m => m.metadata.title),
    pageContext,
    responseTime,
    needsHumanReply: matches[0]?.score < 0.7, // Low confidence
  }).catch(console.error) // Don't fail if logging fails

  // Return streaming response
}
```

### Admin Analytics Dashboard

File: `app/admin/analytics/page.tsx`

**UI Components:**

```typescript
<div className="grid grid-cols-1 md:grid-cols-4 gap-6">
  {/* Today */}
  <StatsCard
    title="Today"
    value={stats.today.chats}
    subtitle="chats"
    trend={+12%}
  />

  {/* This Week */}
  <StatsCard
    title="This Week"
    value={stats.week.chats}
    subtitle="chats"
    trend={+8%}
  />

  {/* This Month */}
  <StatsCard
    title="This Month"
    value={stats.month.chats}
    subtitle="chats"
    trend={+15%}
  />

  {/* All Time */}
  <StatsCard
    title="All Time"
    value={stats.total.chats}
    subtitle="chats"
  />
</div>

{/* Chart: Chats per day */}
<ChartCard title="Chat Volume (Last 30 Days)">
  <LineChart data={stats.chatsByDay} />
</ChartCard>

{/* Top Questions */}
<Card>
  <h3>🔥 Top Questions (This Month)</h3>
  <ul>
    {stats.topQuestions.map((q, i) => (
      <li key={i}>
        {i + 1}. "{q.question}"
        <span className="text-gray-500">→ Asked {q.count} times</span>
      </li>
    ))}
  </ul>
</Card>

{/* Needs Reply */}
<Card>
  <h3>📧 Needs Reply ({stats.needsReplyCount})</h3>
  {stats.needsReply.map(chat => (
    <div key={chat.id} className="border-b py-3">
      <p className="font-medium">{chat.userEmail || 'Anonymous'}</p>
      <p className="text-sm text-gray-600">{chat.userMessage.substring(0, 100)}...</p>
      <p className="text-xs text-gray-400">{formatTimeAgo(chat.timestamp)}</p>
      <div className="mt-2">
        <Button size="sm" onClick={() => viewChat(chat.id)}>View</Button>
        <Button size="sm" variant="outline" onClick={() => replyTo(chat)}>Reply</Button>
      </div>
    </div>
  ))}
</Card>

{/* User Satisfaction */}
<Card>
  <h3>😊 User Satisfaction</h3>
  <div className="flex items-center gap-4">
    <div>
      <p className="text-3xl font-bold">{stats.satisfaction.positive}%</p>
      <p className="text-sm text-green-600">👍 Positive</p>
    </div>
    <div>
      <p className="text-3xl font-bold">{stats.satisfaction.negative}%</p>
      <p className="text-sm text-red-600">👎 Negative</p>
    </div>
  </div>
</Card>
```

---

## 3. Admin Dashboard

### Authentication

**Method:** NextAuth v5 with Credentials provider

**Environment Variables:**

```bash
# .env.local
ADMIN_EMAIL=hungreo2005@gmail.com
ADMIN_PASSWORD_HASH=$2a$10$xyz... # bcrypt hash
NEXTAUTH_SECRET=your-32-char-random-string
NEXTAUTH_URL=https://hungreo.vercel.app
```

**Generate Password Hash:**

```bash
# Use this script to generate hash
node -e "console.log(require('bcryptjs').hashSync('your-password', 10))"
```

**NextAuth Configuration:**

File: `app/api/auth/[...nextauth]/route.ts`

```typescript
import NextAuth from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'

const handler = NextAuth({
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (
          credentials?.email === process.env.ADMIN_EMAIL &&
          bcrypt.compareSync(credentials.password, process.env.ADMIN_PASSWORD_HASH!)
        ) {
          return {
            id: '1',
            email: process.env.ADMIN_EMAIL,
            name: 'Admin',
          }
        }
        return null
      }
    })
  ],
  session: {
    strategy: 'jwt',
    maxAge: 7 * 24 * 60 * 60, // 7 days
  },
  pages: {
    signIn: '/admin/login',
  },
})

export { handler as GET, handler as POST }
```

**Middleware Protection:**

File: `middleware.ts`

```typescript
import { withAuth } from 'next-auth/middleware'

export default withAuth({
  callbacks: {
    authorized: ({ token }) => !!token,
  },
})

export const config = {
  matcher: ['/admin/:path*'],
}
```

**Login Page:**

File: `app/admin/login/page.tsx`

```typescript
'use client'

import { signIn } from 'next-auth/react'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const result = await signIn('credentials', {
      email,
      password,
      redirect: false,
    })

    if (result?.error) {
      setError('Invalid credentials')
    } else {
      router.push('/admin/dashboard')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <form onSubmit={handleSubmit} className="w-full max-w-md">
        <h1 className="text-2xl font-bold mb-6">Admin Login</h1>

        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded mb-4">
            {error}
          </div>
        )}

        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          className="w-full p-3 border rounded mb-4"
        />

        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          className="w-full p-3 border rounded mb-4"
        />

        <button
          type="submit"
          className="w-full bg-primary-600 text-white p-3 rounded"
        >
          Login
        </button>
      </form>
    </div>
  )
}
```

### Dashboard Layout

File: `app/admin/dashboard/layout.tsx`

```typescript
import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { Tabs } from '@/components/admin/Tabs'

export default async function AdminLayout({ children }) {
  const session = await getServerSession()

  if (!session) {
    redirect('/admin/login')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between">
          <h1 className="text-xl font-bold">Admin Dashboard</h1>
          <button onClick={() => signOut()}>Logout</button>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        <Tabs
          tabs={[
            { label: 'Overview', href: '/admin/dashboard' },
            { label: 'Analytics', href: '/admin/analytics' },
            { label: 'Documents', href: '/admin/documents' },
            { label: 'Videos', href: '/admin/videos' },
            { label: 'Scraper', href: '/admin/scraper' },
            { label: 'Email Inbox', href: '/admin/inbox' },
          ]}
        />

        <div className="mt-6">
          {children}
        </div>
      </div>
    </div>
  )
}
```

---

## 4. Document Management

### Upload Workflow

```
1. Admin uploads file (PDF/TXT/DOCX)
         ↓
2. Check file size
   - < 4.5MB: Direct API upload
   - 4.5MB-20MB: Use Vercel Blob
         ↓
3. Parse file content
   - PDF: pdf-parse library
   - DOCX: mammoth library
   - TXT: fs.readFileSync
         ↓
4. Show in "Pending Review" list
         ↓
5. Admin clicks "Review"
   - Edit extracted text
   - Add metadata (title, category, tags)
   - Preview chunks (512 tokens each)
   - See cost estimate
         ↓
6. Admin clicks "Approve"
   - Chunk text into 512-token pieces
   - Generate embeddings (OpenAI)
   - Upload to Pinecone with metadata
         ↓
7. Move to "Active Knowledge Base"
   - Show vector count
   - Allow removal
```

### File Upload API

File: `app/api/admin/upload/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { put } from '@vercel/blob'
import pdfParse from 'pdf-parse'
import mammoth from 'mammoth'

export async function POST(req: NextRequest) {
  const session = await getServerSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const formData = await req.formData()
  const file = formData.get('file') as File

  if (!file) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 })
  }

  // Validate file type
  const allowedTypes = [
    'application/pdf',
    'text/plain',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ]

  if (!allowedTypes.includes(file.type)) {
    return NextResponse.json({ error: 'Invalid file type' }, { status: 400 })
  }

  // Validate file size (max 20MB)
  const maxSize = 20 * 1024 * 1024
  if (file.size > maxSize) {
    return NextResponse.json({ error: 'File too large (max 20MB)' }, { status: 400 })
  }

  let fileUrl: string

  // If < 4.5MB, process directly
  // If >= 4.5MB, upload to Vercel Blob
  if (file.size < 4.5 * 1024 * 1024) {
    // Process directly
    const buffer = Buffer.from(await file.arrayBuffer())

    let extractedText = ''

    if (file.type === 'application/pdf') {
      const data = await pdfParse(buffer)
      extractedText = data.text
    } else if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      const result = await mammoth.extractRawText({ buffer })
      extractedText = result.value
    } else {
      extractedText = buffer.toString('utf-8')
    }

    // Save to KV as "pending"
    const docId = nanoid()
    await kv.set(`doc:pending:${docId}`, {
      id: docId,
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
      extractedText,
      uploadedAt: Date.now(),
      status: 'pending',
    }, { ex: 60 * 60 * 24 * 7 }) // 7 days expiry

    return NextResponse.json({ success: true, docId })
  } else {
    // Upload to Vercel Blob
    const blob = await put(file.name, file, {
      access: 'public',
    })

    fileUrl = blob.url

    // Queue for processing
    // (Vercel Blob URL can be processed asynchronously)

    return NextResponse.json({ success: true, blobUrl: fileUrl })
  }
}
```

### Review Interface

File: `app/admin/documents/[id]/review/page.tsx`

```typescript
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function DocumentReview({ params }: { params: { id: string } }) {
  const [doc, setDoc] = useState<any>(null)
  const [editedText, setEditedText] = useState('')
  const [metadata, setMetadata] = useState({
    title: '',
    category: '',
    tags: '',
  })
  const router = useRouter()

  useEffect(() => {
    // Fetch document from /api/admin/documents/${params.id}
    // Set doc, editedText, metadata
  }, [params.id])

  const handleApprove = async () => {
    // 1. Chunk edited text
    const chunks = chunkText(editedText, 512)

    // 2. Generate embeddings
    const embeddings = await Promise.all(
      chunks.map(chunk => generateEmbedding(chunk))
    )

    // 3. Upload to Pinecone
    await uploadToPinecone(embeddings, metadata)

    // 4. Update status to "approved"
    await fetch(`/api/admin/documents/${params.id}`, {
      method: 'PATCH',
      body: JSON.stringify({ status: 'approved' }),
    })

    // 5. Redirect to documents list
    router.push('/admin/documents')
  }

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Review Document</h1>

      {/* Metadata Form */}
      <div className="bg-white p-6 rounded-lg shadow mb-6">
        <h2 className="font-semibold mb-4">Metadata</h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Title</label>
            <input
              type="text"
              value={metadata.title}
              onChange={(e) => setMetadata({ ...metadata, title: e.target.value })}
              className="w-full border rounded p-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Category</label>
            <select
              value={metadata.category}
              onChange={(e) => setMetadata({ ...metadata, category: e.target.value })}
              className="w-full border rounded p-2"
            >
              <option value="">Select category</option>
              <option value="Leadership">Leadership</option>
              <option value="AI Works">AI Works</option>
              <option value="Health">Health</option>
              <option value="Entertaining">Entertaining</option>
              <option value="Human Philosophy">Human Philosophy</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Tags (comma-separated)</label>
            <input
              type="text"
              value={metadata.tags}
              onChange={(e) => setMetadata({ ...metadata, tags: e.target.value })}
              placeholder="leadership, vision, motivation"
              className="w-full border rounded p-2"
            />
          </div>
        </div>
      </div>

      {/* Extracted Text Editor */}
      <div className="bg-white p-6 rounded-lg shadow mb-6">
        <h2 className="font-semibold mb-4">Extracted Text (Editable)</h2>
        <textarea
          value={editedText}
          onChange={(e) => setEditedText(e.target.value)}
          className="w-full h-96 border rounded p-3 font-mono text-sm"
        />
      </div>

      {/* Preview & Cost */}
      <div className="bg-white p-6 rounded-lg shadow mb-6">
        <h2 className="font-semibold mb-4">Preview</h2>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-gray-600">Total Characters</p>
            <p className="text-2xl font-bold">{editedText.length.toLocaleString()}</p>
          </div>

          <div>
            <p className="text-gray-600">Estimated Chunks</p>
            <p className="text-2xl font-bold">{Math.ceil(editedText.length / 2048)}</p>
          </div>

          <div>
            <p className="text-gray-600">Vectors to Create</p>
            <p className="text-2xl font-bold">{Math.ceil(editedText.length / 2048)}</p>
          </div>

          <div>
            <p className="text-gray-600">Estimated Cost</p>
            <p className="text-2xl font-bold text-green-600">
              ${(Math.ceil(editedText.length / 2048) * 0.00002).toFixed(4)}
            </p>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-4">
        <button
          onClick={() => router.back()}
          className="px-6 py-2 border rounded"
        >
          Cancel
        </button>

        <button
          onClick={handleApprove}
          className="px-6 py-2 bg-green-600 text-white rounded"
        >
          ✅ Approve & Add to Knowledge Base
        </button>
      </div>
    </div>
  )
}
```

---

## 5. YouTube Video System

### Video Upload Workflow

```
1. Admin pastes YouTube URL(s)
   - Single: One URL input
   - Batch: Multiple URLs (one per line)
         ↓
2. Extract video IDs from URLs
         ↓
3. For each video:
   - Fetch metadata (YouTube Data API v3)
     → title, channel, duration, thumbnail, publishedAt
   - Fetch transcript (youtube-transcript package)
     → Full captions text
         ↓
4. Admin assigns category
   - Leadership
   - AI Works
   - Health
   - Entertaining
   - Human Philosophy
         ↓
5. Preview video info + transcript
         ↓
6. Admin clicks "Import"
   - Combine: title + description + transcript
   - Chunk text (512 tokens)
   - Generate embeddings
   - Upload to Pinecone with metadata:
     {
       type: 'youtube',
       videoId: '...',
       category: 'Leadership',
       author: 'Simon Sinek',
       transcript: 'full text...',
       ...
     }
         ↓
7. Show in Video Library
   - Searchable
   - Filterable by category
   - Deletable (removes vectors)
```

### Video Management API

File: `app/api/admin/videos/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import axios from 'axios'
import { YoutubeTranscript } from 'youtube-transcript'

// Extract video ID from URL
function extractVideoId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/,
    /youtube\.com\/embed\/([^&\n?#]+)/,
  ]

  for (const pattern of patterns) {
    const match = url.match(pattern)
    if (match) return match[1]
  }

  return null
}

// Fetch video metadata from YouTube Data API
async function getVideoMetadata(videoId: string) {
  const apiKey = process.env.YOUTUBE_API_KEY
  const url = `https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails&id=${videoId}&key=${apiKey}`

  const response = await axios.get(url)
  const video = response.data.items?.[0]

  if (!video) {
    throw new Error('Video not found')
  }

  return {
    title: video.snippet.title,
    description: video.snippet.description,
    channelTitle: video.snippet.channelTitle,
    publishedAt: video.snippet.publishedAt,
    duration: video.contentDetails.duration,
    thumbnailUrl: video.snippet.thumbnails.medium.url,
  }
}

// Fetch transcript
async function getTranscript(videoId: string): Promise<string> {
  try {
    const transcript = await YoutubeTranscript.fetchTranscript(videoId)
    return transcript.map(item => item.text).join(' ')
  } catch (error) {
    // Fallback to description if no transcript
    return ''
  }
}

export async function POST(req: NextRequest) {
  const session = await getServerSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { urls, category } = await req.json()

  if (!urls || !Array.isArray(urls)) {
    return NextResponse.json({ error: 'Invalid URLs' }, { status: 400 })
  }

  const results = []

  for (const url of urls) {
    const videoId = extractVideoId(url)

    if (!videoId) {
      results.push({ url, success: false, error: 'Invalid URL' })
      continue
    }

    try {
      // Fetch metadata
      const metadata = await getVideoMetadata(videoId)

      // Fetch transcript
      const transcript = await getTranscript(videoId)

      // Save to KV as "pending"
      const docId = `video-${videoId}`
      await kv.set(`video:pending:${docId}`, {
        id: docId,
        videoId,
        ...metadata,
        transcript: transcript || metadata.description,
        category,
        uploadedAt: Date.now(),
        status: 'pending',
      }, { ex: 60 * 60 * 24 * 7 }) // 7 days

      results.push({ url, success: true, videoId, title: metadata.title })
    } catch (error: any) {
      results.push({ url, success: false, error: error.message })
    }
  }

  return NextResponse.json({ results })
}

// DELETE endpoint to remove video
export async function DELETE(req: NextRequest) {
  const session = await getServerSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { videoId } = await req.json()

  // Delete from Pinecone (all vectors with this videoId prefix)
  const index = await getPineconeIndex()
  await index.deleteMany({ prefix: `video-${videoId}` })

  // Delete from KV
  await kv.del(`video:${videoId}`)

  return NextResponse.json({ success: true })
}
```

### Video Library UI

File: `app/admin/videos/page.tsx`

```typescript
'use client'

import { useState, useEffect } from 'react'

export default function VideosPage() {
  const [videos, setVideos] = useState([])
  const [singleUrl, setSingleUrl] = useState('')
  const [batchUrls, setBatchUrls] = useState('')
  const [category, setCategory] = useState('Leadership')
  const [searchTerm, setSearchTerm] = useState('')
  const [filterCategory, setFilterCategory] = useState('all')

  const handleSingleImport = async () => {
    const res = await fetch('/api/admin/videos', {
      method: 'POST',
      body: JSON.stringify({ urls: [singleUrl], category }),
    })

    const data = await res.json()
    // Show success/error toast
    // Refresh video list
  }

  const handleBatchImport = async () => {
    const urls = batchUrls.split('\n').filter(u => u.trim())

    const res = await fetch('/api/admin/videos', {
      method: 'POST',
      body: JSON.stringify({ urls, category }),
    })

    const data = await res.json()
    // Show results for each URL
  }

  const handleDelete = async (videoId: string) => {
    if (!confirm('Are you sure? This will delete all vectors.')) return

    await fetch('/api/admin/videos', {
      method: 'DELETE',
      body: JSON.stringify({ videoId }),
    })

    // Refresh list
  }

  return (
    <div className="space-y-8">
      {/* Import Section */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-bold mb-4">📹 Add YouTube Videos</h2>

        {/* Single URL */}
        <div className="mb-6">
          <label className="block font-medium mb-2">Single Video URL</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={singleUrl}
              onChange={(e) => setSingleUrl(e.target.value)}
              placeholder="https://youtube.com/watch?v=..."
              className="flex-1 border rounded p-2"
            />
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="border rounded p-2"
            >
              <option value="Leadership">Leadership</option>
              <option value="AI Works">AI Works</option>
              <option value="Health">Health</option>
              <option value="Entertaining">Entertaining</option>
              <option value="Human Philosophy">Human Philosophy</option>
            </select>
            <button
              onClick={handleSingleImport}
              className="bg-blue-600 text-white px-4 rounded"
            >
              Add
            </button>
          </div>
        </div>

        {/* Batch Import */}
        <div>
          <label className="block font-medium mb-2">
            Batch Import (one URL per line)
          </label>
          <textarea
            value={batchUrls}
            onChange={(e) => setBatchUrls(e.target.value)}
            placeholder={`https://youtube.com/watch?v=1\nhttps://youtube.com/watch?v=2\nhttps://youtube.com/watch?v=3`}
            className="w-full border rounded p-3 h-32 font-mono text-sm"
          />
          <div className="mt-2 flex justify-end gap-2">
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="border rounded p-2"
            >
              <option value="Leadership">Leadership</option>
              <option value="AI Works">AI Works</option>
              <option value="Health">Health</option>
              <option value="Entertaining">Entertaining</option>
              <option value="Human Philosophy">Human Philosophy</option>
            </select>
            <button
              onClick={handleBatchImport}
              className="bg-blue-600 text-white px-4 py-2 rounded"
            >
              Batch Import
            </button>
          </div>
        </div>
      </div>

      {/* Video Library */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-bold mb-4">📚 Video Library ({videos.length})</h2>

        {/* Filters */}
        <div className="flex gap-4 mb-6">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search videos..."
            className="flex-1 border rounded p-2"
          />

          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="border rounded p-2"
          >
            <option value="all">All Categories</option>
            <option value="Leadership">Leadership</option>
            <option value="AI Works">AI Works</option>
            <option value="Health">Health</option>
            <option value="Entertaining">Entertaining</option>
            <option value="Human Philosophy">Human Philosophy</option>
          </select>
        </div>

        {/* Video List */}
        <div className="space-y-4">
          {videos
            .filter(v => {
              if (filterCategory !== 'all' && v.category !== filterCategory) return false
              if (searchTerm && !v.title.toLowerCase().includes(searchTerm.toLowerCase())) return false
              return true
            })
            .map(video => (
              <div key={video.id} className="border rounded p-4 flex gap-4">
                <img
                  src={video.thumbnailUrl}
                  alt={video.title}
                  className="w-40 h-24 object-cover rounded"
                />

                <div className="flex-1">
                  <h3 className="font-semibold">{video.title}</h3>
                  <p className="text-sm text-gray-600">{video.channelTitle}</p>
                  <div className="flex gap-4 mt-2 text-sm text-gray-500">
                    <span className="bg-blue-100 px-2 py-1 rounded">{video.category}</span>
                    <span>{video.vectors} vectors</span>
                    <span>{new Date(video.uploadedAt).toLocaleDateString()}</span>
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <button className="px-3 py-1 border rounded text-sm">View</button>
                  <button className="px-3 py-1 border rounded text-sm">Edit</button>
                  <button
                    onClick={() => handleDelete(video.videoId)}
                    className="px-3 py-1 bg-red-600 text-white rounded text-sm"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  )
}
```

---

## 6. Website Auto-Scraper

### Requirements

- ✅ Auto-scrape all public pages
- ✅ Extract meaningful text (ignore nav, footer, UI elements)
- ✅ Generate embeddings for each page
- ✅ Upload to Pinecone
- ✅ Manual trigger from admin dashboard
- ✅ Show last scraped timestamp
- ✅ List of indexed pages

### Implementation

File: `scripts/scrape-website.ts`

```typescript
import * as cheerio from 'cheerio'
import { createEmbedding } from '../lib/openai'
import { getPineconeIndex } from '../lib/pinecone'

const PAGES_TO_SCRAPE = [
  '/',
  '/about',
  '/projects',
  '/blog',
  '/contact',
  // Add more as needed
]

async function fetchPage(url: string): Promise<string> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
  const response = await fetch(`${baseUrl}${url}`)
  return await response.text()
}

function extractMainContent(html: string): string {
  const $ = cheerio.load(html)

  // Remove unwanted elements
  $('nav, header, footer, script, style, .navigation, .header, .footer').remove()

  // Get main content
  const mainContent = $('main').text() || $('body').text()

  // Clean up whitespace
  return mainContent
    .replace(/\s+/g, ' ')
    .trim()
}

async function scrapeWebsite() {
  console.log('🚀 Starting website scrape...')

  const index = await getPineconeIndex()
  const results = []

  for (const path of PAGES_TO_SCRAPE) {
    console.log(`Scraping: ${path}`)

    try {
      // Fetch HTML
      const html = await fetchPage(path)

      // Extract content
      const content = extractMainContent(html)

      if (!content || content.length < 100) {
        console.log(`⚠️  Skipping ${path} (too little content)`)
        continue
      }

      // Generate embedding
      const embedding = await createEmbedding(content.substring(0, 8000)) // Max 8K chars

      // Upload to Pinecone
      const id = `website-${path.replace(/\//g, '-') || 'home'}`
      await index.upsert([{
        id,
        values: embedding,
        metadata: {
          type: 'website',
          url: path,
          pageType: path === '/' ? 'home' : path.split('/')[1],
          title: `Website Page: ${path}`,
          description: content.substring(0, 200),
          scrapedAt: new Date().toISOString(),
        },
      }])

      console.log(`✅ Scraped: ${path} (${content.length} chars)`)
      results.push({ path, success: true })
    } catch (error: any) {
      console.error(`❌ Error scraping ${path}:`, error.message)
      results.push({ path, success: false, error: error.message })
    }
  }

  console.log('\n🎉 Scrape complete!')
  console.log(`Success: ${results.filter(r => r.success).length}/${results.length}`)

  return results
}

export { scrapeWebsite }
```

### Admin API Endpoint

File: `app/api/admin/scrape/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { scrapeWebsite } from '@/scripts/scrape-website'
import { kv } from '@vercel/kv'

export async function POST(req: NextRequest) {
  const session = await getServerSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Run scraper
  const results = await scrapeWebsite()

  // Save last scraped timestamp
  await kv.set('scraper:last-run', {
    timestamp: Date.now(),
    results,
  })

  return NextResponse.json({ success: true, results })
}

export async function GET(req: NextRequest) {
  const session = await getServerSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Get last run info
  const lastRun = await kv.get<any>('scraper:last-run')

  return NextResponse.json(lastRun || null)
}
```

### Admin UI

File: `app/admin/scraper/page.tsx`

```typescript
'use client'

import { useState, useEffect } from 'react'

export default function ScraperPage() {
  const [lastRun, setLastRun] = useState<any>(null)
  const [isRunning, setIsRunning] = useState(false)

  useEffect(() => {
    fetchLastRun()
  }, [])

  const fetchLastRun = async () => {
    const res = await fetch('/api/admin/scrape')
    const data = await res.json()
    setLastRun(data)
  }

  const handleRunScraper = async () => {
    setIsRunning(true)

    try {
      const res = await fetch('/api/admin/scrape', { method: 'POST' })
      const data = await res.json()

      setLastRun(data)
      alert('Scraper completed successfully!')
    } catch (error) {
      alert('Scraper failed. Check console for details.')
    } finally {
      setIsRunning(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">🔍 Website Scraper</h1>

      <div className="bg-white p-6 rounded-lg shadow mb-6">
        <h2 className="font-semibold mb-4">Auto-Update Knowledge Base</h2>
        <p className="text-gray-600 mb-4">
          Scrape all public pages and update Pinecone with the latest content.
          This ensures your chatbot always has up-to-date information.
        </p>

        <button
          onClick={handleRunScraper}
          disabled={isRunning}
          className="bg-blue-600 text-white px-6 py-3 rounded disabled:opacity-50"
        >
          {isRunning ? 'Running...' : '🚀 Run Scraper Now'}
        </button>
      </div>

      {lastRun && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="font-semibold mb-4">Last Run</h2>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <p className="text-gray-600">Timestamp</p>
              <p className="font-medium">
                {new Date(lastRun.timestamp).toLocaleString()}
              </p>
            </div>

            <div>
              <p className="text-gray-600">Status</p>
              <p className="font-medium text-green-600">
                {lastRun.results.filter(r => r.success).length}/{lastRun.results.length} Success
              </p>
            </div>
          </div>

          <h3 className="font-semibold mb-3">Pages Indexed:</h3>
          <ul className="space-y-2">
            {lastRun.results.map((result: any, i: number) => (
              <li key={i} className="flex items-center gap-2">
                {result.success ? (
                  <span className="text-green-600">✅</span>
                ) : (
                  <span className="text-red-600">❌</span>
                )}
                <span>{result.path}</span>
                {result.error && (
                  <span className="text-sm text-red-600">({result.error})</span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
```

---

## 7. AI Tools Tab

### Public Video Library

**Structure:**

```
/tools/knowledge
├── /leadership (category page)
│   ├── /start-with-why (video detail)
│   └── /5-second-rule (video detail)
├── /ai-works
├── /health
├── /entertaining
└── /human-philosophy
```

### Category Grid Page

File: `app/tools/knowledge/page.tsx`

```typescript
import Link from 'next/link'

const categories = [
  { slug: 'leadership', name: 'Leadership', icon: '👔', count: 200 },
  { slug: 'ai-works', name: 'AI Works', icon: '🤖', count: 100 },
  { slug: 'health', name: 'Health', icon: '💪', count: 100 },
  { slug: 'entertaining', name: 'Entertaining', icon: '🎬', count: 50 },
  { slug: 'human-philosophy', name: 'Human Philosophy', icon: '🧘', count: 100 },
]

export default function KnowledgePage() {
  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="text-4xl font-bold text-center mb-4">AI Tools - Knowledge Library</h1>
      <p className="text-center text-gray-600 mb-12">
        Curated video collection on leadership, AI, health, and philosophy
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {categories.map(cat => (
          <Link
            key={cat.slug}
            href={`/tools/knowledge/${cat.slug}`}
            className="bg-white rounded-lg shadow-lg p-8 hover:shadow-xl transition text-center"
          >
            <div className="text-6xl mb-4">{cat.icon}</div>
            <h2 className="text-2xl font-bold mb-2">{cat.name}</h2>
            <p className="text-gray-600">{cat.count} videos</p>
          </Link>
        ))}
      </div>
    </div>
  )
}
```

### Category Video List

File: `app/tools/knowledge/[category]/page.tsx`

```typescript
import { getPineconeIndex } from '@/lib/pinecone'
import VideoCard from '@/components/VideoCard'

export default async function CategoryPage({ params }: { params: { category: string } }) {
  // Fetch videos from Pinecone by category
  const index = await getPineconeIndex()

  // This is simplified - in reality you'd query by metadata filter
  const videos = await getVideosByCategory(params.category)

  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="text-4xl font-bold mb-8 capitalize">
        {params.category.replace('-', ' ')}
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {videos.map(video => (
          <VideoCard key={video.id} video={video} />
        ))}
      </div>
    </div>
  )
}
```

### Video Detail Page

File: `app/tools/knowledge/[category]/[slug]/page.tsx`

```typescript
import { getVideoBySlug } from '@/lib/video-utils'
import ChatInterface from '@/components/ChatInterface'

export default async function VideoDetailPage({
  params
}: {
  params: { category: string; slug: string }
}) {
  const video = await getVideoBySlug(params.category, params.slug)

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-4xl font-bold mb-4">{video.title}</h1>
        <p className="text-gray-600 mb-8">{video.author} • {video.category}</p>

        {/* Video Player */}
        <div className="aspect-video mb-8">
          <iframe
            src={`https://www.youtube.com/embed/${video.videoId}`}
            title={video.title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="w-full h-full rounded-lg"
          />
        </div>

        {/* Video Info */}
        <div className="bg-gray-50 p-6 rounded-lg mb-8">
          <h2 className="text-xl font-bold mb-2">About this video</h2>
          <p className="text-gray-700">{video.description}</p>
        </div>

        {/* Context-Aware Chat */}
        <div className="bg-white border rounded-lg p-6">
          <h2 className="text-xl font-bold mb-4">💬 Ask AI about this video</h2>
          <ChatInterface
            context={{
              type: 'video',
              videoId: video.videoId,
              category: video.category,
            }}
          />
        </div>
      </div>
    </div>
  )
}
```

---

## 8. Email Notifications

### Requirements

- ✅ Auto-send email when chatbot can't answer (low confidence)
- ✅ Auto-send when user explicitly requests contact
- ✅ Extract email from user message if provided
- ✅ Include full conversation context
- ✅ Link to admin chat viewer

### Resend API Setup

```bash
npm install resend
```

```bash
# .env.local
RESEND_API_KEY=re_your_api_key_here
```

### Email Service

File: `lib/email.ts`

```typescript
import { Resend } from 'resend'
import type { ChatLog } from './chat-logger'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function notifyHungAboutChat(log: ChatLog) {
  try {
    await resend.emails.send({
      from: 'Chatbot <chatbot@hungreo.vercel.app>',
      to: 'hungreo2005@gmail.com',
      subject: `🤖 Chatbot Alert: "${log.userMessage.substring(0, 50)}..."`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #3b82f6; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
            .content { background: #f9fafb; padding: 20px; }
            .message { background: white; padding: 15px; border-left: 4px solid #3b82f6; margin: 10px 0; }
            .response { background: white; padding: 15px; border-left: 4px solid #10b981; margin: 10px 0; }
            .button { display: inline-block; padding: 12px 24px; background: #3b82f6; color: white; text-decoration: none; border-radius: 6px; margin-top: 20px; }
            .metadata { font-size: 14px; color: #6b7280; margin-top: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="margin: 0;">🤖 Chatbot Needs Your Help</h1>
            </div>

            <div class="content">
              <p><strong>A user has a question that the chatbot couldn't confidently answer:</strong></p>

              <div class="message">
                <strong>User Question:</strong><br/>
                ${log.userMessage}
              </div>

              <div class="response">
                <strong>Chatbot's Attempt:</strong><br/>
                ${log.assistantResponse}
              </div>

              ${log.userEmail ? `
                <div style="background: #fef3c7; padding: 15px; border-radius: 6px; margin: 20px 0;">
                  <strong>📧 User provided email:</strong><br/>
                  <a href="mailto:${log.userEmail}" style="color: #3b82f6; font-size: 16px;">${log.userEmail}</a>
                </div>
              ` : ''}

              <div class="metadata">
                <strong>Context:</strong><br/>
                Page: ${log.pageContext?.page || 'Unknown'}<br/>
                ${log.pageContext?.category ? `Category: ${log.pageContext.category}<br/>` : ''}
                ${log.pageContext?.videoId ? `Video: ${log.pageContext.videoId}<br/>` : ''}
                Timestamp: ${new Date(log.timestamp).toLocaleString()}<br/>
                Response Time: ${log.responseTime}ms
              </div>

              <a href="${process.env.NEXTAUTH_URL}/admin/chats/${log.id}" class="button">
                View Full Conversation →
              </a>
            </div>
          </div>
        </body>
        </html>
      `,
    })

    console.log(`✅ Email notification sent for chat ${log.id}`)
  } catch (error) {
    console.error('Failed to send email notification:', error)
  }
}
```

### Email Detection

File: `lib/detect-email-intent.ts`

```typescript
export function detectEmailIntent(message: string): {
  wantsContact: boolean
  email?: string
} {
  const lowerMessage = message.toLowerCase()

  // Check for contact intent keywords
  const contactKeywords = [
    'contact',
    'reach out',
    'email me',
    'get back to me',
    'send me',
    'reply to me',
    'contact me',
    'get in touch',
  ]

  const wantsContact = contactKeywords.some(keyword => lowerMessage.includes(keyword))

  // Extract email with regex
  const emailRegex = /[\w.-]+@[\w.-]+\.\w+/g
  const emails = message.match(emailRegex)

  return {
    wantsContact,
    email: emails?.[0],
  }
}
```

### Update Chat API

File: `app/api/chat/route.ts`

```typescript
import { detectEmailIntent } from '@/lib/detect-email-intent'
import { notifyHungAboutChat } from '@/lib/email'

export async function POST(req: NextRequest) {
  const startTime = Date.now()
  const chatId = nanoid()
  const { message, history, pageContext } = await req.json()

  // ... RAG logic ...

  // Check confidence score
  const confidence = matches[0]?.score || 0
  const needsHumanReply = confidence < 0.7

  // Check if user wants contact
  const { wantsContact, email } = detectEmailIntent(message)

  // Build chat log
  const chatLog: ChatLog = {
    id: chatId,
    timestamp: Date.now(),
    sessionId: req.cookies.get('session-id')?.value || 'anonymous',
    userMessage: message,
    assistantResponse: fullResponse,
    sources: matches.map(m => m.metadata.title),
    pageContext,
    responseTime: Date.now() - startTime,
    needsHumanReply: needsHumanReply || wantsContact,
    userEmail: email,
  }

  // Log to KV
  await logChat(chatLog)

  // Send email if needed
  if (chatLog.needsHumanReply || chatLog.userEmail) {
    await notifyHungAboutChat(chatLog)
  }

  // If user wants contact, add to system prompt
  if (wantsContact && email) {
    systemPrompt += `\n\nIMPORTANT: The user (${email}) has requested to be contacted. Acknowledge this and let them know Hung will reach out within 24 hours.`
  }

  // ... return streaming response ...
}
```

---

## Database Schema

### Pinecone Vector Metadata

```typescript
interface VectorMetadata {
  // Common fields
  id: string                    // Unique identifier
  type: 'website' | 'pdf' | 'youtube' | 'document'
  title: string
  description: string
  uploadedAt: string            // ISO timestamp

  // For website pages
  url?: string                  // /about, /projects
  pageType?: string             // about | project | blog
  scrapedAt?: string            // Last scrape timestamp

  // For documents (PDF/TXT/DOCX)
  fileName?: string
  fileSize?: number             // bytes
  status?: 'draft' | 'approved'

  // For YouTube videos
  category?: string             // Leadership | AI Works | Health...
  author?: string               // Simon Sinek | Mel Robbins...
  videoId?: string              // YouTube video ID
  videoUrl?: string
  transcript?: string           // Full transcript text (stored in metadata)
  thumbnailUrl?: string
  publishedAt?: string
  duration?: string             // ISO 8601 duration

  // Search optimization
  tags?: string                 // "leadership,vision,motivation"
  chunkIndex?: number           // For multi-chunk items
  totalChunks?: number
}
```

### Vercel KV Keys

**Chat Logs:**
```
chat:{chatId}                   → ChatLog object (90-day TTL)
chats:{YYYY-MM-DD}              → List of chat IDs for that day
stats:total-chats               → Total chat count
stats:chats:{YYYY-MM-DD}        → Chat count for that day
stats:top-questions             → Sorted set of question → count
inbox:needs-reply               → List of chat IDs needing human reply
```

**Documents:**
```
doc:pending:{docId}             → Pending document (7-day TTL)
doc:approved:{docId}            → Approved document metadata
```

**Videos:**
```
video:pending:{videoId}         → Pending video (7-day TTL)
video:{videoId}                 → Approved video metadata
```

**Scraper:**
```
scraper:last-run                → { timestamp, results }
```

**Sessions:**
```
session:{sessionId}             → User session data (30-day TTL)
```

---

## Implementation Plan

### Phase Breakdown

| Phase | Hours | Tasks | Deliverables |
|-------|-------|-------|--------------|
| **1. Chat History** | 3h | LocalStorage hook, ChatBot updates, API changes | Context-aware chatbot |
| **2. Analytics** | 8h | Vercel Analytics, KV logging, admin dashboard | Full analytics system |
| **3. Admin Auth** | 2h | NextAuth setup, login page, middleware | Secure admin access |
| **4. Documents** | 5h | Upload API, parsers, review UI, approval flow | Document management |
| **5. YouTube** | 4h | Video API, transcript extraction, library UI | Video management |
| **6. Scraper** | 2h | Scrape script, admin trigger, status display | Auto-update knowledge |
| **7. AI Tools** | 3h | Category pages, video detail, context chat | Public video library |
| **8. Email** | 2h | Resend setup, email detection, notifications | Email system |
| **9. Testing** | 3h | E2E tests, bug fixes, polish | Production-ready |
| **10. Deploy** | 2h | Env vars, production test, monitoring | Live on Vercel |
| **Total** | **34h** | **~1 week** | **Complete system** |

### Week-by-Week Plan

**Week 1: Core Features**
- Day 1: Chat History (3h) + Analytics Foundation (4h)
- Day 2: Analytics Dashboard (4h) + Admin Auth (2h)
- Day 3: Document Upload (5h) + YouTube API (2h)
- Day 4: YouTube UI (2h) + Website Scraper (2h) + Email (2h)
- Day 5: AI Tools Tab (3h) + Testing (3h)
- Weekend: Buffer time + documentation

**Total: 34 hours over 5 days (~7 hours/day)**

---

## Cost Analysis

### Monthly Recurring Costs

| Service | Free Tier | Your Usage | Estimated Cost |
|---------|-----------|------------|----------------|
| **OpenAI API** | Pay-as-go | ~2000 messages/month | $2-3 |
| **OpenAI Embeddings** | Pay-as-go | ~500 docs + 550 videos | $0.50-1 |
| **Pinecone** | 100K vectors, unlimited queries | ~14.5K vectors | **$0** |
| **Vercel Analytics** | 2.5K events/month | ~1K events | **$0** |
| **Vercel KV** | 256MB, 10K req/day | ~5K req/day | **$0** |
| **Resend Email** | 100 emails/day | ~5-10 emails/day | **$0** |
| **YouTube Data API** | 10K quota/day | ~50 videos/month | **$0** |
| **Vercel Blob** | 500MB, 5GB bandwidth | ~100MB, 1GB | **$0** |
| **NextAuth** | Free open-source | N/A | **$0** |
| **Total** | - | - | **$2.50-4/month** |

**Annual Cost: ~$30-48/year**

### Comparison with Alternatives

| Approach | Monthly | Yearly | 5 Years |
|----------|---------|--------|---------|
| **This Design** | $3 | $36 | $180 |
| Alternative (Pinecone Paid) | $52 | $624 | $3,120 |
| Alternative (Self-hosted ChromaDB) | $8 | $96 | $480 |

**Savings over 5 years: $300-2,940**

---

## Security & Privacy

### Authentication Security

- ✅ **Password Hashing:** Bcrypt with 10 rounds
- ✅ **Session Management:** JWT with 7-day expiry
- ✅ **Rate Limiting:** 5 login attempts per 15 minutes
- ✅ **HTTPS Only:** Enforced by Vercel
- ✅ **CSRF Protection:** NextAuth built-in
- ✅ **Secure Cookies:** httpOnly, secure, sameSite

### Data Privacy

**What we collect:**
- ✅ Anonymous session IDs (no personal data)
- ✅ Chat messages (for service improvement)
- ✅ Page views (Vercel Analytics - privacy-friendly)
- ✅ User emails (only if voluntarily provided)

**What we DON'T collect:**
- ❌ IP addresses
- ❌ Personal information without consent
- ❌ Tracking cookies (except auth session)
- ❌ Third-party analytics (e.g., Google Analytics)

**User Rights:**
- ✅ Clear chat history anytime (LocalStorage)
- ✅ Request data deletion (contact admin)
- ✅ Transparent data usage (privacy policy)
- ✅ GDPR/CCPA compliant

### File Upload Security

- ✅ **File Type Validation:** Only PDF/TXT/DOCX
- ✅ **Size Limits:** Max 20MB
- ✅ **Malware Scanning:** Content parsed before execution
- ✅ **Sandboxed Processing:** No direct file execution
- ✅ **Access Control:** Admin-only upload

---

## Testing Strategy

### Unit Tests

**Priority Components:**
- useChatHistory hook
- File parsers (PDF/DOCX/TXT)
- Email detection logic
- Chunking algorithm
- Embedding generation

**Framework:** Vitest

### Integration Tests

**Critical Flows:**
- Admin login → dashboard access
- Upload PDF → review → approve → searchable
- Add YouTube → transcript → searchable
- Chat → low confidence → email sent
- User provides email → notification sent

**Framework:** Playwright

### Manual Testing Checklist

**Before Deployment:**
- [ ] Chat history persists after refresh
- [ ] Chat history clears correctly
- [ ] Context-aware responses work
- [ ] Admin login succeeds/fails correctly
- [ ] Document upload parses correctly
- [ ] Document review edits save
- [ ] Approve adds to Pinecone
- [ ] YouTube single import works
- [ ] YouTube batch import processes all
- [ ] Transcript extraction works
- [ ] Video delete removes vectors
- [ ] Website scraper runs successfully
- [ ] Analytics dashboard shows stats
- [ ] Email notifications sent correctly
- [ ] Thumbs up/down saves feedback
- [ ] All pages responsive on mobile

---

## Deployment Checklist

### Pre-Deployment

- [ ] All tests passing
- [ ] Environment variables documented
- [ ] .env.local not committed to Git
- [ ] Error handling added
- [ ] Loading states implemented
- [ ] README.md updated
- [ ] Documentation complete

### Vercel Environment Variables

```bash
# OpenAI
OPENAI_API_KEY=sk-...

# Pinecone
PINECONE_API_KEY=pcsk_...
PINECONE_INDEX_NAME=hungreo-website

# YouTube
YOUTUBE_API_KEY=AIzaSy...

# NextAuth
NEXTAUTH_SECRET=your-32-char-secret
NEXTAUTH_URL=https://hungreo.vercel.app
ADMIN_EMAIL=hungreo2005@gmail.com
ADMIN_PASSWORD_HASH=$2a$10$...

# Resend
RESEND_API_KEY=re_...

# Site
NEXT_PUBLIC_SITE_URL=https://hungreo.vercel.app
```

### Post-Deployment

- [ ] Run embedding generation script
- [ ] Test admin login
- [ ] Test chat functionality
- [ ] Test analytics tracking
- [ ] Monitor error logs
- [ ] Check performance metrics
- [ ] Verify email notifications work
- [ ] Confirm Pinecone queries work

---

## Summary

### What We Built

✅ **8 Major Features:**
1. Chat History System
2. Analytics & Logging
3. Admin Dashboard
4. Document Management
5. YouTube Video System
6. Website Auto-Scraper
7. AI Tools Public Library
8. Email Notifications

✅ **Key Stats:**
- **Timeline:** 34 hours (~1 week)
- **Monthly Cost:** $2-4
- **Vector Usage:** 14.6% of free tier
- **Savings:** $300-2,940 over 5 years

✅ **Technology Stack:**
- Next.js 14 (App Router)
- OpenAI GPT-4o-mini + Embeddings
- Pinecone Free Tier
- Vercel Analytics + KV
- Resend Email API
- NextAuth v5

### Ready for Implementation?

This document provides a complete blueprint for Phase 2 Extended. Once approved, we can begin implementation following the week-by-week plan.

**Next Step:** Your review and approval! 🚀

---

**Document Version:** 2.0 (Complete)
**Last Updated:** 2025-01-07
**Status:** Awaiting Final Approval ✅
