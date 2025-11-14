# Phase 2: Video Embedding Status Enhancement
**Date**: November 14, 2025
**Status**: Planned (Not Yet Implemented)
**Priority**: MEDIUM
**User Request**: Enhanced Embedding Metadata (Option 2) ✅

---

## 🎯 Problem Statement

### Current Issues:
1. ❌ Admin cannot see if a video has been embedded to Pinecone
2. ❌ "Embedding" button always shows same color (blue) regardless of status
3. ❌ No visual indicator to know if embedding was successful
4. ❌ When YouTube video is deleted, admin doesn't know if chatbot data still exists
5. ❌ No tracking of WHO embedded the video or WHEN

### Current Implementation:
```typescript
// lib/videoManager.ts (Line 12-27)
export interface Video {
  id: string
  videoId: string
  title: string
  channelTitle: string
  description: string
  publishedAt: string
  thumbnailUrl: string
  duration: string
  category: VideoCategory
  transcript?: string
  summary?: string
  addedAt: number
  addedBy: string
  pineconeIds?: string[]  // ← EXISTS but not utilized in UI
}
```

**What works:**
- ✅ Backend tracks `pineconeIds` array
- ✅ Embedding process saves vector IDs to this field

**What's missing:**
- ❌ UI doesn't show embedding status
- ❌ No metadata about embedding history
- ❌ No YouTube availability check

---

## 🔥 CHOSEN SOLUTION: Option 2 - Enhanced with Metadata

### Updated Video Interface:
```typescript
export interface Video {
  // ... existing fields
  id: string
  videoId: string
  title: string
  channelTitle: string
  description: string
  publishedAt: string
  thumbnailUrl: string
  duration: string
  category: VideoCategory
  transcript?: string
  summary?: string
  addedAt: number
  addedBy: string

  // Keep existing for backwards compatibility
  pineconeIds?: string[]

  // NEW: Enhanced Embedding Metadata
  embedding?: {
    status: 'not_embedded' | 'embedding' | 'embedded' | 'failed'
    vectorCount: number
    embeddedAt?: number      // Unix timestamp
    embeddedBy?: string      // Admin email who triggered embedding
    lastChecked?: number     // Last verification timestamp
    isYouTubeAvailable?: boolean  // Video still exists on YouTube
    errorMessage?: string    // If failed, store error message
  }
}
```

---

## 📋 Implementation Plan

### **Step 1: Update Video Interface** (lib/videoManager.ts)
```typescript
// Add new type
export type EmbeddingStatus = 'not_embedded' | 'embedding' | 'embedded' | 'failed'

export interface EmbeddingMetadata {
  status: EmbeddingStatus
  vectorCount: number
  embeddedAt?: number
  embeddedBy?: string
  lastChecked?: number
  isYouTubeAvailable?: boolean
  errorMessage?: string
}

// Update Video interface
export interface Video {
  // ... existing fields
  pineconeIds?: string[]
  embedding?: EmbeddingMetadata  // NEW
}
```

### **Step 2: Create Helper Functions** (lib/videoManager.ts)
```typescript
/**
 * Update embedding metadata after successful embedding
 */
export async function updateEmbeddingStatus(
  videoId: string,
  metadata: Partial<EmbeddingMetadata>
): Promise<void> {
  const video = await getVideo(videoId)
  if (!video) throw new Error('Video not found')

  video.embedding = {
    ...video.embedding,
    ...metadata,
    lastChecked: Date.now(),
  }

  await saveVideo(video)
}

/**
 * Check if YouTube video is still available
 */
export async function checkYouTubeAvailability(videoId: string): Promise<boolean> {
  try {
    const metadata = await getVideoMetadata(videoId)
    return !!metadata
  } catch (error) {
    return false
  }
}

/**
 * Get embedding summary for admin dashboard
 */
export async function getEmbeddingStats() {
  const videos = await getAllVideos(1000)

  const embedded = videos.filter(v => v.embedding?.status === 'embedded').length
  const notEmbedded = videos.filter(v => !v.embedding || v.embedding.status === 'not_embedded').length
  const failed = videos.filter(v => v.embedding?.status === 'failed').length
  const totalVectors = videos.reduce((sum, v) => sum + (v.embedding?.vectorCount || 0), 0)

  return { embedded, notEmbedded, failed, totalVectors, total: videos.length }
}
```

### **Step 3: Update Admin UI Component** (components/admin/VideosManager.tsx)

