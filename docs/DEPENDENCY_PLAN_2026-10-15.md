# Kế hoạch nâng Next 15 — 2026-10-15

Cập nhật cho `DEPENDENCY_PLAN_2026-09-09.md`. Chưa nâng package nào; chờ GO từng phase.

## Hiện trạng (VERIFIED 15/10)

- `next@14.2.35`, `react@18.3.1`, `next-auth@5.0.0-beta.32`, `eslint-config-next@14.2.35`.
- Dist-tag `next-14` vẫn là `14.2.35` → nhánh 14 không còn bản vá mới. Dist-tag `backport` = `15.5.28` (publish 14/10/2026), `latest` = `16.4.1`.
- `npm audit --omit=dev`: 35 package (1 critical, 28 high, 6 moderate). Riêng `next` có 23 advisory, **tất cả có range kết thúc ≤ `15.5.24`** → `15.5.28` vá hết phần của `next`. Theo thông báo Vercel 25/08, hai critical (Windows RCE, AVIF) không áp dụng trên Vercel; phần còn lại (DoS Server Components/Server Actions, cache poisoning, SSRF rewrites…) chưa được loại trừ.
- `next@15.5.28` vẫn ghim `postcss@8.4.31` → các advisory `postcss` còn lại sau Phase 1. Rủi ro thấp: postcss chỉ xử lý CSS của chính repo lúc build. Chỉ Next 16 (`postcss@8.5.23`) hết.

## Tương thích (VERIFIED từ peerDependencies)

| Package | Yêu cầu | Kết luận |
|---|---|---|
| `next@15.5.28` | react `^18.2 \|\| ^19`, Node `>=20` | OK (Vercel Node 22, CI Node 20) |
| `next-auth@5.0.0-beta.32` | next `^14 \|\| ^15 \|\| ^16`, react `^18.2 \|\| ^19`, **nodemailer `^7.0.7 \|\| ^8.0.5`** | OK cho Next 15. **Nodemailer 9 trong plan 09/09 không tương thích peer** → bỏ ứng viên 9.1.1 |
| `eslint-config-next@15.5.28` | eslint `^7 \|\| ^8 \|\| ^9` | Giữ eslint 8 |
| tiptap, md-editor, lucide, sonner, swr, @vercel/analytics, radix slot, tanstack table, react-markdown | đều nhận React 19 | OK |

## Phạm vi code bị ảnh hưởng (đếm 15/10)

| Thay đổi Next 15 / React 19 | Chỗ trong repo |
|---|---|
| `params` / `searchParams` thành Promise | 4 file server: `app/blog/[slug]/layout.tsx`, `app/projects/[slug]/layout.tsx`, `app/tools/knowledge/[category]/page.tsx`, `app/tools/knowledge/[category]/[slug]/page.tsx` (cả `generateMetadata`) |
| | 5 page client: admin blog/project `[id]`, `admin/reset-password/[token]`, `blog/[slug]`, `projects/[slug]` → `useParams()` hoặc `use(params)` |
| | 10 route handler động dưới `app/api/**/[...]` |
| `cookies()` / `headers()` async | Không có chỗ gọi trực tiếp |
| Config đổi tên | `experimental.serverComponentsExternalPackages` → `serverExternalPackages` (`next.config.js`) |
| Middleware `req.geo` / `req.ip` bị bỏ | Không dùng |
| Cache mặc định (fetch và GET route không cache) | Khớp với `lib/kv.ts` (`no-store`) đã làm 14/10 — không đổi hành vi |
| React 19 type (`useRef()` cần đối số, JSX namespace…) | Sửa theo lỗi `tsc` thực tế; không thấy `useFormState`, `ReactDOM.render`, `propTypes` |

## Các phase

### Phase 1 — Next 15.5.28 + React 19 (release riêng)
1. Trên branch làm việc: nâng `next`, `eslint-config-next` lên `15.5.28`; `react`, `react-dom` lên `19.x`; `@types/react(-dom)` lên 19. Có thể dùng `@next/codemod` cho async params, nhưng đọc lại toàn bộ diff.
2. Sửa config, 19 file params, lỗi type React 19.
3. Kiểm local: `tsc`, `npm test`, build không env (như CI), `next start` + KV giả cho Home, About, Projects, Blog, knowledge category/detail + Related Videos, sitemap, các API GET.
4. Preview Vercel (KV preview rỗng) để chắc build trên Vercel.
5. GO deploy riêng → smoke Prod → **Hưng UAT ~15 phút**: đăng nhập/đăng xuất admin, mở và lưu thử một bài blog/project (không đổi nội dung), chatbot 3 câu, đổi EN/VI.
6. Rollback: Vercel promote lại deployment trước (~1 phút), không có migration dữ liệu.

