# Phase 2: Video Content Translation - Detailed Implementation Plan
**Date**: November 14, 2025
**Status**: Planning Phase - Ready for Implementation
**Priority**: HIGH
**Dependencies**: Phase 1 (Language Context) ✅ Completed

---

## 🎯 OVERVIEW

**Goal:** Enable bilingual video content (English/Vietnamese) with:
- Video metadata in both languages (title, description, summary)
- AI-powered auto-translation helper
- Language-aware video display components
- Bilingual admin video editor

**Success Criteria:**
- ✅ Users see video titles/descriptions in selected language
- ✅ Admin can edit both EN and VI content
- ✅ One-click auto-translate button works
- ✅ Existing videos migrated to new structure
- ✅ No breaking changes for existing data

---

## 📊 CURRENT vs TARGET STATE

### **Current Video Interface:**
```typescript
// lib/videoManager.ts (Lines 12-27)
export interface Video {
  id: string
  videoId: string
  title: string              // ❌ English only
  channelTitle: string
  description: string        // ❌ English only
  publishedAt: string
  thumbnailUrl: string
  duration: string
  category: VideoCategory
  transcript?: string        // ❌ English only
  summary?: string           // ❌ English only
  addedAt: number
  addedBy: string
  pineconeIds?: string[]
}
```

### **Target Video Interface (Bilingual):**
```typescript
export interface Video {
  id: string
  videoId: string

  // Language-agnostic fields (same for both languages)
  channelTitle: string
  publishedAt: string
  thumbnailUrl: string
  duration: string
  category: VideoCategory
  addedAt: number
  addedBy: string
  pineconeIds?: string[]

  // ENGLISH content
  en: {
    title: string
    description: string
    transcript?: string
    summary?: string
  }

  // VIETNAMESE content
  vi: {
    title: string
    description: string
    transcript?: string
    summary?: string
  }
}
```

---

## 🔧 DETAILED IMPLEMENTATION STEPS

---

## **STEP 1: Update Video Interface**

### **File:** `lib/videoManager.ts`

**Action:** Modify the Video interface to support bilingual content

**Implementation:**

```typescript
// lib/videoManager.ts

// Add new type for language-specific content
export interface VideoContent {
  title: string
  description: string
  transcript?: string
  summary?: string
}

// Update Video interface
export interface Video {
  id: string
  videoId: string

  // Language-agnostic metadata
  channelTitle: string
  publishedAt: string
  thumbnailUrl: string
  duration: string
  category: VideoCategory

  // Bilingual content
  en: VideoContent
  vi: VideoContent

  // Metadata
  addedAt: number
  addedBy: string
  pineconeIds?: string[]

  // Optional: Track translation status
  translationStatus?: {
    viTranslated: boolean
    translatedAt?: number
    translatedBy?: string
    translationMethod?: 'manual' | 'auto' | 'hybrid'
  }
}
```

**Testing:**
- [ ] TypeScript compilation passes
- [ ] No errors in IDE
- [ ] Interface properly exported

---

## **STEP 2: Create Translation Helper**

### **File:** `lib/translateVideo.ts` (NEW)

**Purpose:** AI-powered translation using OpenAI

**Implementation:**

```typescript
/**
 * Video Translation Helper
 * Uses OpenAI GPT-4 to translate video content from English to Vietnamese
 */

import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export interface TranslationInput {
  title: string
  description: string
  transcript?: string
  summary?: string
}

export interface TranslationOutput {
  title: string
  description: string
  transcript?: string
  summary?: string
}

/**
 * Translate video content from English to Vietnamese
 * @param englishContent - Original English content
 * @returns Translated Vietnamese content
 */
export async function translateToVietnamese(
  englishContent: TranslationInput
): Promise<TranslationOutput> {
  try {
    const prompt = `You are a professional translator specializing in Vietnamese translations.
Translate the following YouTube video content from English to Vietnamese.

IMPORTANT RULES:
1. Maintain the tone and style of the original content
2. Keep technical terms in English if commonly used (e.g., "AI", "Machine Learning")
3. Use natural Vietnamese phrasing (not word-for-word translation)
4. Preserve formatting and line breaks
5. For video titles: Keep it concise and engaging
6. For descriptions: Translate fully while maintaining readability

CONTENT TO TRANSLATE:

Title: ${englishContent.title}

Description:
${englishContent.description}

${englishContent.summary ? `Summary:\n${englishContent.summary}` : ''}

${englishContent.transcript ? `Transcript (translate first 500 words only):\n${englishContent.transcript.slice(0, 2000)}` : ''}

