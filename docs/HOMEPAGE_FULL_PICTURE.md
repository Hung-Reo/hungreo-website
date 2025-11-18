# Homepage Full Picture - Current vs. Proposed Structure

**Date:** November 18, 2025
**Purpose:** Show complete homepage structure and data architecture decisions

---

## 📊 Current Homepage Architecture

### **Data Sources:**

```typescript
// 1. HARDCODED (in LanguageContext translations)
Hero Section, Core Values → Permanent foundational content

// 2. DATABASE (Vercel KV via contentManager)
Projects, Blog Posts, About, Contact → Dynamic, admin-editable content
```

### **Current Sections:**

| Section | Data Source | Can Edit? | Bilingual? |
|---------|-------------|-----------|------------|
| 1. Hero | Hardcoded (translations) | Code only | ✅ EN/VI |
| 2. Core Values | Hardcoded (translations) | Code only | ✅ EN/VI |
| 3. Featured Projects | Database (KV) | ✅ Admin UI | ✅ EN/VI |
| 4. Latest Posts | Database (KV) | ✅ Admin UI | ✅ EN/VI |

---

## 🎯 Proposed Homepage Architecture

### **New Structure:**

```
┌─────────────────────────────────────────┐
│  HERO SECTION                           │
│  - Name, Role, Tagline                  │
│  - CTA Buttons                          │
│  Source: Hardcoded translations         │
└─────────────────────────────────────────┘
            ↓
┌─────────────────────────────────────────┐
│  CORE VALUES ✏️ UPDATED                 │
│  ┌──────────┬─────────┬────────┐       │
│  │ Problem  │ Human + │ Build  │       │
│  │  First   │   AI ⭐ │ Public │       │
│  └──────────┴─────────┴────────┘       │
│  Change: "AI as a Tool" → "Human + AI"  │
│  Source: Hardcoded translations         │
└─────────────────────────────────────────┘
            ↓
┌─────────────────────────────────────────┐
│  WHERE IT ALL BEGAN ⭐ NEW!             │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │ ACT 1: THE DISCOVERY            │   │
│  │ White card, blue left border    │   │
│  │                                 │   │
│  │ "After one month deep-diving    │   │
│  │ into AI, I realized something   │   │
│  │ profound: AI wasn't just        │   │
│  │ another system... This was      │   │
│  │ Machine Intelligence..."        │   │
│  └─────────────────────────────────┘   │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │ ACT 2: THE QUESTION 🟡          │   │
│  │ Amber highlight background      │   │
│  │                                 │   │
│  │ "As AI's capabilities became    │   │
│  │ clearer, a question emerged:    │   │
│  │                                 │   │
│  │ 'What makes us MORE HUMAN       │   │
│  │ in the age of AI?'"             │   │
│  │                                 │   │
│  └─────────────────────────────────┘   │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │ ACT 3: THE ANSWER               │   │
│  │ White card, blue left border    │   │
│  │                                 │   │
│  │ "My answer came through the     │   │
│  │ 'Văn Hóa Gia Đình' project..."  │   │
│  │                                 │   │
│  │ ┌─────────────────────────┐     │   │
│  │ │  FAMILY VALUES VISUAL   │     │   │
│  │ │                         │     │   │
│  │ │  Sống Thật → Tình YT    │     │   │
│  │ │     ↓          ↓        │     │   │
│  │ │  Học Tập   ← Phục Vụ    │     │   │
│  │ │                         │     │   │
│  │ └─────────────────────────┘     │   │
│  │                                 │   │
│  │ "...using AI to help us         │   │
│  │ remember what makes us human."  │   │
│  └─────────────────────────────────┘   │
│                                         │
│  Source: Hardcoded translations         │
└─────────────────────────────────────────┘
            ↓
┌─────────────────────────────────────────┐
│  FEATURED PROJECTS                      │
│  ┌───────┬────────┬────────┐           │
│  │ Proj  │ Proj   │ Proj   │           │
│  │   1   │   2    │   3    │           │
│  └───────┴────────┴────────┘           │
│  Source: Database (Vercel KV)          │
│  Admin editable: ✅                     │
└─────────────────────────────────────────┘
            ↓
┌─────────────────────────────────────────┐
│  LATEST BLOG POSTS                      │
│  ┌───────┬────────┬────────┐           │
│  │ Post  │ Post   │ Post   │           │
│  │   1   │   2    │   3    │           │
│  └───────┴────────┴────────┘           │
│  Source: Database (Vercel KV)          │
│  Admin editable: ✅                     │
└─────────────────────────────────────────┘
```

---

## 🔧 Data Architecture Options

### **Option 1: HARDCODE in Translations** ⭐ **RECOMMENDED**

