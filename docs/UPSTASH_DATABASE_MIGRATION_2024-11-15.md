# Upstash Database Migration - November 15, 2024

## Summary

Successfully migrated from old Upstash Redis database to a new one due to hitting the free tier 500K requests/month limit.

---

## Migration Details

### Old Database
- **Name**: `hungreo-videos` (glowing-giraffe-26623)
- **URL**: `https://glowing-giraffe-26623.upstash.io`
- **Status**: Hit 500K request limit (823K requests used)
- **Action**: Deleted

### New Database
- **Name**: `large-heron-11467`
- **URL**: `https://large-heron-11467.upstash.io`
- **Region**: Singapore (ap-southeast-1)
- **Status**: Active, 0 requests
- **Created**: November 15, 2024

---

## Changes Made

### 1. Environment Variables Updated

#### Local (.env.local)
```bash
UPSTASH_REDIS_REST_URL=https://large-heron-11467.upstash.io
UPSTASH_REDIS_REST_TOKEN=YOUR_UPSTASH_TOKEN_HERE
KV_REST_API_URL=https://large-heron-11467.upstash.io
KV_REST_API_TOKEN=YOUR_UPSTASH_TOKEN_HERE
```

#### Production (Vercel)
- Removed old environment variables
- Added new credentials via Vercel CLI
- All 4 variables updated:
  - `UPSTASH_REDIS_REST_URL`
  - `UPSTASH_REDIS_REST_TOKEN`
  - `KV_REST_API_URL`
  - `KV_REST_API_TOKEN`

### 2. Deployment
- Successfully deployed to production
- Deployment ID: `dpl_3YeLSoK5hhHVZyejafqKz5fyn4cq`
- Status: ● Ready
- URL: https://hungreo.vercel.app

---

## Post-Migration Status

### ✅ Completed
1. Old database deleted
2. New database created
3. Environment variables updated (local + production)
4. Deployed to production
5. Admin login verified working

### ⏳ Pending
1. **Re-import videos** - Database is now empty, need to re-add videos via admin panel
2. **Regenerate embeddings** - All video vectors need to be regenerated
3. **Re-add About page content** - Content needs to be re-entered

---

## Next Steps for User

### 1. Login to Admin Panel
URL: https://hungreo.vercel.app/admin/login
- Email: `hungreo2005@gmail.com`
- Password: `YOUR_SECURE_PASSWORD`

### 2. Re-add About Page Content
1. Go to https://hungreo.vercel.app/admin/dashboard
2. Click "About Page" tab
3. Fill in your about content
4. Click "Save"

### 3. Re-import Videos
1. Go to https://hungreo.vercel.app/admin/videos
2. Click "Batch Import Videos" button
3. Paste YouTube URLs (one per line)
4. Click "Import"

### 4. Generate Embeddings
After videos are imported:
1. Stay on the Videos page
2. Click "Generate Embeddings" for each video
3. Wait for green checkmark (completion)

### 5. Verify Chatbot
1. Go to public AI Tools page
2. Test chatbot with video questions
3. Ensure it can find relevant content

---

## Why Did This Happen?

The old database exceeded the **Upstash free tier limit of 500,000 requests per month**.

### Possible Causes:
1. **Development testing** - Frequent refreshes during debugging
2. **No caching** - Every page load hit the database
3. **Migration testing** - Multiple data format changes
4. **Lack of monitoring** - Didn't notice usage creeping up

### Root Cause Analysis:
Looking at the usage:
- Reads: 822,370 (99.8%)
- Writes: 966 (0.1%)

This suggests heavy read operations, likely from:
- Public pages loading video metadata
- Chatbot queries searching for videos
- Admin dashboard loading data

---

## Prevention for Future

### 1. Implement Caching
Add caching to reduce database reads:

```typescript
// Example: Cache video list for 5 minutes
export const revalidate = 300 // 5 minutes

async function getVideos() {
  // This will be cached by Next.js
  const videos = await kv.get('videos:all')
  return videos
}
```

### 2. Monitor Usage Weekly
Check Upstash Console every week:
1. Go to https://console.upstash.com/
2. Click on database
3. Check "Details" tab → "Commands" counter
4. If > 300K, investigate what's causing high usage

### 3. Use Next.js Static Generation
For public pages that don't change often:

```typescript
// Generate static pages at build time
export const dynamic = 'force-static'
export const revalidate = 3600 // Revalidate every hour
```

### 4. Add Request Logging (Optional)
Create a monitoring script:

```typescript
// scripts/check-upstash-usage.ts
import { kv } from '@vercel/kv'

async function checkUsage() {
  const info = await kv.info()
  console.log('Upstash Usage:', {
    keys: info.db_keys,
    memory: info.used_memory_human,
  })
}

checkUsage()
```

Run weekly: `npx tsx scripts/check-upstash-usage.ts`

---

## Important Notes

1. **Free Tier Limitation**: Upstash free tier only allows **1 database**
   - If you hit the limit again, you must either:
     - Wait until next month (counter resets on 1st)
     - Upgrade to Pay-As-You-Go ($0.2 per 100K requests)
     - Delete and recreate database (lose all data)

2. **Data Loss**: All data was lost during migration
   - Videos metadata
   - About page content
   - Chat logs
   - Vector embeddings

3. **Local & Production Share Same Database**:
   - Both environments contribute to the 500K limit
   - Be mindful of local development usage

4. **Alternative Solutions**:
   - Consider upgrading to Pay-As-You-Go if this happens frequently
   - Cost estimate: ~$1-2/month based on current usage patterns
   - Pricing: https://upstash.com/pricing

---

## Verification Checklist

After completing re-import:

- [ ] Admin login works
- [ ] About page content saved
- [ ] Videos imported successfully
- [ ] Embeddings generated for all videos
- [ ] Chatbot responds to questions
- [ ] Public AI Tools page shows videos
- [ ] Upstash usage < 10K requests (should be low after migration)

---

## Support Resources

- Upstash Console: https://console.upstash.com/
- Vercel Dashboard: https://vercel.com/hungreos-projects/hungreo-website
- Documentation:
  - [How to Change Admin Password](./HOW_TO_CHANGE_ADMIN_PASSWORD.md)
  - [Reset Upstash Database](./RESET_UPSTASH_DATABASE.md)
  - [Create New Database](./CREATE_NEW_UPSTASH_DATABASE.md)

---

## Timeline

- **14:30** - Discovered 500K limit exceeded
- **14:35** - Created new database `large-heron-11467`
- **14:36** - Updated environment variables (local)
- **14:37** - Updated environment variables (production via Vercel CLI)
- **14:37** - Deployed to production
- **14:43** - Verified deployment successful
- **14:45** - Documentation completed

**Total time**: ~15 minutes

---

## Lessons Learned

1. ✅ Always monitor database usage proactively
2. ✅ Implement caching from the start
3. ✅ Use Next.js static generation where possible
4. ✅ Keep migration documentation for future reference
5. ✅ Have a backup/export strategy for important data