Return ONLY a valid JSON object with this structure:
{
  "title": "Vietnamese title",
  "description": "Vietnamese description",
  "summary": "Vietnamese summary (if provided)",
  "transcript": "Vietnamese transcript excerpt (if provided)"
}

Do not include any other text outside the JSON object.`

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are a professional English-to-Vietnamese translator. Always respond with valid JSON only.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.3, // Lower temperature for more consistent translations
    })

    const translatedContent = JSON.parse(
      response.choices[0].message.content || '{}'
    )

    return {
      title: translatedContent.title || englishContent.title,
      description: translatedContent.description || englishContent.description,
      summary: translatedContent.summary,
      transcript: translatedContent.transcript,
    }
  } catch (error) {
    console.error('Translation error:', error)
    throw new Error('Failed to translate video content')
  }
}

/**
 * Estimate translation cost
 * @param content - Content to translate
 * @returns Estimated tokens and cost in USD
 */
export function estimateTranslationCost(content: TranslationInput): {
  estimatedTokens: number
  estimatedCost: number
} {
  // Rough estimation: 1 word ≈ 1.3 tokens
  const words =
    (content.title?.split(' ').length || 0) +
    (content.description?.split(' ').length || 0) +
    (content.summary?.split(' ').length || 0) +
    (content.transcript?.slice(0, 2000).split(' ').length || 0)

  const estimatedTokens = Math.ceil(words * 1.3)
  const estimatedCost = (estimatedTokens / 1000) * 0.00015 // GPT-4o-mini pricing

  return { estimatedTokens, estimatedCost }
}

/**
 * Batch translate multiple videos
 * @param videos - Array of videos to translate
 * @returns Translation results with success/failure count
 */
export async function batchTranslateVideos(
  videos: Array<{ id: string; en: TranslationInput }>
): Promise<{
  success: number
  failed: number
  results: Array<{ id: string; vi?: TranslationOutput; error?: string }>
}> {
  const results = []
  let success = 0
  let failed = 0

  for (const video of videos) {
    try {
      const translated = await translateToVietnamese(video.en)
      results.push({ id: video.id, vi: translated })
      success++

      // Rate limiting: wait 1 second between requests
      await new Promise((resolve) => setTimeout(resolve, 1000))
    } catch (error: any) {
      results.push({ id: video.id, error: error.message })
      failed++
    }
  }

  return { success, failed, results }
}
```

**Testing:**
- [ ] Test with sample video content
- [ ] Verify OpenAI API key is configured
- [ ] Check translation quality manually
- [ ] Test error handling (invalid API key, network errors)

---

## **STEP 3: Update Video Display Components**

### **3.1: VideoCard Component**

**File:** `components/features/VideoCard.tsx`

**Current State:** Shows hardcoded English content
**Target State:** Shows content based on user's language preference

**Implementation:**

```typescript
'use client'

import Link from 'next/link'
import { Video } from '@/lib/videoManager'
import { useLanguage } from '@/contexts/LanguageContext'

interface VideoCardProps {
  video: Video
  category?: string
}

export function VideoCard({ video, category }: VideoCardProps) {
  const { language } = useLanguage()

  // Get localized content based on user's language
  const content = video[language]

  // Fallback to English if Vietnamese not available
  const displayContent = content || video.en

  return (
    <Link
      href={`/tools/knowledge/${category || video.category.toLowerCase()}/${video.id}`}
      className="group block"
    >
      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white transition-all hover:shadow-lg">
        {/* Thumbnail */}
        <div className="relative aspect-video w-full overflow-hidden">
          <img
            src={video.thumbnailUrl}
            alt={displayContent.title}
            className="h-full w-full object-cover transition-transform group-hover:scale-105"
          />
          <div className="absolute bottom-2 right-2 rounded bg-black/80 px-2 py-1 text-xs text-white">
            {video.duration}
          </div>
        </div>

        {/* Content */}
        <div className="p-4">
          {/* Category Badge */}
          <div className="mb-2">
            <span className="rounded-full bg-primary-100 px-3 py-1 text-xs font-medium text-primary-700">
              {video.category}
            </span>
          </div>

          {/* Title */}
          <h3 className="mb-2 line-clamp-2 text-lg font-semibold text-slate-900 group-hover:text-primary-600">
            {displayContent.title}
          </h3>

          {/* Description */}
          <p className="mb-3 line-clamp-3 text-sm text-slate-600">
            {displayContent.description}
          </p>

          {/* Summary (if available) */}
          {displayContent.summary && (
            <div className="mt-3 rounded-lg bg-slate-50 p-3">
              <p className="text-xs text-slate-700 line-clamp-2">
                💡 {displayContent.summary}
              </p>
            </div>
          )}

          {/* Channel */}
          <div className="mt-3 flex items-center gap-2 text-xs text-slate-500">
            <span>{video.channelTitle}</span>
            <span>•</span>
            <span>{new Date(video.publishedAt).toLocaleDateString()}</span>
          </div>
        </div>
      </div>
    </Link>
  )
}
```

