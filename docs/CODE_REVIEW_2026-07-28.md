# Code Review toàn diện — 2026-07-28

Phạm vi: ~29k LOC, 57 API routes, 33 lib file. Các lỗi CRITICAL đều được **kiểm chứng thực tế trên production**, không phải suy đoán từ code.

## ✅ ĐÃ SỬA (commit `1f38b18`, deploy production 2026-07-28)

### 1. Prompt injection qua chat history — CRITICAL
`app/api/chat/route.ts` đẩy thẳng mảng `history` do client kiểm soát vào OpenAI. Chèn một turn `role: "system"` là ghi đè toàn bộ chỉ dẫn server.

Bằng chứng trước khi sửa (production):

| Request | Kết quả |
|---|---|
| "Thủ đô nước Pháp?" + history rỗng | ✅ Từ chối đúng |
| Cùng câu + 1 system message giả | ❌ **"Thủ đô của nước Pháp là Paris."** |

Hệ quả: dùng chùa OpenAI API (Hung trả tiền), ép bot phát ngôn dưới thương hiệu Hung Dinh, input không giới hạn độ dài (validator chỉ áp cho `message`, không áp cho `history`).

**Fix:** `sanitizeChatHistory()` trong `lib/inputValidator.ts` — chỉ giữ role `user`/`assistant`, `content` phải là string, cắt 10 lượt × 10k ký tự. Giới hạn rộng hơn giới hạn thật của UI (message ≤1000 ký tự, reply ≤2000 token) nên **không ảnh hưởng hội thoại bình thường**.

### 2. Transcript rò rỉ qua API public — CRITICAL
`app/api/videos/route.ts` có comment *"Remove sensitive fields"* nhưng trả nguyên object `en`/`vi` vốn chứa `transcript`.

| | Trước | Sau |
|---|---|---|
| Payload `/api/videos?limit=50` | 367.556 bytes | **31.824 bytes (−91%)** |
| Transcript lộ ra ẩn danh | 62.787 từ | **0** |

**Fix:** `toPublicVideo()` trong `lib/videoManager.ts`, dùng chung cho cả `/api/videos` và `/api/videos/[id]` (đồng thời bỏ được đoạn pick-field trùng lặp ở 2 route).

**Verify:** tsc + build pass · 11/11 unit test sanitizer · 2 payload tấn công bị chặn · câu hỏi mơ hồ cho kết quả **giống hệt production cũ** (chứng minh không phải regression) · UI kiểm tra trên browser: video library, trang category, trang chi tiết, related videos đều render đúng.

**Lưu ý:** `components/features/TranscriptSection.tsx` là **dead code** (không nơi nào render). Text trên `/tools/knowledge` nói *"Each video page includes the full transcript"* là mô tả cũ, không khớp thực tế.

### 3. Traffic ẩn danh kích hoạt rebuild phá dữ liệu — CRITICAL
Chuỗi lỗi: `/api/videos` (public, không rate limit) → `getVideoStats()` → nếu tổng category ≠ tổng videos → `autoRebuildCategorySets()` → `kv.del('videos:all')` + xoá 5 category set → build lại từ `getAllVideosComplete()`.

Nhưng `getVideo()` **nuốt lỗi và trả `null`** → một lỗi đọc KV thoáng qua là video đó bị loại khỏi index. Guard duy nhất là `length === 0`, nên mất **một phần** (12/13) vẫn chạy tiếp: record `video:<id>` còn nguyên nhưng video biến mất khỏi website vĩnh viễn, không cảnh báo. Admin endpoint `rebuild-stats` dùng chung `getAllVideosComplete()` nên **dính đúng lỗi này**.

**Fix (3 phần):**

| # | Thay đổi | Chống được gì |
|---|---|---|
| a | `readVideoStrict()` — đọc bản ghi để lỗi transport **propagate**; `getVideo()` giữ nguyên hành vi nuốt lỗi cho việc render trang. `getAllVideosComplete()` chuyển sang dùng hàm này | Rebuild **abort** thay vì ghi đè index bằng danh sách thiếu. Bảo vệ **cả 2 đường** (public cũ + admin endpoint) |
| b | `getVideoStats()` chỉ **cảnh báo**, không sửa. Xoá luôn `autoRebuildCategorySets()` (~60 dòng) vì đã thành dead code và trùng chức năng với admin endpoint | Traffic ẩn danh không còn chạm được thao tác ghi/xoá |
| c | Admin `rebuild-stats` thêm guard: từ chối (409) nếu danh sách rỗng | Không thể xoá sạch index rồi ghi lại con số 0 |

