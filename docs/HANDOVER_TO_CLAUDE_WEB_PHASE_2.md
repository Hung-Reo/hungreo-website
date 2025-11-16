# Handover Guide: About Page Admin - Phase 2

**Date:** November 16, 2025
**From:** Claude Code Desktop
**To:** Claude Code Web
**Status:** Phase 1 Complete ✅ | Phase 2 Ready to Start

---

## 🎯 What Has Been Completed (Phase 1)

### ✅ Successfully Implemented Features

1. **CV Upload & AI Parsing** - WORKING ✅
   - Drag & drop CV upload (PDF/DOCX)
   - AI auto-parsing with GPT-4.1-mini
   - Auto language detection (EN/VI)
   - Auto translation (EN ↔ VI)
   - Preview parsed data in admin panel
   - Save to Upstash Redis

2. **Files Created/Modified:**
   - ✅ `lib/cvParser.ts` - CV parsing library using `unpdf` (NOT pdf-parse!)
   - ✅ `app/api/admin/content/about/upload-cv/route.ts` - Upload API endpoint
   - ✅ `lib/contentManager.ts` - Updated AboutContent interface (5 sections)
   - ✅ `app/api/admin/content/about/route.ts` - GET/PUT endpoints
   - ✅ `app/admin/content/about/page.tsx` - Admin UI with drag & drop
   - ✅ `components/ChatBot.tsx` - Fixed button position (bottom-24)

3. **Documentation Created:**
   - ✅ `docs/ABOUT_PAGE_IMPLEMENTATION_GUIDE.md` - Complete architecture guide
   - ✅ `app/about/page.tsx.backup` - Backup of hard-coded About page

### ✅ CV Upload Test Result

User successfully uploaded: `DinhQuangHung_CV_2025.docx`
- ✅ File uploaded to Vercel Blob Storage
- ✅ Text extraction successful (using unpdf)
- ✅ Language detected: English
- ✅ AI parsing successful
- ✅ Translation to Vietnamese successful
- ✅ Data displayed in admin panel

---

## 📋 Your Next Tasks (Phase 2)

### Task 1: Replace ChatBot Icon with Robot Rùa Image 🐢

**Priority:** HIGH (User requested this immediately)

**What to do:**

1. **Save the Robot Rùa image:**
   - User has uploaded image: `/Users/hungdinh/Development/hungreo-Website/public/robot-rua.png` (or similar)
   - If not exists, ask user to provide the robot turtle image
   - Save to: `public/robot-rua.png`

2. **Update ChatBot.tsx:**

**File:** `components/ChatBot.tsx` (line 150-184)

**Current code:**
```tsx
<button
  onClick={() => setIsOpen(true)}
  className="fixed bottom-24 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-primary-600 text-white shadow-lg transition-transform hover:scale-110"
  aria-label="Open chat"
  title="Chat with Robot Rùa"
>
  {/* Robot Rùa (Turtle) Icon */}
  <svg className="h-9 w-9" viewBox="0 0 48 48" fill="none">
    {/* ... SVG code ... */}
  </svg>
</button>
```

**New code:**
```tsx
<button
  onClick={() => setIsOpen(true)}
  className="fixed bottom-24 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-white shadow-lg transition-transform hover:scale-110 overflow-hidden"
  aria-label="Open chat"
  title="Chat with Robot Rùa"
>
  <img
    src="/robot-rua.png"
    alt="Robot Rùa"
    className="h-full w-full object-cover"
  />
</button>
```

**Changes:**
- Changed `bg-primary-600 text-white` to `bg-white` (since image has its own colors)
- Added `overflow-hidden` to clip image to circle
- Replaced SVG with `<img>` tag
- Used `object-cover` to fill the circle properly

**IMPORTANT:** User wants the robot image to be scaled appropriately for the website!

---

### Task 2: Add Edit Functionality to About Admin Page

**Priority:** HIGH (Core feature for Phase 2)

**Goal:** Allow admin to manually edit parsed CV data before publishing.

**Current State:**
- Admin can upload CV ✅
- Admin can preview parsed data ✅
- Admin CANNOT edit the data ❌
- Admin can only save what AI parsed ❌