**Changes Made:**
1. ✅ Import `useLanguage` hook
2. ✅ Get current language from context
3. ✅ Access `video[language]` for localized content
4. ✅ Fallback to English if Vietnamese not available
5. ✅ Update all text to use `displayContent`

---

### **3.2: Video Detail Page**

**File:** `app/tools/knowledge/[category]/[slug]/page.tsx`

**Current State:** Server component fetching and displaying video
**Target State:** Client wrapper to access language context

**Implementation:**

```typescript
// app/tools/knowledge/[category]/[slug]/page.tsx
import { notFound } from 'next/navigation'
import { getVideo } from '@/lib/videoManager'
import { VideoDetailClient } from '@/components/features/VideoDetailClient'

interface PageProps {
  params: {
    category: string
    slug: string
  }
}

export const revalidate = 60 // ISR: revalidate every 60 seconds

export default async function VideoDetailPage({ params }: PageProps) {
  // Extract video ID from slug
  const videoId = params.slug.split('-').pop() || params.slug

  // Fetch video data (server-side)
  const video = await getVideo(videoId)

  if (!video) {
    notFound()
  }

  // Pass to client component for language-aware rendering
  return <VideoDetailClient video={video} />
}
```

**New File:** `components/features/VideoDetailClient.tsx`

```typescript
'use client'

import { Video } from '@/lib/videoManager'
import { useLanguage } from '@/contexts/LanguageContext'
import { VideoPlayer } from './VideoPlayer'
import { TranscriptSection } from './TranscriptSection'
import { RelatedVideos } from './RelatedVideos'

interface VideoDetailClientProps {
  video: Video
}

export function VideoDetailClient({ video }: VideoDetailClientProps) {
  const { language, t } = useLanguage()

  // Get localized content
  const content = video[language] || video.en

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid gap-8 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2">
          {/* Video Player */}
          <VideoPlayer videoId={video.videoId} />

          {/* Video Info */}
          <div className="mt-6">
            <h1 className="text-3xl font-bold text-slate-900">
              {content.title}
            </h1>

            <div className="mt-2 flex items-center gap-3 text-sm text-slate-600">
              <span>{video.channelTitle}</span>
              <span>•</span>
              <span>{new Date(video.publishedAt).toLocaleDateString()}</span>
              <span>•</span>
              <span className="rounded-full bg-primary-100 px-2 py-1 text-xs">
                {video.category}
              </span>
            </div>

            {/* Description */}
            <div className="mt-4 rounded-lg bg-slate-50 p-4">
              <p className="whitespace-pre-wrap text-slate-700">
                {content.description}
              </p>
            </div>

            {/* Summary */}
            {content.summary && (
              <div className="mt-4 rounded-lg border-l-4 border-primary-500 bg-primary-50 p-4">
                <h3 className="mb-2 font-semibold text-primary-900">
                  {t('video.summary')}
                </h3>
                <p className="text-slate-700">{content.summary}</p>
              </div>
            )}

            {/* Transcript */}
            {content.transcript && (
              <TranscriptSection
                transcript={content.transcript}
                videoId={video.videoId}
              />
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1">
          <RelatedVideos category={video.category} currentVideoId={video.id} />
        </div>
      </div>
    </div>
  )
}
```

---

### **3.3: Update VideoGrid Component**

**File:** `components/features/VideoGrid.tsx`

**Implementation:**

```typescript
'use client'

import { Video } from '@/lib/videoManager'
import { VideoCard } from './VideoCard'
import { useLanguage } from '@/contexts/LanguageContext'

interface VideoGridProps {
  videos: Video[]
  category?: string
}

export function VideoGrid({ videos, category }: VideoGridProps) {
  const { t } = useLanguage()

  if (videos.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-600">{t('knowledge.noVideos')}</p>
      </div>
    )
  }

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {videos.map((video) => (
        <VideoCard key={video.id} video={video} category={category} />
      ))}
    </div>
  )
}
```

