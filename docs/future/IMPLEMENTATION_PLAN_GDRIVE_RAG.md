# Google Drive RAG Pipeline - Detailed Implementation Plan

**Project**: hungreo-website AI Knowledge Base Optimization
**Based on**: PRD-Google-Drive-RAG-Pipeline.md v1.0
**Date**: December 2, 2025
**Implementation by**: Claude Code

---

## 📊 CODEBASE ANALYSIS SUMMARY

### Current Infrastructure
- **Framework**: Next.js with App Router
- **Vector DB**: Pinecone (dimension: 1536, model: text-embedding-3-small)
- **Admin Panel**: `/admin/vectors` with stats dashboard
- **Existing Vector Types**:
  - Website (`vectorType: 'website'`)
  - Document (`vectorType: 'document'`)
  - Video (`vectorType: 'video'`)
- **n8n**: Docker localhost (test) + Render (production)

### Key Files Identified
- `/lib/pinecone.ts` - Pinecone client & utilities
- `/app/admin/vectors/page.tsx` - Vector management UI
- `/app/api/admin/vectors/stats/route.ts` - Vector statistics API
- `/components/admin/VectorManager.tsx` - Vector stats component

### Architecture Decisions
✅ **Change Detection Storage**: Use n8n's Static Data Store (built-in workflow storage)
✅ **Docling Deployment**: Render Free Tier (accept cold start)
✅ **Admin UI**: Include in Phase C with monitoring + manual trigger
✅ **Vector ID Pattern**: `gdrive#{folder}#{file_id}#chunk{n}`

---

## 🎯 IMPLEMENTATION PHASES

## PHASE A: FOUNDATION (Week 1)

### A.1 Setup Google Drive Structure
**Duration**: 2-3 hours
**Owner**: Hưng (Manual)
**Status**: Ready to start

**Tasks**:
```
□ Create main folder: /AI-Knowledge-Base/
□ Create subfolders:
  - /AI-Knowledge-Base/blogs/
  - /AI-Knowledge-Base/projects/
  - /AI-Knowledge-Base/docs/
□ Move existing content to appropriate folders:
  - PDF blog posts → /blogs/
  - PPTX presentations → /projects/
  - Reference docs → /docs/
□ Rename files with descriptive names (e.g., "BA-to-PM-journey.pdf")
□ Document folder structure in Google Drive README
□ Get folder IDs for n8n configuration:
  - Right-click folder → Share → Copy link
  - Extract ID from URL: https://drive.google.com/drive/folders/{FOLDER_ID}
```

**Deliverable**:
- Google Drive folder structure ready ✅
- Folder IDs for n8n config:
  - **blogs**: `1unRpoP0RlPRqYZTWGFEDgZwe2POZCFoJ`
  - **docs**: `1VJSe21kbUEJDOtjMfYtu5xTOhI5YADXz`
  - **projects**: `1lUuek6fF2wdeGF_2Y8q2XudO2ZshLvdo`
- Sample files uploaded (1 per folder) ✅

---

### A.2 Setup Gemini API (Revised - Simpler Approach!)
**Duration**: 30 minutes
**Owner**: Hưng + Claude Code
**Status**: In Progress

**Decision**: Switched from Docling to Gemini API due to:
- ✅ Simpler (no deployment needed)
- ✅ Safer (Google infrastructure, no maintenance)
- ✅ More effective (better OCR, native multimodal)
- ✅ Free tier generous (15 RPM, 1M tokens/min)
- ❌ Docling requires >512MB RAM (Render Free only has 512MB)

**Pre-requisites**:
- Google Account (you already have Google Service Account ✓)

**Steps**:

#### Step 1: Get Gemini API Key
```bash
1. Go to: https://aistudio.google.com/apikey
2. Click "Create API Key"
3. Select project (or create new)
4. Copy API key
```

#### Step 2: Test Gemini API
```bash
# Test with curl to verify API key works:
curl "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=YOUR_API_KEY" \
  -H 'Content-Type: application/json' \
  -d '{
    "contents": [{
      "parts": [{
        "text": "Hello, test API"
      }]
    }]
  }'

# Expected: JSON response with model reply
```

#### Step 3: Store API Key for n8n
```bash
# You will add this to n8n environment variables:
GEMINI_API_KEY=your-gemini-api-key-here

# Or store as n8n credential
```

#### Step 4: Understand Gemini File API
Gemini có 2 ways để process documents:

**Option A: Direct File Upload (Recommended)**
```javascript
// Upload file to Gemini File API
// Then reference in generateContent request
// Best for PDFs, images, PPTX

const file = await uploadToGemini(pdfBuffer);
const response = await gemini.generateContent({
  model: "gemini-2.0-flash-exp",
  contents: [{
    parts: [
      { fileData: { fileUri: file.uri, mimeType: "application/pdf" } },
      { text: "Extract all text from this document as markdown" }
    ]
  }]
});
```

**Option B: Base64 Inline (For small files)**
```javascript
// Encode file as base64 and send directly
// Good for images, small PDFs (<4MB)

const base64 = pdfBuffer.toString('base64');
const response = await gemini.generateContent({
  contents: [{
    parts: [
      { inlineData: { data: base64, mimeType: "application/pdf" } },
      { text: "Extract all text as markdown" }
    ]
  }]
});
```

**Testing Checklist**:
- [ ] Gemini API key obtained
- [ ] Test API call succeeds
- [ ] Understand File API flow
- [ ] Ready to use in n8n

**Deliverable**:
- ✅ Gemini API key
- ✅ No deployment needed (huge win!)
- ✅ Ready for Phase A.3

---

### A.3 Basic n8n Workflow (Proof of Concept)
**Duration**: 1 day
**Owner**: Claude Code
**Status**: Pending

