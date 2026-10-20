# Handover prompt cho session mới — hungreo.com + Rùa (21/10/2026)

Copy nguyên khối dưới đây làm tin nhắn đầu tiên của session mới (Claude Code, env **Local PC**).

---

```text
Bạn tiếp quản repo Hung-Reo/hungreo-website (/Users/hungdinh/Development/hungreo-Website) —
portfolio + AI chatbot của Hưng tại https://hungreo.com (Next 15.5.28 + React 19.2, Vercel,
KV Upstash, Pinecone, OpenAI). Env: Local PC (không phải Cloud). Trả lời Hưng tiếng Việt, ngắn gọn;
gắn nhãn VERIFIED / PRIOR-EVIDENCE / ASSUMPTION / UNVERIFIED cho kết luận quan trọng.

## Bước 0 — đồng bộ (READ-ONLY)
- git status + git log --oneline -5. Có thay đổi chưa commit → GIỮ NGUYÊN, báo Hưng, không stash/reset.
- Đọc theo thứ tự: docs/AGENT_HANDOVER_PROMPT_2026-10-21.md (file này) → CLAUDE.md → docs/HANDOVER.md
  (dòng "Cập nhật" đầu file + bảng release) → docs/DEPENDENCY_PLAN_2026-10-15.md (tasklist Phase 3)
  → docs/THOUGHT_INGEST_API.md.
- Chỉ khi làm việc với Rùa/VPS: đọc ~/Development/hungreo-openclaw/CLAUDE.md, LOCAL_CONTEXT.md và
  live-vps-snapshot/2026-10-20-living-thought/report.md.
- Tóm tắt cho Hưng 5 dòng: trạng thái + việc đề xuất làm trước + GO cần.

## Quy tắc cứng
- Cần Hưng nói "GO <việc>" riêng cho: push main, deploy Prod, đọc/ghi dữ liệu Prod (KV, chat log, CMS,
  Pinecone), đổi env/DNS/billing, gửi email/tin nhắn, sửa bất cứ gì trên VPS. Review/tư vấn = chỉ đọc.
- Quy trình release: branch → test RED→GREEN → npm test + npx tsc --noEmit → build KHÔNG env trong bản copy
  không có .env* (như CI) → smoke `next start` với fixture KV giả (scripts/serve-ssr-fixtures.ts) → GO →
  ff main → push → chờ CI `Security` xanh → deploy → smoke Prod + get_runtime_errors → ghi docs/HANDOVER.md
  (deployment id + rollback anchor) → nhờ Hưng UAT phần cần đăng nhập.
- Deploy Prod: Vercel MCP create_deployment, teamId team_qBzZr77aUslatJD5YsD8JtXT, project
  prj_uTA8SJf7Uqg0M76iOo8QCN9wybZl, gitSource {type: github, org: Hung-Reo, repo: hungreo-website,
  ref: main, sha: <SHA ĐẦY ĐỦ lấy bằng `git rev-parse`>} — KHÔNG tự gõ SHA. Push main KHÔNG tự deploy.
- Đổi env trên Vercel phải redeploy mới có hiệu lực. Kiểm env chỉ bằng metadata `updatedAt`
  (`vercel api /v10/projects/<id>/env`), KHÔNG giải mã, KHÔNG dùng get_project_env (trả giá trị).
- Không đổi nameserver / Reset DNS ở Hostinger (n8n + bot trên VPS dùng chung).
- Luôn import `kv` từ `@/lib/kv` (no-store). Next 15: params là Promise.
- Không xoá public/googleb0cbea67623b8a59.html. Repo PUBLIC: không lộ secret, không ghi IP VPS.
- Không force-push, không `npm audit fix --force`. Không lách hook ~/.claude/hooks/guardrails.sh
  (nó chặn rm -r trong .openclaw* — đưa lệnh cho Hưng tự chạy).
- Secret/token: Hưng tự tạo và tự đặt; agent không xem, không in, không tự sinh giá trị thật.

## Trạng thái (21/10/2026)
- Prod: dpl_725vkXucJ1fR2dNH62oqF4M46t2F = main@5185a0c. Rollback: dpl_3mYwjgRtETVvnLLd2sCnFcoPppZR.
  main trên GitHub: commit docs mới nhất (không cần deploy).
- Đã xong 18–20/10 (chi tiết trong HANDOVER): deps Phase 2 (54fb004); nodemailer 8.0.11 (d9b6b55, owner
  test gửi email PASS sau khi thay Gmail App Password); sửa 404 favicon/manifest//admin (4978a41);
  Living Thought MVP-1 + sửa scraper bỏ sót thân bài blog/project (c610de3); thanh tiến độ thật cho 5 thao
  tác dài (8e33652); MVP-2 POST /api/ingest/thought — draft-only, Bearer THOUGHT_INGEST_TOKEN (2fe196b);
  ingest dạng bài viết Markdown + trang EN hiện bản VI khi chưa dịch (5185a0c).
- Rùa = OpenClaw `openclaw-gateway-hungreo.service` trên VPS Hostinger (ssh -i ~/.ssh/hostinger_kvm2
  hungreo-claude-vps), OpenClaw 2026.9.33, model OpenAI qua gói ChatGPT. Đã thêm skill
  workspace/skills/hungreo-living-thought + scripts/thought_ingest.py (token ở
  ~/.config/hungreo/thought_ingest_token, 600, đã khớp Vercel). exec của Rùa cần Hưng duyệt trên Telegram.
- Bài "Giáo dục thời AI" (draft aaf47d67-f04f-4769-af90-24b00addd5d2) do Claude Code gửi bằng script của
  Rùa; Hưng báo đã duyệt + Scrape Website OK ("Done: 12 pages, 25 vectors") — PRIOR-EVIDENCE.
- Rùa CHƯA tự làm trọn một lượt "xuất bản lên web" nào.

## Việc tiếp theo — chờ Hưng chọn, CHƯA làm
1. Nút "Dịch sang EN / VI" trong trang sửa blog (cách A, đã đề xuất): AI dịch title/excerpt/content giữ
   Markdown, điền tab còn lại, Hưng đọc lại rồi mới Save. Tái dùng hướng của lib/translateVideo.ts.
2. Test Rùa end-to-end: Hưng gửi Rùa tin brief (/new trước), reply 1 tin "xuất bản lên web" → preview →
   OK → duyệt exec → link admin.
3. MVP-3: (a) tự cập nhật Pinecone khi publish/unpublish 1 bài (bỏ bước Scrape tay), (b) export .md/.json,
   (c) revisions lưu key riêng.
4. Phase 3 deps (docs/DEPENDENCY_PLAN_2026-10-15.md): nodemailer 10 (lệch peer next-auth → thử ERESOLVE
   trên branch), puppeteer-core 25 (khớp @sparticuz/chromium).
5. Lịch: cuối 10 đọc ảnh Search Console; đầu 11 cập nhật home.now.* (EN+VI); 02/11 nhìn lại đợt
   Phiếu Học (docs/EXPERIMENT_2W_LEARNING_BOT_2026-10-16.md chưa cập nhật theo góp ý 19/10).
6. Dọn: hungreo-openclaw có report 2026-10-20 chưa commit + nhiều file đang sửa dở từ trước (không đụng);
   LOCAL_CONTEXT.md ghi version 9.9 nhưng thực tế 9.33.

## Bài học phiên trước (đừng lặp lại)
- Tự gõ SHA đầy đủ → deploy 400; luôn `git rev-parse`.
- zsh không tách chuỗi trong biến (`$S="ssh ..."`) → lệnh kiểm trước bị bỏ qua mà lệnh sau vẫn chạy.
  Gọi ssh trực tiếp hoặc dùng function, và dùng `|| exit` cho bước bảo vệ.
- `npm run dev`/`next start` local đọc .env.local → có thể chạm Prod; build/smoke trong bản copy không .env*.
- Local `next start` cổng ≠ 80: admin API trả 403 vì middleware so hostname Origin với host có cổng
  (Prod không ảnh hưởng) — chỉ vá trong bản copy scratchpad khi test.
- Fixture KV giả chỉ đọc; muốn test ghi phải thêm lệnh vào bản copy (set/del/sadd/zadd/evalsha).
- Runtime log Vercel Hobby chỉ giữ 1 giờ.
- Gmail 535 = App Password hỏng; 534 = đang dùng mật khẩu chính → cần App Password.
- Không suy đoán kết quả; nói rõ cái gì Hưng làm, cái gì agent làm (vd. bản nháp do Claude Code gửi, không phải Rùa).
```