**What to Implement:**

#### 2.1 Make All Fields Editable

**File:** `app/admin/content/about/page.tsx`

**Current Preview Section (line 303-446):** Read-only display in colored boxes

**New Implementation:** Replace with editable form fields

**Example for Hero Section (line 304-328):**

**BEFORE (Read-only):**
```tsx
<div>
  <span className="text-xs font-medium text-slate-500 uppercase">Name</span>
  <p className="text-slate-900">{formData.hero[activeTab].name}</p>
</div>
```

**AFTER (Editable):**
```tsx
<div>
  <label className="text-xs font-medium text-slate-500 uppercase block mb-1">
    Name
  </label>
  <input
    type="text"
    value={formData.hero[activeTab].name}
    onChange={(e) => {
      setFormData({
        ...formData,
        hero: {
          ...formData.hero,
          [activeTab]: {
            ...formData.hero[activeTab],
            name: e.target.value
          }
        }
      })
    }}
    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
  />
</div>
```

**Do this for ALL sections:**
- Hero: name, role, intro
- Professional Journey: year, title, company, description (all items)
- Education & Expertise: degree, detail, focus (all items)
- Training: name, issuer, year (all items)
- Competencies: competency (all items)
- Interests: bio, hobbies

#### 2.2 Add/Edit/Delete Items in Arrays

**For Professional Journey (line 331-354):**

**Add these buttons:**

```tsx
<div className="space-y-3">
  {formData.professionalJourney[activeTab].map((job, idx) => (
    <div key={job.id} className="bg-slate-50 rounded-lg p-4 relative">
      {/* Delete Button */}
      <button
        onClick={() => {
          const newJobs = formData.professionalJourney[activeTab].filter((_, i) => i !== idx)
          setFormData({
            ...formData,
            professionalJourney: {
              ...formData.professionalJourney,
              [activeTab]: newJobs
            }
          })
        }}
        className="absolute top-2 right-2 text-red-600 hover:text-red-700"
      >
        <Trash2 className="h-4 w-4" />
      </button>

      {/* Editable Fields */}
      <input
        type="text"
        value={job.year}
        onChange={(e) => {
          const newJobs = [...formData.professionalJourney[activeTab]]
          newJobs[idx] = { ...newJobs[idx], year: e.target.value }
          setFormData({
            ...formData,
            professionalJourney: {
              ...formData.professionalJourney,
              [activeTab]: newJobs
            }
          })
        }}
        className="w-full px-3 py-2 border rounded mb-2"
      />
      {/* Repeat for title, company, description */}
    </div>
  ))}

  {/* Add New Job Button */}
  <button
    onClick={() => {
      const newJob = {
        id: generateId(),
        year: '',
        title: '',
        company: '',
        description: ''
      }
      setFormData({
        ...formData,
        professionalJourney: {
          ...formData.professionalJourney,
          [activeTab]: [...formData.professionalJourney[activeTab], newJob]
        }
      })
    }}
    className="w-full py-3 border-2 border-dashed border-slate-300 rounded-lg text-slate-600 hover:border-primary-500 hover:text-primary-600"
  >
    + Add New Position
  </button>
</div>
```

**Import generateId:**
```tsx
import { generateId } from '@/lib/contentManager'
```

**Repeat this pattern for:**
- Education items
- Current Focus items
- Training items
- Competencies items

#### 2.3 Add Textarea for Long Text

For description fields, use `<textarea>` instead of `<input>`:

```tsx
<textarea
  value={job.description}
  onChange={(e) => {
    // ... update logic
  }}
  rows={3}
  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
/>
```

---

### Task 3: Add Photo Upload Functionality

**Priority:** MEDIUM (Important but not blocking)

**Goal:** Allow admin to upload profile photo for Hero section.

**Implementation:**

#### 3.1 Add Photo Upload UI to Hero Section

**File:** `app/admin/content/about/page.tsx`

**Add after Hero intro field (around line 326):**