**Objective**: Process 1 test file end-to-end to validate pipeline

#### Workflow Structure (Updated with Gemini)
```
[Manual Trigger]
  → [Set Test File ID]
  → [Google Drive: Download File]
  → [HTTP: Gemini File Upload]
  → [HTTP: Gemini Extract Text]
  → [Code: Chunk Text]
  → [OpenAI: Generate Embeddings]
  → [Pinecone: Upsert Vectors]
  → [Code: Log Result]
```

#### Node-by-Node Configuration

##### Node 1: Manual Trigger
```json
{
  "name": "Manual Trigger",
  "type": "n8n-nodes-base.manualTrigger",
  "position": [250, 300]
}
```

##### Node 2: Set Test File ID
```json
{
  "name": "Set Test File",
  "type": "n8n-nodes-base.set",
  "parameters": {
    "values": {
      "string": [
        {
          "name": "fileId",
          "value": "=YOUR_TEST_FILE_ID"
        },
        {
          "name": "folder",
          "value": "blogs"
        }
      ]
    }
  }
}
```

##### Node 3: Google Drive - Download File
```json
{
  "name": "Download File",
  "type": "n8n-nodes-base.googleDrive",
  "credentials": "googleDriveApi",
  "parameters": {
    "operation": "download",
    "fileId": "={{ $json.fileId }}",
    "options": {}
  }
}
```

##### Node 4: HTTP Request - Upload to Gemini File API
```json
{
  "name": "Upload to Gemini",
  "type": "n8n-nodes-base.httpRequest",
  "parameters": {
    "method": "POST",
    "url": "https://generativelanguage.googleapis.com/upload/v1beta/files?key={{ $env.GEMINI_API_KEY }}",
    "authentication": "none",
    "sendBody": true,
    "contentType": "multipart-form-data",
    "bodyParameters": {
      "parameters": [
        {
          "name": "file",
          "value": "={{ $binary.data }}"
        }
      ]
    },
    "options": {
      "timeout": 60000
    }
  }
}
```

##### Node 5: HTTP Request - Extract Text with Gemini
```json
{
  "name": "Gemini Extract Text",
  "type": "n8n-nodes-base.httpRequest",
  "parameters": {
    "method": "POST",
    "url": "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key={{ $env.GEMINI_API_KEY }}",
    "authentication": "none",
    "sendBody": true,
    "contentType": "application/json",
    "bodyParameters": {
      "parameters": [
        {
          "name": "contents",
          "value": [{
            "parts": [
              {
                "fileData": {
                  "fileUri": "={{ $json.file.uri }}",
                  "mimeType": "={{ $json.file.mimeType }}"
                }
              },
              {
                "text": "Extract all text content from this document. Preserve the structure and formatting. Return as clean markdown without any preamble or commentary."
              }
            ]
          }]
        }
      ]
    },
    "options": {
      "timeout": 60000
    }
  }
}
```

##### Node 6: Code - Chunk Text
```javascript
// Node: Function - Chunk Text
// Purpose: Split markdown into semantic chunks

// Extract text from Gemini response
const geminiResponse = $input.item.json;
const markdown = geminiResponse.candidates[0].content.parts[0].text;
const fileId = $('Set Test File').item.json.fileId;
const folder = $('Set Test File').item.json.folder;

// Chunking parameters
const CHUNK_SIZE = 1000;
const CHUNK_OVERLAP = 200;

// Simple chunking by paragraphs
function chunkText(text, chunkSize, overlap) {
  const chunks = [];
  const paragraphs = text.split('\n\n');

  let currentChunk = '';
  let chunkIndex = 0;

  for (const para of paragraphs) {
    if ((currentChunk + para).length > chunkSize && currentChunk.length > 0) {
      // Save current chunk
      chunks.push({
        text: currentChunk.trim(),
        index: chunkIndex++,
        id: `gdrive#${folder}#${fileId}#chunk${chunkIndex}`
      });

      // Start new chunk with overlap (last N chars)
      currentChunk = currentChunk.slice(-overlap) + '\n\n' + para;
    } else {
      currentChunk += (currentChunk ? '\n\n' : '') + para;
    }
  }

  // Add final chunk
  if (currentChunk.trim()) {
    chunks.push({
      text: currentChunk.trim(),
      index: chunkIndex,
      id: `gdrive#${folder}#${fileId}#chunk${chunkIndex}`
    });
  }

  return chunks;
}

const chunks = chunkText(markdown, CHUNK_SIZE, CHUNK_OVERLAP);

// Return array of chunks
return chunks.map(chunk => ({
  json: {
    id: chunk.id,
    text: chunk.text,
    chunkIndex: chunk.index,
    totalChunks: chunks.length,
    fileId: fileId,
    folder: folder
  }
}));
```

##### Node 7: OpenAI - Generate Embeddings
```json
{
  "name": "Generate Embeddings",
  "type": "n8n-nodes-base.openAi",
  "credentials": "openAiApi",
  "parameters": {
    "resource": "embedding",
    "operation": "create",
    "model": "text-embedding-3-small",
    "input": "={{ $json.text }}",
    "options": {
      "dimensions": 1536
    }
  }
}
```

##### Node 8: Pinecone - Upsert Vectors
```json
{
  "name": "Upsert to Pinecone",
  "type": "n8n-nodes-base.pinecone",
  "credentials": "pineconeApi",
  "parameters": {
    "operation": "upsert",
    "indexName": "={{ $env.PINECONE_INDEX_NAME }}",
    "vectors": {
      "vector": [
        {
          "id": "={{ $json.id }}",
          "values": "={{ $json.embedding }}",
          "metadata": {
            "source_type": "={{ 'gdrive_' + $json.folder }}",
            "gdrive_id": "={{ $json.fileId }}",
            "folder": "={{ $json.folder }}",
            "text": "={{ $json.text }}",
            "chunk_index": "={{ $json.chunkIndex }}",
            "total_chunks": "={{ $json.totalChunks }}",
            "last_modified": "={{ new Date().toISOString() }}",
            "vectorType": "gdrive"
          }
        }
      ]
    }
  }
}
```

##### Node 9: Log Result
```javascript
// Node: Function - Log Success
const totalChunks = $input.all().length;
const fileId = $input.first().json.fileId;

