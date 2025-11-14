# Internationalization - Simplified Approach
**Date**: November 14, 2025 (Updated)
**Status**: Planning Phase - Ready for Implementation

---

## 🎯 User Requirements

**Key Decision Changes**:
1. ✅ **Simple Language Toggle**: Button in header "English" / "Tiếng Việt"
2. ✅ **Apply to ALL pages**: Including Video pages
3. ✅ **Video Translation**: Vietnamese videos get English translations and vice versa
4. ❌ **No URL changes**: Stay on same URL, just change displayed language

---

## 🏗️ Simplified Architecture

### Approach: Client-Side Language Switching (No next-intl routing)

**Why this approach**:
- ✅ Simpler implementation
- ✅ No URL structure changes
- ✅ Fast language switching (no page reload)
- ✅ Easy to understand and maintain
- ✅ Works well for bilingual content

```
Simple Toggle Solution
├── Language state in localStorage
├── Context API for current language
├── Single button toggle in header
└── Conditional rendering based on language

NO routing changes:
hungreo.vercel.app/about       → Shows EN or VI based on toggle
hungreo.vercel.app/projects    → Shows EN or VI based on toggle
hungreo.vercel.app/tools/knowledge → Shows EN or VI based on toggle
```

---

## 📦 Implementation Plan

### Phase 1: Setup Language Context

**Step 1.1**: Create Language Context
```typescript
// contexts/LanguageContext.tsx
'use client'

import { createContext, useContext, useState, useEffect } from 'react'

type Language = 'en' | 'vi'

interface LanguageContextType {
  language: Language
  setLanguage: (lang: Language) => void
  t: (key: string) => string
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

// Translations
const translations = {
  en: {
    // Header
    'header.home': 'Home',
    'header.about': 'About',
    'header.projects': 'Projects',
    'header.blog': 'Blog',
    'header.aiTools': 'AI Tools',
    'header.contact': 'Contact',
    'header.language': 'Language',
    'header.switchTo': 'Tiếng Việt',

    // Footer
    'footer.copyright': '© {year} Hung Dinh. All rights reserved.',
    'footer.security': 'Secured with HTTPS | GDPR Compliant | No Tracking',

    // Knowledge/Videos
    'knowledge.title': 'AI Tools - Video Library',
    'knowledge.subtitle': 'Explore curated videos organized by category',
    'knowledge.categories.leadership': 'Leadership',
    'knowledge.categories.aiWorks': 'AI Works',
    'knowledge.categories.health': 'Health',
    'knowledge.categories.entertaining': 'Entertaining',
    'knowledge.categories.philosophy': 'Human Philosophy',
    'knowledge.videoCount': '{count} video(s)',
    'knowledge.browseVideos': 'Browse videos',

    // Common
    'common.readMore': 'Read more',
    'common.loading': 'Loading...',
    'common.back': 'Back',
  },
  vi: {
    // Header
    'header.home': 'Trang chủ',
    'header.about': 'Giới thiệu',
    'header.projects': 'Dự án',
    'header.blog': 'Blog',
    'header.aiTools': 'Công cụ AI',
    'header.contact': 'Liên hệ',
    'header.language': 'Ngôn ngữ',
    'header.switchTo': 'English',

    // Footer
    'footer.copyright': '© {year} Hung Dinh. Bảo lưu mọi quyền.',
    'footer.security': 'Bảo mật HTTPS | Tuân thủ GDPR | Không theo dõi',

    // Knowledge/Videos
    'knowledge.title': 'Công cụ AI - Thư viện Video',
    'knowledge.subtitle': 'Khám phá các video được tuyển chọn theo danh mục',
    'knowledge.categories.leadership': 'Lãnh đạo',
    'knowledge.categories.aiWorks': 'AI & Công nghệ',
    'knowledge.categories.health': 'Sức khỏe',
    'knowledge.categories.entertaining': 'Giải trí',
    'knowledge.categories.philosophy': 'Triết học con người',
    'knowledge.videoCount': '{count} video',
    'knowledge.browseVideos': 'Duyệt video',

    // Common
    'common.readMore': 'Đọc thêm',
    'common.loading': 'Đang tải...',
    'common.back': 'Quay lại',
  }
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>('en')

  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('language') as Language
    if (saved && (saved === 'en' || saved === 'vi')) {
      setLanguageState(saved)
    }
  }, [])

  // Save to localStorage when changed
  const setLanguage = (lang: Language) => {
    setLanguageState(lang)
    localStorage.setItem('language', lang)
  }

  // Translation function
  const t = (key: string): string => {
    return translations[language][key] || key
  }

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider')
  }
  return context
}
```