```tsx
<div>
  <label className="text-xs font-medium text-slate-500 uppercase block mb-1">
    Profile Photo
  </label>

  {/* Current Photo Preview */}
  {formData.hero[activeTab].photo && (
    <div className="mb-3">
      <img
        src={formData.hero[activeTab].photo}
        alt="Profile"
        className="w-32 h-32 rounded-full object-cover border-4 border-primary-100"
      />
    </div>
  )}

  {/* Upload Button */}
  <input
    type="file"
    accept="image/*"
    onChange={async (e) => {
      const file = e.target.files?.[0]
      if (!file) return

      try {
        const formData = new FormData()
        formData.append('photo', file)

        const response = await fetch('/api/admin/content/about/upload-photo', {
          method: 'POST',
          body: formData
        })

        if (!response.ok) throw new Error('Upload failed')

        const result = await response.json()

        // Update both EN and VI with same photo URL
        setFormData({
          ...formData,
          hero: {
            en: { ...formData.hero.en, photo: result.photoUrl },
            vi: { ...formData.hero.vi, photo: result.photoUrl }
          }
        })

        alert('✅ Photo uploaded successfully!')
      } catch (err) {
        alert('❌ Photo upload failed')
      }
    }}
    className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
  />
</div>
```

#### 3.2 Create Photo Upload API Endpoint

**File:** `app/api/admin/content/about/upload-photo/route.ts` (NEW FILE)

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { put } from '@vercel/blob'

export async function POST(req: NextRequest) {
  const session = await auth()

  if (!session?.user || (session.user as any).role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const formData = await req.formData()
    const file = formData.get('photo') as File

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg']
    if (!validTypes.includes(file.type)) {
      return NextResponse.json({ error: 'Invalid file type' }, { status: 400 })
    }

    // Upload to Vercel Blob
    const blob = await put(`profile/${Date.now()}-${file.name}`, file, {
      access: 'public',
    })

    return NextResponse.json({
      success: true,
      photoUrl: blob.url,
    })
  } catch (error) {
    console.error('[Photo Upload] Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Upload failed' },
      { status: 500 }
    )
  }
}
```

---

### Task 4: Improve UI/UX

**Priority:** MEDIUM

#### 4.1 Add Unsaved Changes Warning

```tsx
const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)

useEffect(() => {
  const handleBeforeUnload = (e: BeforeUnloadEvent) => {
    if (hasUnsavedChanges) {
      e.preventDefault()
      e.returnValue = ''
    }
  }

  window.addEventListener('beforeunload', handleBeforeUnload)
  return () => window.removeEventListener('beforeunload', handleBeforeUnload)
}, [hasUnsavedChanges])

// Set hasUnsavedChanges = true whenever formData changes
// Set hasUnsavedChanges = false after successful save
```

#### 4.2 Add Validation Before Save

```tsx
async function handleSave() {
  // Validate required fields
  if (!formData.hero.en.name || !formData.hero.en.role || !formData.hero.en.intro) {
    alert('❌ Please fill in all required English fields (Name, Role, Intro)')
    return
  }

  if (!formData.hero.vi.name || !formData.hero.vi.role || !formData.hero.vi.intro) {
    alert('❌ Please fill in all required Vietnamese fields (Name, Role, Intro)')
    return
  }

  // Proceed with save
  setSaving(true)
  // ... existing save logic
}
```

#### 4.3 Add Success/Error Toast Notifications

Instead of `alert()`, use a proper toast library:

```bash
npm install sonner
```

```tsx
import { toast } from 'sonner'

// Replace alert() with:
toast.success('✅ CV uploaded successfully!')
toast.error('❌ Upload failed')
```

---

### Task 5: Update Public About Page to Use Database

**Priority:** HIGH (Phase 3)

**Goal:** Make `/about` page dynamic instead of hard-coded.

**Current State:**
- `/app/about/page.tsx` uses hard-coded content
- Backup saved at `/app/about/page.tsx.backup`

**Implementation:**

#### 5.1 Convert to Client Component with Data Fetching

**File:** `app/about/page.tsx`

**Replace with:**

```tsx
'use client'