console.log(`✅ Successfully processed file: ${fileId}`);
console.log(`📊 Total chunks created: ${totalChunks}`);

return [{
  json: {
    success: true,
    fileId: fileId,
    chunksCreated: totalChunks,
    timestamp: new Date().toISOString()
  }
}];
```

#### Testing Steps
```bash
# 1. Activate workflow in n8n
# 2. Click "Execute Workflow" (manual trigger)
# 3. Monitor execution:
#    - Check each node output
#    - Verify Gemini File Upload returns file URI
#    - Verify Gemini Extract Text returns markdown
#    - Verify chunks are created (should be ~5-15 chunks per doc)
#    - Verify embeddings are generated (1536 dimensions)
#    - Verify vectors are in Pinecone

# 4. Verify in Pinecone Console:
# - Go to Pinecone Dashboard → Indexes → Your Index
# - Search for ID prefix: gdrive#blogs#
# - Should see new vectors with correct metadata

# 5. Test in Website Chatbot:
# - Ask a question about the test document content
# - Check if chatbot retrieves and uses the new vectors
```

**Testing Checklist**:
- [ ] Workflow executes without errors
- [ ] Gemini uploads file successfully (returns file URI)
- [ ] Gemini extracts text to markdown
- [ ] Text is chunked (verify chunk count)
- [ ] Embeddings are generated (1536 dimensions)
- [ ] Vectors appear in Pinecone with correct ID pattern
- [ ] Metadata includes all required fields
- [ ] Chatbot can retrieve and use new vectors

**Deliverable**:
- Working n8n workflow (exported JSON)
- Test results with screenshots
- Vector IDs in Pinecone confirmed

---

## PHASE B: FULL PIPELINE (Week 2)

### B.1 Add All Triggers
**Duration**: 3-4 hours
**Owner**: Claude Code

#### Add Schedule Trigger
```json
{
  "name": "Schedule Trigger",
  "type": "n8n-nodes-base.scheduleTrigger",
  "parameters": {
    "rule": {
      "interval": [
        {
          "field": "cronExpression",
          "expression": "0 6 * * *"
        }
      ]
    },
    "triggerTimes": {
      "item": [
        {
          "mode": "everyDay",
          "hour": 6,
          "minute": 0
        }
      ]
    }
  },
  "position": [250, 200]
}
```

#### Add Webhook Trigger
```json
{
  "name": "Webhook Trigger",
  "type": "n8n-nodes-base.webhook",
  "parameters": {
    "path": "refresh-gdrive-vectors",
    "httpMethod": "POST",
    "authentication": "headerAuth",
    "options": {
      "rawBody": true
    }
  },
  "credentials": "headerAuth",
  "position": [250, 400]
}

// Webhook Authentication:
// In n8n Credentials → Create "Header Auth"
// Name: X-Webhook-Secret
// Value: {{ generate random 32-char string }}
```

#### Merge Triggers
```json
{
  "name": "Merge Triggers",
  "type": "n8n-nodes-base.merge",
  "parameters": {
    "mode": "passThrough"
  }
}
```

**Testing**:
```bash
# Test Schedule Trigger:
# - Temporarily set to "0 * * * *" (every hour) for testing
# - Wait for next hour
# - Check workflow execution history
# - Reset to "0 6 * * *" after test

# Test Webhook Trigger:
curl -X POST https://your-n8n.onrender.com/webhook/refresh-gdrive-vectors \
  -H "X-Webhook-Secret: your-secret-here" \
  -H "Content-Type: application/json" \
  -d '{"folders": ["blogs"]}'

# Expected: 200 OK, workflow executes
```

---

### B.2 Change Detection Logic
**Duration**: 4-6 hours
**Owner**: Claude Code

#### Add Static Data Store Node
```json
{
  "name": "Load Processed Files",
  "type": "n8n-nodes-base.staticData",
  "parameters": {
    "operation": "get",
    "key": "processedFiles"
  }
}

// Static Data structure:
{
  "processedFiles": {
    "file_id_1": {
      "hash": "sha256:abc123...",
      "lastProcessed": "2025-12-02T06:00:00Z",
      "fileName": "BA-to-PM-journey.pdf",
      "folder": "blogs",
      "chunkCount": 12
    }
  }
}
```

#### Add Hash Calculation Function
```javascript
// Node: Function - Calculate File Hash
const crypto = require('crypto');

const fileData = $input.item.binary.data;
const fileId = $input.item.json.id;
const fileName = $input.item.json.name;
const folder = $input.item.json.folder;

// Calculate SHA-256 hash
const hash = crypto.createHash('sha256').update(fileData).digest('hex');
const hashString = `sha256:${hash}`;

// Load processed files from static data
const processedFiles = $('Load Processed Files').item.json.processedFiles || {};

// Check if file was processed before
const previousHash = processedFiles[fileId]?.hash;
const isNew = !previousHash;
const isChanged = previousHash && previousHash !== hashString;
const isUnchanged = previousHash === hashString;

