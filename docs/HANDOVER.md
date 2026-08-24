# Handover — hungreo.com

Cập nhật: 2026-08-24 · Trạng thái: **production ổn định, không có task treo**

## Bối cảnh nhanh

Portfolio + AI chatbot của Hung Dinh. Next.js 14 App Router trên Vercel, dữ liệu ở Vercel KV (Upstash Redis), vector ở Pinecone, LLM là OpenAI.

- **Production:** https://hungreo.com (mới chuyển từ hungreo.vercel.app ngày 2026-08-24)
- **Đường lui:** https://hungreo.vercel.app vẫn sống
- **Admin:** /admin (NextAuth v5, credentials)

## ⛔ 4 điều tuyệt đối phải biết trước khi đụng vào

### 1. DNS — không đổi nameserver
DNS quản ở **Hostinger** (`ns1/ns2.dns-parking.com`), KHÔNG dùng Vercel nameserver.

| Type | Name | Content | |
|---|---|---|---|
| A | `@` | `76.76.21.21` | Vercel — sửa được |
| CNAME | `www` | `hungreo.com` | tự theo apex |
| A | `n8n` | `72.61.123.33` | ⛔ VPS |
| A | `bot` | `72.61.123.33` | ⛔ VPS |

VPS (`ssh hungreo-claude-vps`) chạy **n8n + 3 Telegram bot của OpenClaw**. n8n hard-code `WEBHOOK_URL=https://n8n.hungreo.com/`. Đổi nameserver sang Vercel = zone mới mất 2 record này = **n8n webhook chết + bot ngừng nhận tin**.

Cũng **không bao giờ bấm "Reset DNS records"** trong hPanel — xoá sạch về mặc định.

TTL của `@` là 60s → đổi/revert có hiệu lực trong ~1-2 phút. Revert website: đổi `@` về `2.57.91.91`.

### 2. Push GitHub KHÔNG tự deploy
Git integration không hoạt động. Sau khi push phải chạy:
```bash
vercel --prod
```

### 3. YouTube chặn IP Vercel
Import video trên admin sẽ **không lấy được transcript** (badge "⚠ No transcript"). Phải chạy từ máy local:
```bash
npx tsx scripts/repair-video-transcripts.ts
```
Script idempotent, có `--dry-run`. Nếu dính YouTube 429 thì chờ 15-60 phút chạy lại.

### 4. Thêm env var bằng CLI
Phải dùng `--value` + `--no-sensitive`, nếu pipe stdin sẽ tạo biến **RỖNG**:
```bash
vercel env add TEN_BIEN production --value "gia-tri" --no-sensitive --yes
```

## Nguyên tắc làm việc đã thống nhất

**simple-safe-effective, tránh over-engineering, không được làm sập website.**

Cụ thể, những cái này đã chứng minh có giá trị trong phiên trước:

- **Verify bằng dữ liệu thật, không đoán.** Chạy lệnh, đọc production KV, curl thật rồi mới kết luận.
- **Có control test khi nghi regression.** Chạy cùng payload trên production chưa sửa để phân biệt "bug mình gây ra" với "hành vi sẵn có".
- **Trước khi xoá/sửa gì, quét xem có ai đang dùng không.** Bài học đắt nhất phiên trước: suýt làm chết n8n + 3 bot vì quét subdomain quá hẹp rồi kết luận "domain trắng".
- **Không nuốt lỗi im lặng.** Đây là gốc của 3 bug nghiêm trọng nhất từng gặp ở repo này.
- **Nói thật khi sai.** User rất tinh, hay bắt được lỗi — sửa gọn rồi đi tiếp, đừng biện minh.
- **Ngôn ngữ: tiếng Việt** cho hội thoại, commit message, docs.

## Việc còn lại (không gấp)

Chi tiết đầy đủ ở [`docs/CODE_REVIEW_2026-07-28.md`](CODE_REVIEW_2026-07-28.md). Đã xong 3/3 CRITICAL + 3/3 HIGH. Còn lại:

| Ưu tiên | Việc |
|---|---|
| Nâng major (làm riêng, có test) | `next` 14.2 → 16 (Next 15 đổi `params` thành async, ảnh hưởng nhiều route); `nodemailer` 7 → 9 |
| MEDIUM (7 mục) | 2 hàm `chunkText` khác nhau cùng đổ vào 1 Pinecone index; `kv.keys('blog:*')` quét trúng `blog:categories`; slug index rác khi đổi slug; `data.email` chưa escape trong email HTML; thiếu rate limit ở 2 route; heartbeat SSE không guard; `contact-requests:pending/resolved` còn 2 entry rác |
| Refactor | `isAdminEmail` copy 3 bản (liên quan bảo mật); `getClientIp` copy 2 bản; auth guard lặp inline ở 38 route; 149 chỗ `any`; `kv.keys()` + N+1 |
| VPS (không liên quan website) | Bot `nemotron` chết — port 8789 không có service nghe |

## Lệnh hay dùng

```bash
npm run dev                                    # dev server
npx tsc --noEmit                               # type check
npm run build                                  # build
vercel --prod                                  # deploy (BẮT BUỘC sau khi push)
npx tsx scripts/repair-video-transcripts.ts    # backfill transcript video
ssh hungreo-claude-vps                         # vào VPS (n8n + OpenClaw bots)
```
