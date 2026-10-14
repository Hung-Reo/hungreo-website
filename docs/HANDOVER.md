# Handover — hungreo.com

Cập nhật: 2026-10-13 · Follow-up scope fix `a446fba` đã lên Prod `dpl_3XVuKb4NDoiL7RZ2ufmPW3h3srTy` và đã push lên `main` (13/10); technical smoke 4/4 PASS, chờ owner UAT. Xem `PROD_FOLLOWUP_SCOPE_2026-09-09.md`. Nội dung đề xuất và dependency chưa publish/upgrade: `CONTENT_DRAFT_2026-09-09.md`, `DEPENDENCY_PLAN_2026-09-09.md`.

**CI `Security` xanh lại từ 14/10** (`4b9efab`, run #39): job Tests and Build đỏ ít nhất từ 09/09 vì `lib/translateVideo.ts` tạo client OpenAI lúc import → `next build` không có secret thì fail. Đã chuyển sang `getOpenAIClient()` (lười). Commit này **chưa deploy** — hành vi runtime không đổi khi có key, đi cùng release kế tiếp. Audit job vẫn báo 35 lỗ hổng (continue-on-error) → theo `DEPENDENCY_PLAN`. `.gitleaksignore` có 4 dòng glob không hợp lệ (gitleaks chỉ nhận fingerprint) — vô hại vì không có leak, dọn khi tiện.

**Related Videos — đã lên Prod 13/10:** `main@9297f89` → `dpl_7hfDRxbBPMpT7xtr6edNvHqfquh5` (rollback anchor: `dpl_3XVuKb4NDoiL7RZ2ufmPW3h3srTy`). Root cause: `RelatedVideos` gọi HTTP `/api/videos` qua `VERCEL_URL` = URL deployment bị SSO chặn → HTML → `Unexpected token '<'` → khối bị ẩn. Sửa: đọc KV trực tiếp (`lib/relatedVideos.ts`), bỏ `lib/getBaseUrl.ts`, `noStore()` cho sidebar. Smoke Prod: trang Vibe Coding HTTP 200, khối Related Videos hiện 5 video AI Works khác (loại đúng video hiện tại); 0 log error/warning 30 phút sau deploy. Chưa owner UAT.

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

### 2. Push lên `main` KHÔNG tự deploy Prod
Push `main` không tạo deployment Prod (verify 2026-09-09 và lại 2026-10-13). **Nhưng push branch khác
tạo Preview tự động** (13/10: branch `claude/...` → preview `source: git`). Preview dùng KV riêng đang
rỗng (0 video), nên không smoke được dữ liệu thật trên preview. Deploy Prod bằng một trong hai:
```bash
vercel --prod                     # từ máy Mac
```
hoặc từ cloud session qua Vercel connector: `create_deployment` với `gitSource` github `Hung-Reo/hungreo-website`,
`ref: main`, `sha` cụ thể, `target: production` (cách đã dùng 13/10; gán alias ngay, không có bước promote riêng).

### 3. Transcript có fallback, không kết luận mọi import Vercel đều thất bại

Pipeline hiện thử caption trực tiếp rồi Supadata native nếu được cấu hình. Video thiếu caption, provider lỗi hoặc hết quota vẫn có thể thất bại; cần xem trạng thái từng video. Code: `lib/videoManager.ts`, `lib/supadataTranscript.ts`.

Repair CLI mặc định dry-run. Lệnh không tham số chỉ kiểm tra, không tự repair dữ liệu:
```bash
npx tsx scripts/repair-video-transcripts.ts
```
Chỉ sau GO cho đúng video/môi trường mới dùng `--apply --environment=production --video-id=<id>`. Không re-embed cả index để thử.

### 4. Env và secrets

Không dùng ví dụ `--no-sensitive` cho API keys/secrets. Kiểm tra CLI/help hiện tại và dùng cơ chế nhập secret không lộ trong output/shell history. Không suy từ lỗi nhập liệu cũ thành quy tắc “stdin luôn tạo biến rỗng”. Không thay hoặc tạo credentials nếu chưa có GO cho cấu hình đó.

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

**Các release kỹ thuật của audit 2026-09-08 đã lên Prod; phần nội dung và các giới hạn còn lại chưa được coi là hoàn tất** — xem các release report
`PROD_SSR_2026-09-08.md`, `PROD_P3_SEO_2026-09-08.md`,
`PROD_CHAT_PATCH_A_2026-09-08.md`, `PROD_CHAT_BC_2026-09-09.md`,
`PROD_FINAL_2026-09-09.md`.

| Ưu tiên | Việc |
|---|---|
| Dependency | Xem `DEPENDENCY_PLAN_2026-09-09.md`: đánh giá theo runtime/advisory, chọn version vá hiện hành; không nâng major bằng `audit fix --force` |
| MEDIUM (còn 6) | 2 hàm `chunkText` khác nhau cùng đổ vào 1 Pinecone index; `kv.keys('blog:*')` quét trúng `blog:categories`; slug index rác khi đổi slug; `data.email` chưa escape trong email HTML; thiếu rate limit ở 2 route; heartbeat SSE không guard |
| Refactor | `isAdminEmail` copy 3 bản (liên quan bảo mật); `getClientIp` copy 2 bản; auth guard lặp inline ở 38 route; 149 chỗ `any`; `kv.keys()` + N+1 |
| Nội dung (cần Hưng duyệt) | Khối "Đang xây / Đang học" ở Home; case study theo quyết định → kết quả → bài học; số liệu 70%/80%/95% cần gắn kỳ đo |
| Cache KV (sửa 14/10 trên branch `claude/brave-sagan-avxb8e`, **chưa merge/deploy**) | Root cause: `@vercel/kv` fetch với `cache: 'default'` → Next 14 lưu Data Cache vô thời hạn với request không đụng cookies/headers. Sửa: `lib/kv.ts` (client lười, `cache: 'no-store'`), 14 import runtime đổi sang `lib/kv` (scripts/ giữ nguyên vì chạy ngoài Next). Local `next start` + KV giả: mọi route public đọc KV mỗi request, fetch-cache 0 entry. Hệ quả: `/tools/knowledge/[category]` và `sitemap.xml` thành dynamic (mất ISR 60s/prerender) — chấp nhận vì traffic thấp. Prod: sau deploy kiểm số visitor footer khớp Upstash `visitors:YYYY-MM:unique` |
| Kiểm bên ngoài | Google Search Console: xác nhận duplicate indexing đã hết sau khi hợp nhất hostname 09/09 |
| VPS (không liên quan website) | Chưa xác minh trạng thái `nemotron`; quan sát 2 listening process không đủ kết luận bot chết. Kiểm runtime trong project OpenClaw, đọc LOCAL_CONTEXT.md trước |

### Đã đo và cố ý KHÔNG làm

- **Nâng `DISCOVERY_TOP_K` 20 → 50.** Đo 2026-09-09: video được gọi tên luôn
  nằm hạng 1 trong các ca đã thử, và 3 ca nhiều nguồn cố tình chọn video xa nhau đều lấy đủ nguồn
  ở cả top20 lẫn top50 — kết quả y hệt trong bộ thử đó. Chưa có lợi ích đo được để tăng topK; không phải bảo đảm mọi truy vấn đều đủ nguồn.
- **Retrieval theo history cho tài liệu.** Follow-up mơ hồ nhất vẫn lấy đúng
  5/5 chunk tài liệu chỉ bằng embedding trong ca đã thử. Tạm chưa thêm cơ chế; không coi là đã phủ mọi follow-up. Lỗi video cũ lấn context sau đổi chủ đề được xử lý riêng trong bản local `FOLLOWUP_SCOPE_2026-09-09.md`.
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