return [{
  json: {
    fileId: fileId,
    fileName: fileName,
    folder: folder,
    currentHash: hashString,
    previousHash: previousHash,
    isNew: isNew,
    isChanged: isChanged,
    isUnchanged: isUnchanged,
    action: isUnchanged ? 'SKIP' : (isChanged ? 'UPDATE' : 'NEW')
  }
}];
```

#### Add Filter Node
```json
{
  "name": "Filter Changed Files",
  "type": "n8n-nodes-base.filter",
  "parameters": {
    "conditions": {
      "string": [
        {
          "value1": "={{ $json.action }}",
          "operation": "notEqual",
          "value2": "SKIP"
        }
      ]
    }
  }
}
```

#### Add Delete Old Vectors (for changed files)
```javascript
// Node: Function - Delete Old Vectors
// Only runs for changed files

const fileId = $input.item.json.fileId;
const folder = $input.item.json.folder;
const action = $input.item.json.action;

if (action === 'UPDATE') {
  // Build ID prefix for old vectors
  const idPrefix = `gdrive#${folder}#${fileId}#`;

  return [{
    json: {
      deletePrefix: idPrefix,
      needsDelete: true,
      fileId: fileId
    }
  }];
} else {
  // New file, no need to delete
  return [{
    json: {
      needsDelete: false,
      fileId: fileId
    }
  }];
}
```

```json
{
  "name": "Pinecone Delete Old",
  "type": "n8n-nodes-base.pinecone",
  "parameters": {
    "operation": "delete",
    "indexName": "={{ $env.PINECONE_INDEX_NAME }}",
    "deleteBy": "prefix",
    "prefix": "={{ $json.deletePrefix }}"
  },
  "executeOnce": false,
  "filter": {
    "conditions": {
      "boolean": [
        {
          "value1": "={{ $json.needsDelete }}",
          "value2": true
        }
      ]
    }
  }
}
```

#### Update Static Data After Processing
```javascript
// Node: Function - Update Processed Files
const results = $input.all();
const processedFiles = $('Load Processed Files').item.json.processedFiles || {};

// Update with new file info
results.forEach(item => {
  const fileId = item.json.fileId;
  const fileName = item.json.fileName;
  const folder = item.json.folder;
  const hash = item.json.currentHash;
  const chunkCount = item.json.totalChunks;

  processedFiles[fileId] = {
    hash: hash,
    lastProcessed: new Date().toISOString(),
    fileName: fileName,
    folder: folder,
    chunkCount: chunkCount
  };
});

// Save back to static data
return [{
  json: {
    processedFiles: processedFiles
  }
}];
```

```json
{
  "name": "Save Processed Files",
  "type": "n8n-nodes-base.staticData",
  "parameters": {
    "operation": "set",
    "key": "processedFiles",
    "value": "={{ $json.processedFiles }}"
  }
}
```

**Testing**:
```bash
# Test Change Detection:

# 1. Process a file (should be NEW)
# - Check action: "NEW"
# - Verify vectors created

# 2. Re-run workflow (should be SKIP)
# - Check action: "SKIP"
# - Verify no processing

# 3. Modify file in Google Drive (update content)
# - Check action: "UPDATE"
# - Verify old vectors deleted
# - Verify new vectors created

# 4. Check static data:
# - In n8n workflow editor
# - Click "Settings" → "Static Data"
# - Verify processedFiles structure
```

---

### B.3 Multi-folder Processing
**Duration**: 4-6 hours
**Owner**: Claude Code

#### List All Folders
```json
{
  "name": "Set Folders",
  "type": "n8n-nodes-base.set",
  "parameters": {
    "values": {
      "string": [
        {
          "name": "folders",
          "value": "blogs,projects,docs"
        }
      ]
    }
  }
}
```

#### Split Into Items
```json
{
  "name": "Split Folders",
  "type": "n8n-nodes-base.splitInBatches",
  "parameters": {
    "batchSize": 1,
    "options": {}
  }
}
```

#### Loop Through Each Folder
```javascript
// Node: Function - Process Folder
const foldersString = $input.item.json.folders;
const folderArray = foldersString.split(',');

// Environment variable mapping (set in n8n):
// GDRIVE_FOLDER_BLOGS=1unRpoP0RlPRqYZTWGFEDgZwe2POZCFoJ
// GDRIVE_FOLDER_DOCS=1VJSe21kbUEJDOtjMfYtu5xTOhI5YADXz
// GDRIVE_FOLDER_PROJECTS=1lUuek6fF2wdeGF_2Y8q2XudO2ZshLvdo

const folderConfigs = [
  {
    name: 'blogs',
    id: $env.GDRIVE_FOLDER_BLOGS,
    fileTypes: ['pdf']
  },
  {
    name: 'docs',
    id: $env.GDRIVE_FOLDER_DOCS,
    fileTypes: ['pdf', 'docx']
  },
  {
    name: 'projects',
    id: $env.GDRIVE_FOLDER_PROJECTS,
    fileTypes: ['pdf', 'pptx']
  }
];

return folderConfigs.map(folder => ({
  json: folder
}));
```

#### List Files in Folder
```json
{
  "name": "List Files",
  "type": "n8n-nodes-base.googleDrive",
  "parameters": {
    "operation": "list",
    "folderId": "={{ $json.id }}",
    "filters": {
      "mimeTypes": [
        "application/pdf",
        "application/vnd.openxmlformats-officedocument.presentationml.presentation",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
      ]
    },
    "options": {
      "fields": "files(id,name,mimeType,modifiedTime,size)"
    }
  }
}
```

#### Add Folder Metadata
```javascript
// Node: Function - Add Folder Info
const folder = $('Process Folder').item.json.name;
const files = $input.all();

return files.map(item => ({
  json: {
    ...item.json,
    folder: folder
  }
}));
```

**Testing**:
```bash
# Test Multi-folder:

# 1. Add test files to each folder:
# - /blogs/test-blog.pdf
# - /projects/test-project.pptx
# - /docs/test-doc.pdf

