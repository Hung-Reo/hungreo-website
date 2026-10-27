# Tổng kết Session: Di chuyển Chat Model sang `gpt-6-luna`

- **Ngày thực hiện:** 27/10/2026
- **Nhánh Git:** `chore/gpt-6-luna` (tạo từ `main@474e1d5`)
- **Trạng thái:** B0 → B4 hoàn tất; đã vượt qua kiểm tra hồi quy; chưa commit, chưa deploy.
- **Trọng tâm:** Thay thế `gpt-4o-mini` / `gpt-4.1-mini` bằng `gpt-6-luna` (`reasoning_effort=medium`). Giữ nguyên Embeddings (`text-embedding-3-large`) và Pinecone database.

---

## 1. Tóm tắt các quyết định kỹ thuật & Thay đổi cốt lõi

| Hạng mục | Trước migration | Sau migration (`gpt-6-luna`) | Lý do & Kiểm chứng thực tế |
|---|---|---|---|
| **Chat Model** | `gpt-4o-mini` / `gpt-4.1-mini` | `gpt-6-luna` (mặc định) | Chuẩn bị trước hạn chót OpenAI gỡ model cũ (14/01/2027) |
| **Quản lý Model** | Hardcoded rải rác trong 8 file | Tập trung tại `lib/aiModel.ts` | Single Source of Truth; đổi model chỉ qua env `OPENAI_MODEL` |
| **Reasoning Effort** | Không có (model cũ không hỗ trợ) | `medium` (mặc định) | Cân bằng chất lượng suy luận và chi phí; validate nghiêm ngặt `none..xhigh, max` |
| **Tham số Output** | `max_tokens` (2000, 1000, 16000) | `max_completion_tokens` (8000, 4000, 32000) | `max_tokens` bị Luna cấm (HTTP 400); reasoning tokens tính chung vào output budget |
| **Temperature** | `0.7`, `0.3`, `0.2`, `0` | **Bỏ hoàn toàn** | Docs OpenAI: khi reasoning effort khác `none` phải bỏ `temperature`; smoke B1 (effort mặc định + 0.7) → 400. Bỏ hẳn để effort nào cũng chạy |

---

## 2. Chi tiết thực hiện theo các bước (B0 → B4)

### B0 — Chuẩn bị nhánh
- Đã checkout nhánh an toàn: `git checkout -b chore/gpt-6-luna`.
- Giữ nguyên working tree, không stash, không reset.

### B1 — Smoke Test (OpenAI API thật)
- Thực hiện 4 lệnh gọi độc lập qua `scratch/luna-smoke.ts`:
  1. `temperature: 0.7`: **FAIL (400)** ➡️ với effort mặc định, Luna từ chối `temperature` (docs: chỉ nhận khi effort `none`).
  2. Bỏ `temperature`: **PASS (200)** ➡️ Đo TTFT streaming ban đầu đạt 1.6s.
  3. JSON Mode (`response_format: { type: 'json_object' }`): **PASS (200)** ➡️ Output cấu trúc JSON chính xác.
  4. Cô lập `max_tokens: 100`: **FAIL (400)** ➡️ Model từ chối tham số cũ, bắt buộc dùng `max_completion_tokens`.

### B2 — Xây dựng `lib/aiModel.ts` & Xử lý vấn đề SDK
- Xây dựng module trung tâm cung cấp `getAIModel()`, `getReasoningEffort()`, và `reasoningParams()`.
- **Xử lý lỗi P1 (ISS-026):** SDK `openai@^6.8.1` có type `'minimal'` nhưng Luna API nhận `'none' | 'low' | 'medium' | 'high' | 'xhigh' | 'max'` (`max` theo trang model, chưa gọi thử). Đã bổ sung logic validate tự động fallback về `'medium'` nếu env sai, tránh sập app.
- **Xử lý lỗi P2 (ISS-026):** ~~Thêm cơ chế tự nạp `.env.local` trong `lib/aiModel.ts`~~ — bỏ ở review 27/10 (xem mục 6); script CLI tự nạp env và gọi `getAIModel()` lúc request.

