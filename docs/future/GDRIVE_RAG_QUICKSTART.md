# Google Drive RAG Pipeline - Quick Start Guide

**Last Updated**: December 2, 2025
**Status**: Phase A.2 - Ready to get Gemini API Key

---

## ✅ COMPLETED

### Phase A.1: Google Drive Setup
- [x] Created folder structure
- [x] Uploaded sample files (1 per folder)
- [x] Got folder IDs:
  - **blogs**: `1unRpoP0RlPRqYZTWGFEDgZwe2POZCFoJ`
  - **docs**: `1VJSe21kbUEJDOtjMfYtu5xTOhI5YADXz`
  - **projects**: `1lUuek6fF2wdeGF_2Y8q2XudO2ZshLvdo`

### Architecture Decision
- [x] Switched from Docling to **Gemini API**
- **Reason**: Docling needs >512MB RAM (Render Free only 512MB)
- **Benefits**: Simpler, free, better OCR, no deployment needed

---

## 🎯 NEXT STEPS FOR YOU

### Step 1: Get Gemini API Key (5 minutes)

#### 1.1 Visit Google AI Studio
```
Open: https://aistudio.google.com/apikey
```

#### 1.2 Create API Key
```
1. Click "Create API Key" button
2. Select existing Google Cloud project (or create new)
3. Copy the API key (starts with "AIza...")
```

#### 1.3 Test API Key (Optional but recommended)
```bash
# Replace YOUR_API_KEY with actual key
curl "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=YOUR_API_KEY" \
  -H 'Content-Type: application/json' \
  -d '{
    "contents": [{
      "parts": [{
        "text": "Say hello"
      }]
    }]
  }'

# Should return JSON with "Hello!" message
```

---

### Step 2: Store API Key Securely

#### 2.1 For n8n (Render)
```
1. Go to your n8n Render service
2. Environment → Add Environment Variable
3. Name: GEMINI_API_KEY
4. Value: (paste your API key)
5. Save Changes
```

#### 2.2 For Local Testing (Optional)
```bash
# Add to your .env.local:
echo "GEMINI_API_KEY=your-api-key-here" >> .env.local
```

---

### Step 3: Share API Key with Me

Once you have the Gemini API key, share it with me so I can help you:
1. Create the n8n workflow
2. Test with one of your sample files
3. Verify vectors in Pinecone

**Security Note**: You can regenerate the key anytime at https://aistudio.google.com/apikey

---

## 📊 WHAT HAPPENS NEXT (Phase A.3)

After you get the API key, I will:

### 1. Create n8n Workflow
```
[Manual Trigger]
  → [Set Test File ID]
  → [Google Drive: Download File]
  → [Gemini: Upload File]
  → [Gemini: Extract Text as Markdown]
  → [Chunk Text (1000 chars)]
  → [OpenAI: Generate Embeddings]
  → [Pinecone: Upsert Vectors]
  → [Log Results]
```

### 2. Test with Your Sample File
- Pick 1 sample file from /blogs/
- Run workflow
- Verify vectors created

### 3. Verify in Pinecone
- Check vectors exist with ID: `gdrive#blogs#...`
- Verify metadata correct

### 4. Test in Chatbot
- Ask question about sample file content
- Verify chatbot uses new vectors

---

## 🔧 GEMINI API CAPABILITIES

### What Gemini Can Do:
✅ Extract text from PDFs (including scanned with OCR)
✅ Extract text from PPTX slides
✅ Extract text from images (PNG, JPG)
✅ Preserve document structure
✅ Handle tables and layouts
✅ Native multimodal understanding

### Free Tier Limits:
- **15 requests per minute** (plenty for daily batch)
- **1 million tokens per minute**
- **1500 requests per day**
- **Perfect for your use case!**

### Models We'll Use:
- `gemini-2.0-flash-exp` - Fast, excellent quality, FREE
- Best for document processing
- Beats Docling in OCR quality

---

## 💡 WHY GEMINI > DOCLING

| Feature | Docling (Original) | Gemini API (Current) |
|---------|-------------------|----------------------|
| **Deployment** | Render service needed | ❌ | ✅ No deployment |
| **Memory** | >512MB required | ❌ | ✅ N/A (API) |
| **Cost** | $7/month or fails | ❌ | ✅ Free |
| **OCR Quality** | Good | ✔️ | ✅ Excellent |
| **Setup Time** | 4-6 hours | ❌ | ✅ 5 minutes |
| **Maintenance** | Need to monitor | ❌ | ✅ Zero |
| **Cold Start** | 30-60s delay | ❌ | ✅ None |

**Decision**: Gemini is **simpler, safer, more effective** ✅

---

## 📋 CHECKLIST

### Phase A.2: Setup Gemini (YOU DO THIS)
- [ ] Visit https://aistudio.google.com/apikey
- [ ] Create API key
- [ ] Test API key with curl (optional)
- [ ] Add to n8n environment variables
- [ ] Share key with Claude Code

### Phase A.3: Build Workflow (I DO THIS)
- [ ] Create n8n workflow with Gemini nodes
- [ ] Configure all 9 nodes
- [ ] Test with 1 sample file
- [ ] Verify vectors in Pinecone
- [ ] Test with chatbot

---

## ❓ FAQ

### Q: Is Gemini API free forever?
**A**: Google offers generous free tier (15 RPM). For your use case (daily batch processing), you'll stay well within free limits.

### Q: What if we hit rate limits?
**A**: 15 RPM = 900 files per hour. Your daily batch will process maybe 10-20 files max. No risk.

### Q: Can Gemini handle scanned PDFs?
**A**: Yes! Gemini has excellent OCR, often better than Docling.

### Q: What about PPTX with images?
**A**: Gemini handles PPTX natively, including images and complex layouts.

### Q: Can we switch back to Docling later?
**A**: Yes, but you won't want to. Gemini is simply better for this use case.

---

## 🚀 READY?

Once you have your Gemini API key, let me know and we'll immediately proceed to Phase A.3!

The whole workflow should be running in < 1 hour after you get the key. 🎯

---

**Current Status**: ⏸️ Waiting for Gemini API Key
**Next Action**: Get API key from https://aistudio.google.com/apikey
**ETA to Working Pipeline**: < 1 hour after API key obtained
