# n8n Google Drive RAG Pipeline - Setup Guide

**Date**: December 2, 2025
**Status**: Ready to Import
**Estimated Time**: 30 minutes

---

## ✅ PREREQUISITES COMPLETED

- [x] Google Drive folders created
- [x] Gemini API key obtained: `AIzaSyDNLSXa9BR80k48rPuU7TwhDt8pONptp60`
- [x] API tested successfully with gemini-2.5-flash model
- [x] Workflow JSON created

---

## 🚀 STEP-BY-STEP SETUP

### Step 1: Access Your n8n Instance

#### Option A: Render (Production)
```
1. Go to your Render dashboard
2. Find your n8n service
3. Click "Open" to access n8n UI
4. Login with your credentials
```

#### Option B: Localhost (Testing)
```bash
# If running n8n locally
docker-compose up -d n8n
# OR
n8n start

# Access at: http://localhost:5678
```

---

### Step 2: Add Environment Variables to n8n

#### 2.1 On Render:
```
1. Go to n8n service in Render
2. Click "Environment" tab
3. Add these variables:

GEMINI_API_KEY=AIzaSyDNLSXa9BR80k48rPuU7TwhDt8pONptp60
PINECONE_INDEX_NAME=your-existing-index-name
GDRIVE_FOLDER_BLOGS=1unRpoP0RlPRqYZTWGFEDgZwe2POZCFoJ
GDRIVE_FOLDER_DOCS=1VJSe21kbUEJDOtjMfYtu5xTOhI5YADXz
GDRIVE_FOLDER_PROJECTS=1lUuek6fF2wdeGF_2Y8q2XudO2ZshLvdo

4. Click "Save Changes"
5. Service will redeploy (wait ~2 mins)
```

#### 2.2 On Localhost:
```bash
# Add to your .env file in n8n directory
echo "GEMINI_API_KEY=AIzaSyDNLSXa9BR80k48rPuU7TwhDt8pONptp60" >> .env
echo "PINECONE_INDEX_NAME=your-index-name" >> .env
echo "GDRIVE_FOLDER_BLOGS=1unRpoP0RlPRqYZTWGFEDgZwe2POZCFoJ" >> .env
echo "GDRIVE_FOLDER_DOCS=1VJSe21kbUEJDOtjMfYtu5xTOhI5YADXz" >> .env
echo "GDRIVE_FOLDER_PROJECTS=1lUuek6fF2wdeGF_2Y8q2XudO2ZshLvdo" >> .env

# Restart n8n
docker-compose restart n8n
```

---

### Step 3: Setup Credentials in n8n

#### 3.1 Google Drive OAuth2
```
1. In n8n UI, click "Credentials" (top menu)
2. Click "Add Credential"
3. Search "Google Drive"
4. Select "Google Drive OAuth2 API"
5. Fill in:
   - Client ID: (from your Google Cloud Console)
   - Client Secret: (from your Google Cloud Console)
6. Click "Connect my account"
7. Authorize access
8. Save credential
9. Note the credential name (you'll need it)
```

**If you don't have OAuth credentials yet:**
```
1. Go to: https://console.cloud.google.com/apis/credentials
2. Create OAuth 2.0 Client ID
3. Add redirect URI: https://your-n8n-url.onrender.com/rest/oauth2-credential/callback
4. Copy Client ID and Secret
```

#### 3.2 OpenAI API
```
1. Click "Add Credential"
2. Search "OpenAI"
3. Select "OpenAI API"
4. Enter API Key: (your existing OpenAI key from .env)
5. Save credential
```

#### 3.3 Pinecone API
```
1. Click "Add Credential"
2. Search "Pinecone"
3. Select "Pinecone API"
4. Enter:
   - API Key: (your existing Pinecone key from .env)
   - Environment: (e.g., us-east-1-aws)
5. Save credential
```

---

### Step 4: Import Workflow

#### 4.1 Import the JSON file
```
1. In n8n UI, click "Workflows" (top menu)
2. Click "Import from File" button
3. Select: n8n-gdrive-rag-workflow.json
4. Click "Import"
```

#### 4.2 Update Credential References
```
After import, you need to connect credentials:

1. Click on "Download from Google Drive" node
2. In "Credential to connect with" dropdown
3. Select your Google Drive credential
4. Click "Save"

5. Click on "Generate Embeddings" node
6. Select your OpenAI credential
7. Click "Save"

8. Click on "Upsert to Pinecone" node
9. Select your Pinecone credential
10. Click "Save"
```

---

### Step 5: Configure Test File

#### 5.1 Get a Test File ID from Google Drive
```
1. Go to one of your Google Drive folders (blogs, docs, or projects)
2. Right-click on a file
3. Click "Share" → "Copy link"
4. Extract file ID from URL:
   https://drive.google.com/file/d/FILE_ID_HERE/view

Example: If URL is https://drive.google.com/file/d/1abc2def3ghi/view
File ID is: 1abc2def3ghi
```

#### 5.2 Update Workflow
```
1. In n8n workflow, click "Set Test File" node
2. Update the fileId field:
   - Remove: "PASTE_YOUR_TEST_FILE_ID_HERE"
   - Paste your actual file ID
3. Update folder field to match (blogs, docs, or projects)
4. Click "Save"
```

---

### Step 6: Test the Workflow

#### 6.1 Execute Workflow
```
1. Click "Execute Workflow" button (top right)
2. Wait for execution (may take 1-2 minutes)
3. Watch each node turn green as it completes
```

#### 6.2 Monitor Execution
```
For each node, you should see:

✅ Manual Trigger: Executed
✅ Set Test File: Shows fileId and folder
✅ Download from Google Drive: Shows binary data
✅ Gemini Extract Text: Shows extracted markdown text
✅ Chunk Text: Shows array of chunks (5-15 items)
✅ Generate Embeddings: Shows embedding vectors
✅ Upsert to Pinecone: Confirms upload
✅ Log Result: Shows success summary
```