# 2. Run workflow
# - Should process all 3 files
# - Check logs for each folder

# 3. Verify in Pinecone:
# - gdrive#blogs#* vectors
# - gdrive#projects#* vectors
# - gdrive#docs#* vectors

# 4. Check vector counts:
# - Query by source_type metadata
# - Should match file counts
```

---

### B.4 Error Handling & Logging
**Duration**: 3-4 hours
**Owner**: Claude Code

#### Add Try-Catch Wrapper
```javascript
// Node: Function - Safe Execute
// Wrap each main operation

async function safeExecute(operation) {
  try {
    return await operation();
  } catch (error) {
    console.error(`Error in ${operation.name}:`, error);
    return {
      error: true,
      message: error.message,
      stack: error.stack
    };
  }
}

// Example usage in each processing node:
try {
  // Main logic here
  const result = await processFile($json);

  return [{
    json: {
      success: true,
      ...result
    }
  }];
} catch (error) {
  return [{
    json: {
      success: false,
      error: error.message,
      fileId: $json.fileId,
      fileName: $json.fileName
    }
  }];
}
```

#### Add Error Aggregation
```javascript
// Node: Function - Aggregate Results
const results = $input.all();

const summary = {
  total: results.length,
  successful: results.filter(r => r.json.success).length,
  failed: results.filter(r => !r.json.success).length,
  skipped: results.filter(r => r.json.action === 'SKIP').length,
  new: results.filter(r => r.json.action === 'NEW').length,
  updated: results.filter(r => r.json.action === 'UPDATE').length,
  errors: results.filter(r => !r.json.success).map(r => ({
    file: r.json.fileName,
    error: r.json.error
  }))
};

console.log('📊 Processing Summary:', JSON.stringify(summary, null, 2));

return [{
  json: summary
}];
```

#### Add Notification (Optional)
```json
{
  "name": "Send Summary Email",
  "type": "n8n-nodes-base.emailSend",
  "parameters": {
    "fromEmail": "n8n@hungreo.com",
    "toEmail": "hungreo2005@gmail.com",
    "subject": "Google Drive RAG Sync - {{ $json.successful }}/{{ $json.total }} files processed",
    "text": "Summary:\n\nSuccessful: {{ $json.successful }}\nFailed: {{ $json.failed }}\nSkipped: {{ $json.skipped }}\nNew: {{ $json.new }}\nUpdated: {{ $json.updated }}\n\nErrors:\n{{ JSON.stringify($json.errors, null, 2) }}",
    "options": {}
  },
  "executeOnce": true
}
```

**Testing**:
```bash
# Test Error Handling:

# 1. Trigger error scenarios:
# - Invalid file ID
# - Corrupted PDF
# - Network timeout
# - Pinecone rate limit

# 2. Verify error caught:
# - Check workflow doesn't crash
# - Check error logged
# - Check summary includes error

# 3. Verify notification:
# - Check email received
# - Check error details in email
```

---

## PHASE C: INTEGRATION (Week 3)

### C.1 Website Integration - API Routes

#### Create API Route: /api/admin/vectors/gdrive/refresh
```typescript
// File: app/api/admin/vectors/gdrive/refresh/route.ts

import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * POST /api/admin/vectors/gdrive/refresh
 * Trigger n8n workflow to refresh Google Drive vectors
 */
export async function POST(request: Request) {
  try {
    // Auth check
    const session = await auth()
    if (!session?.user || (session.user as any).role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get request body
    const body = await request.json().catch(() => ({}))
    const folders = body.folders || ['blogs', 'projects', 'docs'] // Default: all folders

    // Trigger n8n webhook
    const n8nWebhookUrl = process.env.N8N_WEBHOOK_URL_GDRIVE_REFRESH
    const n8nWebhookSecret = process.env.N8N_WEBHOOK_SECRET

    if (!n8nWebhookUrl || !n8nWebhookSecret) {
      return NextResponse.json(
        { error: 'N8N webhook not configured' },
        { status: 500 }
      )
    }

    const response = await fetch(n8nWebhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Webhook-Secret': n8nWebhookSecret,
      },
      body: JSON.stringify({ folders }),
    })

    if (!response.ok) {
      throw new Error(`N8N webhook failed: ${response.statusText}`)
    }

    const result = await response.json()

    return NextResponse.json({
      success: true,
      message: 'Google Drive sync triggered',
      jobId: result.executionId || 'unknown',
      folders: folders,
    })
  } catch (error: any) {
    console.error('Trigger refresh error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to trigger refresh' },
      { status: 500 }
    )
  }
}
```

#### Create API Route: /api/admin/vectors/gdrive/stats
```typescript
// File: app/api/admin/vectors/gdrive/stats/route.ts

import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { getPineconeIndex } from '@/lib/pinecone'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * GET /api/admin/vectors/gdrive/stats
 * Get statistics about Google Drive vectors
 */