**How it works:**
```typescript
// contexts/LanguageContext.tsx
const translations = {
  en: {
    // Existing translations...
    'home.origin.title': 'Where It All Began',
    'home.origin.act1.text': 'After one month deep-diving into AI...',
    'home.origin.act2.question': 'What makes us MORE HUMAN in the age of AI?',
    'home.origin.act3.text': 'My answer came through...',
  },
  vi: {
    'home.origin.title': 'Nơi Mọi Thứ Bắt Đầu',
    'home.origin.act1.text': 'Sau một tháng đào sâu vào AI...',
    'home.origin.act2.question': 'Điều gì khiến chúng ta TRỞ NÊN HUMAN HƠN...',
    'home.origin.act3.text': 'Câu trả lời của tôi đến thông qua...',
  }
}
```

**Pros:**
- ✅ Simple, fast, no database overhead
- ✅ Content version-controlled with code (Git history)
- ✅ Same pattern as Hero & Core Values (consistency)
- ✅ No admin UI needed (this content rarely changes)
- ✅ Zero database queries = faster page load
- ✅ Perfect for foundational, permanent content

**Cons:**
- ❌ Need developer to change content (not admin-editable)
- ❌ Requires code deployment to update

**When to use:**
- Content is **foundational** and **rarely changes**
- Content is part of brand identity (like mission/vision)
- Content needs to be version-controlled

---

### **Option 2: Database (Create HomeContent Model)**

**How it works:**
```typescript
// lib/contentManager.ts
export interface HomeContent {
  id: 'homepage'
  version: string
  updatedAt: number

  originStory: {
    en: {
      title: string
      act1: string
      act2Question: string
      act3: string
    }
    vi: {
      title: string
      act1: string
      act2Question: string
      act3: string
    }
  }

  coreValues: {
    en: Array<{ title: string, description: string }>
    vi: Array<{ title: string, description: string }>
  }
}
```

**Pros:**
- ✅ Admin-editable via UI (no code deployment)
- ✅ Non-developers can update content
- ✅ Could add A/B testing later
- ✅ Could track content versions in DB

**Cons:**
- ❌ Requires building admin UI for homepage content
- ❌ Adds database queries (slower page load)
- ❌ More complex architecture
- ❌ Overkill for content that rarely changes
- ❌ Inconsistent with current Hero/Core Values pattern

**When to use:**
- Content changes **frequently** (weekly/monthly)
- Non-developers need to edit content
- A/B testing planned for homepage messaging

---

### **Option 3: Hybrid Approach**

**How it works:**
```typescript
// Hardcode structure, dynamic content for specific parts
// Example: Hardcode Acts 1-3 text, but make Family Values visual dynamic

// In translations (hardcoded):
'home.origin.act1': '...',
'home.origin.act2': '...',

// In database (dynamic):
- Family Values framework configuration
- Show/hide toggle for Origin Story section
- Maybe A/B test different "questions"
```

**Pros:**
- ✅ Balance between flexibility and simplicity
- ✅ Core content stable, some parts editable
- ✅ Could toggle section visibility without deployment

**Cons:**
- ❌ Split architecture (harder to understand)
- ❌ Still requires some DB queries
- ❌ Complexity might not be worth it

---

## 💡 **RECOMMENDATION: Option 1 (Hardcode)**

### **Why Hardcode is Best for This Use Case:**

1. **Philosophical content is foundational** - This is your origin story, your "why." It won't change weekly or monthly.

2. **Consistency with existing pattern** - Hero and Core Values are already hardcoded. Keep it consistent.

3. **Performance** - No database queries = faster page load for first-time visitors.

4. **Version control** - Git history tracks changes to your story over time.

5. **Simplicity** - No need to build admin UI for content that changes rarely.

### **When to Consider Database (Future):**

- ✅ If you start A/B testing different homepage messaging
- ✅ If you hire a marketing person who needs to update copy weekly
- ✅ If you want to show different stories to different audiences
- ✅ If you plan to create multiple "origin story" sections

### **Current Reality:**

Looking at your content:
- **Hero Section:** Hardcoded ✅
- **Core Values:** Hardcoded ✅
- **Origin Story:** Should be hardcoded ✅ (same category as above)
- **Projects:** Database ✅ (changes frequently, admin creates projects)
- **Blog Posts:** Database ✅ (changes frequently, admin writes posts)
- **Contact:** Database ✅ (contact methods may change)

---

## 🎨 Visual Mockup (Mobile View)