**Add Status Badge:**
```typescript
function EmbeddingStatusBadge({ video }: { video: Video }) {
  const { embedding } = video

  if (!embedding || embedding.status === 'not_embedded') {
    return (
      <div className="flex items-center gap-2 text-amber-600">
        <AlertCircle className="h-4 w-4" />
        <span className="text-sm">Not embedded</span>
      </div>
    )
  }

  if (embedding.status === 'embedding') {
    return (
      <div className="flex items-center gap-2 text-blue-600">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span className="text-sm">Embedding...</span>
      </div>
    )
  }

  if (embedding.status === 'failed') {
    return (
      <div className="flex items-center gap-2 text-red-600">
        <XCircle className="h-4 w-4" />
        <span className="text-sm">Failed</span>
        {embedding.errorMessage && (
          <Tooltip content={embedding.errorMessage}>
            <Info className="h-3 w-3" />
          </Tooltip>
        )}
      </div>
    )
  }

  // Status: embedded
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-2 text-green-600">
        <CheckCircle className="h-4 w-4" />
        <span className="text-sm">✅ Embedded ({embedding.vectorCount} vectors)</span>
      </div>
      {embedding.embeddedAt && (
        <span className="text-xs text-slate-500">
          {new Date(embedding.embeddedAt).toLocaleDateString()} by {embedding.embeddedBy}
        </span>
      )}
      {embedding.isYouTubeAvailable === false && (
        <div className="flex items-center gap-1 text-amber-600 text-xs">
          <AlertTriangle className="h-3 w-3" />
          <span>YouTube video unavailable (data preserved)</span>
        </div>
      )}
    </div>
  )
}
```

**Update Embed Button:**
```typescript
function EmbedButton({ video }: { video: Video }) {
  const isEmbedded = video.embedding?.status === 'embedded'
  const isEmbedding = video.embedding?.status === 'embedding'
  const hasFailed = video.embedding?.status === 'failed'

  if (isEmbedding) {
    return (
      <button disabled className="bg-blue-400 cursor-not-allowed">
        <Loader2 className="h-4 w-4 animate-spin" /> Embedding...
      </button>
    )
  }

  if (isEmbedded) {
    return (
      <button className="bg-blue-500 hover:bg-blue-600">
        🔄 Re-Embed
      </button>
    )
  }

  return (
    <button className={hasFailed ? 'bg-orange-500' : 'bg-green-500'}>
      {hasFailed ? '⚠️ Retry Embed' : '▶️ Embed Now'}
    </button>
  )
}
```

### **Step 4: Update Embedding API Route** (app/api/admin/videos/[id]/embed/route.ts)
```typescript
export async function POST(req: Request, { params }: { params: { id: string } }) {
  // ... auth checks

  const videoId = params.id
  const session = await auth()

  try {
    // Set status to 'embedding'
    await updateEmbeddingStatus(videoId, {
      status: 'embedding',
      embeddedBy: session.user.email,
    })

    // Check if YouTube video still exists
    const isAvailable = await checkYouTubeAvailability(videoId)

    // Perform embedding
    const vectorIds = await embedVideoToPinecone(videoId)

    // Update status to 'embedded'
    await updateEmbeddingStatus(videoId, {
      status: 'embedded',
      vectorCount: vectorIds.length,
      embeddedAt: Date.now(),
      isYouTubeAvailable: isAvailable,
    })

    return NextResponse.json({ success: true, vectorCount: vectorIds.length })
  } catch (error) {
    // Update status to 'failed'
    await updateEmbeddingStatus(videoId, {
      status: 'failed',
      errorMessage: error.message,
    })

    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
```

### **Step 5: Add Admin Dashboard Widget**
```typescript
// app/admin/dashboard/page.tsx
export default async function AdminDashboard() {
  const embeddingStats = await getEmbeddingStats()

  return (
    <div className="grid grid-cols-4 gap-4">
      <StatCard
        title="Embedded Videos"
        value={embeddingStats.embedded}
        color="green"
      />
      <StatCard
        title="Pending Embedding"
        value={embeddingStats.notEmbedded}
        color="amber"
      />
      <StatCard
        title="Failed Embeddings"
        value={embeddingStats.failed}
        color="red"
      />
      <StatCard
        title="Total Vectors"
        value={embeddingStats.totalVectors}
        color="blue"
      />
    </div>
  )
}
```

---

## 🎨 UI Mockups

### Admin Video List View:
```
┌────────────────────────────────────────────────────────────────────┐
│  Video Title: "Leadership Principles"                              │
│  Category: Leadership                                              │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │
│  Status: ✅ Embedded (5 vectors)                                   │
│          Nov 14, 2025 by admin@example.com                         │
│  📹 YouTube: ✅ Available                                          │
│                                                                     │
│  [Edit] [🔄 Re-Embed] [Delete]                                    │
└────────────────────────────────────────────────────────────────────┘

If NOT embedded:
┌────────────────────────────────────────────────────────────────────┐
│  Video Title: "New Video"                                          │
│  Category: AI Works                                                │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │
│  Status: ⚠️ Not embedded yet                                       │
│  📹 YouTube: ✅ Available                                          │
│                                                                     │
│  [Edit] [▶️ Embed Now] [Delete]                                   │
└────────────────────────────────────────────────────────────────────┘

If YouTube deleted but data preserved:
┌────────────────────────────────────────────────────────────────────┐
│  Video Title: "Deleted Video"                                      │
│  Category: Health                                                  │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │
│  Status: ✅ Embedded (3 vectors)                                   │
│          Nov 10, 2025 by admin@example.com                         │
│  📹 YouTube: ⚠️ Video unavailable (removed by creator)            │
│  💬 Chatbot: ✅ Still works (using cached transcript)             │
│                                                                     │
│  [Edit] [Delete]                                                   │
└────────────────────────────────────────────────────────────────────┘
```

