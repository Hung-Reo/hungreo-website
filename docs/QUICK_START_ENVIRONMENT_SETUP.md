# Quick Start: Environment Setup (Prod vs Localhost)

**TL;DR:** Follow these steps to safely separate production and localhost development environments.

---

## 🎯 What You Need to Do

### ✅ Already Done
- **Redis/KV Database** - Separated! Development uses `intent-peacock-38586`, production uses `large-heron-11467`

### 🔴 MUST DO (Critical - 15 minutes)

#### Create Pinecone Development Index

**Why:** Prevent test embeddings from polluting production chatbot search results.

**Steps:**
1. Go to https://app.pinecone.io/
2. Create new index:
   - Name: `hungreo-website-dev`
   - Dimensions: `1536`
   - Metric: `cosine`
   - Pod: Starter (free)
3. Wait for "Active" status
4. Done! Your `.env.local` is already configured

**Verification:**
```bash
# Check .env.local has this line:
PINECONE_INDEX_NAME=hungreo-website-dev
```

**Detailed guide:** See [SETUP_DEV_PINECONE.md](SETUP_DEV_PINECONE.md)

---

## 🟢 Shared Resources (Manageable)

### Vercel Blob Storage
- **Decision:** Using shared blob for both environments
- **Why:** Single developer, infrequent uploads, cost-effective
- **Best Practice:** Prefix test files with `test-` or `dev-`
- **Cleanup:** Regularly delete test files from Vercel dashboard

### OpenAI API
- **Current:** Shared between prod/dev
- **Impact:** Development testing costs money
- **Workaround:** Just be careful when testing chatbot
- **Optional Separation:** Create separate API key (~$5-10/month)