import { useEffect, useState } from 'react'
import { useLanguage } from '@/contexts/LanguageContext'
import type { AboutContent } from '@/lib/contentManager'
import { Loader2 } from 'lucide-react'

export default function AboutPage() {
  const { language } = useLanguage()
  const [aboutData, setAboutData] = useState<AboutContent | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchAboutData()
  }, [])

  async function fetchAboutData() {
    try {
      const res = await fetch('/api/admin/content/about')
      if (!res.ok) throw new Error('Failed to load content')

      const data = await res.json()
      setAboutData(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    )
  }

  if (error || !aboutData) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <p className="text-red-600">Failed to load About content</p>
      </div>
    )
  }

  const lang = language === 'en' ? 'en' : 'vi'

  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      {/* Hero Section */}
      <HeroSection data={aboutData.hero[lang]} />

      {/* Professional Journey */}
      <ProfessionalJourneySection data={aboutData.professionalJourney[lang]} />

      {/* Education & Expertise */}
      <EducationExpertiseSection
        education={aboutData.educationExpertise.education[lang]}
        currentFocus={aboutData.educationExpertise.currentFocus[lang]}
      />

      {/* Training & Development */}
      <TrainingSection data={aboutData.training[lang]} />

      {/* Core Competencies */}
      <CompetenciesSection data={aboutData.competencies[lang]} />

      {/* Interests */}
      <InterestsSection data={aboutData.interests[lang]} />
    </div>
  )
}

// Extract current hard-coded components into separate components
function HeroSection({ data }: { data: AboutContent['hero']['en'] }) {
  return (
    <div className="flex flex-col items-center text-center mb-16">
      {data.photo && (
        <img
          src={data.photo}
          alt={data.name}
          className="w-48 h-48 rounded-full mb-6 object-cover border-4 border-primary-100"
        />
      )}
      <h1 className="text-4xl font-bold text-slate-900 mb-2">{data.name}</h1>
      <p className="text-xl text-primary-600 font-medium mb-4">{data.role}</p>
      <p className="text-lg text-slate-600 max-w-2xl">{data.intro}</p>
    </div>
  )
}