### Admin Dashboard Stats:
```
┌─────────────────────┐ ┌─────────────────────┐ ┌─────────────────────┐
│  ✅ Embedded Videos │ │  ⚠️ Pending         │ │  ❌ Failed          │
│      45             │ │      12             │ │       2             │
└─────────────────────┘ └─────────────────────┘ └─────────────────────┘

┌─────────────────────┐
│  🔢 Total Vectors   │
│      225            │
└─────────────────────┘
```

---

## 🔄 Migration Strategy

### Step 1: Update existing videos with default embedding status
```typescript
// scripts/migrate-embedding-metadata.ts
import { getAllVideos, saveVideo } from '@/lib/videoManager'

async function migrateEmbeddingMetadata() {
  const videos = await getAllVideos(1000)

  for (const video of videos) {
    if (!video.embedding) {
      // Determine status based on pineconeIds
      const hasEmbedding = video.pineconeIds && video.pineconeIds.length > 0

      video.embedding = {
        status: hasEmbedding ? 'embedded' : 'not_embedded',
        vectorCount: video.pineconeIds?.length || 0,
        embeddedAt: hasEmbedding ? video.addedAt : undefined,
        embeddedBy: hasEmbedding ? video.addedBy : undefined,
      }

      await saveVideo(video)
      console.log(`✓ Migrated: ${video.title}`)
    }
  }

  console.log(`\n✅ Migrated ${videos.length} videos`)
}

migrateEmbeddingMetadata()
```

### Step 2: Run migration
```bash
npx tsx scripts/migrate-embedding-metadata.ts
```

### Step 3: Verify in Admin UI
- All previously embedded videos should show "✅ Embedded"
- All new videos should show "⚠️ Not embedded yet"

---

## ✅ Benefits of This Approach

1. **Clear Visual Feedback**
   - Admin instantly sees which videos are embedded
   - No guessing or manual checking needed

2. **YouTube Availability Tracking**
   - Know when YouTube deletes a video
   - Reassurance that chatbot data is preserved
   - Can decide whether to keep or delete entry

3. **Historical Tracking**
   - Know WHO embedded it
   - Know WHEN it was embedded
   - Audit trail for admin actions

4. **Error Handling**
   - Failed embeddings are visible
   - Error messages help debug issues
   - Can retry failed embeddings

5. **Better UX**
   - Button text changes based on status
   - Loading states during embedding
   - No duplicate embedding attempts

---

## 🚨 Edge Cases to Handle

### Case 1: YouTube Video Deleted
**Scenario:** Creator deletes video from YouTube
**Solution:**
- `isYouTubeAvailable: false`
- Show warning badge
- Chatbot still works (uses cached transcript)
- Admin can decide to keep or remove

### Case 2: Embedding in Progress
**Scenario:** Admin clicks "Embed" and it takes time
**Solution:**
- `status: 'embedding'`
- Disable button
- Show loading spinner
- Prevent duplicate requests

### Case 3: Embedding Failed
**Scenario:** Network error or Pinecone issue
**Solution:**
- `status: 'failed'`
- Store error message
- Button changes to "⚠️ Retry Embed"
- Admin can retry

### Case 4: Re-embedding
**Scenario:** Admin wants to update vectors (e.g., after transcript change)
**Solution:**
- Show "🔄 Re-Embed" button
- Delete old vectors first
- Create new vectors
- Update metadata

---

## 📊 Database Impact

**Storage Increase:** Minimal (~200 bytes per video)

**Example:**
```json
{
  "embedding": {
    "status": "embedded",
    "vectorCount": 5,
    "embeddedAt": 1731600000000,
    "embeddedBy": "admin@hungreo.com",
    "lastChecked": 1731600000000,
    "isYouTubeAvailable": true
  }
}
```

**Total for 100 videos:** ~20KB (negligible)

---

## 🎯 Success Metrics

**Phase 2 Complete When:**
- [ ] Video interface updated with `embedding` metadata
- [ ] Helper functions created
- [ ] Admin UI shows embedding status badges
- [ ] Embed button changes based on status
- [ ] Migration script runs successfully
- [ ] Dashboard shows embedding stats
- [ ] YouTube availability check implemented
- [ ] Error handling works correctly
- [ ] All existing videos migrated

---

## 🔗 Related Files to Modify

1. `lib/videoManager.ts` - Add types and helper functions
2. `components/admin/VideosManager.tsx` - Update UI with status badges
3. `app/api/admin/videos/[id]/embed/route.ts` - Update embedding logic
4. `app/admin/dashboard/page.tsx` - Add stats widget
5. `scripts/migrate-embedding-metadata.ts` - Migration script

---

**Estimated Implementation Time:** 4-6 hours

**Priority:** MEDIUM (after Phase 1 i18n is stable)

**Complexity:** Medium

**Breaking Changes:** None (fully backwards compatible)

---

**📝 Note:** This is a detailed plan for FUTURE implementation. Not yet started.
**✅ User Preference:** Option 2 (Enhanced with Metadata) - Chosen by user