### YouTube API
- **Current:** Shared quota (10k/day)
- **Impact:** Low (don't import videos often)
- **Workaround:** Test sparingly

### Email Services
- **Current:** Shared Resend + Gmail
- **Impact:** Low (emails only go to you)
- **Workaround:** Delete test emails manually

---

## 📋 Quick Checklist

**Before starting development:**
- [ ] `.env.local` exists (copied from `.env.example`)
- [ ] Created Pinecone dev index: `hungreo-website-dev`
- [ ] Verify `.env.local` uses:
  - `PINECONE_INDEX_NAME=hungreo-website-dev`
  - `KV_REST_API_URL=https://intent-peacock-38586.upstash.io`
  - `BLOB_READ_WRITE_TOKEN=vercel_blob_rw_DOX8eFze...` (shared - OK)

**First time testing:**
- [ ] `npm run dev` starts without errors
- [ ] Upload test document → verify in dev Pinecone index (not prod)
- [ ] Upload test image with `test-` prefix → easy to identify later
- [ ] Check production Pinecone → no test vectors appear

---

## 🚨 Common Mistakes

### ❌ Using Production Pinecone Index
**Problem:** `.env.local` has `PINECONE_INDEX_NAME=hungreo-website`

**Fix:**
```bash
# Change to:
PINECONE_INDEX_NAME=hungreo-website-dev
```

---

### ℹ️ Blob Storage is Shared
**Note:** We're intentionally using shared blob storage

**Best Practice:**
- Prefix test files: `test-profile.jpg`, `dev-image.png`
- Makes cleanup easy later
- No separation needed for single developer

---

### ❌ Using Production Redis
**Problem:** `.env.local` has `large-heron-11467` URL

**Fix:**
```bash
# Should be:
KV_REST_API_URL=https://intent-peacock-38586.upstash.io
KV_REST_API_TOKEN=AZa6AAIncDIyZWUxMjU1ZWM2YzI0OTBmOTg4N2JhNmFmZGRmZDZiMnAyMzg1ODY
```

---

## 📊 Environment Variables Summary

| Variable | Production | Development |
|----------|-----------|-------------|
| `PINECONE_INDEX_NAME` | `hungreo-website` | `hungreo-website-dev` ⚠️ |
| `KV_REST_API_URL` | `large-heron-11467` | `intent-peacock-38586` ✅ |
| `BLOB_READ_WRITE_TOKEN` | Shared | Shared ✅ |
| `OPENAI_API_KEY` | Shared | Shared ✅ |
| `YOUTUBE_API_KEY` | Shared | Shared ✅ |

⚠️ = Must be different
✅ = OK (separated or intentionally shared)

---

## 🎓 Understanding the Setup

### What Happens in Production?

When deployed to Vercel:
1. Uses `.env.production` variables
2. Connects to:
   - Pinecone: `hungreo-website` index
   - Redis: `large-heron-11467` database
   - Blob: Production storage
3. Users see production data only

### What Happens in Localhost?

When running `npm run dev`:
1. Uses `.env.local` variables (highest priority)
2. Connects to:
   - Pinecone: `hungreo-website-dev` index
   - Redis: `intent-peacock-38586` database
   - Blob: Development storage
3. Safe to test, no production impact

---

## 💰 Cost Impact

| Resource | Before | After | Change |
|----------|--------|-------|--------|
| Redis | Free tier | Free tier | $0 |
| Pinecone | Free tier | Free tier | $0 |
| Vercel Blob | ~$5/mo | ~$5/mo | $0 (shared) |
| OpenAI | Shared | Shared | $0 |
| **Total** | ~$5/mo | ~$5/mo | **$0** |

**Zero additional cost!** Only Pinecone dev index added (free tier).

---

## 🔄 Testing Your Setup

### 1. Start Development Server
```bash
npm run dev
```

### 2. Login to Admin
Go to: http://localhost:3000/admin

Email: `hungreo2005@gmail.com`
Password: `Admin@2025!Secure`

### 3. Test Document Upload
1. Go to Documents section
2. Upload a test PDF
3. Approve it (creates embeddings)

### 4. Verify Separation
**Pinecone:**
- Open https://app.pinecone.io/
- Check `hungreo-website-dev` index → should have new vectors
- Check `hungreo-website` index → should be unchanged ✅

**Redis:**
- Open https://console.upstash.com/
- Check `intent-peacock-38586` → should have test data
- Check `large-heron-11467` → should be unchanged ✅

**Blob (Shared):**
- Open https://vercel.com/hungreos-projects/hungreo-website/stores
- All files in one blob store (intentional)
- Look for `test-` prefixed files to identify dev uploads

### 5. Test Chatbot
Ask chatbot about your test document → it should retrieve from dev index only.

---

## 📚 Full Documentation

- **Overview:** [ENVIRONMENT_SEPARATION_GUIDE.md](ENVIRONMENT_SEPARATION_GUIDE.md)
- **Pinecone Setup:** [SETUP_DEV_PINECONE.md](SETUP_DEV_PINECONE.md)
- **Blob Setup:** [SETUP_DEV_BLOB.md](SETUP_DEV_BLOB.md)
- **Environment Variables:** [.env.example](.env.example)

---

## 🆘 Need Help?

### Quick Fixes

**Can't start dev server:**
```bash
# Pull latest env vars
vercel env pull .env.local

# Restart server
npm run dev
```

**Test data in production:**
```bash
# Check .env.local uses dev resources:
cat .env.local | grep PINECONE_INDEX_NAME
# Should output: hungreo-website-dev

cat .env.local | grep KV_REST_API_URL
# Should output: https://intent-peacock-38586.upstash.io
```

**Still having issues:**
1. Delete `.env.local`
2. Copy from `.env.example`
3. Run `vercel env pull .env.local`
4. Manually set `PINECONE_INDEX_NAME=hungreo-website-dev`
5. Restart server

---

## ✅ You're Ready!

After completing the MUST-DO steps:
- ✅ Pinecone dev index created
- ✅ Blob dev storage created
- ✅ `.env.local` configured correctly
- ✅ Tested and verified separation

**You can now safely develop on localhost without affecting production!**

Happy coding! 🚀