export async function GET() {
  try {
    const session = await auth()
    if (!session?.user || (session.user as any).role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const index = await getPineconeIndex()

    // Query vectors with gdrive prefix
    const gdriveQuery = await index.query({
      vector: new Array(1536).fill(0),
      topK: 10000,
      includeMetadata: true,
      filter: {
        vectorType: { $eq: 'gdrive' }
      }
    })

    // Categorize by folder
    const stats = {
      total: gdriveQuery.matches?.length || 0,
      byFolder: {
        blogs: 0,
        projects: 0,
        docs: 0,
      },
      lastSync: null as string | null,
      files: [] as any[],
    }

    const fileMap = new Map()

    gdriveQuery.matches?.forEach((match) => {
      const metadata = match.metadata
      const folder = metadata?.folder as string
      const gdriveId = metadata?.gdrive_id as string
      const fileName = metadata?.file_name as string
      const lastModified = metadata?.last_modified as string

      // Count by folder
      if (folder === 'blogs') stats.byFolder.blogs++
      else if (folder === 'projects') stats.byFolder.projects++
      else if (folder === 'docs') stats.byFolder.docs++

      // Track files
      if (gdriveId && !fileMap.has(gdriveId)) {
        fileMap.set(gdriveId, {
          id: gdriveId,
          name: fileName,
          folder: folder,
          lastModified: lastModified,
          chunkCount: 0,
        })
      }

      if (gdriveId) {
        fileMap.get(gdriveId).chunkCount++
      }

      // Track last sync
      if (lastModified && (!stats.lastSync || lastModified > stats.lastSync)) {
        stats.lastSync = lastModified
      }
    })

    stats.files = Array.from(fileMap.values())

    return NextResponse.json({
      success: true,
      stats,
    })
  } catch (error: any) {
    console.error('Get GDrive stats error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to get statistics' },
      { status: 500 }
    )
  }
}
```

---

### C.2 Website Admin UI Component

#### Create Admin Page: /app/admin/vectors/gdrive/page.tsx
```typescript
// File: app/admin/vectors/gdrive/page.tsx

import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { GDriveVectorManager } from '@/components/admin/GDriveVectorManager'

export default async function GDriveVectorsPage() {
  const session = await auth()

  if (!session?.user || (session.user as any).role !== 'admin') {
    redirect('/admin/login')
  }

  return <GDriveVectorManager />
}
```

#### Create Component: /components/admin/GDriveVectorManager.tsx
```typescript
// File: components/admin/GDriveVectorManager.tsx

'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowLeft, RefreshCw, Database, FolderOpen, Clock } from 'lucide-react'
import { Button } from '../ui/Button'

interface GDriveStats {
  total: number
  byFolder: {
    blogs: number
    projects: number
    docs: number
  }
  lastSync: string | null
  files: Array<{
    id: string
    name: string
    folder: string
    lastModified: string
    chunkCount: number
  }>
}

