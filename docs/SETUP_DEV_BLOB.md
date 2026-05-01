# Setup Development Vercel Blob Storage

⚠️ **NOTE: THIS GUIDE IS OPTIONAL**

**Decision:** The project is using **shared blob storage** for both production and development environments.

**Why?**
- Single developer project
- Infrequent file uploads
- Cost-effective (no additional storage needed)
- Easy to manage with naming convention

**Best Practice:** Prefix test files with `test-` or `dev-` (e.g., `test-profile.jpg`, `dev-project-image.png`)

**If you still want separate blob storage, follow the guide below.**

---

## Original Guide: Create Separate Blob Storage

**Purpose:** Create a separate Vercel Blob storage for localhost development to prevent test file uploads from cluttering production storage.

---

## Why This Is Important

Your app uses Vercel Blob for file uploads:
- Production storage: Uses token in `.env.production`
- Development storage: Needs separate token (to be created)

**Without separation:**
- Test file uploads → stored with production files
- Unnecessary storage costs
- Difficult to manage (can't distinguish test vs production files)
- Risk of accidentally deleting production files when cleaning up

---

## What Uses Vercel Blob?

Files using Blob storage:
- `lib/documentManager.ts` - Document uploads (>4.5MB)
- `app/api/admin/content/about/upload-cv/route.ts` - CV uploads
- `app/api/admin/content/about/upload-photo/route.ts` - Profile photos
- `app/api/admin/upload/image/route.ts` - Image uploads
- `app/api/admin/content/projects/upload/route.ts` - Project images

---

## Step-by-Step Setup

### 1. Login to Vercel Dashboard

Go to: https://vercel.com/hungreos-projects/hungreo-website

Navigate to your project: **hungreo-website**

---

### 2. Create Development Blob Store

1. Go to **Storage** tab in left sidebar
2. Click **"Create Database"**
3. Select **"Blob"**
4. Fill in the form:

   **Store Name:** `hungreo-blob-dev`

   **Region:** Choose closest region (Singapore recommended)
   - Should match your production blob region if possible

5. Click **"Create"**

---

### 3. Connect to Development Environment

After creating the blob store:

1. You'll see a prompt to **"Connect to Project"**
2. Select **Environment:** `Development` (IMPORTANT!)
3. This will:
   - Generate a new `BLOB_READ_WRITE_TOKEN`
   - Add it to your project's Development environment variables

---

### 4. Get the Development Token

**Option A: Via Vercel Dashboard**

1. Go to **Settings** → **Environment Variables**
2. Find `BLOB_READ_WRITE_TOKEN`
3. Check that it has different values for:
   - **Production:** `vercel_blob_rw_DOX8eFze...` (existing)
   - **Development:** `vercel_blob_rw_XXXXXXXX...` (new)

**Option B: Via Vercel CLI**

```bash
# Pull latest environment variables
vercel env pull .env.local

# This will update your .env.local with the new dev blob token
```

---

### 5. Verify Environment Variables

Check your `.env.local`:

```bash
# Should have the NEW development blob token
BLOB_READ_WRITE_TOKEN=vercel_blob_rw_XXXXXXXX...
```

**NOT the production token!** Production token starts with: `vercel_blob_rw_DOX8eFze...`

---

### 6. Update Production Environment (Ensure Separation)

Verify `.env.production` still has production token:

```bash
BLOB_READ_WRITE_TOKEN=vercel_blob_rw_DOX8eFze0xmUnVT6_OhCgLFYi3Sw4heV9vlWnkKPStORKTu
```

This ensures production deployments use production storage.

---

## Test the Setup

### 1. Start Development Server

```bash
npm run dev
```

### 2. Test File Upload

1. Go to admin dashboard: `http://localhost:3000/admin`
2. Try uploading a file:
   - **About Page:** Upload profile photo or CV
   - **Projects:** Upload project image
   - **Rich Text Editor:** Upload image in blog/project content

### 3. Verify in Vercel Dashboard

1. Go to **Storage** → **Blob** → `hungreo-blob-dev`
2. Click **"Browse Files"**
3. You should see your test uploads here (NOT in production blob)

### 4. Verify Production Unaffected

1. Go to production blob store (original)
2. Confirm no new test files appeared
3. Production files remain untouched

---

## Verification Checklist

- [ ] Created `hungreo-blob-dev` store in Vercel dashboard
- [ ] Connected to **Development** environment only
- [ ] Got new `BLOB_READ_WRITE_TOKEN` for development
- [ ] `.env.local` has development token (different from production)
- [ ] `.env.production` still has production token
- [ ] `npm run dev` starts without errors
- [ ] Uploaded test file successfully
- [ ] Test file appears in dev blob (not production blob)

---

## Troubleshooting

### Error: "Blob token is invalid"

**Cause:** Wrong token or token not configured

**Solution:**
1. Run `vercel env pull .env.local` to get latest token
2. Restart dev server after updating `.env.local`
3. Check Vercel dashboard - blob store must be "Active"

---

### Test files appearing in production storage

**Cause:** Still using production blob token in `.env.local`

**Solution:**
1. Check `.env.local` - must have development token
2. Development token is DIFFERENT from production token
3. Compare first 20 characters to verify they're different
4. Restart dev server

---

### Cannot upload files

**Cause:** Blob store not properly connected

**Solution:**
1. Go to Vercel dashboard → Storage → Blob
2. Click on `hungreo-blob-dev`
3. Go to **Settings** tab
4. Verify "Connected Environments" includes **Development**
5. If not, click "Connect to Environment" → Select Development

---

### Production uploads failing after setup

**Cause:** Production environment missing blob token

**Solution:**
1. Go to Vercel dashboard → Settings → Environment Variables
2. Find `BLOB_READ_WRITE_TOKEN`
3. Ensure it exists for **Production** environment
4. Value should be: `vercel_blob_rw_DOX8eFze0xmUnVT6...`
5. Redeploy production if needed

---

## Storage Limits & Costs

**Vercel Blob Pricing (Hobby Plan):**
- First 1 GB: Free
- Additional storage: $0.15/GB/month
- Bandwidth: $0.40/GB

**Recommended:**
- Keep development blob < 100 MB
- Regularly clean up test files
- Use small test images/files when possible

**To clean up test files:**
1. Vercel dashboard → Storage → `hungreo-blob-dev`
2. Browse files
3. Select and delete old test files

---

## File Naming Convention (Optional)

To easily identify test files, consider prefixing uploads:

**Development:**
- `test-profile-photo.jpg`
- `dev-project-image.png`

**Production:**
- Normal filenames without prefix

This makes it obvious which files are safe to delete.

---

## Production Safety

**Production blob remains unchanged:**
- Token: `vercel_blob_rw_DOX8eFze...`
- Used only when deployed to Vercel
- `.env.production` has production token

**Localhost always uses dev blob:**
- Token: Different from production
- Safe to delete all files anytime
- Test uploads never reach production

---

## Alternative: Manual Token Setup

If automatic connection doesn't work:

1. Create blob store: `hungreo-blob-dev`
2. Go to store Settings → **Tokens**
3. Click **"Create Token"**
4. Select **Read & Write** permissions
5. Copy the generated token
6. Add to `.env.local`:
   ```bash
   BLOB_READ_WRITE_TOKEN=vercel_blob_rw_YOUR_NEW_TOKEN
   ```

---

## Cost Estimate

**Typical Development Usage:**
- ~50-100 MB test files
- ~100-200 test uploads/month

**Estimated Cost:** $0/month (within free tier)

**If you exceed 1 GB:**
- ~1-2 GB total: ~$0.15-0.30/month
- Still very affordable

---

## Next Steps

After Blob separation is complete:

1. ✅ Pinecone separated (done)
2. ✅ Vercel Blob separated (done)
3. Test full development workflow
4. Update `.env.example` with documentation
5. Consider separating OpenAI/YouTube keys (optional)

---

## Support

**Vercel Blob Documentation:** https://vercel.com/docs/storage/vercel-blob
**Dashboard:** https://vercel.com/hungreos-projects/hungreo-website/stores
**Pricing:** https://vercel.com/docs/storage/vercel-blob/usage-and-pricing

For questions, refer to the main `ENVIRONMENT_SEPARATION_GUIDE.md`.