**Step 1.2**: Add Provider to Layout
```typescript
// app/layout.tsx
import { LanguageProvider } from '@/contexts/LanguageContext'

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <LanguageProvider>
          {children}
        </LanguageProvider>
      </body>
    </html>
  )
}
```

---

### Phase 2: Create Language Switcher

```typescript
// components/LanguageSwitcher.tsx
'use client'

import { useLanguage } from '@/contexts/LanguageContext'

export function LanguageSwitcher() {
  const { language, setLanguage, t } = useLanguage()

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'vi' : 'en')
  }

  return (
    <button
      onClick={toggleLanguage}
      className="flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
      aria-label={t('header.language')}
    >
      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
      </svg>
      {t('header.switchTo')}
    </button>
  )
}
```

**Add to Header**:
```typescript
// components/Header.tsx (or Navigation.tsx)
'use client'

import { useLanguage } from '@/contexts/LanguageContext'
import { LanguageSwitcher } from './LanguageSwitcher'

export function Header() {
  const { t } = useLanguage()

  return (
    <header>
      <nav>
        <Link href="/">{t('header.home')}</Link>
        <Link href="/about">{t('header.about')}</Link>
        <Link href="/projects">{t('header.projects')}</Link>
        <Link href="/blog">{t('header.blog')}</Link>
        <Link href="/tools/knowledge">{t('header.aiTools')}</Link>
        <Link href="/contact">{t('header.contact')}</Link>
      </nav>

      <LanguageSwitcher />
    </header>
  )
}
```

---

### Phase 3: Update Video Data Model for Translation

**IMPORTANT**: Videos need bilingual metadata

```typescript
// lib/videoManager.ts - UPDATED

export interface Video {
  id: string
  videoId: string

  // Language-agnostic fields
  channelTitle: string
  publishedAt: string
  thumbnailUrl: string
  duration: string
  category: VideoCategory

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
    transcript?: string  // Optional for English videos
    summary?: string
  }

  addedAt: number
  addedBy: string
  pineconeIds?: string[]
}
```

**Example Video Object**:
```json
{
  "id": "L3RbhSM3z40",
  "videoId": "L3RbhSM3z40",
  "channelTitle": "Simon Sinek",
  "publishedAt": "2020-02-07T12:00:03Z",
  "thumbnailUrl": "https://i.ytimg.com/vi/L3RbhSM3z40/mqdefault.jpg",
  "duration": "PT1M36S",
  "category": "Leadership",

  "en": {
    "title": "What Happens in an Unsafe Work Environment",
    "description": "Our people need to feel safe enough to share their honest feelings...",
    "transcript": "Full English transcript here...",
    "summary": "AI-generated summary in English"
  },

  "vi": {
    "title": "Điều Gì Xảy Ra Trong Môi Trường Làm Việc Không An Toàn",
    "description": "Nhân viên cần cảm thấy an toàn để chia sẻ cảm xúc thật của họ...",
    "transcript": null,  // Original is English
    "summary": "Tóm tắt bằng AI bằng tiếng Việt"
  }
}
```

---

### Phase 4: Update Video Display Components

```typescript
// components/features/VideoCard.tsx
'use client'

import { useLanguage } from '@/contexts/LanguageContext'
import { Video } from '@/lib/videoManager'

export function VideoCard({ video }: { video: Video }) {
  const { language } = useLanguage()

  // Get localized content
  const content = video[language]

  return (
    <div className="video-card">
      <img src={video.thumbnailUrl} alt={content.title} />
      <h3>{content.title}</h3>
      <p>{content.description}</p>
      {content.summary && (
        <div className="summary">
          <p>{content.summary}</p>
        </div>
      )}
    </div>
  )
}
```