### B3 — Cập nhật Codebase (11 file)
- **8 file nghiệp vụ:**
  - `app/api/chat/route.ts`: Chatbot streaming, `max_completion_tokens: 8000`, bỏ `temperature`.
  - `lib/openai.ts`: `generateChatCompletion`, `max_completion_tokens: 4000`, bỏ `temperature`.
  - `app/api/youtube/route.ts`: Tóm tắt video YouTube, `max_completion_tokens: 4000`, bỏ `temperature`.
  - `lib/translateVideo.ts`: Dịch video, bỏ `temperature`.
  - `lib/blogTranslator.ts`: Tăng trần output lên `32_000` tokens, bỏ `temperature`.
  - `lib/blogPolisher.ts`: Polish & Detect language, bỏ `temperature`.
  - `lib/cvParser.ts`: Parse CV & Dịch CV, bỏ `temperature`.
  - `lib/projectParser.ts`: Parse project docs, bỏ `temperature`.
- **3 file phụ trợ & kiểm thử:**
  - `scripts/replay-chat-retrieval.ts`: Tích hợp `AI_MODEL` và `reasoningParams()`.
  - `.env.example`: Hướng dẫn đầy đủ `OPENAI_MODEL` và `OPENAI_REASONING_EFFORT` (`none..xhigh, max`).
  - `__tests__/blogTranslator.test.ts`: Thêm kiểm tra `max_completion_tokens === 32000` và `max_tokens === undefined`.

### B4 — Kiểm tra tự động & Đánh giá RAG Streaming
1. **Kiểm tra cú pháp & Type:**
   - `grep -rn "gpt-4\|max_tokens" app lib scripts --include="*.ts"`: Sạch hoàn toàn (chỉ còn logic tương thích ngược trong `lib/aiModel.ts`).
   - `npx tsc --noEmit`: **0 lỗi** type.
   - `npm test`: **PASS 19/19 suites** (120+ unit tests).
   - `npm run build`: **PASS** (biên dịch thành công toàn bộ 58 trang Next.js).
2. **Benchmark 10 câu RAG Streaming thật (`scratch/replay-10-rigorous.ts`):**
   - Đầy đủ context RAG (Pinecone vector search + context builder).
   - Đo lường streaming TTFT thực tế và đối chiếu sự thật (facts/citations):
     - **TTFT Streaming thực tế:** Dao động từ **1.28s đến 3.45s** (trung bình ~2.5 giây).
     - **Thời gian hoàn tất cả câu:** 1.6s đến 6.9s.
     - **Bám nguồn (Grounding):** 10/10 câu đạt chuẩn (trích dẫn đúng link YouTube ID `O8_isifBeKk`, `yhGzXULZkEw`, facts 20 năm BA, dự án OpenClaw, và từ chối đúng các câu hỏi ngoài kho tài liệu).
     - Chi tiết lưu tại: `/tmp/luna-replay-10-audit.json`.

---

## 3. Nhật ký sự cố kỹ thuật trong phiên (ISS-026)

Đã ghi nhận vào `docs/ISSUE_LOG.md` theo quy chuẩn dự án:
- **Mã:** `ISS-026`
- **Nội dung:** Lỗi 400 khi cấu hình `reasoning_effort=minimal` trên GPT-6 Luna và lỗi nạp chậm `.env.local` do ES module hoisting.
- **Bài học rút ra:** 
  1. Không tin tưởng tuyệt đối vào type definition tĩnh của SDK bên thứ ba khi làm việc với model AI mới; luôn xác minh bằng HTTP request thật tới runtime API của model.
  2. Với các file module export cấu hình, luôn đọc `process.env` động tại thời điểm hàm thực thi để tránh bị đóng băng giá trị trước khi dotenv kịp nạp.

---

## 4. `git diff --stat`

