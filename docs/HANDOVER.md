# Handover — hungreo.com

Cập nhật: 2026-10-18 · Prod chạy `main@54fb004` (dependency Phase 2, `dpl_GTRBdiEMwz9t7d6zAM9DH1Ek3YMB`, rollback anchor `dpl_CBmVAKKTBJiXAWZJSWjs4ScaaUTn`) — **chờ owner UAT editor admin**. Trước đó `main@913cc88` (hardening đợt 2, trên Next 15.5.28 + React 19 — **owner UAT PASS**). **Agent mới: đọc `AGENT_HANDOVER_PROMPT_2026-10-16.md` trước.** Trước đó · Follow-up scope fix `a446fba` đã lên Prod `dpl_3XVuKb4NDoiL7RZ2ufmPW3h3srTy` và đã push lên `main` (13/10); technical smoke 4/4 PASS, chờ owner UAT. Xem `PROD_FOLLOWUP_SCOPE_2026-09-09.md`. Nội dung đề xuất và dependency chưa publish/upgrade: `CONTENT_DRAFT_2026-09-09.md`, `DEPENDENCY_PLAN_2026-09-09.md`.

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
| Dependency Phase 2 — **đã lên Prod 18/10, chờ owner UAT editor** | `main@54fb004` → `dpl_GTRBdiEMwz9t7d6zAM9DH1Ek3YMB` (rollback anchor `dpl_CBmVAKKTBJiXAWZJSWjs4ScaaUTn`). `npm audit fix` không `--force` + đồng bộ 7 gói `@tiptap/*` lên `^3.32.0` (audit fix chỉ nâng `@tiptap/core`/`pm`, để lệch 3.11 ↔ 3.32). `npm audit --omit=dev` 35 → 25 (high 28 → 16); 25 còn lại đều cần major (Phase 3). `next`/`react` không đổi. Local: `npm test`, tsc, build không env (bản copy không `.env*`), `next start` + fixture KV giả 17 URL + Related Videos PASS. CI `Security` xanh. Smoke Prod trước/sau giống nhau (18 URL cùng status/size, Related Videos 5 link, sitemap 32 URL), 0 runtime error. Fixture `scripts/serve-ssr-fixtures.ts` thiếu `smembers` → trang knowledge category rỗng khi smoke local (chỉ vá trong bản copy, chưa sửa repo). **Chờ owner UAT:** editor tiptap (blog/project admin). |
| Next 15 Phase 1 — **đã lên Prod 15/10, owner UAT PASS** (public EN/VI, admin login + lưu blog, chatbot 3 câu) | `main@105fa76` (`9dfd929`: next 15.5.28, react 19.2.9) → `dpl_87KMUXpNtFZopmHYRNU6m15EVAwR` (rollback anchor `dpl_4fm2ZDjF52zmBxetYfnbNhtywdtE`). CI Node 20 xanh. Smoke Prod: trang video Vibe Coding 200 + Related Videos 5 link, `/api/content/projects/[slug]` 200, `/api/videos` 14 video, 0 log error/warning. Phase 2 (`npm audit fix` non-major) sau 3–7 ngày ổn định. Kế hoạch: `DEPENDENCY_PLAN_2026-10-15.md` |
| Dependency | Xem `DEPENDENCY_PLAN_2026-09-09.md`: đánh giá theo runtime/advisory, chọn version vá hiện hành; không nâng major bằng `audit fix --force` |
| Hardening — **đã lên Prod 15/10** | `main@12753f7` (fix `5af9af7`) → `dpl_84Avv6DkpX9NAkpHGzUtYnkFLdio` (rollback anchor `dpl_Fsk2owyy1B52eC6dB52YnxY3KriL`). Escape email HTML (admin + khách), rate limit `/api/analytics/track` 30/phút/IP và reset-password 5/15 phút/IP, lọc `blog:categories`, SSE dừng timer khi client đi. Smoke: `/api/content/blog` 200 đủ 3 bài, 0 log error/warning. Rate limit chưa kiểm được bằng POST từ cloud — theo dõi log. |
| Hardening đợt 2 — **đã lên Prod 16/10, owner UAT PASS** | `main@913cc88` → `dpl_CBmVAKKTBJiXAWZJSWjs4ScaaUTn` (rollback anchor `dpl_87KMUXpNtFZopmHYRNU6m15EVAwR`). `validate-reset-token` thêm rate limit (dùng chung bucket `passwordResetRateLimit` 5/15 phút/IP với reset-password — 1 lượt reset hợp lệ tốn 2), GET `/api/admin/content/about` thêm `auth()` trong handler (middleware vốn đã chặn), `getChatStats` chạy 37 `llen` bằng `Promise.all`, gỡ gói `bcrypt` (code chỉ dùng `bcryptjs`), xoá 2 file `.backup`. Local: tsc, `npm test`, build PASS; CI `Security` xanh. Smoke Prod: `/`, `/about`, `/blog`, `/projects`, visitor-count, `sitemap.xml` 200; admin about không session → 401; validate token sai → 400; 0 runtime error. Test mới trong `__tests__/security.test.ts` chỉ kiểm text nguồn, không kiểm hành vi. **Owner UAT PASS (Hưng xác nhận lại 18/10):** Admin Dashboard (số chat tuần/tháng) và trang sửa About. Review cloud 16/10: chỉ trang admin About gọi GET `/api/admin/content/about`, không còn import `bcrypt`; `npm ci`, tsc, `npm test` PASS. |
| MEDIUM còn lại | 2 hàm `chunkText` khác nhau cùng đổ vào 1 Pinecone index (chỉ xử lý khi re-index); slug index cũ không xoá khi đổi slug (URL cũ vẫn resolve — vô hại) |
| Nội dung Home — **đã lên Prod 15/10** | Khối Đang xây/Đang học tháng 10 (`1b5e5ad`) → `main@cc13c9e` → `dpl_4fm2ZDjF52zmBxetYfnbNhtywdtE` (rollback anchor `dpl_84Avv6DkpX9NAkpHGzUtYnkFLdio`). Smoke: Home 200, đủ 2 thẻ + 2 link. **Cập nhật hằng tháng**: sửa key `home.now.*` (EN + VI) trong `contexts/LanguageContext.tsx`. Case study Telegram (CMS) **đã sửa 16/10 qua admin** theo `CASE_STUDY_TELEGRAM_2026-10-15.md`: Prod API không còn số %, EN/VI đủ, techStack đổi `OpenAI GPT-4.1-mini`, `learnings` chốt giữ bản tiếng Việt (owner xác nhận 16/10). |
| Refactor | `isAdminEmail` copy 3 bản (liên quan bảo mật); `getClientIp` copy 2 bản; auth guard lặp inline ở 38 route; 149 chỗ `any`; `kv.keys()` + N+1 |
| Nội dung (cần Hưng duyệt) | Khối "Đang xây / Đang học" ở Home; case study theo quyết định → kết quả → bài học; số liệu 70%/80%/95% cần gắn kỳ đo |
| Cache KV — **đã lên Prod 14/10** | `main@e5f7b9a` → `dpl_Fsk2owyy1B52eC6dB52YnxY3KriL` (rollback anchor `dpl_7hfDRxbBPMpT7xtr6edNvHqfquh5`), kèm fix CI `4b9efab`. Root cause: `@vercel/kv` fetch `cache: 'default'` → Next 14 Data Cache vô thời hạn với request không đụng cookies/headers. Sửa: `lib/kv.ts` (`cache: 'no-store'`), 14 import runtime đổi sang `lib/kv`. Smoke Prod: trang Vibe Coding 200 + Related Videos; `/api/videos`, `/api/videos/[id]`, visitor-count 200; `sitemap.xml` giờ dynamic (x-vercel-cache MISS, 31 URL); 0 log error/warning 30 phút. **Owner check 15/10 PASS:** Upstash `SCARD visitors:2026-10:unique` = 9, `/api/public/visitor-count` Prod = 9. Upstash usage tháng 10 (đến 15/10): 3.1K / 500K commands (571 write, 2,505 read). |
| Kiểm bên ngoài | Google Search Console: **property `https://hungreo.com/` đã có và đã submit `sitemap.xml` (owner xác nhận 15/10)**; property cũ `hungreo.vercel.app` giữ nguyên. Xác minh bằng file `public/googleb0cbea67623b8a59.html` — **không xoá file này**. Cuối tháng 10: xem Indexing → Pages để kiểm duplicate/indexing |
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
