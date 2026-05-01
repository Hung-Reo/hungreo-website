# Setup Development Pinecone Index

**Purpose:** Create a separate Pinecone index for localhost development to prevent test data from polluting production search results.

---

## Why This Is Critical

Your chatbot uses Pinecone for RAG (Retrieval Augmented Generation):
- Production index: `hungreo-website`
- Development index: `hungreo-website-dev` (to be created)

**Without separation:**
- Test embeddings on localhost → contaminate production index
- Users see test/garbage data in chatbot responses
- Cannot safely test document uploads or scraping

---

## Step-by-Step Setup

### 1. Login to Pinecone Dashboard

Go to: https://app.pinecone.io/

Use your existing Pinecone account (login at app.pinecone.io)

---

### 2. Create New Index

1. Click **"Create Index"** button
2. Fill in the form:

   **Index Name:** `hungreo-website-dev`

   **Dimensions:** `1536`
   - This matches OpenAI's `text-embedding-3-small` model

   **Metric:** `cosine`
   - For semantic similarity search

   **Region:** Choose closest to you (Singapore recommended for Asia)

   **Pod Type:** `Starter` (Free tier)
   - 1 pod, 100K vectors free
   - Sufficient for development testing

3. Click **"Create Index"**
4. Wait 1-2 minutes for index to be ready (status: Active)

---

### 3. Verify Configuration

After creation, verify these settings match production:

| Setting | Value | Must Match Production |
|---------|-------|----------------------|
| Index Name | `hungreo-website-dev` | No (dev-specific) |
| Dimensions | `1536` | ✅ Yes |
| Metric | `cosine` | ✅ Yes |
| Pod Type | Starter | No (can differ) |

**Important:** Dimensions and metric MUST match production or embeddings won't work!

---

### 4. Confirm Environment Variables

Your `.env.local` is already configured:

```bash
PINECONE_API_KEY=your-pinecone-api-key-here
PINECONE_INDEX_NAME=hungreo-website-dev
```

**No code changes needed!** The app will automatically use the dev index on localhost.

---

### 5. Test the Setup

1. Start development server:
   ```bash
   npm run dev
   ```

2. Go to admin dashboard: `http://localhost:3000/admin`

3. Test document upload:
   - Go to Documents section
   - Upload a test document
   - Approve it (this creates embeddings in Pinecone)

4. Verify in Pinecone dashboard:
   - Open `hungreo-website-dev` index
   - Check "Vectors" tab
   - You should see new vectors appearing

5. Test chatbot:
   - Ask a question related to your test document
   - Chatbot should retrieve from dev index (not production)

---

## Verification Checklist

- [ ] Created `hungreo-website-dev` index in Pinecone dashboard
- [ ] Index dimensions = `1536`
- [ ] Index metric = `cosine`
- [ ] Index status = `Active`
- [ ] `.env.local` has `PINECONE_INDEX_NAME=hungreo-website-dev`
- [ ] `npm run dev` starts without errors
- [ ] Uploaded test document successfully
- [ ] Test document embeddings appear in dev index (not prod)

---

## Troubleshooting

### Error: "Index 'hungreo-website-dev' not found"

**Cause:** Index not created yet or name mismatch

**Solution:**
1. Check Pinecone dashboard - index must show "Active" status
2. Verify `.env.local` has exact name: `hungreo-website-dev` (no typos)
3. Restart dev server after env changes

---

### Error: "Dimension mismatch"

**Cause:** Index created with wrong dimensions

**Solution:**
1. Delete the incorrect index
2. Recreate with dimensions = `1536`
3. Cannot change dimensions after creation!

---

### Test data appearing in production

**Cause:** Still using production index name

**Solution:**
1. Check `.env.local`: must be `hungreo-website-dev`
2. NOT `hungreo-website` (production)
3. Restart dev server
4. Clear browser cache if needed

---

### Free tier limits exceeded

**Pinecone Starter Limits:**
- 1 pod per index
- 100,000 vectors max
- 2GB storage

**If exceeded:**
1. Delete old test vectors from dev index
2. Use Pinecone's "Delete All" feature for dev index
3. Or upgrade to paid tier (~$70/month for serverless)

---

## Production Safety

**Production index remains unchanged:**
- Name: `hungreo-website`
- Used only when deployed to Vercel
- `.env.production` has `PINECONE_INDEX_NAME=hungreo-website`

**Localhost always uses dev index:**
- Name: `hungreo-website-dev`
- Safe to delete all vectors anytime
- Test data never reaches users

---

## Cost Estimate

- **Development Index:** Free (Starter pod)
- **Production Index:** Free (Starter pod)
- **Total:** $0/month (within free tier limits)

**Note:** If you exceed 100K vectors, you'll need to upgrade or clean up old test data.

---

## Next Steps

After Pinecone separation is complete:

1. ✅ Pinecone separated
2. ⏭️ Separate Vercel Blob storage (see `SETUP_DEV_BLOB.md`)
3. Update `.env.example` with new variables
4. Test full workflow on localhost

---

## Support

**Pinecone Documentation:** https://docs.pinecone.io/
**Dashboard:** https://app.pinecone.io/
**Free Tier Details:** https://www.pinecone.io/pricing/

For questions, refer to the main `ENVIRONMENT_SEPARATION_GUIDE.md`.
