# Handover prompt cho agent tiếp theo — hungreo.com (16/10/2026)

Copy nguyên khối dưới đây làm tin nhắn đầu tiên cho agent mới (Claude Code, Codex, Gemini…).

---

Bạn tiếp quản repo `Hung-Reo/hungreo-website` — portfolio + AI chatbot của Hưng (Đinh Quang Hưng), chạy tại https://hungreo.com. Trả lời Hưng bằng **tiếng Việt**, rõ ràng, ngắn gọn; commit message và docs cũng tiếng Việt.

## 1. Đọc trước khi làm bất cứ gì

1. `CLAUDE.md` — stack và convention.
2. `docs/HANDOVER.md` — trạng thái hiện tại, **"4 điều tuyệt đối phải biết"**, bảng "Việc còn lại".
3. `docs/DEPENDENCY_PLAN_2026-10-15.md` — kế hoạch nâng dependency theo phase.
4. `git log --oneline -15` trên `main` để thấy các thay đổi gần nhất.

## 2. Quy tắc làm việc (bắt buộc)

- **GO riêng cho mọi thứ ra ngoài:** push lên `main`, deploy Prod, ghi dữ liệu Prod (KV/CMS), gửi email/tin nhắn, đổi DNS/env/billing đều cần Hưng nói "GO …" rõ ràng cho đúng việc đó. Phân tích, review, tư vấn = chỉ đọc.
- Làm trên branch; chỉ fast-forward `main` khi có GO. Không rewrite history, không force-push, không `npm audit fix --force`.
- **Bằng chứng trước kết luận:** gắn nhãn `VERIFIED` / `PRIOR-EVIDENCE` / `ASSUMPTION` / `UNVERIFIED`. Khi nghi regression, so với bản Prod đang chạy (control test) trước khi kết luận.
- Mỗi release: test → typecheck → build như CI (không env) → chạy `next start` local với KV giả cho các trang bị ảnh hưởng → GO → merge → chờ CI GitHub `Security` xanh → deploy → smoke Prod → ghi `docs/HANDOVER.md` (commit, deployment id, rollback anchor, kết quả smoke) → nhờ Hưng UAT phần agent không tự test được (admin login, chatbot).
- Không lộ secret (token, key, `.env*`). Repo **public**.

## 3. Những điều dễ sai (đã trả giá để biết)

- **DNS ở Hostinger** chứa record của n8n và 3 Telegram bot trên VPS. Không đổi nameserver, không "Reset DNS". Search Console đã xác minh bằng file, không cần DNS.
- **Push `main` không tự deploy Prod.** Push branch khác thì Vercel tự tạo Preview, nhưng KV của Preview **rỗng**, nên chỉ dùng để kiểm build/không lỗi. Deploy Prod: `vercel --prod` từ máy Hưng, hoặc Vercel API/connector `create_deployment` với `gitSource` (`Hung-Reo/hungreo-website`, `ref: main`, `sha` cụ thể, `target: production`). Rollback: promote lại deployment trước (~1 phút).
- **Luôn import `kv` từ `@/lib/kv`** (client `cache: 'no-store'`), không import thẳng từ `@vercel/kv`. Lý do: `@vercel/kv` mặc định `cache: 'default'` → Next lưu Data Cache vô thời hạn → trang public hiện dữ liệu cũ.
- **Next 15:** `params`/`searchParams` là Promise (server: `await params`; client page: `useParams()`). Prod chạy `next@15.5.28`, `react@~19.2.9` (cố ý ghim dòng 19.2).
- Không xoá `public/googleb0cbea67623b8a59.html` (xác minh Google Search Console).
- Rate limit `passwordResetRateLimit` (5 lần/15 phút/IP) **dùng chung** cho `validate-reset-token` và `reset-password` → 1 lượt reset hợp lệ tốn 2.
- Trang `/tools/knowledge/<category-không-tồn-tại>` trả 200 + `noindex` (hành vi cũ, đã có từ Next 14) — không phải regression.
- Cloud session có thể bị chặn mạng tới `hungreo.com`; dùng URL deployment `*.vercel.app` qua Vercel connector (tự bypass SSO) để smoke.

## 4. Trạng thái hiện tại (16/10/2026)

- Prod: `dpl_CBmVAKKTBJiXAWZJSWjs4ScaaUTn` = `main@913cc88` (hardening đợt 2), rollback anchor `dpl_87KMUXpNtFZopmHYRNU6m15EVAwR`.
- Đã xong 13–16/10: fix Related Videos; `lib/kv.ts` no-store; CI xanh lại; hardening đợt 1 (escape email, rate limit, SSE) và đợt 2 (auth admin About, rate limit validate token, bỏ `bcrypt`); nội dung Home "Đang xây / Đang học" tháng 10; nâng Next 15 + React 19 (owner UAT PASS); Search Console có property `https://hungreo.com/` + sitemap; case study Telegram bỏ số liệu chưa kiểm chứng.

## 5. Việc còn lại — theo thứ tự

| # | Việc | Ghi chú / tiêu chí xong |
|---|---|---|
| 1 | **Owner UAT hardening đợt 2** | Hưng mở Admin Dashboard (số chat tuần/tháng hiển thị đúng) và trang sửa About (tải + lưu được). Ghi kết quả vào HANDOVER |
| 2 | **Key Learnings của case study Telegram** | Ô `learnings` dùng chung EN/VI đang là tiếng Việt → trang EN hiện tiếng Việt. Hỏi Hưng giữ VI hay đổi sang 4 câu EN trong `docs/CASE_STUDY_TELEGRAM_2026-10-15.md` (Hưng tự sửa trong admin) |
| 3 | **Phase 2 dependency** (từ ~18–22/10, khi Next 15 ổn định) | `npm audit fix` **không** `--force`, release riêng; test + smoke + UAT editor admin (tiptap). Xem `DEPENDENCY_PLAN_2026-10-15.md` |
| 4 | **AI agent cho website** (ý tưởng của Hưng) | Chưa code. Bước đầu: hỏi Hưng 3 câu (agent phục vụ ai trước — khách hay chính Hưng; một việc cụ thể muốn nó tự làm; ngân sách OpenAI/tháng) → phân tích chat log (chỉ đọc, cần GO vì dữ liệu Prod) → spec 1 trang → prototype 1 tool trên branch. Giữ GDPR (không PII), trần chi phí, chống prompt injection |
| 5 | Search Console (cuối tháng 10) | Hưng gửi ảnh Indexing → Pages; đọc giúp trang nào chưa index và vì sao |
| 6 | Cập nhật Home hằng tháng (đầu tháng 11) | Hưng gửi 2–3 dòng → sửa key `home.now.*` EN + VI trong `contexts/LanguageContext.tsx`, đổi `home.now.updated` |
| 7 | Phase 3 dependency (quyết định từng cái) | Nodemailer 8.x có vá (next-auth chỉ nhận ^7.0.7 \|\| ^8.0.5), puppeteer-core 25, Tailwind 4, Next 16 |
| 8 | Nợ kỹ thuật nhỏ (không gấp) | 2 hàm `chunkText` khác nhau (chỉ khi re-index Pinecone); `isAdminEmail` copy 3 bản; auth guard lặp ở ~38 route; category sai trả 200 thay vì 404 |

Bắt đầu bằng việc #1 và #2 (cần Hưng), đề xuất thời điểm cho #3, và hỏi 3 câu của #4. Không tự deploy hay ghi dữ liệu Prod khi chưa có GO.