```typescript
// app/tools/knowledge/[category]/[slug]/page.tsx
// Server component - needs client wrapper for video details

export default async function VideoPage({ params }) {
  const videoId = extractVideoId(params.slug)
  const video = await getVideo(videoId)

  return <VideoPageClient video={video} />
}

// components/VideoPageClient.tsx
'use client'

import { useLanguage } from '@/contexts/LanguageContext'

export function VideoPageClient({ video }) {
  const { language, t } = useLanguage()
  const content = video[language]

  return (
    <div>
      <h1>{content.title}</h1>
      <p>{content.description}</p>

      {/* Video player */}
      <iframe src={`https://www.youtube.com/embed/${video.videoId}`} />

      {/* Transcript */}
      {content.transcript && (
        <div>
          <h2>{t('video.transcript')}</h2>
          <p>{content.transcript}</p>
        </div>
      )}

      {/* Summary */}
      {content.summary && (
        <div>
          <h2>{t('video.summary')}</h2>
          <p>{content.summary}</p>
        </div>
      )}
    </div>
  )
}
```

---

### Phase 5: Admin UI for Bilingual Video Management

```typescript
// app/admin/videos/[id]/edit/page.tsx

export default function EditVideoPage() {
  const [activeTab, setActiveTab] = useState<'en' | 'vi'>('en')

  return (
    <form>
      {/* Language-agnostic fields */}
      <input name="category" />
      <input name="thumbnailUrl" />

      {/* Language tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="en">English Content</TabsTrigger>
          <TabsTrigger value="vi">Vietnamese Content</TabsTrigger>
        </TabsList>

        <TabsContent value="en">
          <input name="en.title" placeholder="Title (English)" required />
          <textarea name="en.description" placeholder="Description" required />
          <textarea name="en.transcript" placeholder="Transcript (auto-fetched)" />
          <textarea name="en.summary" placeholder="AI Summary" />
        </TabsContent>

        <TabsContent value="vi">
          <input name="vi.title" placeholder="Tiêu đề (Tiếng Việt)" required />
          <textarea name="vi.description" placeholder="Mô tả" required />
          <textarea name="vi.transcript" placeholder="Bản ghi (nếu có)" />
          <textarea name="vi.summary" placeholder="Tóm tắt AI" />
        </TabsContent>
      </Tabs>

      <button type="submit">Save Video</button>
    </form>
  )
}
```

**AI-Powered Translation Helper**:
```typescript
// lib/translateVideo.ts
import OpenAI from 'openai'

export async function translateVideoContent(
  englishContent: { title: string; description: string; summary?: string },
  targetLang: 'vi'
): Promise<{ title: string; description: string; summary?: string }> {
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

  const prompt = `Translate the following YouTube video content to Vietnamese. Maintain the meaning and tone.

Title: ${englishContent.title}
Description: ${englishContent.description}
${englishContent.summary ? `Summary: ${englishContent.summary}` : ''}

Return JSON format:
{
  "title": "Vietnamese title",
  "description": "Vietnamese description",
  "summary": "Vietnamese summary"
}
`

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: prompt }],
    response_format: { type: 'json_object' }
  })

  return JSON.parse(response.choices[0].message.content)
}
```

---

### Phase 6: Update CMS Data Models

**About Page**:
```typescript
export interface AboutContent {
  version: number

  en: {
    title: string
    content: string  // Markdown
    skills: string[]
    experience: ExperienceItem[]
    education: EducationItem[]
  }

  vi: {
    title: string
    content: string  // Markdown
    skills: string[]
    experience: ExperienceItem[]
    education: EducationItem[]
  }

  lastUpdated: number
  updatedBy: string
}
```

**Projects & Blog**: Same bilingual structure as shown in original plan.

---

## 📋 Implementation Checklist

### i18n Core
- [ ] Create `contexts/LanguageContext.tsx`
- [ ] Add `LanguageProvider` to root layout
- [ ] Create `components/LanguageSwitcher.tsx`
- [ ] Add language switcher to header
- [ ] Create translation JSON structure
- [ ] Test language switching

### Video Translation
- [ ] Update `Video` interface with bilingual fields
- [ ] Update `saveVideo()` to handle bilingual data
- [ ] Create `translateVideoContent()` helper
- [ ] Update video display components to use language
- [ ] Update admin video editor with language tabs
- [ ] Add "Auto-translate" button in admin

### CMS Bilingual
- [ ] Update `AboutContent` interface
- [ ] Update `Project` interface
- [ ] Update `BlogPost` interface
- [ ] Update admin editors with language tabs
- [ ] Update public pages to use language context

### Testing
- [ ] Test language switcher on all pages
- [ ] Test video display in both languages
- [ ] Test admin video upload/edit
- [ ] Test localStorage persistence
- [ ] Test missing translations (fallback to English)

---

## 🎨 UI/UX Mockup

**Header with Language Switcher**:
```
┌─────────────────────────────────────────────────────────┐
│  Hung Dinh    Home  About  Projects  Blog  AI Tools   │
│                                                         │
│                                    [🌐 Tiếng Việt]     │
└─────────────────────────────────────────────────────────┘
```

**When clicked → Changes to**:
```
┌─────────────────────────────────────────────────────────┐
│  Hung Dinh    Trang chủ  Giới thiệu  Dự án  Blog       │
│                                                         │
│                                        [🌐 English]     │
└─────────────────────────────────────────────────────────┘
```

**Video Card Example**:

English Version:
```
┌─────────────────────────────┐
│   [Video Thumbnail]         │
│                             │
│   Leadership                │
│   What Happens in Unsafe    │
│   Work Environment          │
│                             │
│   Our people need to feel   │
│   safe enough to share...   │
└─────────────────────────────┘
```

Vietnamese Version (after toggle):
```
┌─────────────────────────────┐
│   [Video Thumbnail]         │
│                             │
│   Lãnh đạo                  │
│   Điều Gì Xảy Ra Trong      │
│   Môi Trường Làm Việc...    │
│                             │
│   Nhân viên cần cảm thấy    │
│   an toàn để chia sẻ...     │
└─────────────────────────────┘
```

---

## 🚀 Migration Strategy

### Step 1: Add Vietnamese Content to Existing Videos

**Option A**: Manual Translation
1. Admin opens video edit page
2. Fills Vietnamese tab manually
3. Saves

**Option B**: AI-Assisted Translation
1. Admin opens video edit page
2. Clicks "Auto-translate to Vietnamese" button
3. Reviews AI translation
4. Edits if needed
5. Saves

### Step 2: Batch Translation Script

```typescript
// scripts/translate-all-videos.ts
import { getAllVideos, saveVideo } from '@/lib/videoManager'
import { translateVideoContent } from '@/lib/translateVideo'

async function translateAllVideos() {
  const videos = await getAllVideos(1000)

  for (const video of videos) {
    if (!video.vi) {
      console.log(`Translating: ${video.en.title}`)

      const viContent = await translateVideoContent(video.en, 'vi')

      video.vi = viContent
      await saveVideo(video, 'system@auto-translate')

      console.log(`✓ Translated: ${viContent.title}`)
    }
  }

  console.log(`\n✅ Translated ${videos.length} videos`)
}

translateAllVideos()
```

---

## ⚡ Performance Considerations

1. **Translation Caching**: Store translations in KV, don't translate on-the-fly
2. **Client-Side Toggle**: No server round-trip, instant switch
3. **localStorage**: Remember user preference
4. **Lazy Loading**: Load only needed translations

---

## 🔍 SEO Considerations

**Since URLs don't change**, we need alternate approach:

```typescript
// Add language meta tags
export function generateMetadata({ params, searchParams }) {
  const lang = searchParams.lang || 'en'

  return {
    title: lang === 'vi' ? 'Hung Dinh - Nhà phát triển' : 'Hung Dinh - Developer',
    description: lang === 'vi' ? 'Portfolio...' : 'Portfolio...',
    other: {
      'content-language': lang
    }
  }
}
```

**Optional**: Add `?lang=vi` query param for SEO (but don't require it for switching)

---

## 📝 Summary

**What Makes This Simple**:
1. ✅ No routing changes
2. ✅ No middleware complexity
3. ✅ Client-side state management
4. ✅ Single button toggle
5. ✅ Works with existing architecture

**What Gets Translated**:
- ✅ All UI text
- ✅ Page content (About, Projects, Blog)
- ✅ Video titles, descriptions, summaries
- ✅ Category names
- ✅ Button labels

**What Doesn't Get Translated**:
- ❌ Admin panel (English only)
- ❌ API responses (internal use)
- ❌ Error messages (technical)

---

**Ready for Claude Code Web Implementation** 🚀