**Add translation key to LanguageContext:**
```typescript
// contexts/LanguageContext.tsx
const translations = {
  en: {
    // ... existing keys
    'knowledge.noVideos': 'No videos found in this category',
  },
  vi: {
    // ... existing keys
    'knowledge.noVideos': 'Không tìm thấy video nào trong danh mục này',
  }
}
```

---

## **STEP 4: Create Bilingual Admin Video Editor**

### **File:** `app/admin/videos/[id]/edit/page.tsx`

**Purpose:** Allow admin to edit both English and Vietnamese content

**Implementation:**

```typescript
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Video, VideoContent } from '@/lib/videoManager'
import { translateToVietnamese, estimateTranslationCost } from '@/lib/translateVideo'
import { Loader2, Languages, Check, AlertCircle } from 'lucide-react'

export default function EditVideoPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [video, setVideo] = useState<Video | null>(null)
  const [activeTab, setActiveTab] = useState<'en' | 'vi'>('en')
  const [isTranslating, setIsTranslating] = useState(false)
  const [translationCost, setTranslationCost] = useState<number>(0)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')

  // Form state
  const [enContent, setEnContent] = useState<VideoContent>({
    title: '',
    description: '',
    transcript: '',
    summary: '',
  })

  const [viContent, setViContent] = useState<VideoContent>({
    title: '',
    description: '',
    transcript: '',
    summary: '',
  })

  // Fetch video data
  useEffect(() => {
    async function fetchVideo() {
      const response = await fetch(`/api/admin/videos/${params.id}`)
      const data = await response.json()

      if (data.video) {
        setVideo(data.video)
        setEnContent(data.video.en)
        setViContent(data.video.vi || { title: '', description: '' })
      }
    }
    fetchVideo()
  }, [params.id])

  // Calculate translation cost when English content changes
  useEffect(() => {
    const { estimatedCost } = estimateTranslationCost(enContent)
    setTranslationCost(estimatedCost)
  }, [enContent])

  // Auto-translate function
  const handleAutoTranslate = async () => {
    if (!enContent.title || !enContent.description) {
      alert('Please fill in English title and description first')
      return
    }

    setIsTranslating(true)
    try {
      const translated = await translateToVietnamese(enContent)
      setViContent(translated)
      alert('✅ Translation completed! Please review and edit as needed.')
    } catch (error) {
      console.error('Translation failed:', error)
      alert('❌ Translation failed. Please try again or translate manually.')
    } finally {
      setIsTranslating(false)
    }
  }

  // Save video
  const handleSave = async () => {
    setSaveStatus('saving')

    try {
      const response = await fetch(`/api/admin/videos/${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...video,
          en: enContent,
          vi: viContent,
          translationStatus: {
            viTranslated: !!(viContent.title && viContent.description),
            translatedAt: Date.now(),
            translationMethod: isTranslating ? 'auto' : 'manual',
          },
        }),
      })

      if (response.ok) {
        setSaveStatus('saved')
        setTimeout(() => setSaveStatus('idle'), 2000)
      } else {
        setSaveStatus('error')
      }
    } catch (error) {
      console.error('Save failed:', error)
      setSaveStatus('error')
    }
  }

  if (!video) {
    return <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Edit Video</h1>
        <button
          onClick={handleSave}
          disabled={saveStatus === 'saving'}
          className="flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-white hover:bg-primary-700 disabled:opacity-50"
        >
          {saveStatus === 'saving' && <Loader2 className="h-4 w-4 animate-spin" />}
          {saveStatus === 'saved' && <Check className="h-4 w-4" />}
          {saveStatus === 'saving' ? 'Saving...' : saveStatus === 'saved' ? 'Saved!' : 'Save Changes'}
        </button>
      </div>

      {/* Language Tabs */}
      <div className="mb-6 border-b">
        <div className="flex gap-4">
          <button
            onClick={() => setActiveTab('en')}
            className={`pb-2 px-4 font-medium transition-colors ${
              activeTab === 'en'
                ? 'border-b-2 border-primary-600 text-primary-600'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            🇬🇧 English Content
          </button>
          <button
            onClick={() => setActiveTab('vi')}
            className={`pb-2 px-4 font-medium transition-colors ${
              activeTab === 'vi'
                ? 'border-b-2 border-primary-600 text-primary-600'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            🇻🇳 Vietnamese Content
          </button>
        </div>
      </div>

      {/* Auto-translate Banner (shown on Vietnamese tab) */}
      {activeTab === 'vi' && (
        <div className="mb-6 rounded-lg border border-blue-200 bg-blue-50 p-4">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <Languages className="h-5 w-5 text-blue-600" />
                <h3 className="font-semibold text-blue-900">AI-Powered Translation</h3>
              </div>
              <p className="mt-1 text-sm text-blue-700">
                Automatically translate English content to Vietnamese using GPT-4.
                Estimated cost: ${translationCost.toFixed(4)} USD
              </p>
            </div>
            <button
              onClick={handleAutoTranslate}
              disabled={isTranslating || !enContent.title}
              className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {isTranslating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Translating...
                </>
              ) : (
                <>
                  <Languages className="h-4 w-4" />
                  Auto-Translate
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Form Fields */}
      <div className="space-y-6">
        {activeTab === 'en' ? (
          <EnglishContentForm content={enContent} onChange={setEnContent} />
        ) : (
          <VietnameseContentForm content={viContent} onChange={setViContent} />
        )}
      </div>

      {/* Preview */}
      <div className="mt-8 rounded-lg border border-slate-200 bg-slate-50 p-6">
        <h3 className="mb-4 font-semibold">Preview</h3>
        <div className="rounded-lg bg-white p-4">
          <h2 className="text-xl font-bold">
            {activeTab === 'en' ? enContent.title : viContent.title}
          </h2>
          <p className="mt-2 text-slate-600 whitespace-pre-wrap">
            {activeTab === 'en' ? enContent.description : viContent.description}
          </p>
          {(activeTab === 'en' ? enContent.summary : viContent.summary) && (
            <div className="mt-4 rounded bg-primary-50 p-3">
              <p className="text-sm text-slate-700">
                💡 {activeTab === 'en' ? enContent.summary : viContent.summary}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// English Content Form Component
function EnglishContentForm({
  content,
  onChange
}: {
  content: VideoContent
  onChange: (content: VideoContent) => void
}) {
  return (
    <>
      <div>
        <label className="block text-sm font-medium text-slate-700">
          Title (English) *
        </label>
        <input
          type="text"
          value={content.title}
          onChange={(e) => onChange({ ...content, title: e.target.value })}
          className="mt-1 w-full rounded-lg border border-slate-300 px-4 py-2"
          placeholder="Enter video title in English"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700">
          Description (English) *
        </label>
        <textarea
          value={content.description}
          onChange={(e) => onChange({ ...content, description: e.target.value })}
          rows={6}
          className="mt-1 w-full rounded-lg border border-slate-300 px-4 py-2"
          placeholder="Enter video description in English"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700">
          AI Summary (English)
        </label>
        <textarea
          value={content.summary || ''}
          onChange={(e) => onChange({ ...content, summary: e.target.value })}
          rows={4}
          className="mt-1 w-full rounded-lg border border-slate-300 px-4 py-2"
          placeholder="AI-generated summary (optional)"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700">
          Transcript (English)
        </label>
        <textarea
          value={content.transcript || ''}
          onChange={(e) => onChange({ ...content, transcript: e.target.value })}
          rows={8}
          className="mt-1 w-full rounded-lg border border-slate-300 px-4 py-2 font-mono text-sm"
          placeholder="Full video transcript (auto-fetched)"
          readOnly
        />
        <p className="mt-1 text-xs text-slate-500">
          Transcript is auto-fetched from YouTube and cannot be edited
        </p>
      </div>
    </>
  )
}

// Vietnamese Content Form Component
function VietnameseContentForm({
  content,
  onChange
}: {
  content: VideoContent
  onChange: (content: VideoContent) => void
}) {
  return (
    <>
      <div>
        <label className="block text-sm font-medium text-slate-700">
          Tiêu đề (Tiếng Việt) *
        </label>
        <input
          type="text"
          value={content.title}
          onChange={(e) => onChange({ ...content, title: e.target.value })}
          className="mt-1 w-full rounded-lg border border-slate-300 px-4 py-2"
          placeholder="Nhập tiêu đề video bằng tiếng Việt"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700">
          Mô tả (Tiếng Việt) *
        </label>
        <textarea
          value={content.description}
          onChange={(e) => onChange({ ...content, description: e.target.value })}
          rows={6}
          className="mt-1 w-full rounded-lg border border-slate-300 px-4 py-2"
          placeholder="Nhập mô tả video bằng tiếng Việt"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700">
          Tóm tắt AI (Tiếng Việt)
        </label>
        <textarea
          value={content.summary || ''}
          onChange={(e) => onChange({ ...content, summary: e.target.value })}
          rows={4}
          className="mt-1 w-full rounded-lg border border-slate-300 px-4 py-2"
          placeholder="Tóm tắt tự động bằng AI (tùy chọn)"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700">
          Bản ghi (Tiếng Việt)
        </label>
        <textarea
          value={content.transcript || ''}
          onChange={(e) => onChange({ ...content, transcript: e.target.value })}
          rows={8}
          className="mt-1 w-full rounded-lg border border-slate-300 px-4 py-2 font-mono text-sm"
          placeholder="Bản ghi đầy đủ (nếu có)"
        />
        <p className="mt-1 text-xs text-slate-500">
          Hầu hết videos trên YouTube đều bằng tiếng Anh, bạn có thể để trống trường này
        </p>
      </div>
    </>
  )
}
```

---

## **STEP 5: Update API Routes**

### **File:** `app/api/admin/videos/[id]/route.ts`

**Update GET and PUT endpoints:**

```typescript
import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { getVideo, saveVideo } from '@/lib/videoManager'

export const dynamic = 'force-dynamic'

// GET: Fetch video for editing
export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await auth()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const video = await getVideo(params.id)

  if (!video) {
    return NextResponse.json({ error: 'Video not found' }, { status: 404 })
  }

  return NextResponse.json({ video })
}

// PUT: Update video
export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await auth()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await req.json()

    // Validate required fields
    if (!body.en?.title || !body.en?.description) {
      return NextResponse.json(
        { error: 'English title and description are required' },
        { status: 400 }
      )
    }

    await saveVideo(body)

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Failed to update video:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to update video' },
      { status: 500 }
    )
  }
}
```

### **New File:** `app/api/admin/videos/translate/route.ts`

**Purpose:** API endpoint for auto-translation

```typescript
import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { translateToVietnamese } from '@/lib/translateVideo'

export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  const session = await auth()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { englishContent } = await req.json()

    if (!englishContent?.title || !englishContent?.description) {
      return NextResponse.json(
        { error: 'English title and description are required' },
        { status: 400 }
      )
    }

    const vietnameseContent = await translateToVietnamese(englishContent)

    return NextResponse.json({
      success: true,
      vietnameseContent
    })
  } catch (error: any) {
    console.error('Translation failed:', error)
    return NextResponse.json(
      { error: error.message || 'Translation failed' },
      { status: 500 }
    )
  }
}
```

---

## **STEP 6: Migration Strategy**

### **6.1: Create Migration Script**

**File:** `scripts/migrate-videos-to-bilingual.ts` (NEW)

```typescript
/**
 * Migration Script: Convert existing videos to bilingual structure
 * Run once to update all existing videos
 */

import { getAllVideos, saveVideo, Video } from '../lib/videoManager'

async function migrateVideosToBilingual() {
  console.log('🚀 Starting video migration to bilingual structure...\n')

  // Fetch all existing videos
  const videos = await getAllVideos(1000)
  console.log(`📊 Found ${videos.length} videos to migrate\n`)

  let migratedCount = 0
  let skippedCount = 0
  let errorCount = 0

  for (const video of videos) {
    try {
      // Check if already migrated (has 'en' and 'vi' fields)
      if (video.en && video.vi) {
        console.log(`⏭️  Skipping: ${video.title} (already migrated)`)
        skippedCount++
        continue
      }

      // Migrate: Move existing fields to 'en' object
      const migratedVideo: Video = {
        ...video,
        en: {
          title: (video as any).title || 'Untitled',
          description: (video as any).description || '',
          transcript: (video as any).transcript,
          summary: (video as any).summary,
        },
        vi: {
          title: '',  // Will be filled by admin or auto-translate
          description: '',
          transcript: undefined,
          summary: undefined,
        },
      }

      // Remove old fields
      delete (migratedVideo as any).title
      delete (migratedVideo as any).description
      delete (migratedVideo as any).transcript
      delete (migratedVideo as any).summary

      // Save migrated video
      await saveVideo(migratedVideo)

      console.log(`✅ Migrated: ${migratedVideo.en.title}`)
      migratedCount++

      // Rate limiting
      await new Promise((resolve) => setTimeout(resolve, 100))
    } catch (error: any) {
      console.error(`❌ Error migrating video ${video.id}:`, error.message)
      errorCount++
    }
  }

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('📊 Migration Summary:')
  console.log(`   ✅ Successfully migrated: ${migratedCount}`)
  console.log(`   ⏭️  Skipped (already migrated): ${skippedCount}`)
  console.log(`   ❌ Errors: ${errorCount}`)
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

  if (errorCount === 0) {
    console.log('🎉 Migration completed successfully!')
  } else {
    console.log('⚠️  Migration completed with errors. Please review.')
  }
}

// Run migration
migrateVideosToBilingual()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Fatal error during migration:', error)
    process.exit(1)
  })