export function GDriveVectorManager() {
  const [stats, setStats] = useState<GDriveStats | null>(null)
  const [loading, setLoading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)

  // Fetch stats
  const fetchStats = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/admin/vectors/gdrive/stats')
      const data = await res.json()

      if (data.success) {
        setStats(data.stats)
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error)
    } finally {
      setLoading(false)
    }
  }

  // Trigger refresh
  const triggerRefresh = async (folders?: string[]) => {
    if (!confirm('Trigger Google Drive sync now? This may take several minutes.')) {
      return
    }

    try {
      setRefreshing(true)
      const res = await fetch('/api/admin/vectors/gdrive/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ folders: folders || ['blogs', 'projects', 'docs'] }),
      })
      const data = await res.json()

      if (data.success) {
        alert(`✅ Sync triggered! Job ID: ${data.jobId}\n\nRefresh this page in a few minutes to see results.`)
      } else {
        alert('❌ Sync failed: ' + data.error)
      }
    } catch (error) {
      console.error('Failed to trigger refresh:', error)
      alert('❌ Sync failed')
    } finally {
      setRefreshing(false)
    }
  }

  useEffect(() => {
    fetchStats()
  }, [])

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never'
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <Link href="/admin/vectors">
              <Button variant="outline" size="sm" className="gap-2 mb-4">
                <ArrowLeft className="h-4 w-4" />
                Back to Vectors
              </Button>
            </Link>
            <h1 className="text-3xl font-bold text-gray-900">Google Drive Vectors</h1>
            <p className="text-gray-600 mt-2">Automated RAG pipeline from Google Drive</p>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={fetchStats}
              disabled={loading}
              variant="outline"
              size="sm"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
            <Button
              onClick={() => triggerRefresh()}
              disabled={refreshing}
              size="sm"
              className="gap-2"
            >
              <Database className="h-4 w-4" />
              {refreshing ? 'Syncing...' : 'Sync Now'}
            </Button>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center gap-2 text-gray-500 mb-2">
              <Database className="h-5 w-5" />
              <h3 className="text-sm font-medium">Total Vectors</h3>
            </div>
            <p className="text-3xl font-bold text-gray-900">{stats?.total || 0}</p>
          </div>

          <div className="bg-blue-50 p-6 rounded-lg shadow">
            <div className="flex items-center gap-2 text-blue-600 mb-2">
              <FolderOpen className="h-5 w-5" />
              <h3 className="text-sm font-medium">Blogs</h3>
            </div>
            <p className="text-3xl font-bold text-blue-900">{stats?.byFolder.blogs || 0}</p>
          </div>

          <div className="bg-green-50 p-6 rounded-lg shadow">
            <div className="flex items-center gap-2 text-green-600 mb-2">
              <FolderOpen className="h-5 w-5" />
              <h3 className="text-sm font-medium">Projects</h3>
            </div>
            <p className="text-3xl font-bold text-green-900">{stats?.byFolder.projects || 0}</p>
          </div>

          <div className="bg-purple-50 p-6 rounded-lg shadow">
            <div className="flex items-center gap-2 text-purple-600 mb-2">
              <FolderOpen className="h-5 w-5" />
              <h3 className="text-sm font-medium">Docs</h3>
            </div>
            <p className="text-3xl font-bold text-purple-900">{stats?.byFolder.docs || 0}</p>
          </div>
        </div>

        {/* Last Sync */}
        <div className="bg-white p-4 rounded-lg shadow mb-8">
          <div className="flex items-center gap-2 text-gray-600">
            <Clock className="h-5 w-5" />
            <span className="font-medium">Last Sync:</span>
            <span>{formatDate(stats?.lastSync)}</span>
          </div>
        </div>

        {/* Files List */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900">Indexed Files</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    File Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Folder
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Chunks
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Last Modified
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {stats?.files.map((file) => (
                  <tr key={file.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {file.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          file.folder === 'blogs'
                            ? 'bg-blue-100 text-blue-800'
                            : file.folder === 'projects'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-purple-100 text-purple-800'
                        }`}
                      >
                        {file.folder}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {file.chunkCount}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(file.lastModified)}
                    </td>
                  </tr>
                ))}
                {(!stats || stats.files.length === 0) && (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                      No files indexed yet. Click "Sync Now" to start.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Info */}
        <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mt-8">
          <div className="flex">
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800">How it works</h3>
              <div className="mt-2 text-sm text-blue-700">
                <ul className="list-disc list-inside space-y-1">
                  <li>Automatically syncs daily at 6:00 AM</li>
                  <li>Only processes changed or new files (smart change detection)</li>
                  <li>Supports PDF, PPTX, DOCX with OCR for images</li>
                  <li>Click "Sync Now" for manual refresh anytime</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
```

---

### C.3 Update Main Vector Manager

#### Update /components/admin/VectorManager.tsx
Add link to Google Drive vectors:

```typescript
// Add after line 125 (after Unknown Type card):

<Link href="/admin/vectors/gdrive">
  <div className="bg-orange-50 p-6 rounded-lg shadow cursor-pointer hover:bg-orange-100">
    <h3 className="text-sm font-medium text-orange-600">Google Drive</h3>
    <p className="text-3xl font-bold text-orange-900 mt-2">
      {/* Fetch gdrive stats separately or include in main stats */}
      <span className="text-lg">View Details</span>
    </p>
    <button className="text-xs text-orange-600 mt-2">Manage →</button>
  </div>
</Link>
```

---

### C.4 Environment Variables

#### Add to .env.local and .env.production
```bash
# n8n Webhook Configuration
N8N_WEBHOOK_URL_GDRIVE_REFRESH=https://your-n8n.onrender.com/webhook/refresh-gdrive-vectors
N8N_WEBHOOK_SECRET=your-32-char-secret-here

# Google Drive Folder IDs
GDRIVE_FOLDER_BLOGS=1unRpoP0RlPRqYZTWGFEDgZwe2POZCFoJ
GDRIVE_FOLDER_DOCS=1VJSe21kbUEJDOtjMfYtu5xTOhI5YADXz
GDRIVE_FOLDER_PROJECTS=1lUuek6fF2wdeGF_2Y8q2XudO2ZshLvdo
```

---

### C.5 End-to-End Testing

**Testing Checklist**:

#### Test 1: New File Upload
```
□ Upload new file to Google Drive /blogs/
□ Click "Sync Now" in admin UI
□ Wait 2-3 minutes
□ Refresh stats page
□ Verify file appears in list
□ Verify vector count increased
□ Test chatbot with question about new content
□ Verify chatbot uses new vectors
```

#### Test 2: File Modification
```
□ Edit existing file in Google Drive
□ Click "Sync Now"
□ Wait 2-3 minutes
□ Refresh stats page
□ Verify "Last Modified" timestamp updated
□ Verify chunk count (may change)
□ Test chatbot with updated content
□ Verify chatbot has new information
```

#### Test 3: File Deletion
```
□ Delete file from Google Drive
□ Click "Sync Now"
□ Wait 2-3 minutes
□ Refresh stats page
□ Verify file removed from list
□ Verify vector count decreased
□ Test chatbot with deleted content
□ Verify chatbot no longer references it
```

#### Test 4: Daily Schedule
```
□ Wait for next 6:00 AM trigger
□ Check n8n execution logs
□ Verify workflow ran automatically
□ Check admin UI for updated "Last Sync" time
□ Verify any overnight changes processed
```

#### Test 5: Multi-folder Processing
```
□ Add files to all 3 folders
□ Click "Sync Now"
□ Verify all folders processed
□ Check stats breakdown by folder
□ Verify correct folder metadata in vectors
```

#### Test 6: Error Handling
```
□ Upload corrupted PDF
□ Trigger sync
□ Verify error logged (check n8n logs)
□ Verify other files still processed
□ Verify summary email includes error
```

---

## PHASE D: MONITORING & OPTIMIZATION

### D.1 Monitoring Dashboard

#### Add to Admin Dashboard (/app/admin/dashboard/page.tsx)
```typescript
// Add GDrive stats widget

<div className="bg-white p-6 rounded-lg shadow">
  <h3 className="text-lg font-medium text-gray-900 mb-4">
    Google Drive RAG Status
  </h3>
  <div className="space-y-2">
    <div className="flex justify-between">
      <span className="text-gray-600">Last Sync:</span>
      <span className="font-medium">{gdriveStats.lastSync}</span>
    </div>
    <div className="flex justify-between">
      <span className="text-gray-600">Total Files:</span>
      <span className="font-medium">{gdriveStats.fileCount}</span>
    </div>
    <div className="flex justify-between">
      <span className="text-gray-600">Total Vectors:</span>
      <span className="font-medium">{gdriveStats.vectorCount}</span>
    </div>
  </div>
  <Link href="/admin/vectors/gdrive">
    <Button className="mt-4 w-full" variant="outline" size="sm">
      View Details
    </Button>
  </Link>
</div>
```

### D.2 Daily Monitoring Checklist
```
□ Check n8n execution logs (https://your-n8n.onrender.com/executions)
□ Verify daily 6 AM run completed successfully
□ Check admin UI for updated "Last Sync" timestamp
□ Compare vector counts with expected file counts
□ Review any error notifications
□ Spot check chatbot with recent content
```

### D.3 Weekly Optimization Tasks
```
□ Review processing times (adjust chunk size if needed)
□ Check Pinecone usage (approaching 100K limit?)
□ Review Docling performance (slow files?)
□ Check OpenAI API costs (embeddings usage)
□ Optimize folder structure if needed
```

---

## 🚨 ROLLBACK PROCEDURES

### Emergency Rollback - Delete All GDrive Vectors

If something goes wrong and you need to revert:

#### Option 1: Via Pinecone Console
```
1. Go to Pinecone Dashboard
2. Select your index
3. Click "Browse Index"
4. Filter by metadata: vectorType = "gdrive"
5. Select all
6. Click "Delete Selected"
```

#### Option 2: Via n8n Workflow
Create emergency cleanup workflow:
```json
{
  "name": "Emergency GDrive Cleanup",
  "nodes": [
    {
      "name": "Manual Trigger",
      "type": "n8n-nodes-base.manualTrigger"
    },
    {
      "name": "Delete GDrive Vectors",
      "type": "n8n-nodes-base.pinecone",
      "parameters": {
        "operation": "delete",
        "deleteBy": "filter",
        "filter": {
          "vectorType": {
            "$eq": "gdrive"
          }
        }
      }
    }
  ]
}
```

#### Option 3: Via Node.js Script
```javascript
// scripts/cleanup-gdrive-vectors.js
import { Pinecone } from '@pinecone-database/pinecone'

const pinecone = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY,
})

const index = pinecone.index(process.env.PINECONE_INDEX_NAME)

async function cleanup() {
  console.log('🗑️  Deleting all gdrive vectors...')

  // List all gdrive vectors
  const vectors = await index.listPaginated({ prefix: 'gdrive#' })

  // Delete in batches
  const ids = vectors.vectors.map(v => v.id)
  await index.deleteMany(ids)

  console.log(`✅ Deleted ${ids.length} vectors`)
}

cleanup()
```

### Rollback to Previous State

#### Step 1: Stop Automation
```
□ Disable n8n schedule trigger
□ Disable webhook endpoint (or change secret)
□ Prevent any new syncs
```

#### Step 2: Clean Vectors
```
□ Run cleanup script (above)
□ Verify vectors deleted in Pinecone
□ Verify total count decreased
```

#### Step 3: Verify System
```
□ Test chatbot with old questions
□ Verify existing web/doc/video vectors still work
□ Verify no errors in chatbot
```

#### Step 4: Investigate Issue
```
□ Review n8n logs
□ Check Docling logs
□ Review Pinecone stats
□ Identify root cause
```

---

## 📋 FINAL CHECKLIST

### Phase A Complete
- [ ] Google Drive folders created and organized
- [ ] Docling deployed on Render
- [ ] Docling health check passing
- [ ] Test conversion works (PDF + PPTX)
- [ ] Basic n8n workflow created
- [ ] 1 test file processed successfully
- [ ] Vectors visible in Pinecone
- [ ] Chatbot can use test vectors

### Phase B Complete
- [ ] Schedule trigger (6 AM daily) working
- [ ] Webhook trigger working
- [ ] Change detection implemented
- [ ] Static data store working
- [ ] Multi-folder processing working
- [ ] All 3 folders (blogs/projects/docs) processed
- [ ] Error handling implemented
- [ ] Logging/summary working

### Phase C Complete
- [ ] API routes created (/api/admin/vectors/gdrive/*)
- [ ] Admin UI page created (/admin/vectors/gdrive)
- [ ] Stats display working
- [ ] Manual refresh button working
- [ ] Files list displaying
- [ ] Environment variables configured
- [ ] End-to-end test passed (new file)
- [ ] End-to-end test passed (modified file)
- [ ] Chatbot quality verified

### Phase D Complete
- [ ] Dashboard widget added
- [ ] Daily monitoring routine established
- [ ] No errors for 7 consecutive days
- [ ] Performance metrics acceptable
- [ ] Rollback procedure tested
- [ ] Documentation complete

---

## 🎓 KEY LEARNINGS & BEST PRACTICES

### What We Learned
1. **Additive approach is safer**: Never delete existing vectors during migration
2. **Change detection is critical**: Avoid re-processing unchanged files
3. **Cold start is acceptable**: For daily batch jobs, Render Free tier works
4. **Metadata filtering > Namespaces**: Single namespace enables cross-query
5. **Static data store is sufficient**: No need for external database

### Best Practices Going Forward
1. **Monitor daily**: Check logs every morning for 1 week
2. **Descriptive filenames**: Use clear names in Google Drive
3. **Test before production**: Always test with 1-2 files first
4. **Backup before changes**: Export Pinecone data before major updates
5. **Document everything**: Keep this plan updated

---

## 📞 SUPPORT & TROUBLESHOOTING

### Common Issues

#### Issue: Docling timeout
```
Symptom: n8n node fails with timeout error
Solution:
  - Increase timeout to 180000 (3 min)
  - Check file size (>50 pages may be slow)
  - Retry with shorter file first
```

#### Issue: Vectors not appearing
```
Symptom: Workflow succeeds but no vectors in Pinecone
Solution:
  - Check Pinecone API key
  - Check index name
  - Verify upsert node output
  - Check Pinecone quota (100K limit)
```

#### Issue: Change detection not working
```
Symptom: Files reprocessed every time
Solution:
  - Check static data saved correctly
  - Verify hash calculation
  - Check file ID consistency
```

#### Issue: Chatbot not using new vectors
```
Symptom: Questions not retrieving GDrive content
Solution:
  - Verify vectors have correct vectorType
  - Check embedding dimension (1536)
  - Test with very specific question
  - Check metadata filtering in chat API
```

---

**END OF IMPLEMENTATION PLAN**
