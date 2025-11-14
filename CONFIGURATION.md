# Configuration Guide
**Last Updated**: November 14, 2025

This guide provides comprehensive instructions for configuring the portfolio website for both localhost development and production deployment.

## Table of Contents

1. [Quick Start](#quick-start)
2. [Environment Variables](#environment-variables)
3. [Local Development Setup](#local-development-setup)
4. [Production Deployment](#production-deployment)
5. [Vercel KV & Blob Setup](#vercel-kv--blob-setup)
6. [Video Library Setup](#video-library-setup)
7. [Troubleshooting](#troubleshooting)
8. [Recent Updates](#recent-updates)

---

## Quick Start

### Minimum Required Setup

For basic chatbot functionality (without document management):

```bash
# 1. Clone and install
git clone <repository-url>
cd hungreo-Website
npm install

# 2. Copy environment file
cp .env.example .env.local

# 3. Add required API keys
# Edit .env.local and add:
# - OPENAI_API_KEY
# - PINECONE_API_KEY & PINECONE_INDEX_NAME
# - YOUTUBE_API_KEY
# - NEXTAUTH_SECRET

# 4. Run development server
npm run dev
```

### Full Feature Setup

For complete functionality including admin document management:

Follow the [Vercel KV & Blob Setup](#vercel-kv--blob-setup) section below.

---

## Environment Variables

### Required Variables

These are **required** for core chatbot functionality:

#### 1. OpenAI API (`OPENAI_API_KEY`)
- **Purpose**: Powers chatbot (GPT-4.1-mini) and text embeddings
- **Get it**: https://platform.openai.com/api-keys
- **Format**: `sk-...`
- **Cost**: ~$0.50-2/month for typical usage

#### 2. Pinecone Vector Database
- **Purpose**: Stores and searches document embeddings for RAG
- **Get it**: https://app.pinecone.io/
- **Variables**:
  - `PINECONE_API_KEY`: Your API key
  - `PINECONE_INDEX_NAME`: Your index name
- **Setup**:
  1. Create a free Pinecone account
  2. Create an index with:
     - **Dimensions**: 1536 (for text-embedding-3-small)
     - **Metric**: cosine
  3. Copy your API key and index name

#### 3. YouTube Data API v3 (`YOUTUBE_API_KEY`)
- **Purpose**: Fetches YouTube video data for summarizer
- **Get it**: https://console.cloud.google.com/apis/credentials
- **Format**: `AIzaSy...`
- **Free Tier**: 10,000 units/day (enough for ~100 videos)

#### 4. NextAuth Configuration
- **Purpose**: Admin authentication
- **Variables**:
  - `NEXTAUTH_SECRET`: Random 32-character string
  - `NEXTAUTH_URL`: Your site URL
- **Generate secret**:
  ```bash
  openssl rand -base64 32
  ```
- **Default password**: `admin123` (change in production!)
- **Generate new password hash**:
  ```bash
  node -e "const bcrypt = require('bcrypt'); bcrypt.hash('your-password', 10).then(h => console.log(h))"
  ```

### Optional Variables

These are **optional** but enable additional features:

#### 5. Vercel KV (Document Management & Chat Logging)
- **Purpose**: Persistent storage for documents and chat history
- **Variables**:
  - `KV_REST_API_URL`
  - `KV_REST_API_TOKEN`
- **Fallback**: Uses in-memory storage (data lost on restart)
- **Setup**: See [Vercel KV Setup](#vercel-kv-setup) section

#### 6. Vercel Blob Storage (Large File Uploads)
- **Purpose**: Store files >4.5MB
- **Variable**: `BLOB_READ_WRITE_TOKEN`
- **Fallback**: Files stored in Vercel KV (4.5MB limit)
- **Setup**: See [Vercel Blob Setup](#vercel-blob-setup) section

#### 7. Resend (Email Notifications)
- **Purpose**: Send email notifications for chat interactions
- **Variables**:
  - `RESEND_API_KEY`
  - `RESEND_FROM_EMAIL`
  - `RESEND_TO_EMAIL`
- **Fallback**: Email notifications silently skipped
- **Get it**: https://resend.com/api-keys

---

## Local Development Setup

### Option A: Basic Setup (No Vercel KV/Blob)

**Best for**: Initial development, chatbot testing

1. **Create `.env.local`**:
   ```bash
   cp .env.example .env.local
   ```

2. **Add required API keys**:
   ```env
   OPENAI_API_KEY=sk-your-key-here
   PINECONE_API_KEY=your-key-here
   PINECONE_INDEX_NAME=your-index-name
   YOUTUBE_API_KEY=AIzaSy-your-key-here
   NEXTAUTH_SECRET=your-generated-secret
   NEXTAUTH_URL=http://localhost:3000
   ADMIN_EMAIL=hungreo2005@gmail.com
   ```

3. **Leave KV/Blob variables empty** - app will use in-memory storage

4. **Run dev server**:
   ```bash
   npm run dev
   ```

**Limitations**:
- Document uploads lost on server restart
- Chat history not persisted
- No production-like storage testing

### Option B: Full Setup (With Vercel KV/Blob)

**Best for**: Testing production features, document management

1. **Install Vercel CLI**:
   ```bash
   npm install -g vercel
   ```

2. **Login to Vercel**:
   ```bash
   vercel login
   ```

3. **Link project** (if not already linked):
   ```bash
   vercel link
   ```

4. **Create Vercel KV database**:
   - Go to: https://vercel.com/dashboard
   - Navigate to: Storage → Create Database → KV
   - Name it: `hungreo-kv`
   - Connect to your project

5. **Create Vercel Blob storage**:
   - Go to: Storage → Create Database → Blob
   - Name it: `hungreo-blob`
   - Connect to your project

6. **Pull environment variables**:
   ```bash
   vercel env pull .env.local
   ```

7. **Add remaining API keys manually** to `.env.local`:
   ```env
   OPENAI_API_KEY=sk-your-key-here
   PINECONE_API_KEY=your-key-here
   PINECONE_INDEX_NAME=your-index-name
   YOUTUBE_API_KEY=AIzaSy-your-key-here
   ```

8. **Run dev server**:
   ```bash
   npm run dev
   ```

**Benefits**:
- Full feature parity with production
- Data persists across restarts
- Test real storage behavior

**Note**: Vercel Blob callbacks (`onUploadCompleted`) won't work on localhost. For full Blob testing, use ngrok or deploy to Vercel preview.

---

## Production Deployment

### Initial Deployment

1. **Push to GitHub**:
   ```bash
   git add .
   git commit -m "Initial commit"
   git push origin main
   ```

2. **Import to Vercel**:
   - Go to: https://vercel.com/new
   - Import your GitHub repository
   - Configure project settings

3. **Add Environment Variables in Vercel**:
   - Go to: Project Settings → Environment Variables
   - Add all required variables from `.env.example`
   - Use "Production" environment

4. **Create Storage**:
   - In Vercel Dashboard: Storage → Create KV Database
   - Storage → Create Blob Storage
   - Connect both to your project
   - Environment variables automatically added

5. **Deploy**:
   - Vercel auto-deploys on push to main
   - Or manually: `vercel --prod`

### Continuous Deployment

**Automatic** (Default):
- Push to `main` → Auto-deploy to production
- Push to other branches → Auto-deploy to preview

**Manual Control** (If using `vercel.json`):
```json
{
  "git": {
    "deploymentEnabled": {
      "main": false
    }
  }
}
```
Then deploy manually: `vercel --prod`

---

## Vercel KV & Blob Setup

### Vercel KV Setup

**Purpose**: Store documents, chat logs, user sessions

#### Create KV Database

1. Go to Vercel Dashboard: https://vercel.com/dashboard
2. Navigate to: **Storage** → **Create Database**
3. Select: **KV** (Redis-compatible key-value store)
4. Configure:
   - **Name**: `hungreo-kv`
   - **Region**: Choose closest to your users
   - **Plan**: Free tier (256MB, 10K commands/day)
5. Click **Create**

#### Connect to Project

1. In KV dashboard, click **Connect Project**
2. Select your project: `hungreo-Website`
3. Select environments:
   - ✅ Production
   - ✅ Preview
   - ✅ Development
4. Click **Connect**

#### Get Credentials for Local Development

**Method 1: Vercel CLI** (Recommended)
```bash
vercel env pull .env.local
```

**Method 2: Manual Copy**
1. Go to KV Database → **.env.local** tab
2. Copy the values:
   ```env
   KV_REST_API_URL=https://...kv.vercel-storage.com
   KV_REST_API_TOKEN=...
   ```
3. Paste into your `.env.local` file

### Vercel Blob Setup

**Purpose**: Store large files (>4.5MB), document attachments

#### Create Blob Storage

1. Go to Vercel Dashboard: https://vercel.com/dashboard
2. Navigate to: **Storage** → **Create Database**
3. Select: **Blob** (Object storage)
4. Configure:
   - **Name**: `hungreo-blob`
   - **Region**: Same as KV for best performance
   - **Plan**: Free tier (First 500MB free)
5. Click **Create**

#### Connect to Project

Same steps as KV:
1. Click **Connect Project**
2. Select: `hungreo-Website`
3. Select all environments
4. Click **Connect**

#### Get Credentials for Local Development

**Method 1: Vercel CLI**
```bash
vercel env pull .env.local
```

**Method 2: Manual Copy**
1. Go to Blob Storage → **.env.local** tab
2. Copy:
   ```env
   BLOB_READ_WRITE_TOKEN=vercel_blob_rw_...
   ```
3. Add to `.env.local`

### Verification

Test your configuration:

1. **Check environment variables**:
   ```bash
   # In .env.local, you should have:
   KV_REST_API_URL=https://...
   KV_REST_API_TOKEN=...
   BLOB_READ_WRITE_TOKEN=...
   ```

2. **Restart dev server**:
   ```bash
   npm run dev
   ```

3. **Upload a test document**:
   - Go to: http://localhost:3000/admin
   - Login with admin credentials
   - Navigate to: Documents → Upload
   - Try uploading a DOCX or PDF file

4. **Verify storage**:
   - Check Vercel Dashboard → Storage → KV
   - You should see keys like `doc:...`
   - For large files, check Blob storage

---

## Troubleshooting

### Chatbot Not Responding

**Symptoms**: 500 error, no response from chatbot

**Possible Causes**:

1. **Missing OpenAI API key**
   - Check: `.env.local` has `OPENAI_API_KEY`
   - Verify: Key starts with `sk-`
   - Test: https://platform.openai.com/api-keys

2. **Pinecone not configured**
   - Check: `PINECONE_API_KEY` and `PINECONE_INDEX_NAME` set
   - Verify: Index dimensions = 1536
   - Test: Try creating embedding in Pinecone dashboard

3. **Resend API blocking execution** (if configured)
   - Check server logs for Resend errors
   - Temporary fix: Remove `RESEND_API_KEY` from `.env.local`

### Document Upload Fails

**Symptoms**: Upload returns error, 404 on status update

**Possible Causes**:

1. **Vercel KV not configured**
   - Fallback: In-memory storage (data lost on restart)
   - Fix: Follow [Vercel KV Setup](#vercel-kv-setup)

2. **File too large (>20MB)**
   - Check: File size limit is 20MB
   - Fix: Compress file or split into smaller chunks

3. **Unsupported file type**
   - Supported: PDF, DOCX, DOC, TXT
   - Fix: Convert file to supported format

4. **PDF processing error**
   - Library: Now using `unpdf` (edge-compatible)
   - Check: Server logs for specific PDF errors
   - Fix: Try DOCX or TXT instead

### Admin Login Failed

**Symptoms**: "Invalid email or password" error

**Possible Causes**:

1. **Wrong credentials**
   - Default email: `hungreo2005@gmail.com`
   - Default password: `admin123`

2. **Password hash not set**
   - Check: `.env.local` has `ADMIN_PASSWORD_HASH`
   - Default hash (for `admin123`): `$2b$10$05KUDdTtAhvYELphZhxeUOQZ0tNy08ACVz64jOJbLuSwJXW0gMSAK`

3. **NextAuth not configured**
   - Check: `NEXTAUTH_SECRET` and `NEXTAUTH_URL` set
   - Generate secret: `openssl rand -base64 32`

### Status Update 404 Error

**Symptoms**: Clicking "→ Review" button returns 404

**Fixed In**: Latest version
- Added in-memory storage support to all document manager functions
- Fixed Next.js 14 async params pattern

**If still occurring**:
1. Clear Next.js cache: `rm -rf .next`
2. Restart dev server: `npm run dev`
3. Check browser console for specific error

### Cache Issues

**Symptoms**: Old code still running after changes

**Solution**:
```bash
# Stop all dev servers
pkill -f "next dev"

# Clear Next.js cache
rm -rf .next

# Restart
npm run dev
```

### Vercel KV Connection Issues

**Symptoms**: "Failed to connect to Vercel KV" in logs

**Solutions**:

1. **Check credentials**:
   ```bash
   # Print environment variables (safely)
   node -e "console.log('KV URL:', process.env.KV_REST_API_URL ? 'Set' : 'Missing')"
   node -e "console.log('KV Token:', process.env.KV_REST_API_TOKEN ? 'Set' : 'Missing')"
   ```

2. **Refresh credentials**:
   ```bash
   vercel env pull .env.local --force
   ```

3. **Check KV status**:
   - Go to: Vercel Dashboard → Storage → KV
   - Verify: Status is "Active"

### Vercel Blob Upload Issues

**Symptoms**: File upload hangs or fails

**Solutions**:

1. **Check token**:
   - Verify: `BLOB_READ_WRITE_TOKEN` in `.env.local`
   - Format: `vercel_blob_rw_...`

2. **Localhost limitation**:
   - Callbacks don't work on localhost
   - File uploads work, but `onUploadCompleted` won't trigger
   - For full testing: Deploy to Vercel preview

3. **File size limits**:
   - Free tier: 500MB total storage
   - Max file size: 4.5MB (without Blob), unlimited (with Blob)

---

## Best Practices

### Security

1. **Never commit `.env.local`** - Already in `.gitignore`
2. **Rotate API keys** regularly, especially if exposed
3. **Use strong admin password** in production
4. **Enable 2FA** on all service accounts (OpenAI, Vercel, etc.)

### Cost Management

1. **Monitor OpenAI usage**: https://platform.openai.com/usage
   - Set billing alerts
   - Typical cost: $0.50-2/month

2. **Pinecone free tier**: 100K vectors, 1 pod
   - Upgrade if exceeding limits

3. **Vercel free tier**:
   - KV: 256MB, 10K commands/day
   - Blob: 500MB storage
   - Functions: 100 GB-hours/month

### Development Workflow

1. **Use in-memory storage** for rapid development
2. **Use Vercel KV/Blob** for production-like testing
3. **Test on Vercel preview** before merging to main
4. **Monitor logs** in Vercel dashboard

### Performance

1. **Enable caching** for API routes when possible
2. **Use Redis (KV)** for frequently accessed data
3. **Compress images** before uploading
4. **Monitor Lighthouse scores** regularly

---

## Support

For additional help:

1. **Check logs**:
   - Local: Terminal where `npm run dev` is running
   - Production: Vercel Dashboard → Logs

2. **Vercel Docs**:
   - KV: https://vercel.com/docs/storage/vercel-kv
   - Blob: https://vercel.com/docs/storage/vercel-blob

3. **OpenAI Docs**: https://platform.openai.com/docs

4. **Pinecone Docs**: https://docs.pinecone.io

---

## Video Library Setup

### Overview

The Video Library feature (`/tools/knowledge`) allows uploading YouTube videos with AI-powered transcripts and chatbot Q&A.

### Architecture

```
Video Storage: Vercel KV (Redis)
├── video:{videoId}              → Individual video metadata
├── videos:{category}            → Set of videos by category
└── videos:all                   → Sorted set of all videos

Categories:
- Leadership
- AI Works
- Health
- Entertaining
- Human Philosophy
```

### Adding Videos

**Via Admin Panel** (Recommended):
1. Login: `/admin/dashboard`
2. Navigate to: **AI Tools** → **Videos**
3. Click **Import Videos**
4. Enter YouTube URLs (one per line)
5. Select category
6. Click **Import**

**Automatic Processing**:
- Fetches video metadata from YouTube API
- Downloads transcript (if available)
- Stores in Vercel KV
- Optionally embeds in Pinecone for AI search

### Displaying Videos

**Public Pages**:
- `/tools/knowledge` - All categories with video counts
- `/tools/knowledge/leadership` - Videos in Leadership category
- `/tools/knowledge/leadership/video-slug-videoId` - Individual video page

**ISR (Incremental Static Regeneration)**:
- Pages revalidate every 60 seconds
- New videos appear within 1 minute of upload
- No manual deployment needed

### Important Notes

**Server Components Best Practice**:
- Pages call `getVideoStats()` and `getVideosByCategory()` **directly**
- **DO NOT** fetch from `/api/videos` in server components
- API routes are for client components and external access only

**Example**:
```typescript
// ✅ CORRECT (Server Component)
import { getVideoStats } from '@/lib/videoManager'
const stats = await getVideoStats()

// ❌ WRONG (Anti-pattern)
const res = await fetch('/api/videos?stats=true')
const stats = await res.json()
```

---

## Recent Updates

### November 14, 2025 - Production Deployment

**Major Changes**:
1. ✅ Fixed videos not appearing on production
2. ✅ Replaced HTTP fetching with direct function calls
3. ✅ Added ISR (60s revalidation) to knowledge pages
4. ✅ Fixed Dynamic Server Usage warnings
5. ✅ Eliminated cache strategy conflicts

**Commits**:
- `9c81c39` - ISR revalidation + localhost URL fixes
- `3d5767c` - Force-dynamic for API routes
- `d83eee9` - Replace no-store cache with ISR
- `be0c82c` - Direct videoManager calls (critical fix)

**Documentation**:
- [PRODUCTION_DEPLOYMENT_NOV14_2025.md](./docs/PRODUCTION_DEPLOYMENT_NOV14_2025.md) - Detailed deployment summary
- [CMS_AND_I18N_PLAN.md](./docs/CMS_AND_I18N_PLAN.md) - Upcoming features plan

**Status**:
- ✅ Production: https://hungreo.vercel.app
- ✅ Videos working correctly
- ✅ ISR active (60s revalidation)
- ✅ No build warnings

---

**Last Updated**: November 14, 2025

**Version**: 2.1 (Production-Ready with Video Library)