```
┌─────────────────────────────┐
│                             │
│    HUNG DINH               │
│    Product Manager         │
│    [View Projects] [About] │
│                             │
├─────────────────────────────┤
│  Problem-First Mindset      │
│  Understanding problem...   │
├─────────────────────────────┤
│  Human + AI ⭐              │
│  What makes us MORE...      │
├─────────────────────────────┤
│  Build in Public            │
│  Sharing failures...        │
├─────────────────────────────┤
│                             │
│  Where It All Began         │
│                             │
│  ┌─────────────────────┐   │
│  │ After one month...  │   │
│  │ AI exceeded my      │   │
│  │ imagination...      │   │
│  └─────────────────────┘   │
│                             │
│  ┌─────────────────────┐   │
│  │🟡 What makes us     │   │
│  │   MORE HUMAN?       │   │
│  └─────────────────────┘   │
│                             │
│  ┌─────────────────────┐   │
│  │ My answer came      │   │
│  │ through...          │   │
│  │                     │   │
│  │   [Family Values]   │   │
│  │    Visual Here      │   │
│  │                     │   │
│  │ ...remember what    │   │
│  │ makes us human      │   │
│  └─────────────────────┘   │
│                             │
├─────────────────────────────┤
│  Featured Projects          │
│  [Project Cards...]         │
├─────────────────────────────┤
│  Latest Posts               │
│  [Blog Cards...]            │
└─────────────────────────────┘
```

---

## 📝 Implementation Checklist

### **Phase 1: Update Core Values** (5 min)

- [ ] Update `contexts/LanguageContext.tsx`
- [ ] Change translation keys:
  - `home.values.title2`: "AI as a Tool" → "Human + AI"
  - `home.values.desc2`: Update description

### **Phase 2: Add Origin Story Translations** (10 min)

- [ ] Add new translation keys to `LanguageContext.tsx`:
  - `home.origin.title`
  - `home.origin.act1`
  - `home.origin.act2.intro`
  - `home.origin.act2.question`
  - `home.origin.act3.intro`
  - `home.origin.act3.closing`

### **Phase 3: Implement Origin Story Section** (20 min)

- [ ] Create section in `app/page.tsx`
- [ ] Position after Core Values, before Projects
- [ ] Style with Tailwind CSS (gradient bg, card layouts)
- [ ] Add Act 2 amber highlight styling

### **Phase 4: Create Family Values Visual Component** (15 min)

- [ ] Create `components/FamilyValuesDisplay.tsx`
- [ ] Implement bilingual 4-value framework visual
- [ ] Make it embeddable (no extra chrome when embedded)
- [ ] Test sizes: small, medium, large

### **Phase 5: Integration & Testing** (10 min)

- [ ] Embed FamilyValuesDisplay in Act 3
- [ ] Test responsive on mobile, tablet, desktop
- [ ] Test language switching (EN/VI)
- [ ] Verify reading flow

**Total Time:** ~60 minutes

---

## 🔍 Current Database Capabilities

From `lib/contentManager.ts`:

```typescript
// EXISTING Models in Database (Vercel KV):

1. AboutContent
   - Single document
   - Hero, Journey, Education, Training, Competencies, Interests
   - Bilingual EN/VI
   - Editable via Admin UI

2. Projects
   - CRUD operations
   - Featured flag (shows on homepage)
   - Bilingual EN/VI
   - Tech stack, images, GitHub/demo URLs
   - Editable via Admin UI

3. BlogPosts
   - CRUD operations
   - Featured flag, categories, tags
   - Bilingual EN/VI
   - Auto-calculate read time
   - Editable via Admin UI

4. ContactMethods
   - CRUD operations
   - 8 predefined types
   - Reorderable, show/hide toggle
   - Bilingual EN/VI
   - Editable via Admin UI
```

**Pattern:**
- **Hardcoded:** Hero, Core Values, Footer links
- **Database:** About (single doc), Projects (collection), Blog (collection), Contact (collection)

**For Origin Story:**
- Matches Hero/Core Values pattern → Should be **hardcoded**
- It's foundational content, not dynamic content

---

## 🚀 Next Steps

1. **Decision:** Hardcode vs Database?
   - **My recommendation:** Hardcode (Option 1)
   - Matches existing pattern, simpler, faster

2. **Implement:**
   - [ ] Update Core Values translation ("Human + AI")
   - [ ] Add Origin Story translations
   - [ ] Create FamilyValuesDisplay component
   - [ ] Update app/page.tsx with new section
   - [ ] Test & deploy

3. **Future Considerations:**
   - If you later need admin-editable homepage content:
     - Create `HomeContent` model in contentManager
     - Build admin UI for homepage sections
     - Migrate from translations to database
     - Add A/B testing capability

---

## 📊 Final Structure Summary

```
HOMEPAGE = 5 SECTIONS

1. Hero (Hardcoded)
2. Core Values (Hardcoded) ← UPDATE "Human + AI"
3. Origin Story (Hardcoded) ← NEW!
4. Featured Projects (Database)
5. Latest Posts (Database)

Strategy: Foundational content hardcoded, dynamic content in DB
```

---

**Created:** November 18, 2025
**For:** Homepage Architecture Planning
**Status:** Awaiting decision on hardcode vs database ✅
