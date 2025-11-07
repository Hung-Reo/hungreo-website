# Deployment Guide - Phase 2 Extended

Complete guide to deploy your website with all Phase 2 Extended features to Vercel.

## Prerequisites

Before deploying, ensure you have:

1. ✅ All code committed to GitHub
2. ✅ Vercel account connected to your GitHub repository
3. ✅ All required API keys (see below)

## Required API Keys & Services

### 1. OpenAI API (Required)
- **Purpose**: GPT-4o-mini for chat & embeddings
- **Get it**: https://platform.openai.com/api-keys
- **Cost**: ~$2-4/month for typical usage
- **Env var**: `OPENAI_API_KEY=sk-proj-...`

### 2. Pinecone Vector Database (Required)
- **Purpose**: Vector storage for RAG
- **Get it**: https://www.pinecone.io/
- **Setup**: Create index with 1536 dimensions, cosine metric
- **Cost**: FREE (100K vectors)
- **Env vars**:
  - `PINECONE_API_KEY=pcsk_...`
  - `PINECONE_INDEX_NAME=hungreo-website`

### 3. YouTube Data API v3 (Required)
- **Purpose**: Fetch video metadata
- **Get it**: https://console.cloud.google.com/
- **Setup**: Enable YouTube Data API v3, create API key
- **Cost**: FREE (10K quota/day)
- **Env var**: `YOUTUBE_API_KEY=AIzaSy...`

### 4. Vercel KV (Required for Analytics)
- **Purpose**: Chat logs, analytics, document/video storage
- **Get it**: Auto-setup in Vercel dashboard
- **Setup**: Storage → KV → Create Database
- **Cost**: FREE (256MB, 100K commands/day)
- **Env vars**: Auto-injected by Vercel
  - `KV_URL`
  - `KV_REST_API_URL`
  - `KV_REST_API_TOKEN`
  - `KV_REST_API_READ_ONLY_TOKEN`

### 5. Vercel Blob (Required for Large Files)
- **Purpose**: Store documents >4.5MB
- **Get it**: Auto-setup in Vercel dashboard
- **Setup**: Storage → Blob → Create Store
- **Cost**: FREE (100GB bandwidth/month)
- **Env var**: `BLOB_READ_WRITE_TOKEN` (auto-injected)

### 6. Resend API (Optional - Email Notifications)
- **Purpose**: Email notifications when chatbot needs help
- **Get it**: https://resend.com/
- **Setup**: Create account, get API key, verify domain
- **Cost**: FREE (100 emails/day)
- **Env vars**:
  - `RESEND_API_KEY=re_...`
  - `EMAIL_FROM=chatbot@yourdomain.com` (use verified domain)

### 7. NextAuth Configuration (Required)
- **Purpose**: Admin authentication
- **Env vars**:
  - `NEXTAUTH_SECRET=<generate-random-string>`  (run: `openssl rand -base64 32`)
  - `NEXTAUTH_URL=https://your-site.vercel.app`
  - `ADMIN_EMAIL=hungreo2005@gmail.com`
  - `ADMIN_PASSWORD_HASH=<bcrypt-hash>` (see below)

### 8. Site URL (Required)
- **Purpose**: Used for scraping and email links
- **Env var**: `NEXT_PUBLIC_SITE_URL=https://hungreo.vercel.app`

## Step-by-Step Deployment

### Step 1: Generate Admin Password Hash

Run this locally to generate password hash:

```bash
node -e "const bcrypt = require('bcryptjs'); bcrypt.hash('your-secure-password', 10).then(console.log)"
```

Copy the output hash for `ADMIN_PASSWORD_HASH` env var.

### Step 2: Set Up Vercel Project

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "Add New Project"
3. Import your GitHub repository
4. Configure project:
   - **Framework Preset**: Next.js
   - **Root Directory**: `./`
   - **Build Command**: `npm run build`
   - **Output Directory**: `.next`

### Step 3: Add Environment Variables

In Vercel Dashboard → Settings → Environment Variables, add all variables:

