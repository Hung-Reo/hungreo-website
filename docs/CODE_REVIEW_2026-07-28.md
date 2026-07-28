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

---

## ⏳ CHƯA SỬA — xếp theo ưu tiên

### CRITICAL
**3. Traffic ẩn danh có thể kích hoạt rebuild phá dữ liệu**
Chuỗi: `/api/videos` (public, không rate limit) → `getVideoStats()` → nếu tổng category ≠ tổng videos → `autoRebuildCategorySets()` ([lib/videoManager.ts:576](../lib/videoManager.ts)) → `kv.del('videos:all')` + xoá 5 category set → build lại từ `getAllVideosComplete()`.

Nhưng `getVideo()` ([lib/videoManager.ts:389](../lib/videoManager.ts)) **nuốt lỗi và trả `null`** → một lỗi đọc KV thoáng qua là video đó bị loại khỏi index. Guard duy nhất là `length === 0`, mất **một phần** (12/13) vẫn chạy tiếp. Record `video:<id>` còn nhưng video biến mất khỏi website vĩnh viễn, không cảnh báo.

*Hướng:* thao tác destructive không được kích hoạt bởi traffic public (chuyển sang cron/admin-only); `getAllVideosComplete()` phải **throw** khi lỗi đọc thay vì trả danh sách thiếu.

### HIGH
**4. Inbox "cần trả lời" đếm sai: dashboard 38, thực tế 9**
`chat:<id>` có TTL 90 ngày nhưng index list không bao giờ được dọn. Đo trên production:

| Key | Entry | Còn sống | Rác |
|---|---|---|---|
| `inbox:needs-reply` | 38 | 9 | **29** |
| `chats:2025-11-15` | 40 | 0 | **40** |

Hai code path đếm khác nhau: `kv.llen()` ([lib/chatLogger.ts:138](../lib/chatLogger.ts)) → 38, còn `getNeedsReplyChats()` lọc record chết → 9.

Kèm 2 bug trong `markAsReplied()` ([lib/chatLogger.ts:222](../lib/chatLogger.ts)): `LPUSH` nhiều phần tử **đảo ngược thứ tự list** mỗi lần đánh dấu; `del` + `lpush` không atomic → chat mới ghi vào đúng khe giữa 2 lệnh sẽ **mất**.

**5. `visitors:*` không có TTL** — [lib/visitorTracker.ts:123](../lib/visitorTracker.ts) ghi 3 set mỗi lượt truy cập, không `ex:`. Hiện 107 keys/232 members, tăng vĩnh viễn. Mọi key khác (`chat:`, `contact-request:`, `job:`) đều có TTL — chỗ này bị sót. Ngược tinh thần GDPR trong CLAUDE.md.

**6. Dependency: 2 critical + 6 high** — gốc ở `postcss` đi kèm Next.js 14.2. Fix cần nâng Next 16 (breaking) → làm riêng, có test.

### MEDIUM
| # | Vấn đề | Vị trí |
|---|---|---|
| 7 | 2 hàm `chunkText` khác nhau cùng đổ vào 1 Pinecone index (200 vs 500 từ/chunk) → chunk video "loãng" hơn, thua thế trong topK | `lib/textUtils.ts:15` vs `lib/documentProcessor.ts:114` |
| 8 | `kv.keys('blog:*')` quét trúng `blog:categories`. Hiện chưa lỗi vì mọi consumer lọc `status==='published'` — an toàn nhờ may mắn, không nhờ thiết kế | `lib/contentManager.ts:381` |
| 9 | Đổi slug → index slug cũ không xoá; xoá bài để lại slug trỏ ID chết | `lib/contentManager.ts:329` |
| 10 | `data.email` chèn thô vào HTML email (chỗ khác đều `escapeHtml`); regex email cho phép `"`, `<`, `>` | `lib/emailNotifier.ts:410` |
| 11 | `/api/admin/reset-password` và `/api/analytics/track` không rate limit | 2 route |
| 12 | Heartbeat SSE gọi `controller.enqueue` trực tiếp, không check `closed`/try-catch | `app/api/stream/[id]/route.ts:60` |

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