```text
 .env.example                     |  5 +++++
 __tests__/blogTranslator.test.ts |  2 ++
 app/api/chat/route.ts            |  7 ++++---
 app/api/youtube/route.ts         |  7 ++++---
 docs/ISSUE_LOG.md                |  9 +++++++++
 lib/blogPolisher.ts              |  7 +++----
 lib/blogTranslator.ts            | 12 +++++-------
 lib/cvParser.ts                  | 10 ++++------
 lib/openai.ts                    |  7 ++++---
 lib/projectParser.ts             |  8 +++-----
 lib/translateVideo.ts            |  5 +++--
 scripts/replay-chat-retrieval.ts |  5 ++++-
 12 files changed, 50 insertions(+), 34 deletions(-)
```

---

## 5. Hướng dẫn tiếp theo (B5 UAT Local & B6 Deploy)

### Checklist B5 — UAT Local (`npm run dev` tại localhost:3000)
1. **Chatbot (Public):**
   - Hỏi câu tiếng Việt về kinh nghiệm của Hưng (`/about` context).
   - Hỏi phân tích video YouTube (`/tools/youtube`).
   - Hỏi 1 câu hoàn toàn ngoài lề ➡️ Kiểm tra phản hồi từ chối lịch sự.
2. **Admin CMS (`/admin`):**
   - Thử dịch 1 bài blog từ VI ➡️ EN (`/admin/content/blog`).
   - Thử tính năng Polish bài viết blog.
   - Thử parse CV hoặc project PDF.

### Checklist B6 — Deploy Preview / Production (Cần GO riêng của Hưng)
1. Vercel **không có** biến `OPENAI_MODEL` (VERIFIED 27/10, `vercel env ls`) → deploy là cả chatbot (đang `gpt-4.1-mini`) và admin tools (đang `gpt-4o-mini`) chuyển sang `gpt-6-luna`. Không cần sửa env.
2. Tạo commit trên nhánh `chore/gpt-6-luna` và mở PR hoặc deploy Preview.
3. Theo dõi token usage trên OpenAI Dashboard sau 24-48h.

---

## 6. Review 27/10 (Claude Code, fresh-context)

**Đã sửa trên nhánh (chưa commit):**
- Bỏ đoạn tự nạp `.env.local` trong `lib/aiModel.ts`: chạy `npm test` kéo key thật vào env (red-check FAIL → PASS). `scripts/replay-chat-retrieval.ts` dùng `getAIModel()` lúc gọi.
- `.gitignore` thêm `/scratch/` (3 script smoke/benchmark của phiên này, giữ trên máy, không commit).
- Thêm `max` vào danh sách effort; sửa câu về `temperature`; `CLAUDE.md`, `HANDOVER.md`, `README.md`, `.env.example` ghi model mới.
- Sau sửa: `npx tsc --noEmit` 0 lỗi, `npm test` pass, `npm run build` pass.

**Rollback:** đặt `OPENAI_MODEL=gpt-4.1-mini` trên Vercel rồi redeploy, hoặc Instant Rollback về deployment Prod trước. Đổi bằng env **không giống hệt** bản cũ: `temperature` đã bị bỏ, nên model cũ chạy với mặc định 1 (trước là 0–0.7; parse CV/dịch sẽ kém ổn định hơn), và admin tools sẽ chạy `gpt-4.1-mini` thay vì `gpt-4o-mini`.

**Giới hạn của benchmark B4:**
- Chưa đo model cũ cùng 10 câu → con số TTFT ~2.5s chưa có mốc so sánh.
- Chưa ghi số token reasoning/chi phí từng câu.
- "10/10 bám nguồn" do chính agent viết code tự chấm. Bằng chứng thật là UAT của Hưng.

**Chi phí (docs OpenAI, kiểm 27/10):** `gpt-6-luna` $0.10 input / $0.50 output mỗi 1M token. Ca xấu nhất của chatbot (8.000 token output, tính cả reasoning) ≈ $0.004/câu.

Nguồn: [GPT-6 Luna](https://developers.openai.com/api/docs/models/gpt-6-luna) · [Using GPT-6](https://developers.openai.com/api/docs/guides/latest-model) · [Pricing](https://developers.openai.com/api/docs/pricing) · [Deprecations](https://developers.openai.com/api/docs/deprecations)