#### Required Variables
```bash
# OpenAI
OPENAI_API_KEY=sk-proj-your-key-here

# Pinecone
PINECONE_API_KEY=pcsk-your-key-here
PINECONE_INDEX_NAME=hungreo-website

# YouTube
YOUTUBE_API_KEY=AIzaSy-your-key-here

# NextAuth
NEXTAUTH_SECRET=your-generated-secret-here
NEXTAUTH_URL=https://hungreo.vercel.app
ADMIN_EMAIL=hungreo2005@gmail.com
ADMIN_PASSWORD_HASH=your-bcrypt-hash-here

# Site URL
NEXT_PUBLIC_SITE_URL=https://hungreo.vercel.app
```

#### Optional Variables (Email Notifications)
```bash
# Resend (optional)
RESEND_API_KEY=re-your-key-here
EMAIL_FROM=chatbot@hungreo.vercel.app
```

**Important**: Add these to ALL environments (Production, Preview, Development)

### Step 4: Set Up Vercel Storage

#### 4a. Create KV Database
1. Go to Storage tab in Vercel Dashboard
2. Click "Create Database" → KV
3. Name it `hungreo-kv`
4. Connect to your project
5. Vercel will auto-inject env vars

#### 4b. Create Blob Store
1. Go to Storage tab
2. Click "Create Store" → Blob
3. Name it `hungreo-blob`
4. Connect to your project
5. Vercel will auto-inject `BLOB_READ_WRITE_TOKEN`

### Step 5: Deploy

1. Click "Deploy" in Vercel
2. Wait for build to complete (~2-3 minutes)
3. Deployment successful!

### Step 6: Initialize Knowledge Base

After first deployment, run these commands locally:

#### 6a. Generate Embeddings for Blog/Projects
```bash
npx tsx scripts/generate-embeddings.ts
```

This adds your blog posts and projects to Pinecone.

#### 6b. Scrape Website Content
1. Go to `https://hungreo.vercel.app/admin/login`
2. Login with your admin credentials
3. Go to Dashboard
4. Click "Scrape Website" button
5. This adds all public pages to knowledge base

### Step 7: Verify Deployment

Test all features:

✅ **Homepage**: https://hungreo.vercel.app
✅ **Chatbot**: Click chat icon (bottom-right)
✅ **AI Tools**: https://hungreo.vercel.app/tools/youtube
✅ **Admin Dashboard**: https://hungreo.vercel.app/admin/login

## Post-Deployment Tasks

### Add Initial Content

#### 1. Upload Documents (Optional)
1. Login to admin dashboard
2. Go to Documents tab
3. Upload PDF/DOCX/TXT files
4. Review → Approve → Auto-added to Pinecone

#### 2. Import YouTube Videos (Optional)
1. Login to admin dashboard
2. Go to Videos tab
3. Click "Batch Import Videos"
4. Paste YouTube URLs (one per line)
5. Select category
6. Import → Videos appear in library
7. Click "Generate Embeddings" to add to chatbot knowledge

### Configure Email Notifications (Optional)

If you added `RESEND_API_KEY`:

