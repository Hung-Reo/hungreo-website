# Phase 2 Extended: Admin Dashboard & Knowledge Management System

**Status:** Design Document - Approved
**Timeline:** 20-25 hours implementation (~3-4 days)
**Monthly Cost:** $2-4 (OpenAI API only)
**Database:** Pinecone Free Tier (100K vectors)

---

## Executive Summary

This document outlines the design for Phase 2 Extended features:
- **Chat History** - Conversation context using LocalStorage
- **Admin Dashboard** - Secure content management system
- **Document Upload** - PDF/TXT/DOCX with review workflow
- **YouTube Management** - Batch video import with categories
- **Website Auto-Scraper** - Automatic knowledge base updates
- **AI Tools Tab** - Public categorized video library

**Architecture Decision:** Single unified chatbot with Pinecone Free Tier vector database.

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Chat History System](#chat-history-system)
3. [Admin Dashboard](#admin-dashboard)
4. [Document Management](#document-management)
5. [YouTube Video System](#youtube-video-system)
6. [Vector Database Strategy](#vector-database-strategy)
7. [Implementation Phases](#implementation-phases)
8. [Cost Analysis](#cost-analysis)
9. [Security & Privacy](#security--privacy)
10. [Testing Strategy](#testing-strategy)

---

## Architecture Overview

### System Components

```
┌─────────────────────────────────────────────────┐
│         Frontend (Next.js 14 App Router)        │
├─────────────────────────────────────────────────┤
│                                                  │
│  Public Pages:                                   │
│  ├── Single Chatbot (all pages)                 │
│  ├── AI Tools Tab                               │
│  │   ├── Leadership                             │
│  │   ├── AI Works                               │
│  │   ├── Health                                 │
│  │   ├── Entertaining                           │
│  │   └── Human Philosophy                       │
│  └── YouTube Summarizer                         │
│                                                  │
│  Admin Pages (Protected by NextAuth):           │
│  ├── /admin/login                               │
│  └── /admin/dashboard                           │
│      ├── Documents Tab                          │
│      ├── Videos Tab                             │
│      └── Website Scraper                        │
│                                                  │
└─────────────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────┐
│        API Routes (Vercel Serverless)           │
├─────────────────────────────────────────────────┤
│  ├── /api/chat (RAG chatbot with history)      │
│  ├── /api/youtube (video summarizer)           │
│  ├── /api/admin/upload                         │
│  ├── /api/admin/documents                      │
│  ├── /api/admin/videos                         │
│  └── /api/admin/scrape                         │
└─────────────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────┐
│            External Services                     │
├─────────────────────────────────────────────────┤
│  ├── OpenAI API (GPT-4o-mini + Embeddings)     │
│  ├── Pinecone Free (Vector Database)           │
│  ├── YouTube Data API v3                        │
│  ├── Vercel Blob (File Storage)                │
│  └── NextAuth (Authentication)                  │
└─────────────────────────────────────────────────┘
```

### Key Architectural Decisions

**✅ Single Chatbot Approach**
- One chatbot with access to ALL knowledge sources
- Smart filtering by metadata (category, type, etc.)
- Cross-reference capability (e.g., "Hung's view on Simon Sinek's ideas")
- Better UX - users don't need to choose which chatbot to use

**✅ Pinecone Free Tier**
- Capacity: 100K vectors (~14,560 estimated usage = 14.6%)
- Cost: $0/month (vs $50+ for paid tier or $5-10 for ChromaDB)
- Performance: <50ms global queries
- Zero maintenance
- **Decision:** Stay with free tier; only migrate if exceeding 90K vectors

**✅ LocalStorage for Chat History**
- Store last 10 messages per session
- 30-minute session timeout
- Privacy-friendly (data stays on device)
- Zero cost
- Simple implementation

---

## Chat History System

### Requirements

1. ✅ Remember last 10 messages (5 Q&A pairs)
2. ✅ Context-aware responses
3. ✅ Session management (30 min timeout)
4. ✅ Clear history option
5. ✅ Privacy-friendly (client-side only)

### Technical Design

**Storage:** LocalStorage (browser)

```typescript
interface Message {
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: number
}

interface ChatSession {
  id: string
  messages: Message[]
  createdAt: number
  updatedAt: number
}
```

**Hook Implementation:**

```typescript
// lib/hooks/useChatHistory.ts
export function useChatHistory() {
  const [session, setSession] = useState<ChatSession | null>(null)

  // Methods:
  // - addMessage(role, content)
  // - clearHistory()
  // - getContextMessages() // for OpenAI API

  return { messages, addMessage, clearHistory, getContextMessages }
}
```

**API Integration:**

```typescript
// app/api/chat/route.ts
const { message, history } = await req.json()

const messages = [
  { role: 'system', content: systemPrompt },
  ...history.slice(-10), // Last 10 messages for context
]
```

### Context Awareness for Videos

**Auto-detect current page:**

```typescript
// When user is on /tools/knowledge/leadership/start-with-why
const pageContext = {
  type: 'video',
  category: 'Leadership',
  videoId: 'start-with-why',
  author: 'Simon Sinek'
}

// Chatbot knows: "You're watching 'Start With Why'. Ask me anything!"
```

**Cost Impact:**
- Token increase: ~100% (sending history)
- Cost increase: ~$1-2/month
- Total: $3-5/month (still very cheap)

---

## Admin Dashboard

### Authentication

**Method:** Email + Password (NextAuth v5)

```bash
# .env.local
ADMIN_EMAIL=hungreo2005@gmail.com
ADMIN_PASSWORD_HASH=$2a$10$... # bcrypt hash
NEXTAUTH_SECRET=your-32-char-secret
NEXTAUTH_URL=https://hungreo.vercel.app
```

**Security Features:**
- ✅ Bcrypt password hashing (10 rounds)
- ✅ JWT sessions (7-day expiry)
- ✅ Rate limiting (5 attempts / 15 min)
- ✅ CSRF protection (NextAuth built-in)
- ✅ Middleware protection for `/admin/*`

**Access Flow:**

```
User → /admin → Redirect to /admin/login
         ↓
  Enter credentials
         ↓
  Verify with NextAuth
         ↓
  Create JWT session
         ↓
  Access /admin/dashboard
```

### Dashboard Layout

```
┌────────────────────────────────────────────┐
│  Admin Dashboard                    [Logout]│
├────────────────────────────────────────────┤
│  [Documents] [Videos] [Website Scraper]    │
├────────────────────────────────────────────┤
│                                             │
│  Content area (tabs)                        │
│                                             │
└────────────────────────────────────────────┘
```

**Navigation:**
- Add "Admin" button next to "Contact" in header
- Only visible when authenticated (client-side check)
- Protected by middleware (server-side enforcement)

---

## Document Management

### Upload Workflow

```
1. Upload File (PDF/TXT/DOCX)
         ↓
2. Parse & Extract Text
   - PDF: pdf-parse
   - DOCX: mammoth
   - TXT: fs.readFileSync
         ↓
3. Review/Edit Interface
   - Edit extracted text
   - Add metadata (title, category, tags)
   - Preview chunks (512 tokens each)
   - See cost estimate
         ↓
4. Save as Draft or Approve
         ↓
5. If Approved:
   - Chunk text (512 tokens/chunk)
   - Generate embeddings
   - Upload to Pinecone
         ↓
6. Success → Show in Active Knowledge Base
```

### UI Mockup

**Upload Tab:**
```
┌─────────────────────────────────────┐
│  📤 Upload Documents                │
├─────────────────────────────────────┤
│  [Drag & Drop or Click to Browse]  │
│  Supported: PDF, TXT, DOCX         │
│  Max size: 20MB                     │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│  📝 Pending Review (2)              │
├─────────────────────────────────────┤
│  leadership-book.pdf               │
│  2.3 MB | Uploaded 2 hours ago     │
│  [Preview] [Edit] [Approve] [❌]   │
├─────────────────────────────────────┤
│  simon-notes.txt                    │
│  45 KB | Uploaded 5 hours ago      │
│  [Preview] [Edit] [Approve] [❌]   │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│  ✅ Active in Knowledge Base (15)   │
├─────────────────────────────────────┤
│  start-with-why.pdf                │
│  24 vectors | Added Jan 5          │
│  [View] [Remove]                    │
└─────────────────────────────────────┘
```

**Review Interface:**
```
┌──────────────────────────────────────┐
│  Review: leadership-book.pdf   [Back]│
├──────────────────────────────────────┤
│  Title: [Leadership Principles    ] │
│  Category: [Leadership ▼]           │
│  Tags: [leadership, vision       ]  │
│                                      │
│  Extracted Text (Editable):          │
│  ┌────────────────────────────────┐ │
│  │ Chapter 1: Power of Vision    │ │
│  │                                │ │
│  │ Leaders inspire action by...   │ │
│  │ [Edit text here]               │ │
│  │                                │ │
│  └────────────────────────────────┘ │
│                                      │
│  📊 Preview Chunks (24):             │
│  • Chunk 1 (512 tok): "Chapter 1..." │
│  • Chunk 2 (512 tok): "Vision is..." │
│                                      │
│  💰 Cost Estimate: $0.0012           │
│  📦 Vectors to create: 24            │
│                                      │
│  [Cancel] [Save Draft] [✅ Approve] │
└──────────────────────────────────────┘
```

### File Size Handling

**Strategy:**

```typescript
if (fileSize < 4.5MB) {
  // Direct upload to API route
  await uploadToAPI(file)
} else if (fileSize <= 20MB) {
  // Use Vercel Blob Storage
  const blob = await upload(file.name, file, {
    access: 'public',
    handleUploadUrl: '/api/upload',
  })
  await processFromBlob(blob.url)
}
```

**Vercel Blob Free Tier:**
- 500MB storage
- 5GB bandwidth/month
- **Cost:** $0 (stays in free tier for typical usage)

---

## YouTube Video System

### Video Upload Workflow

```
1. Paste YouTube URL(s)
   - Single video
   - Multiple videos (one per line)
         ↓
2. Extract Video ID & Metadata
   - Use YouTube Data API v3
   - Get: title, channel, duration, thumbnail
         ↓
3. Fetch Transcript
   - Use youtube-transcript package
   - Fallback to description if no captions
         ↓
4. Assign Category
   - Leadership
   - AI Works
   - Health
   - Entertaining
   - Human Philosophy
         ↓
5. Review & Approve
   - Preview transcript
   - Edit if needed
   - Confirm category
         ↓
6. Generate Embeddings
   - Combine: title + description + transcript
   - Chunk into 512 tokens
   - ~23 vectors per 1-hour video
         ↓
7. Upload to Pinecone
   - Metadata includes:
     - videoId, category, author
     - transcript (full text)
     - thumbnailUrl, publishedAt
         ↓
8. Display in AI Tools Tab
```

### UI Mockup

**Videos Tab:**
```
┌──────────────────────────────────────┐
│  📹 Add YouTube Videos               │
├──────────────────────────────────────┤
│  Single URL:                         │
│  [https://youtube.com/watch?v=...]  │
│  [Add Single Video]                  │
│                                      │
│  Batch Import (one per line):        │
│  ┌────────────────────────────────┐ │
│  │ https://youtube.com/watch?v=1  │ │
│  │ https://youtube.com/watch?v=2  │ │
│  │ https://youtube.com/watch?v=3  │ │
│  └────────────────────────────────┘ │
│  Category: [Leadership ▼]           │
│  [Batch Import]                      │
└──────────────────────────────────────┘

┌──────────────────────────────────────┐
│  📚 Video Library (550)              │
├──────────────────────────────────────┤
│  Filter: [All ▼] [Leadership]       │
│  Search: [........................]  │
├──────────────────────────────────────┤
│  🎬 Start With Why                   │
│     Simon Sinek | Leadership         │
│     23 vectors | Added Jan 5         │
│     [View] [Edit] [Delete]           │
├──────────────────────────────────────┤
│  🎬 The 5 Second Rule                │
│     Mel Robbins | Leadership         │
│     18 vectors | Added Jan 4         │
│     [View] [Edit] [Delete]           │
└──────────────────────────────────────┘
```

### Delete Strategy

**When deleting a video:**

1. ✅ Remove from UI
2. ✅ Delete vectors from Pinecone (by ID prefix)
3. ✅ Keep transcript in metadata backup (optional)
4. ✅ Confirmation dialog to prevent accidents

```typescript
async function deleteVideo(videoId: string) {
  // 1. Delete from Pinecone
  await index.deleteMany({ prefix: `video-${videoId}` })

  // 2. Optional: Backup to JSON
  await backupToFile(videoId, metadata)

  // 3. Update UI state
  removeFromLibrary(videoId)
}
```

---

## Vector Database Strategy

### Pinecone Free Tier Capacity

**Limits:**
- 100,000 vectors total
- 1 index
- Unlimited queries

**Estimated Usage:**

| Content Type | Quantity | Vectors/Item | Total Vectors | % of 100K |
|--------------|----------|--------------|---------------|-----------|
| Blog Posts | 50 | 10 | 500 | 0.5% |
| Projects | 20 | 8 | 160 | 0.2% |
| Website Pages | 10 | 5 | 50 | 0.05% |
| PDF Documents | 30 | 40 | 1,200 | 1.2% |
| **YouTube Videos** | **550** | **23** | **12,650** | **12.7%** |
| **TOTAL** | - | - | **14,560** | **14.6%** |
| **REMAINING** | - | - | **85,440** | **85.4%** |

**Conclusion: Pinecone Free is perfect!**
- You can add **3,714 more videos** before hitting the limit
- No need for paid tier or self-hosted alternatives
- Zero cost, zero maintenance

### Vector Metadata Schema

```typescript
interface VectorMetadata {
  // Common
  id: string                    // e.g., "video-leadership-simon-1"
  type: 'website' | 'pdf' | 'youtube' | 'document'
  title: string
  description: string
  uploadedAt: string            // ISO timestamp

  // For website pages
  url?: string                  // /about, /projects/k12
  pageType?: string             // about | project | blog

  // For documents
  fileName?: string
  fileSize?: number             // bytes
  status?: 'draft' | 'approved'

  // For YouTube videos
  category?: string             // Leadership | AI Works | Health...
  author?: string               // Simon Sinek | Mel Robbins...
  videoId?: string              // YouTube video ID
  videoUrl?: string
  transcript?: string           // Full transcript text
  thumbnailUrl?: string
  publishedAt?: string
  duration?: string             // ISO 8601: PT1H5M30S

  // Search optimization
  tags?: string                 // "leadership,vision,motivation"
  chunkIndex?: number           // For multi-chunk items
  totalChunks?: number
}
```

### Querying Strategies

**1. General Query (all content):**
```typescript
const results = await index.query({
  vector: questionEmbedding,
  topK: 5,
  includeMetadata: true,
})
```

**2. Filter by Category:**
```typescript
const results = await index.query({
  vector: questionEmbedding,
  topK: 5,
  filter: { category: 'Leadership' },
  includeMetadata: true,
})
```

**3. Filter by Type:**
```typescript
const results = await index.query({
  vector: questionEmbedding,
  topK: 3,
  filter: { type: 'youtube' },
  includeMetadata: true,
})
```

**4. Current Video Context:**
```typescript
// User is watching specific video
const results = await index.query({
  vector: questionEmbedding,
  topK: 5,
  filter: { videoId: 'start-with-why' },
  includeMetadata: true,
})
```

---

## Implementation Phases

### Phase 1: Chat History (3 hours)

**Tasks:**
- [ ] Create `lib/hooks/useChatHistory.ts` hook
- [ ] Update `components/ChatBot.tsx` to use history
- [ ] Update `app/api/chat/route.ts` to accept history parameter
- [ ] Add "Clear History" button to chat UI
- [ ] Test conversation context works
- [ ] Add session timeout (30 min)

**Deliverables:**
- Context-aware chatbot
- Persistent conversations (per session)
- User can clear history

---

### Phase 2: Admin Authentication (2 hours)

**Tasks:**
- [ ] Install `next-auth` package
- [ ] Create `app/admin/login/page.tsx`
- [ ] Setup NextAuth config in `app/api/auth/[...nextauth]/route.ts`
- [ ] Generate bcrypt password hash
- [ ] Create middleware for `/admin/*` protection
- [ ] Add "Admin" button to navigation (conditional)
- [ ] Test login/logout flow

**Deliverables:**
- Secure admin login
- Protected routes
- Session management

---

### Phase 3: Document Upload System (5 hours)

**Tasks:**
- [ ] Install parsers: `pdf-parse`, `mammoth`
- [ ] Create `app/api/admin/upload/route.ts`
- [ ] Create `app/admin/dashboard/documents/page.tsx`
- [ ] Build upload form with drag & drop
- [ ] Implement file parsing (PDF/TXT/DOCX)
- [ ] Create review/edit UI
- [ ] Implement chunking strategy (512 tokens)
- [ ] Add approve/reject workflow
- [ ] Integrate Vercel Blob for >4.5MB files
- [ ] Add document list (pending & active)

**Deliverables:**
- Full document management system
- Review before approve
- Active knowledge base view

---

### Phase 4: YouTube Video Management (4 hours)

**Tasks:**
- [ ] Install `youtube-transcript` package
- [ ] Create `app/api/admin/videos/route.ts`
- [ ] Create `app/admin/dashboard/videos/page.tsx`
- [ ] Build single video upload form
- [ ] Build batch video import
- [ ] Implement transcript extraction
- [ ] Add category assignment
- [ ] Create video library table
- [ ] Implement delete with vector cleanup
- [ ] Add search/filter functionality

**Deliverables:**
- Video upload (single & batch)
- Video library management
- Transcript storage in metadata

---

### Phase 5: Website Auto-Scraper (2 hours)

**Tasks:**
- [ ] Install `cheerio` for HTML parsing
- [ ] Create `scripts/scrape-website.ts`
- [ ] Extract text from all pages
- [ ] Implement smart content extraction (ignore nav/footer)
- [ ] Generate embeddings for each page
- [ ] Add "Refresh Knowledge" button in admin
- [ ] Create API route: `app/api/admin/scrape/route.ts`

**Deliverables:**
- Auto-scrape all website pages
- Manual trigger from admin
- Updates Pinecone with latest content

---

### Phase 6: AI Tools Tab (3 hours)

**Tasks:**
- [ ] Create `app/tools/knowledge/page.tsx` (category grid)
- [ ] Create `app/tools/knowledge/[category]/page.tsx` (video list)
- [ ] Create `app/tools/knowledge/[category]/[slug]/page.tsx` (video detail)
- [ ] Build category cards UI
- [ ] Build video grid/list view
- [ ] Add video player embed
- [ ] Add "Ask AI about this video" feature (filtered chatbot)
- [ ] Implement category filtering

**Deliverables:**
- Public video library
- Category-based navigation
- Context-aware chatbot per video

---

### Phase 7: Testing & Polish (3 hours)

**Tasks:**
- [ ] End-to-end testing (all features)
- [ ] Mobile responsiveness check
- [ ] Error handling improvements
- [ ] Loading states for async operations
- [ ] Update README.md
- [ ] Create admin user guide
- [ ] Add inline help tooltips

**Deliverables:**
- Production-ready system
- Documentation complete
- All bugs fixed

---

### Phase 8: Deployment (2 hours)

**Tasks:**
- [ ] Add environment variables to Vercel
- [ ] Test in production environment
- [ ] Run embedding generation script
- [ ] Verify all features work live
- [ ] Monitor error logs
- [ ] Performance optimization if needed

**Deliverables:**
- Fully deployed Phase 2 Extended
- Live on https://hungreo.vercel.app

---

**Total Time: 24 hours (~3 days of focused work)**

---

## Cost Analysis

### Monthly Recurring Costs

| Service | Free Tier | Your Usage | Estimated Cost |
|---------|-----------|------------|----------------|
| **Vercel Hosting** | 100GB bandwidth | ~10GB | $0 |
| **OpenAI API** | Pay-as-go | ~2000 messages/month | $2-3 |
| **OpenAI Embeddings** | Pay-as-go | ~500 docs + 550 videos | $0.50-1 |
| **Pinecone** | 100K vectors, unlimited queries | ~14.5K vectors | **$0** |
| **YouTube Data API** | 10K quota/day | ~50 videos/month | $0 |
| **Vercel Blob** | 500MB, 5GB bandwidth | ~100MB, 1GB | $0 |
| **NextAuth** | Free open-source | N/A | $0 |
| **Total** | - | - | **$2.50-4/month** |

**Annual Cost: ~$30-48/year**

### One-Time Costs

| Item | Cost |
|------|------|
| Domain (optional) | $10-15/year |
| **Total** | **$10-15** |

### Cost Comparison

| Approach | Monthly | Yearly | 5 Years |
|----------|---------|--------|---------|
| **This Design (Pinecone Free)** | $3 | $36 | $180 |
| Alternative (ChromaDB Railway) | $8 | $96 | $480 |
| Alternative (Pinecone Paid) | $52 | $624 | $3,120 |

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

### File Upload Security

- ✅ **File Type Validation:** Only PDF/TXT/DOCX
- ✅ **Size Limits:** Max 20MB
- ✅ **Content Scanning:** Parse and review before approval
- ✅ **No Direct Execution:** Files are parsed, not executed
- ✅ **Isolated Storage:** Vercel Blob with access controls

### API Security

- ✅ **Authentication Required:** All admin endpoints protected
- ✅ **Authorization Checks:** Middleware enforces permissions
- ✅ **Input Validation:** Zod schemas for request validation
- ✅ **Rate Limiting:** Per-IP rate limits on public endpoints
- ✅ **CORS Policy:** Restrict to own domain

### Privacy Considerations

**Chat History:**
- ✅ Stored locally (LocalStorage)
- ✅ Never sent to server (except current message)
- ✅ User can clear anytime
- ✅ 30-minute auto-expiry
- ✅ No tracking or analytics

**User Data:**
- ❌ No user accounts (except admin)
- ❌ No personal data collection
- ❌ No cookies (except auth session)
- ✅ GDPR/CCPA compliant

**Content Data:**
- ✅ YouTube transcripts public (already on YouTube)
- ✅ PDFs uploaded by admin (your choice what to share)
- ✅ Website content already public

---

## Testing Strategy

### Unit Tests

**Priority Areas:**
- [ ] useChatHistory hook (LocalStorage operations)
- [ ] File parsers (PDF/DOCX/TXT)
- [ ] Chunking algorithm (512 tokens)
- [ ] Embedding generation
- [ ] YouTube URL extraction
- [ ] Transcript fetching

**Framework:** Vitest or Jest

---

### Integration Tests

**Critical Flows:**
- [ ] Admin login → access dashboard
- [ ] Upload PDF → review → approve → appears in chatbot
- [ ] Add YouTube video → transcript extracted → searchable
- [ ] Chatbot query → RAG retrieval → correct context
- [ ] Delete video → vectors removed from Pinecone

**Framework:** Playwright or Cypress

---

### Manual Testing Checklist

**Admin Dashboard:**
- [ ] Login with correct credentials succeeds
- [ ] Login with wrong credentials fails + rate limits
- [ ] Upload PDF under 4.5MB works
- [ ] Upload PDF over 4.5MB uses Blob
- [ ] Upload DOCX extracts text correctly
- [ ] Upload TXT preserves formatting
- [ ] Review interface allows text editing
- [ ] Approve button creates embeddings
- [ ] Save draft keeps in pending state
- [ ] Delete removes from pending
- [ ] Active documents list shows correctly
- [ ] Remove document deletes vectors

**YouTube Management:**
- [ ] Single URL extracts video info
- [ ] Batch URLs process all videos
- [ ] Transcript fetching works (with captions)
- [ ] Falls back to description (no captions)
- [ ] Category assignment persists
- [ ] Video library displays all videos
- [ ] Search filters correctly
- [ ] Delete removes video + vectors
- [ ] Edit updates metadata

**Chatbot:**
- [ ] Conversation history persists after refresh
- [ ] Context from previous messages works
- [ ] Clear history removes all messages
- [ ] Session timeout after 30 min
- [ ] Retrieves correct documents from Pinecone
- [ ] Filters by category work
- [ ] Shows sources in response
- [ ] Handles errors gracefully

**AI Tools Tab:**
- [ ] Category grid displays all categories
- [ ] Click category shows videos
- [ ] Video detail page loads correctly
- [ ] Embedded player works
- [ ] "Ask about this video" filters to video context
- [ ] Back navigation works

**Performance:**
- [ ] Chat response < 2s
- [ ] Vector search < 100ms
- [ ] File upload < 30s (20MB file)
- [ ] Page load < 1s

---

## Monitoring & Maintenance

### Key Metrics to Track

**Via Vercel Dashboard:**
- API request count
- Error rates
- Response times
- Bandwidth usage

**Via OpenAI Dashboard:**
- Token usage (daily/monthly)
- API costs
- Model usage breakdown

**Via Pinecone Dashboard:**
- Vector count (approaching 100K?)
- Query latency
- Index statistics

### Monthly Review Checklist

- [ ] Check OpenAI costs (should be < $5)
- [ ] Check Pinecone vector count (alert at 80K)
- [ ] Review error logs in Vercel
- [ ] Update dependencies (security patches)
- [ ] Backup knowledge base (optional)

### Alerts to Set Up

- 🚨 OpenAI costs > $10/month
- 🚨 Pinecone vectors > 80,000 (80%)
- 🚨 Vercel error rate > 5%
- 🚨 API response time > 3s

---

## Migration Strategy (If Needed)

### Trigger: Approaching 90K Vectors

**Options:**

1. **Clean up old content** (remove outdated videos/docs)
2. **Upgrade to Pinecone Paid** ($50/month)
3. **Migrate to ChromaDB** ($5-10/month self-hosted)

**Migration Steps (if choosing ChromaDB):**

```bash
# 1. Deploy ChromaDB on Railway
# Use template: https://railway.com/template/kbvIRV

# 2. Export from Pinecone
npx tsx scripts/export-pinecone.ts > pinecone-backup.json

# 3. Import to ChromaDB
npx tsx scripts/import-chromadb.ts pinecone-backup.json

# 4. Update environment variables
# Replace PINECONE_* with CHROMA_*

# 5. Update code
# Replace getPineconeIndex() with getChromaCollection()

# 6. Test locally

# 7. Deploy to Vercel

# 8. Verify production

# 9. Delete Pinecone index (save backup first)
```

**Downtime: <5 minutes**

---

## Summary & Next Steps

### What We're Building

- ✅ **Chat History:** Context-aware conversations
- ✅ **Admin Dashboard:** Secure content management
- ✅ **Document Upload:** PDF/TXT/DOCX with review
- ✅ **YouTube Management:** Batch import with categories
- ✅ **AI Tools Tab:** Public video library
- ✅ **Website Scraper:** Auto-update knowledge

### Why This Design

- ✅ **Cost-effective:** $2-4/month (Pinecone free tier)
- ✅ **Scalable:** 85K vectors headroom
- ✅ **Maintainable:** Zero infrastructure management
- ✅ **Secure:** NextAuth + proper validation
- ✅ **User-friendly:** Single chatbot, intuitive UI
- ✅ **Privacy-focused:** LocalStorage for history

### Timeline

- **Week 1:** Chat History + Admin Auth (5 hours)
- **Week 2:** Document Upload + YouTube Management (9 hours)
- **Week 3:** Auto-Scraper + AI Tools Tab (5 hours)
- **Week 4:** Testing, Polish, Deployment (5 hours)

**Total: 24 hours over 4 weeks**

### Approval Checklist

- ✅ Single chatbot approach
- ✅ Pinecone Free Tier (no ChromaDB)
- ✅ LocalStorage for chat history
- ✅ Email + password admin auth
- ✅ 3-stage file approval workflow
- ✅ 20MB file limit with Vercel Blob
- ✅ YouTube batch import
- ✅ Public AI Tools tab with categories

### Ready to Start?

Once approved, we'll begin with Phase 1: Chat History implementation.

---

**Document Version:** 1.0
**Last Updated:** 2025-01-07
**Status:** Awaiting Final Approval ✅
