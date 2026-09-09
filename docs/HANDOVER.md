# Handover — hungreo.com

Cập nhật: 2026-09-09 · Trạng thái: **production ổn định, không có task treo**

## Bối cảnh nhanh

Portfolio + AI chatbot của Hung Dinh. Next.js 14 App Router trên Vercel, dữ liệu ở Vercel KV (Upstash Redis), vector ở Pinecone, LLM là OpenAI.

- **Production:** https://hungreo.com (mới chuyển từ hungreo.vercel.app ngày 2026-08-24)
- **Đường lui:** https://hungreo.vercel.app — vẫn phục vụ bình thường, cố ý KHÔNG
  redirect. Nó chỉ mang header `X-Robots-Tag: noindex` để không cạnh tranh với apex
  trên Google. **URL deployment KHÔNG dùng làm đường lui được**: deployment
  protection đẩy khách ẩn danh sang Vercel SSO (302).
- **Admin:** /admin (NextAuth v5, credentials)

> Từ 2026-09-09 `www.hungreo.com` và `hungreo-website.vercel.app` **308 về apex**
> (`REDIRECT_HOSTS` trong `middleware.ts`). Muốn tắt: sửa set đó rồi `vercel --prod`.
> 308 bị browser cache khá lì — người đã truy cập cần xoá cache mới thấy thay đổi.

## ⛔ 4 điều tuyệt đối phải biết trước khi đụng vào

### 1. DNS — không đổi nameserver
DNS quản ở **Hostinger** (`ns1/ns2.dns-parking.com`), KHÔNG dùng Vercel nameserver.

| Type | Name | Content | |
|---|---|---|---|
| A | `@` | `76.76.21.21` | Vercel — sửa được |
| CNAME | `www` | `hungreo.com` | tự theo apex |
| A | `n8n` | `<VPS_IP>` | ⛔ VPS |
| A | `bot` | `<VPS_IP>` | ⛔ VPS |

> Giá trị thật của `<VPS_IP>` / `<OLD_HOST_IP>` nằm ở `docs/INFRA_PRIVATE.local.md`
> (gitignored). Repo này **public** — đừng ghi IP hạ tầng vào file được commit.

VPS (`ssh hungreo-claude-vps`) chạy **n8n + 3 Telegram bot của OpenClaw**. n8n hard-code `WEBHOOK_URL=https://n8n.hungreo.com/`. Đổi nameserver sang Vercel = zone mới mất 2 record này = **n8n webhook chết + bot ngừng nhận tin**.

Cũng **không bao giờ bấm "Reset DNS records"** trong hPanel — xoá sạch về mặc định.

TTL của `@` là 60s → đổi/revert có hiệu lực trong ~1-2 phút. Revert website: đổi `@` về `<OLD_HOST_IP>`.

### 2. Push GitHub KHÔNG tự deploy
Git integration không hoạt động — **đã verify lại 2026-09-09**: push xong `vercel ls`
không thấy deployment mới nào. Sau khi push phải chạy:
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

Chi tiết ở [`CODE_REVIEW_2026-07-28.md`](CODE_REVIEW_2026-07-28.md) và
[`AUDIT_2026-09-08_WEBSITE_KNOWLEDGE.md`](AUDIT_2026-09-08_WEBSITE_KNOWLEDGE.md).

**Audit 2026-09-08 đã xong cả 3 ưu tiên** — xem các release report
`PROD_SSR_2026-09-08.md`, `PROD_P3_SEO_2026-09-08.md`,
`PROD_CHAT_PATCH_A_2026-09-08.md`, `PROD_CHAT_BC_2026-09-09.md`,
`PROD_FINAL_2026-09-09.md`.

| Ưu tiên | Việc |
|---|---|
| Nâng major (làm riêng, có test) | `next` 14.2 → 16 (Next 15 đổi `params` thành async, ảnh hưởng nhiều route); `nodemailer` 7 → 9 |
| MEDIUM (còn 6) | 2 hàm `chunkText` khác nhau cùng đổ vào 1 Pinecone index; `kv.keys('blog:*')` quét trúng `blog:categories`; slug index rác khi đổi slug; `data.email` chưa escape trong email HTML; thiếu rate limit ở 2 route; heartbeat SSE không guard |
| Refactor | `isAdminEmail` copy 3 bản (liên quan bảo mật); `getClientIp` copy 2 bản; auth guard lặp inline ở 38 route; 149 chỗ `any`; `kv.keys()` + N+1 |
| Nội dung (cần Hưng duyệt) | Khối "Đang xây / Đang học" ở Home; case study theo quyết định → kết quả → bài học; số liệu 70%/80%/95% cần gắn kỳ đo |
| Kiểm bên ngoài | Google Search Console: xác nhận duplicate indexing đã hết sau khi hợp nhất hostname 09/09 |
| VPS (không liên quan website) | Bot `nemotron` chết — 09/09 chỉ thấy 2 process bot nghe ở `[::1]:18789` và `[::1]:18795` |

### Đã đo và cố ý KHÔNG làm

- **Nâng `DISCOVERY_TOP_K` 20 → 50.** Đo 2026-09-09: video được gọi tên luôn
  nằm hạng 1, và 3 ca nhiều nguồn cố tình chọn video xa nhau đều lấy đủ nguồn
  ở cả top20 lẫn top50 — kết quả y hệt. Không có lợi ích đo được.
- **Retrieval theo history cho tài liệu.** Follow-up mơ hồ nhất vẫn lấy đúng
  5/5 chunk tài liệu chỉ bằng embedding. Không cần cơ chế thêm.
- **Rewrite git history để giấu IP VPS.** IP nằm trong record A công khai của
  `n8n`/`bot.hungreo.com`, `dig` là ra. Xem [`VPS_SSH_HARDENING.md`](VPS_SSH_HARDENING.md).

## Lệnh hay dùng

```bash
npm run dev                                    # dev server
npx tsc --noEmit                               # type check
npm run build                                  # build
vercel --prod                                  # deploy (BẮT BUỘC sau khi push)
npx tsx scripts/repair-video-transcripts.ts    # backfill transcript video
ssh hungreo-claude-vps                         # vào VPS (n8n + OpenClaw bots)
```
