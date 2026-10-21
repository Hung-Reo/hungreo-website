# Handover prompt cho session mới — hungreo.com (22/10/2026)

Copy nguyên khối dưới đây làm tin nhắn đầu tiên của session mới (Claude Code, env **Local PC**).
Thay cho `AGENT_HANDOVER_PROMPT_2026-10-21.md`.

---

```text
Bạn tiếp quản repo Hung-Reo/hungreo-website (/Users/hungdinh/Development/hungreo-Website) —
portfolio + AI chatbot của Hưng tại https://hungreo.com (Next 15.5.28 + React 19.2, Vercel Node 22.x,
KV Upstash, Pinecone, OpenAI). Env: Local PC. Trả lời Hưng tiếng Việt, ngắn gọn; gắn nhãn
VERIFIED / PRIOR-EVIDENCE / ASSUMPTION / UNVERIFIED cho kết luận quan trọng.

## Bước 0 — đồng bộ (READ-ONLY)
- git status + git log --oneline -5. Có thay đổi chưa commit → GIỮ NGUYÊN, báo Hưng.
- Đọc theo thứ tự: docs/AGENT_HANDOVER_PROMPT_2026-10-22.md → CLAUDE.md → docs/HANDOVER.md (dòng
  "Cập nhật" + bảng release) → docs/ISSUE_LOG.md (bảng + "Mẫu lỗi lặp lại") →
  docs/DEPENDENCY_PLAN_2026-10-15.md (tasklist cuối file).
- Chỉ khi làm với Rùa/VPS: đọc ~/Development/hungreo-openclaw/CLAUDE.md + LOCAL_CONTEXT.md trước.
- Tóm tắt cho Hưng 5 dòng: trạng thái + việc đề xuất + GO cần.

## Quy tắc cứng
- Cần Hưng nói "GO <việc>" riêng cho: commit (khi chưa được bảo), push main, deploy Prod, đọc/ghi dữ liệu
  Prod (KV, chat log, CMS, Pinecone), đổi env/DNS/billing, gửi email/tin nhắn, sửa bất cứ gì trên VPS.
- Quy trình release (đã chạy ổn 4 lần ngày 21/10): branch → test RED→GREEN → npm test + npx tsc --noEmit
  → build KHÔNG env trong bản copy scratchpad không có .env* → smoke `next start` bản copy → (review
  fresh-context nếu đụng dữ liệu) → GO → commit → ff main → push → chờ CI `Security` xanh (gh run watch)
  → deploy → smoke Prod 22 URL trước/sau + get_runtime_errors → ghi docs/HANDOVER.md (deployment id +
  rollback anchor) → push docs → nhờ Hưng UAT phần cần đăng nhập.
- Deploy Prod: Vercel MCP create_deployment, teamId team_qBzZr77aUslatJD5YsD8JtXT, project
  prj_uTA8SJf7Uqg0M76iOo8QCN9wybZl, gitSource {type: github, org: Hung-Reo, repo: hungreo-website, ref: main,
  sha: <SHA ĐẦY ĐỦ từ `git rev-parse main`>}. Không tự gõ SHA. Push main KHÔNG tự deploy. Chờ READY bằng
  `vercel inspect <url> --wait`.
- CI `Security` chỉ chạy khi push main hoặc PR vào main — push branch không có CI.
- Luôn import `kv` từ `@/lib/kv` (test kvImportGuard sẽ fail nếu sai). Next 15: params là Promise.
- Không xoá public/googleb0cbea67623b8a59.html. Repo PUBLIC: không lộ secret, không ghi IP VPS.
- Không force-push, không `npm audit fix --force`, không `--legacy-peer-deps`. Không lách guardrails hook.
- Secret/token: Hưng tự tạo và tự đặt; agent không xem, không in. Kiểm env chỉ bằng `updatedAt`.
- Mỗi lỗi mới gặp trên Prod: thêm mục ISS-NNN vào docs/ISSUE_LOG.md + test chặn tái diễn.

## Trạng thái (21/10/2026 tối)
- Prod: dpl_J6obzELLAoZABMy4gf2Vft4MaoCa = main@d7ca5bf. Rollback: dpl_8nP7D6kw69csXsMXD31bxRxUp8za.
  main trên GitHub có thêm commit docs (không cần deploy).
- Xong 21/10 (owner UAT PASS, chi tiết trong HANDOVER):
  - Nút "Dịch VI ↔ EN" trong trang sửa blog (lib/blogTranslator.ts; giới hạn 30.000 ký tự; không tự lưu).
  - Sửa upload ảnh blog (ISS-001: ảnh nén gửi tên "blob" → 400; lỗi có từ 25/04/2026).
  - MVP-3a: lưu/gỡ/xoá/đổi slug blog + project tự cập nhật Pinecone (lib/contentIndex.ts), không cần bấm
    Scrape Website; scraper dùng cùng text CMS cho /blog/*, /projects/*.
  - Admin → Home: Hưng tự sửa khối "Đang xây / Đang học" (KV content:home-now). Home thành trang động
    (TTFB ~0,24 s → ~0,53 s, đã chấp nhận).
  - Chặn trùng slug khi tạo/sửa (lib/slug.ts), ô Screenshot Projects báo lỗi rõ, cleanup-corrupt-posts dọn
    vector, CLAUDE.md + CHANGELOG.md sửa.
  - docs/ISSUE_LOG.md: 25 mục + bảng "Mẫu lỗi lặp lại"; test chặn tái diễn kvImportGuard, videoIndexRead.
  - Rùa end-to-end PASS lần đầu: bài Nightbirde (id d405f1ad-…) ingest 201 → Hưng publish.
- Thử và HOÃN: nodemailer 10 (next-auth chỉ nhận peer 7–8 → npm ls invalid + mất type), puppeteer-core 25
  (cần Node ≥ 22.12 + Chromium mới hơn @sparticuz/chromium 153). Lý do trong DEPENDENCY_PLAN.

## Việc còn mở — chờ Hưng chọn, CHƯA làm
1. Nội dung (Hưng tự làm trong admin): bài Nightbirde chưa có thân EN → "Dịch VI → EN" + Save; dòng
   "Xem video anh Hưng chọn" lệch ngôi; nháp 74a9dcb0-… (Rùa gửi 20/10) — giữ hay xoá.
2. Lịch: cuối tháng 10 xem Search Console (Indexing → Pages); đầu tháng 11 cập nhật Admin → Home;
   02/11 nhìn lại đợt Phiếu Học (docs/EXPERIMENT_2W_LEARNING_BOT_2026-10-16.md chưa cập nhật góp ý 19/10).
3. Nhỏ, có thể làm khi rảnh: `npm run test:ssr` chưa nằm trong `npm test`; cảnh báo lệch Markdown của nút
   Dịch chưa so URL link/ảnh. (XONG 21/10: CI `security.yml` đã Node 22 — `f4138ee`, run 39604642949 xanh,
   không deploy; chi tiết trong HANDOVER.)
4. Tuỳ chọn: MVP-3 (b) export .md/.json, (c) revisions lưu key riêng.
5. Dependency: nodemailer 10 khi next-auth nới peer hoặc có @types/nodemailer 10; puppeteer 25 khi
   @sparticuz/chromium theo kịp và CI đã Node 22.

## Bài học phiên trước (đừng lặp lại)
- Runtime log Vercel Hobby chỉ giữ 1 giờ → muốn đọc log thì đọc ngay sau thao tác. Với Rùa, kết quả lệnh
  nằm trong session Codex trên VPS (~/.openclaw-hungreo/agents/main/agent/codex-home/sessions/...) — chỉ
  grep mã kết quả/id, không in nội dung chat.
- Smoke `next start` bản copy: fixture KV (scripts/serve-ssr-fixtures.ts) chỉ đọc → muốn đăng nhập/lưu thì
  chỉ trong bản copy: thêm `evalsha`/`eval` (rate limit) và `set` (ghi vào bộ nhớ); vá middleware so
  `originUrl.host === host` (cổng ≠ 80). OpenAI giả qua OPENAI_BASE_URL; admin test = mật khẩu ngẫu nhiên +
  ADMIN_PASSWORD_HASH trong scratchpad. Chạy qua .claude/launch.json cấu hình "smoke-copy".
- Review fresh-context (subagent) đã bắt 2 lỗi thật mà test tự viết không thấy (xoá thân bài ẩn; gỡ bài
  lỗi không sửa được bằng Save lại) → giữ bước này cho thay đổi đụng dữ liệu.
- Xác định mốc lỗi bằng dữ liệu thật trên Prod, không đoán từ git log (ISS-001 ban đầu ghi sai mốc).
- `git rev-parse --short A B` báo fatal → gọi riêng từng cái.
- Lệnh tuỳ chọn để hoàn tác: viết trong câu, KHÔNG đặt trong khối ```bash (app có nút Run, Hưng đã bấm nhầm).
- Trang chi tiết blog/project lệch ±91 byte giữa các lần tải là do thứ tự stream Suspense, không phải lỗi.
- Không suy đoán kết quả; nói rõ cái gì Hưng làm, cái gì agent làm.
```
