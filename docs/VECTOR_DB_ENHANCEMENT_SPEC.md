# Vector DB Management Enhancement Specification

**Version:** 1.0  
**Date:** 2025-01-27  
**Status:** Ready for Implementation  
**Prepared by:** Opus 4.5 (reviewed by Hưng)

---

## 1. EXECUTIVE SUMMARY

### Problem Statement
Current Vector DB management lacks:
1. **Visibility** - Cannot see which pages/documents have how many vectors
2. **Granular control** - Website scrape is all-or-nothing, no selective delete
3. **Progress feedback** - No progress indication during long processing operations
4. **Bulk operations** - Cannot select multiple documents to delete at once

### Solution Overview
Enhance existing admin UI to provide:
- Page-level visibility and control for website vectors
- Document-level selection with bulk delete (including Pinecone vectors)
- Real-time progress bar for all processing operations

---

## 2. SCOPE

### ✅ IN SCOPE
| Feature | Description |
|---------|-------------|
| Website page selection | Select specific pages to delete vectors / re-scrape |
| Document bulk selection | Checkbox to select multiple documents |
| Bulk delete with vectors | Delete selected documents AND their Pinecone vectors |
| Progress bar | Show processing progress (0-100%) for scrape and upload |
| Vector count display | Show vector count per page and per document |

### ❌ OUT OF SCOPE (Future Phases)
| Feature | Reason |
|---------|--------|
| Chunk-level selection | Too granular, not needed |
| Image/OCR support | Complex, costly - defer to Phase 3 |
| PPTX file support | Complex - defer to Phase 3 |
| Versioning/Rollback | Overkill for personal website |
| Preview diff before scrape | Nice-to-have, not critical |
| Incremental updates | Too complex for current phase |

---

## 3. FEATURE SPECIFICATIONS

### 3.1 Website Scraper Enhancement

#### Current Behavior
```
Admin clicks "Scrape Website" 
→ Deletes ALL website vectors 
→ Re-scrapes ALL 5 pages 
→ Shows success/fail message only
```

#### New Behavior
```
Admin opens Vector Manager
→ Sees list of pages with vector counts
→ Can select specific pages (checkbox)
→ Can "Delete Selected" or "Re-scrape Selected"
→ Progress bar shows during processing
→ Success message with updated counts
```

#### UI Mockup
```
┌────────────────────────────────────────────────────────────┐
│  📄 Website Pages in Vector DB                             │
│                                                            │
│  ☑️ Select All                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ ☐  /           (Home)      5 vectors    2h ago      │  │
│  │ ☐  /about      (About Me)  45 vectors   2h ago      │  │
│  │ ☐  /projects   (Projects)  30 vectors   2h ago      │  │
│  │ ☐  /blog       (Blog)      25 vectors   2h ago      │  │
│  │ ☐  /contact    (Contact)   20 vectors   2h ago      │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                            │
│  Selected: 2 pages (75 vectors)                            │
│                                                            │
│  [Delete Selected Vectors] [Re-scrape Selected Pages]      │
│                                                            │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ Processing: Re-scraping /about...                    │  │
│  │ ████████████░░░░░░░░░░░░░░░░░░░░  40%               │  │
│  └──────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────┘
```

#### Technical Requirements
1. **API: Get vectors grouped by page**
   - Endpoint: `GET /api/admin/vectors/by-page`
   - Response: `{ pages: [{ path: "/about", vectorCount: 45, lastScraped: timestamp }] }`

2. **API: Delete vectors by pages**
   - Endpoint: `DELETE /api/admin/vectors`
   - Body: `{ pages: ["/about", "/blog"] }`

3. **API: Scrape specific pages**
   - Endpoint: `POST /api/admin/scrape`
   - Body: `{ pages: ["/about", "/projects"] }`
   - Response: Stream progress updates (SSE or polling)

4. **Progress tracking**
   - Use Server-Sent Events (SSE) or polling
   - Report: `{ stage: "scraping", current: 2, total: 5, percent: 40, message: "Scraping /about..." }`

---

### 3.2 Documents Manager Enhancement

#### Current Behavior
```
Admin sees document list
→ Can only delete one document at a time
→ No visibility of pineconeIds
→ No progress during upload processing
```

#### New Behavior
```
Admin sees document list with checkboxes
→ Can select multiple documents
→ Sees vector count per document
→ "Delete Selected" removes docs AND Pinecone vectors
→ Progress bar during upload/processing
```

#### UI Mockup
```
┌────────────────────────────────────────────────────────────┐
│  📁 Documents (Approved)                                   │
│                                                            │
│  ☑️ Select All                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ ☐  resume.pdf         1.2MB   15 vectors   1d ago   │  │
│  │ ☐  cert_aws.pdf       0.8MB   10 vectors   2d ago   │  │
│  │ ☐  family_values.txt  0.1MB   18 vectors   3d ago   │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                            │
│  Selected: 2 documents (25 vectors)                        │
│                                                            │
│  [Delete Selected + Vectors]                               │
│                                                            │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ Uploading: Processing large_doc.pdf...               │  │
│  │ ████████████████████░░░░░░░░░░░░  65%               │  │
│  │ Creating embeddings (13/20 chunks)                   │  │
│  └──────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────┘
```