```

**Usage:**
```bash
# Run migration
npx tsx scripts/migrate-videos-to-bilingual.ts
```

---

### **6.2: Batch Auto-Translate Script**

**File:** `scripts/batch-translate-videos.ts` (NEW)

```typescript
/**
 * Batch Translation Script: Auto-translate all videos to Vietnamese
 * Use after migration to fill Vietnamese content
 */

import { getAllVideos, saveVideo } from '../lib/videoManager'
import { translateToVietnamese, estimateTranslationCost } from '../lib/translateVideo'

async function batchTranslateVideos() {
  console.log('🌐 Starting batch translation...\n')

  const videos = await getAllVideos(1000)
  const untranslatedVideos = videos.filter(v => !v.vi?.title || !v.vi?.description)

  console.log(`📊 Found ${untranslatedVideos.length} videos needing translation\n`)

  // Estimate total cost
  let totalCost = 0
  untranslatedVideos.forEach(video => {
    const { estimatedCost } = estimateTranslationCost(video.en)
    totalCost += estimatedCost
  })

  console.log(`💰 Estimated total cost: $${totalCost.toFixed(2)} USD\n`)
  console.log('Press Ctrl+C to cancel, or wait 5 seconds to continue...\n')

  await new Promise(resolve => setTimeout(resolve, 5000))

  let successCount = 0
  let errorCount = 0

  for (let i = 0; i < untranslatedVideos.length; i++) {
    const video = untranslatedVideos[i]

    console.log(`[${i + 1}/${untranslatedVideos.length}] Translating: ${video.en.title}`)

    try {
      const translated = await translateToVietnamese(video.en)

      video.vi = translated
      video.translationStatus = {
        viTranslated: true,
        translatedAt: Date.now(),
        translationMethod: 'auto',
      }

      await saveVideo(video)

      console.log(`   ✅ Success: ${translated.title}\n`)
      successCount++

      // Rate limiting: 1 request per second
      await new Promise(resolve => setTimeout(resolve, 1000))
    } catch (error: any) {
      console.error(`   ❌ Error: ${error.message}\n`)
      errorCount++
    }
  }

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('📊 Translation Summary:')
  console.log(`   ✅ Successfully translated: ${successCount}`)
  console.log(`   ❌ Errors: ${errorCount}`)
  console.log(`   💰 Actual cost: ~$${(totalCost * (successCount / untranslatedVideos.length)).toFixed(2)} USD`)
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

  console.log('🎉 Batch translation completed!')
  console.log('⚠️  IMPORTANT: Please review all translations in the admin panel!')
}