Sửa chữa vẫn dùng đường sẵn có: nút **"Rebuild Stats"** trong admin video manager (`POST /api/admin/videos/rebuild-stats`).

**Verify** (test giả lập lỗi ở tầng `fetch`, chỉ đọc, không ghi gì vào KV):

| Kịch bản | Kết quả |
|---|---|
| Lỗi transport khi đọc 1 bản ghi | ✅ `getAllVideosComplete()` **throw** (trước đây: trả list thiếu) |
| Cùng lỗi đó, gọi `getVideo()` | ✅ Vẫn trả `null` — trang web không vỡ |
| Record vắng mặt thật (orphan ID) | ✅ Bỏ qua, không throw → 12/13 (hành vi dọn rác đúng, giữ nguyên) |
| Ép phát hiện lệch (1009 ≠ 13) | ✅ Chỉ log cảnh báo, **0 lệnh ghi** phát sinh |

KV production kiểm tra sau test: `videos:all = 13`, category sum = 13 — nguyên vẹn.

### 4. Inbox "cần trả lời" đếm sai — HIGH
`chat:<id>` có TTL 90 ngày nhưng index list không bao giờ được dọn, nên hai code path đếm khác nhau: `kv.llen()` đếm cả rác, còn `getNeedsReplyChats()` lọc record chết. Kèm 2 bug trong `markAsReplied()`: `LPUSH` nhiều phần tử **đảo ngược thứ tự** mỗi lần đánh dấu; `del` + `lpush` không atomic → chat ghi vào đúng khe giữa 2 lệnh sẽ **mất**.