#### 6.3 Check for Errors
```
If any node fails:
- Click on the red node
- Check error message
- Common issues:
  - Credentials not connected
  - File ID incorrect
  - API quota exceeded (wait and retry)
  - Environment variables not set
```

---

### Step 7: Verify in Pinecone

#### 7.1 Check Vectors Created
```
1. Go to: https://app.pinecone.io/
2. Select your index
3. Click "Query"
4. In filter, search for:
   vectorType = "gdrive"
5. Should see your new vectors
```

#### 7.2 Check Vector Details
```
Click on any vector to see metadata:
- id: gdrive#blogs#YOUR_FILE_ID#chunk0
- metadata.folder: blogs
- metadata.vectorType: gdrive
- metadata.text: (chunk content)
- metadata.chunk_index: 0
- metadata.total_chunks: 10 (example)
```

---

### Step 8: Test with Chatbot

#### 8.1 Ask Question About Content
```
1. Go to your website
2. Open AI chatbot
3. Ask a specific question about the test file content
4. Chatbot should retrieve and use the new vectors
```

#### 8.2 Verify Vector Retrieval
```
Check your chatbot backend logs to see:
- Query was sent to Pinecone
- Vectors with "gdrive" were retrieved
- Context was used in response
```

---

## 🎉 SUCCESS CRITERIA

Your setup is complete when:
- [ ] Workflow executes without errors
- [ ] All 8 nodes turn green
- [ ] Log shows: "Successfully processed file"
- [ ] Vectors appear in Pinecone with `gdrive#` prefix
- [ ] Metadata is correct (folder, vectorType, etc.)
- [ ] Chatbot can answer questions about the file

---

## 🔧 TROUBLESHOOTING

### Issue: "Google Drive credential not found"
**Solution**:
```
1. Re-create Google Drive OAuth2 credential
2. Make sure to authorize access
3. Update workflow node to use new credential
```

### Issue: "Gemini API quota exceeded"
**Solution**:
```
1. Wait 60 seconds and retry
2. Check usage at: https://ai.dev/usage
3. Gemini free tier: 15 RPM, should be plenty
```

### Issue: "No vectors in Pinecone"
**Solution**:
```
1. Check Pinecone node executed successfully
2. Verify PINECONE_INDEX_NAME env var is correct
3. Check Pinecone credential has correct API key
4. Try querying with filter: vectorType = "gdrive"
```

### Issue: "Gemini returns empty text"
**Solution**:
```
1. Check file is readable (not password-protected)
2. Verify file type is supported (PDF, PPTX, DOCX)
3. Try with a simpler test file first
4. Check Gemini node output for error messages
```

### Issue: "Chunks not created"
**Solution**:
```
1. Check "Chunk Text" node output
2. Verify markdown text from Gemini is not empty
3. Check console for JavaScript errors
4. Text might be too short (<1000 chars)
```

---

## 📊 NEXT STEPS AFTER SUCCESS

Once you confirm the workflow works:

### 1. Process More Files
```
- Update "Set Test File" node with different file IDs
- Run workflow for each file
- Or proceed to Phase B to automate multi-file processing
```

### 2. Add Schedule Trigger (Phase B.1)
```
- Replace Manual Trigger with Schedule Trigger
- Set to run daily at 6 AM
- Automate the entire pipeline
```

### 3. Add Multi-folder Support (Phase B.3)
```
- Modify workflow to loop through all 3 folders
- Process all files automatically
- Skip unchanged files (change detection)
```

### 4. Build Website Admin UI (Phase C)
```
- Add API routes for stats and manual trigger
- Create admin page to monitor sync
- Add "Sync Now" button
```

---

## 🚨 IMPORTANT NOTES

### Rate Limits
```
Gemini API (Free Tier):
- 15 requests per minute
- 1 million tokens per minute
- 1500 requests per day

For your use case:
- Daily batch: ~10-20 files
- Well within limits ✅
```

### Cost Monitoring
```
OpenAI Embeddings:
- text-embedding-3-small: $0.00002 per 1K tokens
- ~10 files × 15 chunks × 250 tokens = 37,500 tokens
- Cost: ~$0.75 per batch
- Very affordable ✅

Pinecone:
- Free tier: 100K vectors
- Your usage: ~150-300 vectors after full sync
- No cost ✅
```

### Security
```
API Keys in Environment:
✅ Stored in Render environment variables
✅ Not committed to code
✅ Accessible only in n8n
✅ Can rotate anytime

Regenerate Gemini key if needed:
https://aistudio.google.com/apikey
```

---

## 📞 NEED HELP?

If you encounter issues:

1. **Check n8n execution logs** - detailed error messages
2. **Review this guide** - step-by-step troubleshooting
3. **Test each node individually** - isolate the problem
4. **Share error message** - I can help debug

---

## ✅ CHECKLIST

### Setup Completed:
- [ ] n8n accessed (Render or localhost)
- [ ] Environment variables added
- [ ] Google Drive credential created
- [ ] OpenAI credential created
- [ ] Pinecone credential created
- [ ] Workflow imported
- [ ] Credentials connected to nodes
- [ ] Test file ID configured

### Testing Completed:
- [ ] Workflow executed successfully
- [ ] All nodes green
- [ ] Vectors in Pinecone
- [ ] Chatbot tested
- [ ] Success! 🎉

---

**Current Status**: Ready to Import & Test
**Workflow File**: [n8n-gdrive-rag-workflow.json](n8n-gdrive-rag-workflow.json)
**Estimated Time to Working**: 30 minutes