// ... Create other section components
```

#### 5.2 Copy Hard-Coded Component Styles

**IMPORTANT:** Reference the backup file `app/about/page.tsx.backup` to preserve the beautiful design:

- Timeline dots and connecting lines (Professional Journey)
- 2-column grid layout (Education & Current Focus)
- Card grid (Training)
- Checkmark icons (Competencies)
- Spacing and typography

**Example for Professional Journey (with timeline):**

```tsx
function ProfessionalJourneySection({
  data
}: {
  data: AboutContent['professionalJourney']['en']
}) {
  return (
    <section className="mb-16">
      <h2 className="text-3xl font-bold text-slate-900 mb-8">Professional Journey</h2>

      <div className="relative">
        {/* Timeline line */}
        <div className="absolute left-[7px] top-0 bottom-0 w-0.5 bg-slate-200" />

        <div className="space-y-8">
          {data.map((job) => (
            <div key={job.id} className="relative pl-8">
              {/* Timeline dot */}
              <div className="absolute left-0 top-1 w-4 h-4 rounded-full bg-primary-600 border-4 border-white" />

              <div>
                <p className="text-sm font-medium text-primary-600 mb-1">{job.year}</p>
                <h3 className="text-xl font-semibold text-slate-900">{job.title}</h3>
                <p className="text-slate-600 font-medium mb-2">{job.company}</p>
                <p className="text-slate-700">{job.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
```

---

## 🔧 Technical Notes

### Database Connection Issues

**Problem:** Old Upstash database URL (`glowing-giraffe-26623`) sometimes cached

**Solution:**
1. Kill all dev servers
2. Run `rm -rf .next` to clear build cache
3. Restart dev server
4. Verify `.env.local` has correct URL: `large-heron-11467.upstash.io`

### PDF Extraction Library

**CRITICAL:** Must use `unpdf` library, NOT `pdf-parse`

**Why:**
- `pdf-parse` doesn't work with Next.js (causes 500 errors)
- Documents feature already uses `unpdf` successfully
- Reference: `lib/documentProcessor.ts`

**Correct usage:**
```typescript
import { extractText } from 'unpdf'

const uint8Array = new Uint8Array(buffer)
const { text } = await extractText(uint8Array, { mergePages: true })
```

### Data Structure

All About content stored in Upstash Redis under key: `content:about`

**5 Main Sections:**
1. Hero (name, role, intro, photo)
2. Professional Journey (timeline)
3. Education & Expertise (education + current focus)
4. Training & Development
5. Core Competencies
6. Interests (bio + hobbies)

**Bilingual:** All sections have EN and VI versions with synced IDs

---

## 📂 Important Files to Review

### Core Implementation Files
1. `lib/cvParser.ts` - CV parsing logic
2. `app/api/admin/content/about/upload-cv/route.ts` - Upload endpoint
3. `app/admin/content/about/page.tsx` - Admin UI
4. `lib/contentManager.ts` - Data structure definitions

### Reference Files
1. `app/about/page.tsx.backup` - Original hard-coded design (PRESERVE THIS!)
2. `lib/documentProcessor.ts` - Reference for unpdf usage
3. `app/api/admin/documents/upload/route.ts` - Reference for file upload

### Documentation
1. `docs/ABOUT_PAGE_IMPLEMENTATION_GUIDE.md` - Full architecture guide
2. `docs/UPSTASH_DATABASE_MIGRATION_2024-11-15.md` - Database migration notes

---

## 🚀 Development Workflow

### Starting Development

```bash
# 1. Ensure correct database URL in .env.local
cat .env.local | grep UPSTASH_REDIS_REST_URL

# 2. Clear build cache
rm -rf .next

# 3. Start dev server
npm run dev

# 4. Navigate to admin panel
open http://localhost:3000/admin/content/about
```

### Testing Checklist

- [ ] ChatBot icon shows Robot Rùa image
- [ ] Can edit all Hero fields (name, role, intro)
- [ ] Can edit Professional Journey items
- [ ] Can add/delete Professional Journey items
- [ ] Can edit Education items
- [ ] Can add/delete Education items
- [ ] Can edit Training items
- [ ] Can add/delete Training items
- [ ] Can edit Competencies
- [ ] Can add/delete Competencies
- [ ] Can edit Interests (bio, hobbies)
- [ ] Can upload profile photo
- [ ] Photo displays correctly
- [ ] Save button works
- [ ] Data persists in Upstash Redis
- [ ] Public `/about` page displays database content
- [ ] Public `/about` page preserves beautiful design
- [ ] Language switching works (EN ↔ VI)

---

## ⚠️ Important Warnings

### DO NOT Deploy Yet!

- ⚠️ Do NOT commit to git
- ⚠️ Do NOT push to GitHub
- ⚠️ Do NOT deploy to production
- ⚠️ Test thoroughly on localhost first

### Database Safety

- Same database for local & production (Upstash: large-heron-11467)
- Changes made locally will affect production data
- Be careful when testing save operations
- Monitor 500K request/month limit

### Backup Preservation

- **NEVER delete** `app/about/page.tsx.backup`
- This is the reference for the beautiful design
- Copy component styles from here to dynamic version

---

## 📞 Questions?

If you need clarification:

1. **Check documentation:** `docs/ABOUT_PAGE_IMPLEMENTATION_GUIDE.md`
2. **Review existing code:** Reference Documents feature implementation
3. **Ask user:** Hung Dinh (hungreo2005@gmail.com)

---

## 🎯 Priority Order

1. **HIGHEST:** Replace ChatBot icon with Robot Rùa (user requested immediately)
2. **HIGH:** Make all fields editable (core Phase 2 feature)
3. **HIGH:** Add/Edit/Delete functionality for array items
4. **MEDIUM:** Photo upload functionality
5. **MEDIUM:** Improve UI/UX (toast, validation, unsaved warning)
6. **HIGH:** Update public About page to use database (Phase 3)

---

**Good luck! The foundation is solid. Just build on top of what's already working.** 🚀

**Last Updated:** November 16, 2025
**Created by:** Claude Code Desktop
**For:** Claude Code Web