#### Technical Requirements
1. **Display vector count per document**
   - Use existing `pineconeIds.length` from Document interface
   - Show in document list row

2. **Checkbox selection state**
   - Track selected document IDs in component state
   - Show "Selected: X documents (Y vectors)" summary

3. **Bulk delete API**
   - Endpoint: `DELETE /api/admin/documents/bulk`
   - Body: `{ documentIds: ["doc_123", "doc_456"] }`
   - Logic: 
     1. Get pineconeIds from each document
     2. Delete vectors from Pinecone
     3. Delete documents from KV
     4. Return success/failure per document

4. **Progress tracking for upload**
   - Stages: "Extracting text" → "Creating chunks" → "Generating embeddings" → "Uploading to Pinecone"
   - Report progress per chunk: `{ stage: "embeddings", current: 13, total: 20, percent: 65 }`

---

### 3.3 Progress Bar Component

#### Requirements
- Reusable component for both Scraper and Documents
- Show: stage name, progress bar, percentage, current/total
- Smooth animation
- Handle errors gracefully

#### Props Interface
```typescript
interface ProgressBarProps {
  isVisible: boolean
  stage: string           // "Scraping /about...", "Creating embeddings..."
  current: number         // Current item (e.g., 13)
  total: number           // Total items (e.g., 20)
  percent: number         // 0-100
  error?: string          // Error message if failed
}
```

---

## 4. FILES TO MODIFY

### Backend
| File | Changes |
|------|---------|
| `lib/websiteScraper.ts` | Add `scrapeSelectedPages(paths: string[])` function |
| `lib/documentManager.ts` | Add `deleteDocumentsWithVectors(ids: string[])` function |
| `app/api/admin/vectors/route.ts` | Add page-based filtering and delete |
| `app/api/admin/vectors/by-page/route.ts` | NEW - Get vectors grouped by page |
| `app/api/admin/scrape/route.ts` | Accept `pages[]` param, add progress streaming |
| `app/api/admin/documents/bulk/route.ts` | NEW - Bulk delete endpoint |
| `app/api/admin/documents/upload/route.ts` | Add progress streaming |

### Frontend
| File | Changes |
|------|---------|
| `components/admin/VectorManager.tsx` | Add page selection UI, progress bar |
| `components/admin/DocumentsManager.tsx` | Add checkbox selection, bulk delete, progress bar |
| `components/ui/ProgressBar.tsx` | NEW - Reusable progress component |

---

## 5. IMPLEMENTATION ORDER

```
Phase 1: Foundation (Backend)
├── Step 1.1: Create ProgressBar component
├── Step 1.2: Add by-page vectors API
├── Step 1.3: Add page-based delete to vectors API
├── Step 1.4: Update scrape API with pages param + progress
└── Step 1.5: Create bulk documents delete API

Phase 2: Frontend Integration
├── Step 2.1: Update VectorManager with page selection + progress
└── Step 2.2: Update DocumentsManager with checkboxes + progress

Phase 3: Testing
├── Step 3.1: Test selective page scrape
├── Step 3.2: Test bulk document delete
└── Step 3.3: Verify Pinecone data integrity
```

---

## 6. SUCCESS CRITERIA

| Feature | Test Case | Expected Result |
|---------|-----------|-----------------|
| Page visibility | Open VectorManager | See 5 pages with vector counts |
| Page selection | Select /about + /blog | Shows "Selected: 2 pages (70 vectors)" |
| Delete page vectors | Click "Delete Selected" | Only selected pages' vectors removed |
| Re-scrape pages | Click "Re-scrape Selected" | Progress bar shows, only selected pages scraped |
| Document selection | Check 2 documents | Shows "Selected: 2 documents (25 vectors)" |
| Bulk delete | Click "Delete Selected + Vectors" | Documents AND Pinecone vectors removed |
| Progress bar | Upload 20MB PDF | Shows stages and percentage smoothly |

---

## 7. NOTES FOR IMPLEMENTATION

### Do's
- ✅ Use existing component patterns from codebase
- ✅ Follow existing API structure
- ✅ Add proper error handling with user-friendly messages
- ✅ Add confirmation dialogs before destructive actions
- ✅ Test with real Pinecone data

### Don'ts
- ❌ Don't implement chunk-level selection
- ❌ Don't add image/OCR processing
- ❌ Don't over-engineer progress tracking
- ❌ Don't change existing working functionality unnecessarily

### Progress Implementation Options
Choose ONE approach:
1. **Server-Sent Events (SSE)** - Real-time, recommended for long operations
2. **Polling** - Simpler, poll every 1-2 seconds
3. **Response streaming** - Use ReadableStream in API response

Recommend: **SSE** for scrape operations (can take 30-60s), **Polling** for document upload (usually faster).

---

## 8. REFERENCE FILES

Key files to understand before implementation:
```
lib/websiteScraper.ts      - Current scrape logic
lib/documentManager.ts     - Document CRUD operations
lib/pinecone.ts            - Pinecone client setup
components/admin/VectorManager.tsx    - Current vector UI
components/admin/DocumentsManager.tsx - Current document UI
app/api/admin/vectors/route.ts        - Current vector API
```

---

**END OF SPECIFICATION**

*Ready for Claude Code to begin implementation.*