**Fix:**
- `markAsReplied()` → dùng **`LREM`** (1 lệnh atomic). Hết cả bug đảo thứ tự lẫn khe mất dữ liệu.
- `loadNeedsReplyInbox()` dùng chung cho cả đếm và liệt kê → không thể lệch nhau nữa. Chỉ gỡ entry khi **xác nhận record vắng mặt**; lỗi đọc thì throw và không đụng gì (cùng bài học với mục #3).
- `chats:<date>` được `expire` cùng nhịp 90 ngày với record nó trỏ tới → hết sinh rác mới.
- Áp dụng cùng cách cho `contact-requests:<date>` (đang có đúng lỗi đó, 2/6 entry rác).

**Verify trên production:** dọn 29 entry rác → dashboard/danh sách/KV đều = 15 ✓. Test `markAsReplied` trên 7 entry: gỡ đúng số lượng ✓, **thứ tự giữ nguyên** ✓, dashboard khớp ✓.

### 5. Key KV không có TTL, phình vĩnh viễn — HIGH
`visitors:*` ghi 3 set + 2 hash mỗi lượt truy cập mà không `ex:`.

**Fix:** `trackPageView()` set TTL mỗi lần ghi — daily/weekly **90 ngày**, monthly **400 ngày** (đủ chỗ cho báo cáo lịch sử). Backfill TTL cho 102 key cũ (chỉ gán hạn, **không xoá gì**) + 18 key `chats:*` cũ.

**Phát hiện thêm khi sửa:** `analytics: true` của Upstash Ratelimit sinh zset `ratelimit:*:events:*` **không TTL và không ai đọc** (111 key, tăng mãi) — `Analytics` trong codebase là Vercel Analytics, hoàn toàn khác. Đã đổi thành `false` ở 9 chỗ; verify rate limit vẫn chặn đúng (10×200 → 429).

**Kết quả:** 100% key `visitors:*` và `chats:*` đã có hạn; các key còn thiếu TTL đều là dữ liệu cố ý giữ vĩnh viễn (video, blog, project, CMS, password hash).

### 6. Dependency: 2 critical + nhiều high — HIGH (một phần)
**Đã sửa (không breaking):** `npm audit fix` → **critical 2 → 0**. Nâng `next-auth` beta.31 → beta.32, `@auth/core` 0.41.2 → 0.41.3, `oauth4webapi`, `dompurify`. Chỉ 11 package đổi, `package.json` không đổi.

Vì đây là phần **xác thực**, đã test kỹ: providers endpoint ✓, CSRF token ✓, admin API 401 khi chưa login ✓, `/admin/dashboard` → 307 redirect ✓, **sai mật khẩu → từ chối, không cấp session cookie** ✓.

**Chưa sửa — cần nâng major, phải làm riêng có test:**

| Package | Vấn đề | Ghi chú |
|---|---|---|
| `next` 14.2 → 16 | high; kéo theo `postcss` 8.4.31 lồng bên trong | Nhảy 2 major. Next 15 đổi `params`/`searchParams` thành async — ảnh hưởng nhiều route. **Rủi ro thật, không nên gộp chung** |
| `nodemailer` 7 → 9 | high | Production dep, cần test gửi mail |
| Bộ ESLint (~19 gói) | high | **Dev-only, không lên production** — không có rủi ro runtime |

---

## ⏳ CHƯA SỬA — xếp theo ưu tiên

### MEDIUM
| # | Vấn đề | Vị trí |
|---|---|---|
| 7 | 2 hàm `chunkText` khác nhau cùng đổ vào 1 Pinecone index (200 vs 500 từ/chunk) → chunk video "loãng" hơn, thua thế trong topK | `lib/textUtils.ts:15` vs `lib/documentProcessor.ts:114` |
| 8 | `kv.keys('blog:*')` quét trúng `blog:categories`. Hiện chưa lỗi vì mọi consumer lọc `status==='published'` — an toàn nhờ may mắn, không nhờ thiết kế | `lib/contentManager.ts:381` |
| 9 | Đổi slug → index slug cũ không xoá; xoá bài để lại slug trỏ ID chết | `lib/contentManager.ts:329` |
| 10 | `data.email` chèn thô vào HTML email (chỗ khác đều `escapeHtml`); regex email cho phép `"`, `<`, `>` | `lib/emailNotifier.ts:410` |
| 11 | `/api/admin/reset-password` và `/api/analytics/track` không rate limit | 2 route |
| 12 | Heartbeat SSE gọi `controller.enqueue` trực tiếp, không check `closed`/try-catch | `app/api/stream/[id]/route.ts:60` |
| 13 | `contact-requests:pending`/`:resolved` là list thường trực, vẫn còn 2 entry rác — cùng loại với #4 nhưng chưa dọn (quy mô nhỏ) | `lib/contactRequestLogger.ts` |

### Refactoring
| Vấn đề | Con số | Vì sao |
|---|---|---|
| `isAdminEmail()` copy 3 bản | auth.ts, forgot-password, reset-password | **Liên quan bảo mật** — sửa 1 nơi quên 2 nơi = lỗ hổng |
| `getClientIp()` copy 2 bản | rateLimit.ts, forgot-password | Logic chống spoof IP nhân đôi |
| `chunkText()` 3 bản, 3 default | textUtils, documentProcessor, scripts | Gốc của #7 |
| Auth guard lặp inline | **38 routes** | Nên có `withAdminAuth()` wrapper |
| `alert()`/`confirm()` | **53 lần**, 4 component | UX thô, khó test |
| `any` / `as any` | **149 chỗ** | Mất lợi ích TS, đặc biệt `session.user as any` |
| `kv.keys()` + N+1 `kv.get()` | contentManager ×2 | `KEYS` là O(N) blocking; mỗi lần load `/blog` là N+1 round-trip |

---

## Điểm sáng

`lib/videoVectorLifecycle.ts`, `lib/videoEmbeddingManager.ts`, `lib/chatRetrieval.ts` viết **rất tốt**: staged vector replacement không xoá bản live trước, xử lý được ca DB commit nhưng client timeout, comment giải thích "why" chứ không phải "what". Đây là chuẩn nên nhân rộng.

## Lessons learned

1. **Comment nói dối nguy hiểm hơn không có comment** — cả 2 lỗi CRITICAL đều có comment khẳng định đã xử lý (*"Remove sensitive fields"*, *"Transcript is public as it's used in the chatbot"*) trong khi thực tế ngược lại. Comment mô tả ý định phải được verify bằng test, không tin suông.
2. **Dữ liệu do client gửi luôn phải validate, kể cả field "phụ"** — `message` được validate kỹ nhưng `history` bên cạnh thì không, và chính nó là đường vào.
3. **Luôn có control test khi nghi ngờ regression** — chạy cùng payload trên production chưa sửa để phân biệt "bug mình gây ra" với "hành vi sẵn có".