1. Go to [Resend Dashboard](https://resend.com/domains)
2. Add and verify your domain
3. Update `EMAIL_FROM` to use verified domain
4. Test: Ask chatbot a question it can't answer
5. Check email: hungreo2005@gmail.com

### Monitor Usage

#### Vercel Dashboard
- **Analytics**: View page views and events
- **KV**: Monitor storage usage
- **Blob**: Monitor file storage
- **Logs**: Check for errors

#### API Dashboards
- **OpenAI**: https://platform.openai.com/usage
- **Pinecone**: https://app.pinecone.io/
- **YouTube**: https://console.cloud.google.com/apis/api/youtube.googleapis.com/quotas
- **Resend**: https://resend.com/emails

## Cost Summary

**Monthly costs** (assuming ~100 visitors, 500 chats, 50 videos):

| Service | Cost | Notes |
|---------|------|-------|
| Vercel Hosting | $0 | Hobby plan |
| Vercel KV | $0 | Free tier: 256MB, 100K commands/day |
| Vercel Blob | $0 | Free tier: 100GB bandwidth/month |
| Vercel Analytics | $0 | Included |
| OpenAI | $2-4 | Pay-as-you-go |
| Pinecone | $0 | Free tier: 100K vectors |
| YouTube API | $0 | Free tier: 10K quota/day |
| Resend | $0 | Free tier: 100 emails/day |
| **Total** | **$2-4/month** | |

## Troubleshooting

### Build Fails

**Error**: Module not found
- **Fix**: Check all imports, ensure packages installed
- **Check**: `package.json` has all dependencies

**Error**: Environment variable not set
- **Fix**: Add missing env vars in Vercel dashboard
- **Check**: Env vars set for Production environment

### Runtime Errors

**Chat API Error**: "Module not found: fs"
- **Fix**: Ensure `export const runtime = 'nodejs'` in route files
- **Files**: `/api/chat/route.ts`, `/api/youtube/route.ts`

**Pinecone Error**: "Index not found"
- **Fix**: Check `PINECONE_INDEX_NAME` matches your index name
- **Verify**: Index exists and is "Ready" in Pinecone dashboard

**KV Error**: "KV_URL not defined"
- **Fix**: Create KV database in Vercel Storage tab
- **Connect**: Link to your project

### Chat Not Working

1. Check chatbot appears (bottom-right corner)
2. Check browser console for errors (F12)
3. Verify Pinecone has vectors (run generate-embeddings script)
4. Check OpenAI API key is valid
5. Check API quotas not exceeded

### Email Notifications Not Sending

1. Check `RESEND_API_KEY` is set
2. Verify domain in Resend dashboard
3. Update `EMAIL_FROM` to verified domain
4. Check Resend logs for errors

## Security Notes

### Never Commit These to Git
- ❌ `.env.local` (in `.gitignore`)
- ❌ API keys
- ❌ Passwords
- ❌ Hashed passwords (use env vars)

### Security Best Practices
- ✅ Use strong admin password (12+ characters)
- ✅ Rotate API keys periodically
- ✅ Monitor usage for unusual activity
- ✅ Enable 2FA on all accounts (Vercel, OpenAI, etc.)
- ✅ Keep dependencies updated (`npm audit`)

## Backup Strategy

### What to Backup
1. **Git Repository**: All code (automated via GitHub)
2. **Pinecone Vectors**: Export periodically (or regenerate from content)
3. **KV Data**: Export chat logs if needed
4. **Environment Variables**: Document in password manager

### How to Backup KV Data
```bash
# Install Vercel CLI
npm i -g vercel

# Pull KV data
vercel env pull .env.production
# Then use Vercel KV SDK to export data
```

## Updating the Site

### Deploy New Changes
```bash
git add .
git commit -m "Update: description"
git push origin main
```

Vercel auto-deploys on push to main branch.

### Update Knowledge Base
- **After adding blog posts**: Run `npx tsx scripts/generate-embeddings.ts`
- **After updating pages**: Click "Scrape Website" in admin dashboard
- **After adding videos**: Use batch import in Videos tab

## Support

### Get Help
- **Vercel Docs**: https://vercel.com/docs
- **Next.js Docs**: https://nextjs.org/docs
- **OpenAI Docs**: https://platform.openai.com/docs
- **Pinecone Docs**: https://docs.pinecone.io/

### Common Issues
Check PHASE2_SETUP.md for troubleshooting tips.

---

## Quick Reference: All Environment Variables

```bash
# OpenAI
OPENAI_API_KEY=sk-proj-...

# Pinecone
PINECONE_API_KEY=pcsk_...
PINECONE_INDEX_NAME=hungreo-website

# YouTube
YOUTUBE_API_KEY=AIzaSy...

# NextAuth
NEXTAUTH_SECRET=<random-32-char-string>
NEXTAUTH_URL=https://hungreo.vercel.app
ADMIN_EMAIL=hungreo2005@gmail.com
ADMIN_PASSWORD_HASH=<bcrypt-hash-of-password>

# Site
NEXT_PUBLIC_SITE_URL=https://hungreo.vercel.app

# Vercel Storage (auto-injected)
KV_URL=<auto>
KV_REST_API_URL=<auto>
KV_REST_API_TOKEN=<auto>
KV_REST_API_READ_ONLY_TOKEN=<auto>
BLOB_READ_WRITE_TOKEN=<auto>

# Optional: Email Notifications
RESEND_API_KEY=re_...
EMAIL_FROM=chatbot@hungreo.vercel.app
```

---

**Deployment complete!** 🎉

Your website is now live with all Phase 2 Extended features:
- ✅ AI Chatbot with conversation history
- ✅ Analytics & logging
- ✅ Admin dashboard
- ✅ Document management
- ✅ YouTube video library
- ✅ Website auto-scraper
- ✅ Email notifications
