# Tạo Database Upstash Redis Mới

## Khi nào cần tạo database mới?

- Database hiện tại đã vượt quá giới hạn 500K requests/tháng
- Không muốn upgrade lên paid plan
- Không muốn đợi đến đầu tháng mới
- Cần database sạch ngay lập tức

---

## Bước 1: Tạo Database Mới

1. Truy cập https://console.upstash.com/
2. Click "Create Database" (nút xanh ở góc trên)
3. Điền thông tin:
   - **Name**: `hungreo-videos-v2` (hoặc tên khác)
   - **Type**: Redis
   - **Region**: Singapore (ap-southeast-1) - giống database cũ
   - **Primary Region**: ap-southeast-1
   - **Read Region**: None (không cần)
   - **Eviction**: Có thể để mặc định
4. Click "Create"

---

## Bước 2: Lấy Connection Details

Sau khi tạo xong, click vào database mới và copy:

1. **UPSTASH_REDIS_REST_URL**: `https://...upstash.io`
2. **UPSTASH_REDIS_REST_TOKEN**: Token dài bắt đầu bằng `A...`

---

## Bước 3: Update Environment Variables

### Local Development (.env.local)

Tạo/edit file `.env.local`:

```bash
# Upstash Redis (NEW DATABASE)
UPSTASH_REDIS_REST_URL="https://your-new-endpoint.upstash.io"
UPSTASH_REDIS_REST_TOKEN="AxxxYourNewTokenHere"

# KV_REST_API_URL and KV_REST_API_TOKEN are aliases used by @vercel/kv
KV_REST_API_URL="https://your-new-endpoint.upstash.io"
KV_REST_API_TOKEN="AxxxYourNewTokenHere"

# Admin (không đổi)
ADMIN_EMAIL="hungreo2005@gmail.com"

# OpenAI (không đổi)
OPENAI_API_KEY="sk-..."

# Pinecone (không đổi)
PINECONE_API_KEY="..."
PINECONE_ENVIRONMENT="..."
PINECONE_INDEX_NAME="..."
```

### Production (Vercel)

Update environment variables trên Vercel:

```bash
# Method 1: Via Vercel CLI
vercel env rm UPSTASH_REDIS_REST_URL production
vercel env add UPSTASH_REDIS_REST_URL production

# Paste the new URL when prompted
# Repeat for TOKEN:
vercel env rm UPSTASH_REDIS_REST_TOKEN production
vercel env add UPSTASH_REDIS_REST_TOKEN production

# Also update KV aliases:
vercel env rm KV_REST_API_URL production
vercel env add KV_REST_API_URL production

vercel env rm KV_REST_API_TOKEN production
vercel env add KV_REST_API_TOKEN production
```

**Hoặc via Vercel Dashboard:**
1. Go to https://vercel.com/hungreos-projects/hungreo-website/settings/environment-variables
2. Delete old variables:
   - `UPSTASH_REDIS_REST_URL`
   - `UPSTASH_REDIS_REST_TOKEN`
   - `KV_REST_API_URL`
   - `KV_REST_API_TOKEN`
3. Add new variables with values from new database
4. Select "Production" environment
5. Click "Save"

---

## Bước 4: Redeploy

Sau khi update environment variables:

```bash
git add .env.local
git commit -m "chore: update to new Upstash Redis database"
git push origin main

# Trigger production deployment
vercel --prod
```

Hoặc redeploy từ Vercel Dashboard:
- Go to Deployments tab
- Click "..." menu on latest deployment
- Click "Redeploy"

---

## Bước 5: Verify

Sau khi deploy xong:

1. **Check Admin Login**: https://hungreo.vercel.app/admin/login
   - Login với `hungreo2005@gmail.com` / `YOUR_SECURE_PASSWORD`

2. **Check Videos**: https://hungreo.vercel.app/admin/videos
   - Sẽ hiển thị "No videos found" (database mới, chưa có data)

3. **Check Upstash Console**:
   - Go to new database
   - Check "Details" tab
   - Commands counter phải = 0 hoặc rất nhỏ

---

## Bước 6: Re-import Data

Database mới sẽ trống, bạn cần re-import:

### A. Re-add About Page Content
1. Go to https://hungreo.vercel.app/admin/dashboard
2. Click "About Page" tab
3. Fill in your about content
4. Click "Save"

### B. Re-import Videos
1. Go to https://hungreo.vercel.app/admin/videos
2. Click "Batch Import Videos"
3. Paste YouTube URLs (one per line)
4. Click "Import"

### C. Generate Embeddings
1. Sau khi import xong videos
2. Click "Generate Embeddings" cho từng video
3. Đợi completion (green checkmark)

---

## Bước 7: Delete Old Database (Tùy chọn)

Sau khi verify database mới hoạt động ok:

1. Go to https://console.upstash.com/
2. Click vào database cũ (`hungreo-videos`)
3. Go to "Details" tab
4. Scroll xuống dưới cùng
5. Click "Delete Database"
6. Confirm

**Lưu ý**: Chỉ xóa database cũ sau khi chắc chắn database mới hoạt động 100% ok!

---

## So sánh Giải pháp

| Giải pháp | Ưu điểm | Nhược điểm |
|-----------|---------|------------|
| **Tạo database mới** | Miễn phí, ngay lập tức | Mất hết data cũ, phải setup lại env vars |
| **Đợi đầu tháng mới** | Miễn phí, giữ được data | Phải đợi đến 1/12/2025 |
| **Upgrade Pay-As-You-Go** | Ngay lập tức, giữ data | Tốn $0.2/100K requests |

---

## Nguyên nhân vượt 500K requests

Để tránh tình huống này trong tương lai:

1. **Add caching** trong API routes
2. **Use revalidate** trong Next.js fetch
3. **Monitor usage** thường xuyên qua Upstash Console
4. **Tránh infinite loops** trong code
5. **Limit API calls** trong development

---

## Cần giúp đỡ?

Nếu gặp vấn đề khi tạo database mới:
1. Check environment variables đã update chưa
2. Verify Vercel deployment logs
3. Test với fresh browser session (clear cookies)
4. Contact Upstash support nếu database không hoạt động