Ước lượng: nửa ngày đến 1 ngày làm + 15 phút UAT.

### Phase 2 — vá non-major (release riêng, sau 3–7 ngày Phase 1 ổn định)
`npm audit fix` không `--force` (axios, tiptap, prosemirror, undici, dompurify, markdown-it, xmldom…). Test + smoke như Phase 1, UAT editor admin.

### Phase 3 — major còn lại (quyết định từng cái, không gộp)
- `nodemailer`: tìm bản 8.x vá advisory SMTP injection mà vẫn trong peer của next-auth.
- `puppeteer-core` 25, `mammoth`, `@tailwindcss/typography` / `tailwindcss` 4 (thay đổi CSS lớn — chưa đáng làm).
- Next 16: sau khi 15 ổn định; nhiều breaking hơn (middleware → proxy, Turbopack mặc định, bỏ `next lint`).

### Trạng thái 19/10 + tasklist còn lại (chưa gấp, Hưng chốt 19/10)

- ✅ Phase 1 (Next 15) · ✅ Phase 2 (`54fb004`) · ✅ nodemailer 8.0.11 (`d9b6b55`, owner test gửi email PASS) · ✅ sửa 404 favicon/manifest/`/admin` (`4978a41`). Audit prod còn 25 (9 moderate, 16 high).
- **21/10 thử nâng (Claude Code, branch `chore/small-fixes`) → hoãn cả hai, giữ nodemailer 8.0.11 / puppeteer-core 24.43.1:**
  - nodemailer 10.1.7: changelog 9–10 không đổi gì phần repo dùng (Gmail SMTP user/pass; 9.0 bật kiểm TLS cho tải nội dung từ xa, 10.0 cần Node ≥ 20) và advisory nodemailer biến khỏi audit. Nhưng `npm install` phải **ghi đè peer** của `next-auth`/`@auth/core` (`^7.0.7 || ^8.0.5`) → `npm ls` báo `ELSPROBLEMS invalid`, và `tsc` mất kiểu `nodemailer` (`@types/nodemailer` mới nhất vẫn 8.0.2). Đã hoàn lại lockfile. Làm lại khi next-auth nới peer hoặc có `@types/nodemailer` 10. Rủi ro giữ 8: nodemailer chỉ dùng khi admin bấm trả lời contact request.
  - puppeteer-core 25.15: cần Node ≥ 22.12 (CI đang Node 20) và Chromium mới hơn `@sparticuz/chromium` mới nhất (153). Chờ chromium serverless theo kịp + nâng Node CI trước. Chỉ ảnh hưởng nút cào website của admin.
  - Đã thêm `__tests__/nodemailer.test.ts` (dựng email offline: UTF-8, CRLF ở subject không tạo Bcc) để lần nâng sau có kiểm tự động.
- [ ] **nodemailer 10.x (làm trước):** còn 8 advisory tới 10.0.5 (addressparser DoS, recipient-domain bypass, DNS cache TLS). `next-auth`/`@auth/core` bị báo high **chỉ vì kéo theo nodemailer** (VERIFIED từ `via` của `npm audit`), không phải lỗi riêng → sửa nodemailer là hết 3 dòng. Vướng: peer optional của next-auth `^7.0.7 || ^8.0.5` → thử trên branch xem `npm ci` có ERESOLVE không trước khi push. Test: trả lời 1 contact request (email của Hưng).
- [ ] **puppeteer-core 25 (làm sau):** chuỗi `puppeteer-core → @puppeteer/browsers → proxy-agent → pac-proxy-agent → get-uri → basic-ftp` (FTP listing DoS) + `extract-zip`. App chỉ dùng ở nút cào website của admin (`lib/websiteScraper.ts`), đọc HTTPS, không dùng FTP → rủi ro thực tế rất thấp. Phải khớp phiên bản với `@sparticuz/chromium`. Test: bấm cào website 1 lần.
- [ ] Để sau: `mammoth`/`gray-matter` (audit gợi ý hạ cấp — sai, chờ upstream), Tailwind 4, Next 16 (kèm postcss), warning tiptap *Duplicate extension names* (`StarterKit` v3 đã có Link/Underline).

Không dùng `npm audit fix --force`. Không gộp phase với thay đổi tính năng (AI agent làm sau Phase 1).
