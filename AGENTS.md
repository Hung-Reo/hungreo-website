# Hungreo Portfolio

Personal portfolio + AI-powered knowledge platform for Hung Dinh.

## Project Overview

- **Type:** Portfolio website with AI chatbot, knowledge base, and admin CMS
- **Owner:** Hung Dinh - BA transitioning to AI Product Builder
- **Production:** https://hungreo.vercel.app
- **Status:** Live since November 2024

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS |
| Data Store | Vercel KV (Redis) |
| File Storage | Vercel Blob |
| Vector DB | Pinecone |
| AI | OpenAI GPT-4o-mini |
| Auth | NextAuth.js v5 |
| Analytics | Vercel Analytics |
| Deployment | Vercel |

## Key Directories

```
app/                  # Next.js pages and API routes
  admin/              # Admin dashboard (protected)
  api/                # API endpoints
  (public)/           # Public pages (about, projects, blog, etc.)
components/           # React components
  admin/              # Admin-specific components
  layout/             # Header, Footer, Navigation
  ui/                 # Reusable UI components
lib/                  # Utilities and helpers
  auth.ts             # NextAuth configuration
  kv.ts               # Vercel KV helpers
  pinecone.ts         # Vector search
contexts/             # React contexts
  LanguageContext.tsx # i18n (EN/VI)
docs/                 # Documentation
```

## Important Conventions

### Bilingual Support (EN/VI)
- All user-facing text uses `useLanguage()` hook from `LanguageContext`
- Translations defined in `contexts/LanguageContext.tsx`
- Pattern: `t('key.subkey')` returns translated string

### Admin Protection
- All `/admin/*` routes require authentication
- Use `auth()` from `lib/auth.ts` to check session
- Redirect to `/admin/login` if not authenticated

### Data Storage Pattern
- Content stored in Vercel KV with structured keys
- Example: `about:content`, `projects:list`, `blog:posts`
- Use `kv` from `lib/kv.ts` for all KV operations

### API Route Pattern
```typescript
// Protected admin API
export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user || (session.user as any).role !== 'admin') {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }
  // ... handler logic
}
```

### Privacy & GDPR
- **No tracking cookies** - GDPR compliant
- **No PII storage** - Only aggregate data
- Footer states: "GDPR Compliant | No Tracking"
- Any analytics must be privacy-friendly (no IP, no user IDs)

## Commands

```bash
npm run dev      # Start dev server (localhost:3000)
npm run build    # Build for production
npm run lint     # Run ESLint
npm run start    # Start production server
```

## Environment Setup

1. Copy `.env.example` to `.env.local`
2. Fill in required API keys (OpenAI, Pinecone, YouTube)
3. For full features, connect Vercel KV and Blob

See `.env.example` for detailed instructions.

## Do's and Don'ts

### Do
- Follow existing component patterns
- Use TypeScript strictly
- Support both EN and VI languages
- Keep admin routes protected
- Use Vercel KV for data persistence
- Test on localhost before deploying

### Don't
- Store PII or tracking data (GDPR)
- Commit `.env.local` or secrets
- Skip authentication checks on admin routes
- Use cookies for tracking
- Make breaking changes to public API routes

## Key Files Reference

| Purpose | File |
|---------|------|
| i18n translations | `contexts/LanguageContext.tsx` |
| Auth config | `lib/auth.ts` |
| KV operations | `lib/kv.ts` |
| Admin dashboard | `components/admin/AdminDashboard.tsx` |
| Footer | `components/layout/Footer.tsx` |
| Main layout | `app/layout.tsx` |
| API stats | `app/api/admin/stats/route.ts` |
