# PRD: Google Drive RAG Pipeline Integration

**Project**: hungreo-website AI Knowledge Base Optimization  
**Version**: 1.0  
**Date**: December 2, 2025  
**Author**: Hưng (with Claude Desktop consultation)  
**For**: Claude Code Implementation  

---

## 📋 TABLE OF CONTENTS

1. [Executive Summary](#1-executive-summary)
2. [Problem Statement](#2-problem-statement)
3. [Solution Overview](#3-solution-overview)
4. [Architecture Design](#4-architecture-design)
5. [Technical Specifications](#5-technical-specifications)
6. [Pinecone Data Strategy](#6-pinecone-data-strategy)
7. [Implementation Phases](#7-implementation-phases)
8. [Critical Notes & Constraints](#8-critical-notes--constraints)
9. [Success Criteria](#9-success-criteria)
10. [Appendix](#10-appendix)

---

## 1. EXECUTIVE SUMMARY

### 1.1 Project Goal
Optimize the AI chatbot knowledge base by centralizing all content sources into Google Drive, enabling automated daily sync to Pinecone vector database via n8n workflows.

### 1.2 Key Decision
**Selected Approach**: Option A - n8n + Docling + Daily Batch

**Rationale**:
- ✅ Aligns with "Simple, Safe, Effective" principle
- ✅ Leverages existing n8n knowledge
- ✅ Docling is free & handles PPTX + images with OCR
- ✅ Daily batch sufficient for use case (no real-time needed)
- ✅ Manual trigger available when immediate refresh required

### 1.3 Migration Strategy
**Additive Approach** - Add new Google Drive vectors WITHOUT deleting existing data. This ensures zero risk to current chatbot functionality.

---

## 2. PROBLEM STATEMENT

### 2.1 Current State Issues

| Issue | Description | Impact |
|-------|-------------|--------|
| **Scattered sources** | Data from website scraping, manual uploads, videos | Hard to maintain |
| **Manual process** | Each document requires manual upload to create vectors | Time-consuming, easy to forget |
| **Lack of visibility** | Cannot easily see which documents contribute vectors | Difficult to debug |
| **No change tracking** | No automatic detection when content updates | Vectors become stale |
| **File type limitations** | PDFs/PPTXs with images not fully extracted | Knowledge gaps |

### 2.2 Current Pinecone State
- Website scraping vectors: **Working** (all-or-nothing approach)
- Manual upload vectors: **Working** (but scattered)
- Vector dimension: **1536** (OpenAI text-embedding-3-small)
- Current index: **Stable, do not disrupt**

---

## 3. SOLUTION OVERVIEW

### 3.1 High-Level Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                      GOOGLE DRIVE                               │
│                 📁 /AI-Knowledge-Base/                          │
│    ┌──────────┐  ┌──────────┐  ┌──────────┐                    │
│    │ /blogs/  │  │/projects/│  │  /docs/  │                    │
│    │ (*.pdf)  │  │ (*.pptx) │  │ (*.pdf)  │                    │
│    └────┬─────┘  └────┬─────┘  └────┬─────┘                    │
└─────────┼─────────────┼─────────────┼──────────────────────────┘
          │             │             │
          └─────────────┼─────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────────┐
│                     N8N WORKFLOW                                │
│              (Docker on Render - existing)                      │
│                                                                 │
│  Triggers:                                                      │
│  ├── 🕐 Daily Schedule (6:00 AM)                                │
│  ├── 🔘 Manual Webhook (from website admin)                     │
│  └── 📁 File Change Detection (optional future)                 │
│                                                                 │
│  Pipeline:                                                      │
│  [Download] → [Docling Process] → [Chunk] → [Embed] → [Upsert] │
└─────────────────────────────────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────────┐
│                      DOCLING                                    │
│              (Docker on Render - new)                           │
│                                                                 │
│  Capabilities:                                                  │
│  ├── PDF parsing with layout preservation                       │
│  ├── PPTX slide extraction                                      │
│  ├── OCR for images/scanned content                             │
│  ├── Table structure recognition                                │
│  └── Export to Markdown/JSON                                    │
└─────────────────────────────────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────────┐
│                      PINECONE                                   │
│                (Existing - add new vectors)                     │
│                                                                 │
│  Existing vectors: PRESERVED                                    │
│  New vectors: ADDED with gdrive# prefix                         │
└─────────────────────────────────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────────┐
│                   HUNGREO WEBSITE                               │
│              (Existing chatbot - enhanced)                      │
│                                                                 │
│  Queries both old and new vectors seamlessly                    │
└─────────────────────────────────────────────────────────────────┘
```

### 3.2 Component Summary

| Component | Status | Action |
|-----------|--------|--------|
| Google Drive | New | Setup folder structure |
| n8n | Existing | Add new workflow |
| Docling | New | Deploy on Render |
| Pinecone | Existing | Add vectors (no changes to existing) |
| Website | Existing | Optional: Add admin refresh button |

---

## 4. ARCHITECTURE DESIGN

### 4.1 Google Drive Folder Structure

```
📁 AI-Knowledge-Base/
│
├── 📁 blogs/
│   ├── BA-to-PM-journey.pdf
│   ├── Problem-Solving-First.pdf
│   ├── AI-Mistakes-Learned.pdf
│   └── Running-Leadership.pdf
│
├── 📁 projects/
│   ├── K12-Chatbot-Presentation.pptx
│   ├── Lesson-Plan-Generator.pdf
│   ├── Personal-Assistant-Bot.pptx
│   └── Real-Estate-Search-Bot.pdf
│
└── 📁 docs/
    ├── Van-Hoa-Gia-Dinh.pdf
    ├── Technical-Notes.pdf
    └── Reference-Materials.pdf
```

### 4.2 n8n Workflow Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    N8N RAG INGESTION WORKFLOW                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────┐                                                │
│  │  TRIGGERS   │                                                │
│  ├─────────────┤                                                │
│  │ • Schedule  │──► Cron: 0 6 * * * (Daily 6AM)                │
│  │ • Webhook   │──► POST /webhook/refresh-vectors               │
│  └──────┬──────┘                                                │
│         │                                                       │
│         ▼                                                       │
│  ┌─────────────┐                                                │
│  │ LIST FILES  │                                                │
│  │ (G-Drive)   │──► List all files in /AI-Knowledge-Base/       │
│  └──────┬──────┘    Include subfolders                          │
│         │                                                       │
│         ▼                                                       │
│  ┌─────────────┐                                                │
│  │   FILTER    │                                                │
│  │  CHANGED    │──► Compare file hash/modified date             │
│  └──────┬──────┘    Skip unchanged files                        │
│         │                                                       │
│         ▼                                                       │
│  ┌─────────────┐                                                │
│  │  DOWNLOAD   │                                                │
│  │   FILES     │──► Download changed files to temp storage      │
│  └──────┬──────┘                                                │
│         │                                                       │
│         ▼                                                       │
│  ┌─────────────┐                                                │
│  │   DOCLING   │                                                │
│  │   PROCESS   │──► HTTP POST to Docling /v1/convert            │
│  └──────┬──────┘    Returns: Markdown + extracted images        │
│         │                                                       │
│         ▼                                                       │
│  ┌─────────────┐                                                │
│  │   CHUNK     │                                                │
│  │   TEXT      │──► Recursive Character Splitter                │
│  └──────┬──────┘    chunk_size: 1000, overlap: 200              │
│         │                                                       │
│         ▼                                                       │
│  ┌─────────────┐                                                │
│  │  GENERATE   │                                                │
│  │ EMBEDDINGS  │──► OpenAI text-embedding-3-small               │
│  └──────┬──────┘    Dimension: 1536                             │
│         │                                                       │
│         ▼                                                       │
│  ┌─────────────┐                                                │
│  │DELETE OLD   │                                                │
│  │  VECTORS    │──► Delete by ID prefix: gdrive#{folder}#{id}#  │
│  └──────┬──────┘    Only for files being updated                │
│         │                                                       │
│         ▼                                                       │
│  ┌─────────────┐                                                │
│  │  UPSERT     │                                                │
│  │  PINECONE   │──► Insert new vectors with metadata            │
│  └──────┬──────┘                                                │
│         │                                                       │
│         ▼                                                       │
│  ┌─────────────┐                                                │
│  │   LOG &     │                                                │
│  │  NOTIFY     │──► Log results, optional Telegram notification │
│  └─────────────┘                                                │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 4.3 Website Integration (Optional)

```
┌─────────────────────────────────────────────────────────────────┐
│                    WEBSITE ADMIN PAGE                           │
│                  /admin/knowledge-base                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │  📊 Knowledge Base Status                                  │ │
│  │                                                            │ │
│  │  Last Sync: 2024-12-02 06:00:00                           │ │
│  │  Total Vectors: 1,247                                      │ │
│  │  - Website: 523                                            │ │
│  │  - Google Drive: 724                                       │ │
│  │    - blogs: 312                                            │ │
│  │    - projects: 287                                         │ │
│  │    - docs: 125                                             │ │
│  │                                                            │ │
│  │  [🔄 Refresh Now]  [📋 View Logs]                         │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘

// API call when button clicked:
POST https://your-n8n.onrender.com/webhook/refresh-vectors
Headers: { "Authorization": "Bearer {secret}" }
```

---

## 5. TECHNICAL SPECIFICATIONS

### 5.1 Docling Configuration

**Deployment**: Docker on Render (Free tier or $7/month Starter)

**Docker Image**: `ghcr.io/docling-project/docling:latest`

**API Endpoint**: `POST /v1/convert`

**Request Format**:
```json
{
  "source": {
    "type": "url",
    "url": "https://drive.google.com/uc?id={file_id}"
  },
  "options": {
    "ocr": true,
    "table_structure": true,
    "output_format": "markdown"
  }
}
```

**Response Format**:
```json
{
  "content": "# Document Title\n\nExtracted markdown content...",
  "metadata": {
    "pages": 5,
    "tables": 2,
    "images": 3
  }
}
```

**Supported File Types**:
- PDF (text + scanned with OCR)
- PPTX (slides + speaker notes)
- DOCX
- Images (PNG, JPEG, TIFF)

### 5.2 Chunking Strategy

```javascript
// Chunking configuration
const splitter = new RecursiveCharacterTextSplitter({
  chunkSize: 1000,      // Characters per chunk
  chunkOverlap: 200,    // Overlap between chunks
  separators: [
    "\n\n",             // Paragraph breaks (highest priority)
    "\n",               // Line breaks
    ". ",               // Sentences
    " ",                // Words
    ""                  // Characters (last resort)
  ]
});
```

**Rationale**:
- 1000 chars ≈ 250 tokens (fits well with embedding model)
- 200 char overlap preserves context across chunks
- Semantic separators maintain meaning

### 5.3 Embedding Configuration

```javascript
// OpenAI Embedding
const embedding = await openai.embeddings.create({
  model: "text-embedding-3-small",
  input: chunkText,
  encoding_format: "float",
  dimensions: 1536  // Must match existing Pinecone index
});
```

**Important**: Dimension MUST be 1536 to match existing Pinecone index.

### 5.4 n8n Webhook Endpoints

| Endpoint | Method | Purpose | Auth |
|----------|--------|---------|------|
| `/webhook/refresh-vectors` | POST | Manual trigger full refresh | Bearer token |
| `/webhook/refresh-single` | POST | Refresh single file by ID | Bearer token |
| `/webhook/status` | GET | Get sync status | Bearer token |

---

## 6. PINECONE DATA STRATEGY

### 6.1 Why NOT Use Namespaces

**Decision**: Use single namespace with metadata filtering

**Rationale**: 
> "Namespaces chỉ query được 1 namespace mỗi lần. Chatbot cần query TOÀN BỘ knowledge (website + blogs + projects + docs) để trả lời tốt nhất."

If we used separate namespaces:
- ❌ Cannot search across all sources in one query
- ❌ More complex query logic needed
- ❌ Chatbot quality would decrease

With metadata filtering:
- ✅ Single query searches all sources
- ✅ Can filter by source_type if needed
- ✅ Flexible future expansion

### 6.2 Vector ID Pattern

**Pattern**: `{source}#{folder}#{file_id}#chunk{n}`

**Examples**:
```
# Existing vectors (DO NOT CHANGE)
web#homepage#chunk1
web#homepage#chunk2
web#about#chunk1
doc#manual-upload-123#chunk1

# New Google Drive vectors (ADD)
gdrive#blogs#1abc2def3ghi#chunk1
gdrive#blogs#1abc2def3ghi#chunk2
gdrive#projects#4xyz5uvw6rst#chunk1
gdrive#docs#7mno8pqr9stu#chunk1
```

**Benefits of ID Prefixing**:
1. Easy to list all chunks of a document: `list(prefix='gdrive#blog#1abc2def3ghi#')`
2. Easy to delete a document: delete all IDs with that prefix
3. Easy to identify source type from ID
4. No conflicts between old and new vectors

### 6.3 Metadata Schema

```json
{
  "id": "gdrive#blogs#1abc2def3ghi#chunk3",
  "values": [0.123, 0.456, ...],  // 1536 dimensions
  "metadata": {
    // Required fields
    "source_type": "gdrive_blogs",     // gdrive_blogs | gdrive_projects | gdrive_docs
    "gdrive_id": "1abc2def3ghi",       // Google Drive file ID
    "file_name": "BA-to-PM-journey.pdf",
    "folder": "blogs",                 // blogs | projects | docs
    "vectorType": "gdrive",            // For consistency with existing vectors
    
    // Tracking fields
    "last_modified": "2024-12-01T10:30:00Z",
    "content_hash": "sha256:abc123...",  // For change detection
    "chunk_index": 3,
    "total_chunks": 15,
    
    // Content fields
    "text": "The actual chunk text content...",  // For display in citations
    "page_number": 2,                   // If available from Docling
    
    // Optional fields
    "title": "BA to PM Journey",        // Extracted document title
    "author": "Hung",                   // If available
    "created_at": "2024-11-15T08:00:00Z"
  }
}
```

### 6.4 Data Coexistence Strategy

```
┌─────────────────────────────────────────────────────────────────┐
│                     PINECONE INDEX                              │
│                   (Single namespace)                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ╔═══════════════════════════════════════════════════════════╗ │
│  ║  EXISTING DATA - DO NOT MODIFY                            ║ │
│  ║                                                           ║ │
│  ║  ID Pattern: web#* or doc#*                               ║ │
│  ║  Source: Website scraping + Manual uploads                ║ │
│  ║  Status: PRESERVED                                        ║ │
│  ╚═══════════════════════════════════════════════════════════╝ │
│                                                                 │
│  ╔═══════════════════════════════════════════════════════════╗ │
│  ║  NEW DATA - GOOGLE DRIVE PIPELINE                         ║ │
│  ║                                                           ║ │
│  ║  ID Pattern: gdrive#*                                     ║ │
│  ║  Source: Automated from Google Drive                      ║ │
│  ║  Status: ADDITIVE (no conflicts)                          ║ │
│  ╚═══════════════════════════════════════════════════════════╝ │
│                                                                 │
│  Query behavior:                                                │
│  - Default: Search ALL vectors (old + new)                      │
│  - Optional: Filter by source_type metadata                     │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 6.5 Update Logic for Changed Files

```python
# Pseudocode for handling file updates

def process_file(gdrive_file):
    file_id = gdrive_file.id
    new_hash = calculate_hash(gdrive_file.content)
    
    # Check if file was previously processed
    existing_vectors = pinecone.list(prefix=f"gdrive#{folder}#{file_id}#")
    
    if existing_vectors:
        old_hash = get_stored_hash(file_id)
        
        if new_hash == old_hash:
            # File unchanged, skip
            return "SKIPPED"
        else:
            # File changed, delete old vectors first
            pinecone.delete(ids=existing_vectors)
    
    # Process and insert new vectors
    chunks = process_with_docling(gdrive_file)
    vectors = generate_embeddings(chunks)
    pinecone.upsert(vectors)
    
    return "UPDATED" if existing_vectors else "NEW"
```

### 6.6 Duplicate Content Handling

**Scenario**: Same blog post exists on website AND in Google Drive

**Phase 1 (Current)**: Allow both to coexist
- Website vector: `web#blog-post-1#chunk1`
- GDrive vector: `gdrive#blog#abc123#chunk1`
- Chatbot gets context from both (not harmful, may be slightly redundant)

**Phase 2 (Future - Optional)**: Cleanup after stable
- Once GDrive pipeline proven stable
- Delete website scraping vectors: `pinecone.delete(prefix='web#')`
- Keep only GDrive-sourced vectors
- More centralized, easier to maintain

---

## 7. IMPLEMENTATION PHASES

### Phase A: Foundation (Week 1)

#### A.1 Setup Google Drive Structure
```
Duration: 2-3 hours
Owner: Hưng (manual)

Tasks:
□ Create folder: /AI-Knowledge-Base/
□ Create subfolders: /blogs/, /projects/, /docs/
□ Move/upload existing content to appropriate folders
□ Organize files with clear naming convention
```

#### A.2 Deploy Docling on Render
```
Duration: 4-6 hours
Owner: Claude Code

Tasks:
□ Create new Render service
□ Configure Docker deployment
  - Image: ghcr.io/docling-project/docling:latest
  - Environment variables
  - Health check endpoint
□ Test /v1/convert endpoint with sample PDF
□ Test with PPTX file
□ Test with image-heavy document
□ Document Render URL for n8n
```

#### A.3 Basic n8n Workflow
```
Duration: 1 day
Owner: Claude Code

Tasks:
□ Create new workflow: "RAG-GDrive-Ingestion"
□ Add manual trigger (for testing)
□ Add Google Drive node - list files from one folder
□ Add HTTP Request node - call Docling
□ Add Function node - chunk text
□ Add OpenAI node - generate embeddings
□ Add Pinecone node - upsert vectors
□ Test with 1-2 sample files
□ Verify vectors in Pinecone console
```

### Phase B: Full Pipeline (Week 2)

#### B.1 Add All Triggers
```
Duration: 3-4 hours
Owner: Claude Code

Tasks:
□ Add Schedule trigger (Daily 6AM)
□ Add Webhook trigger for manual refresh
□ Configure webhook authentication
□ Test both triggers
```

#### B.2 Change Detection Logic
```
Duration: 4-6 hours
Owner: Claude Code

Tasks:
□ Add n8n Static Data Store for tracking processed files
  - Structure: { file_id: { hash, lastProcessed, fileName, folder, chunkCount } }
  - No external storage needed (simple & safe)
□ Add comparison logic
  - Calculate SHA-256 hash of file content
  - Compare with stored hash
  - Skip if unchanged
□ Add delete-before-insert logic for changed files
  - Delete old vectors by ID prefix
  - Insert new vectors
□ Test with file modification scenario
```

#### B.3 Multi-folder Processing
```
Duration: 4-6 hours
Owner: Claude Code

Tasks:
□ Loop through all subfolders: blogs, projects, docs
□ Add folder metadata to vectors
□ Handle different file types appropriately
  - PDF → Docling with OCR
  - PPTX → Docling slide extraction
  - TXT → Direct chunking
□ Test complete pipeline with all folders
```

#### B.4 Error Handling & Logging
```
Duration: 3-4 hours
Owner: Claude Code

Tasks:
□ Add try-catch around all external calls
□ Add error logging
□ Add success summary (files processed, vectors created)
□ Optional: Telegram notification on completion/error
```

### Phase C: Integration (Week 3)

#### C.1 Webhook API for Website
```
Duration: 4-6 hours
Owner: Claude Code

Tasks:
□ Create webhook: POST /webhook/refresh-vectors
  - Accepts: { "folders": ["blogs", "projects", "docs"] } or empty for all
  - Returns: { "status": "started", "job_id": "xxx" }
□ Create webhook: GET /webhook/status/{job_id}
  - Returns: { "status": "completed", "files_processed": 5, "vectors_created": 120 }
□ Add authentication (Bearer token)
□ Document API for website integration
```

#### C.2 Website Admin UI
```
Duration: 1 day
Owner: Claude Code

Tasks:
□ Create API routes:
  - /api/admin/vectors/gdrive/stats (GET - fetch statistics)
  - /api/admin/vectors/gdrive/refresh (POST - trigger sync)
□ Create page: /admin/vectors/gdrive
□ Display last sync time
□ Display vector counts by folder (blogs/projects/docs)
□ Display indexed files table with details
□ Add "Sync Now" button (triggers n8n webhook)
□ Add auto-refresh stats button
□ Integrate with existing admin layout
```

#### C.3 End-to-End Testing
```
Duration: 4-6 hours
Owner: Hưng + Claude Code

Tasks:
□ Upload new file to Google Drive → verify auto-indexed
□ Modify existing file → verify updated in Pinecone
□ Ask chatbot questions about new content → verify answers
□ Test manual refresh from website (if implemented)
□ Monitor for 3 days for stability
```

### Phase D: Stabilization & Cleanup (Week 4+)

#### D.1 Monitoring & Optimization
```
Duration: Ongoing
Owner: Hưng

Tasks:
□ Monitor daily sync logs
□ Check Pinecone vector counts
□ Test chatbot quality with new content
□ Identify any OCR issues with specific documents
□ Fine-tune chunking if needed
```

#### D.2 Optional Cleanup (After 2+ weeks stable)
```
Duration: 2-3 hours
Owner: Claude Code

Tasks:
□ Backup current Pinecone data (export)
□ Identify duplicate content (web vs gdrive)
□ Delete old website scraping vectors (if desired)
□ Verify chatbot still works correctly
```

---

## 8. CRITICAL NOTES & CONSTRAINTS

### 8.1 🚨 DO NOT DO

```
╔═══════════════════════════════════════════════════════════════════╗
║                    CRITICAL - DO NOT DO                           ║
╠═══════════════════════════════════════════════════════════════════╣
║                                                                   ║
║  ❌ DO NOT delete existing Pinecone vectors                       ║
║     → Existing chatbot functionality depends on them              ║
║                                                                   ║
║  ❌ DO NOT change Pinecone index dimensions                       ║
║     → Must stay 1536 to match existing vectors                    ║
║                                                                   ║
║  ❌ DO NOT use different embedding model                          ║
║     → Must use text-embedding-3-small for consistency             ║
║                                                                   ║
║  ❌ DO NOT create new Pinecone namespace                          ║
║     → Keep all vectors in default namespace for cross-query       ║
║                                                                   ║
║  ❌ DO NOT use ID patterns that conflict with existing            ║
║     → web#* and doc#* are reserved for existing data              ║
║     → New data must use gdrive#* prefix                           ║
║                                                                   ║
╚═══════════════════════════════════════════════════════════════════╝
```

### 8.2 ⚠️ IMPORTANT CONSTRAINTS

```
┌─────────────────────────────────────────────────────────────────┐
│                    IMPORTANT CONSTRAINTS                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. Render Free Tier Limitations                                │
│     - Services sleep after 15 mins idle                         │
│     - First request after sleep takes 30-60 seconds             │
│     - Solution: Use $7/month Starter if critical                │
│                                                                 │
│  2. Docling Processing Time                                     │
│     - Large PDFs (50+ pages) may take 2-5 minutes               │
│     - PPTXs with many images take longer                        │
│     - Solution: Set appropriate n8n timeout (10+ mins)          │
│                                                                 │
│  3. OpenAI Rate Limits                                          │
│     - Embedding API: 3,000 RPM, 1,000,000 TPM                   │
│     - Solution: Add delay between batches if needed             │
│                                                                 │
│  4. Pinecone Free Tier                                          │
│     - 100K vectors max                                          │
│     - Monitor usage, upgrade if approaching limit               │
│                                                                 │
│  5. Google Drive API Quotas                                     │
│     - 10,000 queries per 100 seconds                            │
│     - Should not be an issue for daily batch                    │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 8.3 💡 BEST PRACTICES

```
┌─────────────────────────────────────────────────────────────────┐
│                      BEST PRACTICES                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. Always test with 1-2 files before full batch                │
│                                                                 │
│  2. Keep backup of Pinecone data before major changes           │
│     → Export via Pinecone console or API                        │
│                                                                 │
│  3. Use descriptive file names in Google Drive                  │
│     → "K12-Chatbot-AI-Project-Overview.pptx" not "doc1.pptx"    │
│                                                                 │
│  4. Monitor first week of daily syncs closely                   │
│     → Check logs, verify vector counts                          │
│                                                                 │
│  5. Document any manual interventions                           │
│     → Track in Google Sheets or Notes                           │
│                                                                 │
│  6. Rollback strategy if issues                                 │
│     → Delete all vectors with prefix gdrive#*                   │
│     → System returns to previous state                          │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 8.4 🔄 ROLLBACK PROCEDURE

If something goes wrong:

```python
# Emergency rollback - delete all Google Drive vectors
# This returns system to pre-migration state

import pinecone

# Connect to Pinecone
index = pinecone.Index("your-index-name")

# List and delete all gdrive vectors
for ids in index.list(prefix='gdrive#'):
    index.delete(ids=ids)

# Verify deletion
stats = index.describe_index_stats()
print(f"Remaining vectors: {stats.total_vector_count}")

# Existing web# and doc# vectors remain intact
# Chatbot continues working with original data
```

---

## 9. SUCCESS CRITERIA

### 9.1 Phase A Complete When:
- [ ] Google Drive folders created and organized
- [ ] Docling deployed and responding on Render
- [ ] Basic n8n workflow processes 1 file successfully
- [ ] Vector appears in Pinecone with correct metadata

### 9.2 Phase B Complete When:
- [ ] Daily schedule trigger works
- [ ] Manual webhook trigger works
- [ ] Changed files are detected and updated
- [ ] Unchanged files are skipped
- [ ] All three folders (blogs, projects, docs) processed

### 9.3 Phase C Complete When:
- [ ] Website can trigger refresh via API
- [ ] Chatbot answers questions using new GDrive content
- [ ] No degradation in chatbot quality for existing content
- [ ] System runs stable for 1 week

### 9.4 Overall Success Metrics

| Metric | Target | How to Measure |
|--------|--------|----------------|
| **Automation** | 100% hands-off daily sync | Check n8n execution logs |
| **Coverage** | All GDrive files indexed | Compare file count vs vector count |
| **Freshness** | <24 hour lag | Check last_modified metadata |
| **Quality** | Chatbot answers GDrive content | Manual testing |
| **Stability** | Zero failures in 1 week | Monitor n8n errors |
| **No regression** | Existing chatbot works | Test with old questions |

---

## 10. APPENDIX

### 10.1 Reference Links

**Docling**:
- GitHub: https://github.com/docling-project/docling
- Documentation: https://docling-project.github.io/docling/
- Docker Image: ghcr.io/docling-project/docling

**n8n**:
- Google Drive Trigger: https://docs.n8n.io/integrations/builtin/trigger-nodes/n8n-nodes-base.googledrivetrigger/
- Webhook Node: https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.webhook/
- RAG Templates: https://n8n.io/workflows/?q=rag+google+drive

**Pinecone**:
- Manage RAG Documents: https://docs.pinecone.io/guides/data/manage-rag-documents
- Metadata Filtering: https://docs.pinecone.io/guides/data/filter-with-metadata
- Namespaces vs Metadata: https://docs.pinecone.io/troubleshooting/namespaces-vs-metadata-filtering

### 10.2 Environment Variables

```bash
# n8n Workflow
GOOGLE_DRIVE_FOLDER_ID=your_folder_id
DOCLING_API_URL=https://your-docling.onrender.com
OPENAI_API_KEY=sk-xxx
PINECONE_API_KEY=xxx
PINECONE_INDEX_NAME=your-index
PINECONE_ENVIRONMENT=us-east-1

# Docling (on Render)
PORT=8080
WORKERS=2
```

### 10.3 Sample n8n Workflow JSON

```json
{
  "name": "RAG-GDrive-Ingestion",
  "nodes": [
    {
      "name": "Schedule Trigger",
      "type": "n8n-nodes-base.scheduleTrigger",
      "parameters": {
        "rule": {
          "interval": [{ "field": "cronExpression", "expression": "0 6 * * *" }]
        }
      }
    },
    {
      "name": "Manual Webhook",
      "type": "n8n-nodes-base.webhook",
      "parameters": {
        "path": "refresh-vectors",
        "httpMethod": "POST"
      }
    }
    // ... more nodes to be implemented by Claude Code
  ]
}
```

### 10.4 Glossary

| Term | Definition |
|------|------------|
| **RAG** | Retrieval-Augmented Generation - technique to enhance LLM with external knowledge |
| **Vector** | Numerical representation of text for semantic search |
| **Embedding** | The process of converting text to vectors |
| **Chunk** | A segment of text (typically 500-1000 chars) |
| **Pinecone** | Vector database service for storing/querying embeddings |
| **Docling** | IBM's open-source document parser with OCR capabilities |
| **n8n** | Open-source workflow automation tool |
| **Namespace** | Pinecone's way to partition data (not used in this project) |
| **Metadata** | Additional information attached to vectors for filtering |

---

## Document History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2024-12-02 | Hưng + Claude Desktop | Initial document |

---

**END OF DOCUMENT**
