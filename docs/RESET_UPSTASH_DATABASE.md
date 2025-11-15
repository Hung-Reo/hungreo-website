# Reset Upstash Redis Database

## ⚠️ WARNING
This will delete ALL data in both local and production environments:
- All videos metadata
- All vector embeddings
- All chat logs
- All content (about, blog, projects)

**Backup important data before proceeding!**

---

## Step-by-Step Reset Process

### 1. Access Upstash Console

Go to: https://console.upstash.com/

Login with your account.

### 2. Select Your Database

Click on your Redis database (likely named something like `hungreo-redis` or similar).

### 3. Flush All Data

**Option A: Via Console UI**
1. Go to the "Data Browser" tab
2. Click "Flush Database" button
3. Confirm the action

**Option B: Via CLI**
```bash
# Get your Upstash Redis URL and token from .env.local
# Then run:
redis-cli -u <YOUR_UPSTASH_REDIS_URL> FLUSHDB
```

**Option C: Via REST API**
```bash
curl -X POST https://YOUR_UPSTASH_ENDPOINT/flushdb \
  -H "Authorization: Bearer YOUR_UPSTASH_TOKEN"
```

### 4. Verify Database is Empty

In Upstash Console → Data Browser, you should see:
- Keys: 0
- Memory: ~0 KB

### 5. Re-import Essential Data

After reset, you need to re-add content:

#### A. Re-upload About Page Content
1. Go to https://hungreo.vercel.app/admin/dashboard
2. Click "About Page" tab
3. Fill in and save your about content

#### B. Re-import Videos (if needed)
1. Go to https://hungreo.vercel.app/admin/videos
2. Click "+ Batch Import Videos"
3. Paste YouTube URLs (one per line)
4. Import videos

#### C. Generate Embeddings for Videos
1. On the Videos page
2. Click "Generate Embeddings" for each video
3. Wait for completion (green checkmark)

---

## Monitor Request Usage

After reset, monitor your Upstash usage:

1. Go to Upstash Console
2. Click on your database
3. Check "Metrics" tab
4. Watch "Total Commands" counter

**Free Plan Limit**: 500,000 requests/month

### Tips to Reduce Usage:
1. ✅ Use caching in API routes
2. ✅ Limit API calls during development
3. ✅ Use `revalidate` in Next.js fetch
4. ❌ Avoid unnecessary bulk operations

---

## Why Reset Counter Hit 500K?

Possible causes:
1. **Migration testing**: Multiple data format changes
2. **Development loops**: Frequent refreshes during debugging
3. **Infinite loops**: Bug causing repeated requests
4. **Lack of caching**: Every page load hits database

---

## Alternative: Upgrade Upstash Plan

If you need more than 500K requests/month:

**Pay As You Go Plan**:
- $0.2 per 100K requests
- No monthly limit
- Only pay for what you use

**Pro Plan** ($10/month):
- 10M requests included
- Better for high-traffic sites

Visit: https://upstash.com/pricing

---

## Post-Reset Checklist

- [ ] Database flushed (Keys: 0)
- [ ] About page content re-added
- [ ] Videos re-imported (if needed)
- [ ] Embeddings regenerated
- [ ] Chatbot tested with a video
- [ ] Monitor request usage (should be low now)

---

## Prevention for Future

### Add Request Counter Monitoring

Create a simple script to check daily usage:

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

## Need Help?

If you encounter issues after reset:
1. Check Vercel deployment logs
2. Verify environment variables are correct
3. Test with a fresh browser session (clear cookies)
4. Contact Upstash support if database issues persist