// Run batch translation
batchTranslateVideos()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Fatal error during batch translation:', error)
    process.exit(1)
  })
```

**Usage:**
```bash
# Translate all videos
npx tsx scripts/batch-translate-videos.ts
```

---

## 📋 IMPLEMENTATION CHECKLIST

### **Development Phase:**
- [ ] Update Video interface in `lib/videoManager.ts`
- [ ] Create `lib/translateVideo.ts` translation helper
- [ ] Update `VideoCard.tsx` component
- [ ] Create `VideoDetailClient.tsx` client component
- [ ] Update `VideoGrid.tsx` component
- [ ] Create bilingual admin editor page
- [ ] Update API routes for video CRUD
- [ ] Create translation API endpoint
- [ ] Write migration script
- [ ] Write batch translation script
- [ ] Add translation keys to `LanguageContext.tsx`

### **Testing Phase:**
- [ ] Test video display in both languages
- [ ] Test language switching (EN ↔ VI)
- [ ] Test admin editor (both tabs)
- [ ] Test auto-translate button
- [ ] Test save functionality
- [ ] Verify fallback to English works
- [ ] Test migration script on dev data
- [ ] Review translation quality (sample 5-10 videos)
- [ ] Test edge cases (missing Vietnamese content)

### **Migration Phase:**
- [ ] Backup database (export all videos)
- [ ] Run migration script
- [ ] Verify all videos migrated successfully
- [ ] Run batch translation (or manual for key videos)
- [ ] Review AI translations
- [ ] Edit/improve translations as needed

### **Deployment Phase:**
- [ ] Commit all changes
- [ ] Push to GitHub
- [ ] Deploy to production
- [ ] Verify no breaking changes
- [ ] Test on production environment
- [ ] Monitor for errors

---

## ⚠️ POTENTIAL ISSUES & SOLUTIONS

### **Issue 1: Translation Quality**
**Problem:** AI translations may not be perfect
**Solution:**
- Always review translations before publishing
- Provide context to AI (technical vs casual content)
- Use manual editing for critical videos
- Create translation guidelines document

### **Issue 2: API Costs**
**Problem:** OpenAI API costs for many videos
**Solution:**
- Estimate costs before batch translation
- Translate only important videos first
- Use cheaper model (gpt-4o-mini) for drafts
- Cache translations to avoid re-translating

### **Issue 3: Migration Errors**
**Problem:** Some videos may fail to migrate
**Solution:**
- Implement try-catch for each video
- Log errors with video IDs
- Create manual fix script for failed videos
- Verify data integrity after migration

### **Issue 4: Fallback Behavior**
**Problem:** What if Vietnamese content is missing?
**Solution:**
- Always fallback to English: `video[language] || video.en`
- Show badge "English only" if VI not available
- Admin panel highlights untranslated videos

### **Issue 5: Large Transcripts**
**Problem:** Transcripts can be very long (expensive to translate)
**Solution:**
- Only translate first 500 words of transcript
- Make transcript translation optional
- Most value is in title/description/summary

---

## 📊 ESTIMATED TIMELINE

**Step-by-step breakdown:**

| Task | Estimated Time |
|------|---------------|
| Update Video interface | 30 mins |
| Create translation helper | 1 hour |
| Update VideoCard component | 30 mins |
| Create VideoDetailClient | 1 hour |
| Update VideoGrid | 15 mins |
| Create admin editor | 3 hours |
| Update API routes | 1 hour |
| Write migration scripts | 1 hour |
| Testing & debugging | 2 hours |
| **Total** | **~10 hours** |

**Migration & Translation:**
| Task | Estimated Time |
|------|---------------|
| Run migration script | 5 mins |
| Batch translate 50 videos | 1 hour |
| Review translations | 2-3 hours |
| **Total** | **~4 hours** |

**Grand Total: ~14 hours (2 working days)**

---

## 💰 COST ESTIMATION

**OpenAI API Costs (GPT-4o-mini):**
- Input: $0.150 / 1M tokens
- Output: $0.600 / 1M tokens

**Typical video translation:**
- Input tokens: ~500 (title + description + summary)
- Output tokens: ~500 (translated content)
- Cost per video: ~$0.0005 USD

**For 50 videos:** ~$0.025 USD (basically free!)
**For 100 videos:** ~$0.05 USD

**Note:** Very affordable, even for hundreds of videos.

---

## ✅ SUCCESS METRICS

**Phase 2 Complete When:**
- [ ] All videos display in both EN and VI
- [ ] Users can switch language and see translated content
- [ ] Admin can edit both languages easily
- [ ] Auto-translate button works reliably
- [ ] At least 80% of videos have Vietnamese translations
- [ ] Zero breaking changes to existing functionality
- [ ] TypeScript compilation passes
- [ ] Production deployment successful

---

## 📚 FILES SUMMARY

**New Files (9):**
1. `lib/translateVideo.ts` - Translation helper
2. `components/features/VideoDetailClient.tsx` - Client wrapper
3. `app/api/admin/videos/translate/route.ts` - Translation API
4. `scripts/migrate-videos-to-bilingual.ts` - Migration script
5. `scripts/batch-translate-videos.ts` - Batch translation

**Modified Files (6):**
1. `lib/videoManager.ts` - Updated Video interface
2. `components/features/VideoCard.tsx` - Language-aware
3. `components/features/VideoGrid.tsx` - Use translations
4. `app/tools/knowledge/[category]/[slug]/page.tsx` - Pass to client
5. `app/admin/videos/[id]/edit/page.tsx` - Bilingual editor
6. `app/api/admin/videos/[id]/route.ts` - Updated API
7. `contexts/LanguageContext.tsx` - Add video translation keys

---

## 🎯 NEXT STEPS AFTER PHASE 2

After Phase 2 is complete, we can move to:

**Phase 3: Page Content Translation**
- About page bilingual
- Projects page bilingual
- Blog page bilingual

**Phase 4 (Optional): CMS Implementation**
- Vercel KV-based content management
- Admin UI for About/Projects/Blog

**Phase 5 (Optional): Embedding Enhancement**
- Implement Option 2 (Enhanced Metadata)
- See `docs/PHASE2_VIDEO_EMBEDDING_ENHANCEMENT.md`

---

**🔥 Ready to implement when you give the green light!**

Let me know if you want to proceed or if you need any adjustments to this plan! 🚀
