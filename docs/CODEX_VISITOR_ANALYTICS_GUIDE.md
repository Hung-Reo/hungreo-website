# Codex Guide: Visitor Analytics Feature

## Overview

Implement a visitor analytics feature for the Hungreo Portfolio website:
- **Public Footer:** Display monthly unique visitor count
- **Admin Dashboard:** Show detailed visitor stats with click-to-view modal

## Requirements

### 1. Public Footer Display
- Location: After "All rights reserved." text
- Format: `• 150 accessed/Feb` (EN) | `• 150 lượt truy cập/Th2` (VI)
- Data: Unique visitors count for current month
- Update: Cached, refreshes periodically (not real-time)

### 2. Admin Dashboard
- Add new StatCard showing "Unique Visitors" with monthly count
- Clickable card opens modal with details:
  - Today/Week/Month visitor counts
  - Top 5 most viewed pages
  - Device breakdown (desktop/mobile)

### 3. Privacy (CRITICAL)
- **GDPR Compliant** - No PII storage
- **No IP addresses** stored
- **No cookies** for tracking
- **No user IDs** - only aggregate counts
- Use daily hash: `hash(date + userAgent + screenSize)` for uniqueness

## Files to Create

### 1. `lib/visitorTracker.ts`
Track and store visitor stats in Vercel KV.

```typescript
// Key structure in Vercel KV:
// visitors:2026-02 → { uniqueCount: 150, pageViews: 500 }
// visitors:2026-02:pages → { "/": 200, "/projects": 150, ... }
// visitors:2026-02:devices → { desktop: 100, mobile: 50 }
// visitors:2026-02:daily:01 → Set of daily visitor hashes

// Functions to implement:
export async function trackPageView(page: string, userAgent: string, screenWidth: number): Promise<void>
export async function getMonthlyStats(yearMonth: string): Promise<VisitorStats>
export async function getPublicVisitorCount(): Promise<{ count: number; month: string }>
```

### 2. `app/api/analytics/track/route.ts`
API endpoint to record page views (called from client).

```typescript
// POST /api/analytics/track
// Body: { page: string, userAgent: string, screenWidth: number }
// Response: { success: true }
```

### 3. `app/api/public/visitor-count/route.ts`
Public API for footer display.

```typescript
// GET /api/public/visitor-count
// Response: { count: 150, month: "Feb", monthVi: "Th2" }
// Cache: 1 hour
```

## Files to Modify

### 1. `app/api/admin/stats/route.ts`
Add visitor stats to existing stats endpoint.

```typescript
// Add to response:
stats: {
  // ... existing fields
  visitors: {
    today: number,
    thisWeek: number,
    thisMonth: number,
    topPages: Array<{ page: string, views: number }>,
    devices: { desktop: number, mobile: number }
  }
}
```

### 2. `components/admin/AdminDashboard.tsx`
Add new StatCard for visitors.

```tsx
// Add after existing StatCards (line ~196):
<StatCard
  title="Unique Visitors"
  value={stats.visitors?.thisMonth || 0}
  icon="👥"
  color="bg-teal-50 text-teal-600"
  subtitle="this month"
  onClick={() => setShowVisitorModal(true)}
/>
```

### 3. `components/layout/Footer.tsx`
Add visitor count display.

```tsx
// After copyright text (line ~18):
<p className="text-sm text-slate-600">
  {t('footer.copyright').replace('{year}', currentYear.toString())}
  <span className="ml-2 text-slate-400">•</span>
  <span className="ml-2 text-slate-400">
    {visitorCount} {lang === 'en' ? `accessed/${monthEN}` : `lượt truy cập/${monthVI}`}
  </span>
</p>
```

### 4. `contexts/LanguageContext.tsx`
Add month translations.

```typescript
// Add to translations:
'months.short.1': 'Jan',  // 'Th1' for VI
'months.short.2': 'Feb',  // 'Th2' for VI
// ... etc
```

## Files to Create (Additional)

### `components/admin/VisitorStatsModal.tsx`
Modal showing detailed visitor stats.

```tsx
// Props: { isOpen: boolean, onClose: () => void, stats: VisitorStats }
// Display:
// - Today/Week/Month counts
// - Top 5 pages table
// - Device breakdown (simple bar or text)
```

## Tracking Trigger

Add tracking call in `app/layout.tsx` or create a client component:

```tsx
// components/VisitorTracker.tsx (client component)
'use client'
import { useEffect } from 'react'
import { usePathname } from 'next/navigation'

export function VisitorTracker() {
  const pathname = usePathname()

  useEffect(() => {
    // Don't track admin pages
    if (pathname.startsWith('/admin')) return

    fetch('/api/analytics/track', {
      method: 'POST',
      body: JSON.stringify({
        page: pathname,
        userAgent: navigator.userAgent,
        screenWidth: window.innerWidth
      })
    }).catch(() => {}) // Silent fail
  }, [pathname])

  return null
}
```

## Data Schema (Vercel KV)

```
visitors:2026-02                    → { uniqueCount: 150, pageViews: 500 }
visitors:2026-02:pages              → { "/": 200, "/projects": 150, "/blog": 100 }
visitors:2026-02:devices            → { desktop: 100, mobile: 50 }
visitors:2026-02:daily:01           → Set<string> of visitor hashes for day 01
visitors:2026-02:daily:02           → Set<string> of visitor hashes for day 02
```

## Privacy-Safe Visitor Hash

```typescript
function generateVisitorHash(date: string, userAgent: string, screenWidth: number): string {
  const data = `${date}|${userAgent}|${screenWidth}`
  // Use simple hash - NOT cryptographic, just for uniqueness
  return hashString(data).substring(0, 16)
}

function hashString(str: string): string {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convert to 32bit integer
  }
  return Math.abs(hash).toString(16)
}
```

## Verification Steps

After implementation:
1. Visit website → check footer shows "X accessed/Feb"
2. Visit multiple pages → verify pageview count increases
3. Check same device doesn't increment unique count same day
4. Login admin → Statistics shows visitor StatCard
5. Click card → modal shows details
6. Check language switching works (EN/VI)
7. Verify Vercel KV only stores aggregate data (no PII)

## Important Notes

- Use existing `kv` from `lib/kv.ts` for all KV operations
- Follow existing component patterns in the codebase
- Support bilingual (EN/VI) for all user-facing text
- Cache public API response for performance
- Silent fail on tracking errors (don't break user experience)

## Reference Files

- `lib/kv.ts` - KV operations pattern
- `lib/chatLogger.ts` - Similar logging pattern
- `components/admin/AdminDashboard.tsx` - StatCard examples
- `contexts/LanguageContext.tsx` - Translation pattern
