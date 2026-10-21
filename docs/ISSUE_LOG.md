# Issue Log — hungreo.com

Mỗi lỗi đã gặp trên Prod (hoặc suýt lên Prod) một mục. Mục đích: lần sau gặp triệu chứng giống thì tra ở đây trước, và mỗi lỗi phải có test chặn tái diễn.

**Cách ghi:** thêm 1 dòng vào bảng + 1 mục chi tiết bên dưới. ID tăng dần `ISS-NNN`. Ngày theo giờ VN. Nhãn bằng chứng: VERIFIED / PRIOR-EVIDENCE / ASSUMPTION / UNVERIFIED. Repo public — không ghi secret, IP, dữ liệu cá nhân.

| ID | Ngày phát hiện | Triệu chứng | Root cause (1 dòng) | Sửa (commit → deploy) | Trạng thái |
|---|---|---|---|---|---|
| [ISS-001](#iss-001) | 2026-10-20 | Upload ảnh Featured Image trong admin blog luôn báo "Upload failed" | Ảnh nén gửi lên với tên `"blob"` → server từ chối đuôi `.blob` (400), client nuốt lỗi | `6541723` → `main@ffcbaf9` → `dpl_8KU2aFuWX7NHaphCA3EMsWrfGx7r` | Đóng — owner UAT PASS 21/10 |
| [ISS-002](#iss-002) | 2024-11-15 | Database KV vượt giới hạn gói miễn phí, phải tạo database mới | Vượt free tier Upstash 500K request/tháng (99,8% là đọc), không có giám sát | Chuyển sang database Upstash mới | Đóng |
| [ISS-003](#iss-003) | 2025-11-17 | `/about` báo lỗi trên mobile; chatbot tràn màn hình mobile | Trang public gọi `/api/admin/...` (middleware chặn); kích thước chatbot cố định theo desktop | Tách API public; layout responsive | Đóng |
| [ISS-004](#iss-004) | 2025-11-19 | Token đặt lại mật khẩu xuất hiện trong chat log và email cảnh báo | Chatbot ghi `pathname` có `/admin/reset-password/{token}` | Tắt chatbot ở trang auth, lọc pathname, dọn token đã lộ | Đóng |
| [ISS-005](#iss-005) | 2025-11-20 | Mật khẩu/token thật nằm trong docs của repo public (**lặp 2 lần**) | Ghi giá trị thật vào checklist/hướng dẫn khi setup | `43c2afd` (11/2025), `971e979` (05/2026); rotate 06/2026 | Đóng có điều kiện — git history vẫn chứa giá trị cũ |
| [ISS-006](#iss-006) | 2025-11-21 | Website hiện dữ liệu cũ sau khi đã sửa trong admin (**lặp 3 lần**) | Cache (Vercel/Next Data Cache) giữ kết quả đọc KV | `0bac7ee`/`8d0c1a2` (11/2025), `9297f89` + `80fbf2c` (10/2026) | Đóng — `lib/kv` no-store |
| [ISS-007](#iss-007) | 2025-11-21 | Lưu About/Blog/Project trong admin báo 405 | Doc cũ ghi: thiếu OPTIONS handler/runtime config (chưa kiểm lại) | `632be98` | Đóng |
| [ISS-008](#iss-008) | 2025-11-26 | Endpoint public có thể bị lạm dụng tốn tiền API / spam email | `/api/youtube` không rate limit; tin header IP giả được; forgot-password không giới hạn | `749cced` | Đóng |
| [ISS-009](#iss-009) | 2025-11-26 | Vector Pinecone bị trùng, mồ côi, hoặc có nguy cơ mất trước khi có bản thay (**lặp 3 đợt**) | Xoá/ghi vector không theo thứ tự an toàn; dùng sai API xoá/liệt kê | `d046ccd` (11/2025), `b5aac22` (06/2026), `16e5206` (07/2026) | Đóng |
| [ISS-010](#iss-010) | 2026-07-12 | Chatbot không biết nội dung các video mới (từ 04/2026) | YouTube đổi API transcript; code nuốt lỗi lưu transcript rỗng; IP Vercel bị soft-block | `19e41e1`, `ea8becb` + quy trình repair từ máy local | Đóng — có quy trình vận hành |
| [ISS-011](#iss-011) | 2026-05-01 | Admin hiện 0 vector sau khi đổi model embedding | Vector giả cứng 1536 chiều, index mới 3072 chiều | `9a8f14d` | Đóng |
| [ISS-012](#iss-012) | 2026-06-01 | Một số API admin (GET blog/projects…) truy cập được không cần đăng nhập; đăng nhập không bị giới hạn số lần thử | Thiếu `auth()` trong handler; rate limit đặt sai endpoint của NextAuth v5 | `b5aac22` | Đóng |
| [ISS-013](#iss-013) | 2026-07-28 | Chatbot bị ép trả lời ngoài phạm vi; transcript video lộ qua API public | Tin `history` do client gửi (cả role `system`); API public trả nguyên object | `1f38b18` | Đóng |
| [ISS-014](#iss-014) | 2026-07-28 | Nguy cơ video biến mất khỏi website do traffic ẩn danh | Request public kích hoạt rebuild xoá index; lỗi đọc KV bị nuốt → danh sách thiếu | `11ce154` | Đóng |
| [ISS-015](#iss-015) | 2026-07-28 | Hộp thư "cần trả lời" đếm sai; KV phình vì key không TTL | Index list không dọn khi record hết hạn; `markAsReplied` không atomic | `678c79a` | Đóng |
| [ISS-016](#iss-016) | 2026-08-24 | **Suýt** làm chết n8n + 3 bot Telegram khi chuyển domain | Kết luận "domain trắng" sau khi quét quá ít subdomain → khuyên đổi nameserver | Không đổi nameserver, chỉ sửa 1 record A | Đóng — near-miss, không sự cố |
| [ISS-017](#iss-017) | 2026-09-08 | Trang chi tiết blog/project trả HTTP 500 | `isomorphic-dompurify` nạp jsdom ở server → `ERR_REQUIRE_ESM` | `408b965` | Đóng |
| [ISS-018](#iss-018) | 2026-09-08 | Chatbot mất nguồn khi hỏi nhiều video, gán sai tác giả, kéo nguồn cũ sang chủ đề mới | Retrieval chỉ chọn 1 video; bỏ metadata nguồn; quét toàn bộ history | `a994b0b`, `1f65e9e`, `3f9c280`, `a446fba` | Đóng |
| [ISS-019](#iss-019) | 2026-10-13 | Khối Related Videos bị ẩn trên Prod | Server gọi HTTP qua `VERCEL_URL` (bị SSO chặn) → nhận HTML thay vì JSON | `9297f89` | Đóng |
| [ISS-020](#iss-020) | 2026-10-14 | CI `Security` đỏ ~5 tuần không ai sửa | Client OpenAI tạo lúc import → `next build` không có key thì fail | `4b9efab` | Đóng |
| [ISS-021](#iss-021) | 2026-10-18 | Console đỏ 404 trên mọi trang; `/admin` 404 khi đã đăng nhập | Layout khai báo favicon/manifest chưa từng có; thiếu page `/admin` | `4978a41` | Đóng |
| [ISS-022](#iss-022) | 2026-10-19 | Trả lời liên hệ qua email lỗi 535 rồi 534 | App Password Gmail cũ hết hiệu lực; lần sửa đầu dán nhầm mật khẩu chính vào env | Thay App Password + redeploy (không đổi code) | Đóng |
| [ISS-023](#iss-023) | 2026-10-19 | Lệnh deploy Prod bị từ chối 400 | Agent tự gõ SHA và gõ sai | Lấy SHA bằng `git rev-parse`, deploy lại | Đóng — quy tắc trong handover |
| [ISS-024](#iss-024) | 2026-10-20 | Chatbot không trả lời được nội dung bài blog | Scraper chỉ đọc `<section>`, thân bài nằm trong `<div>` → không vào Pinecone | `c610de3` | Đóng |
| [ISS-025](#iss-025) | 2026-10-20 | Thanh tiến độ của thao tác dài không chạy | Server làm xong mới trả jobId → client theo dõi khi việc đã xong | `8e33652` | Đóng |

> ISS-001 ghi ngay khi sửa. ISS-002 → ISS-025 ghi bù ngày 21/10/2026 từ docs, git log và lịch sử session Claude Code của project; thứ tự theo ngày phát hiện. Các mục ghi bù là **PRIOR-EVIDENCE** (đọc từ nguồn ghi ở từng mục, chưa tái hiện lại), trừ chỗ ghi VERIFIED.

## Mẫu lỗi lặp lại → nguyên tắc (đọc trước khi sửa code)

| Mẫu | Các issue | Nguyên tắc | Guard hiện có |
|---|---|---|---|
| **Nuốt lỗi im lặng** | 001, 010, 014 | Lỗi phải hiện cho người dùng/admin kèm lý do; bước đọc dữ liệu để ghi lại phải throw, không trả danh sách thiếu | Test ISS-001, badge "No transcript", `readVideoStrict` |
| **Cache trả dữ liệu cũ** | 006 (3 lần), 019 | Đọc KV chỉ qua `@/lib/kv` (no-store); không gọi HTTP nội bộ từ server | Quy ước trong CLAUDE/handover. **Chưa có test** cấm `import { kv } from '@vercel/kv'` ngoài `lib/kv.ts` — nên thêm |
| **Bí mật lọt vào repo public** | 004, 005 (2 lần), 022 | Secret chỉ ở Vercel env / máy Hưng; docs dùng placeholder; không ghi IP hạ tầng | gitleaks + pre-commit, CI Secret Scanning |
| **Thêm luật/đổi thư viện mà không chạy đường đi thật** | 001, 011, 017, 020 | Sau khi đổi validation, model, thư viện, build: chạy lại luồng UI thật + build không env như CI | CI `Security`, smoke `next start` bản copy |
| **Xoá trước khi có bản thay** | 009, 014 | Tạo mới đủ → chuyển → mới xoá cũ; thiếu thì giữ nguyên | `videoVectorLifecycle.test.ts` |
| **Tin dữ liệu từ client** | 008, 012, 013 | Mọi field client gửi đều validate; auth/rate limit enforce ở server, fail-closed | `security.test.ts`, `chatContext.test.ts` |
| **Kết luận quá sớm từ mẫu nhỏ** | 016, 001 (mốc lỗi) | Quét đủ phạm vi bằng dữ liệu thật trước khi kết luận "không có gì" / "lỗi có từ X" | Handover mục "4 điều tuyệt đối phải biết" |

---

## ISS-001

**Upload ảnh Featured Image (admin blog) luôn thất bại với "Upload failed"**

| | |
|---|---|
| Phát hiện | 2026-10-20, Hưng báo khi sửa blog |
| Tồn tại | 2026-04-25 (`39b68e8`) → 2026-10-21 (~6 tháng) |
| Phạm vi | `components/admin/ImageUploader.tsx` — dùng ở trang sửa blog và trang sửa project. Ô Screenshot của Projects upload riêng (không nén) nên không dính |
| Mức độ | Trung bình: không upload được ảnh bìa mới; không mất dữ liệu, không ảnh hưởng trang public |

**Triệu chứng.** Chọn ảnh JPG/PNG hợp lệ → toast "Upload failed", không có ảnh. Không có thông tin gì thêm trên màn hình.

**Root cause (VERIFIED — tái hiện trong bản copy local, code server giống Prod).**
1. `browser-image-compression` 2.0.2 trả về `Blob`, chỉ gắn thêm thuộc tính `blob.name` — không phải `File`.
2. `FormData.append('image', blob)` không truyền tên file → theo chuẩn, trình duyệt gửi tên `"blob"`.
3. `validateUpload()` (thêm ở `39b68e8`, security review 25/04/2026) lấy đuôi từ tên file → `.blob` không nằm trong whitelist → 400 "File type not allowed".
4. `ImageUploader` bỏ qua nội dung lỗi của server, chỉ hiện "Upload failed" → không ai biết lý do.

Bằng chứng mốc thời gian: ảnh Featured của bài "Awakening Inner Peace" upload 24/04/2026 có URL `images/1777040361555-blob` — trước `39b68e8` server vẫn nhận tên "blob". Nén ảnh có từ `9178133` (17/11/2025) nhưng chưa gây lỗi cho tới khi thêm kiểm tra đuôi. Ảnh cũ tên `-blob` vẫn hiển thị bình thường (200, `image/png`).

**Sửa (`6541723`).**
- `lib/uploadClient.ts` → `asUploadFile()`: bọc ảnh nén thành `File` giữ tên gốc.
- Client kiểm tra trước bằng chính `validateUpload()` của server (một nguồn luật duy nhất).
- HEIC/HEIF (ảnh iPhone) báo rõ "Export as JPEG or PNG first"; `accept` chỉ 5 định dạng server nhận.
- `getUploadErrorMessage()`: toast hiện lỗi server + mã HTTP; lỗi một file không chặn các file sau.

**Deploy.** `main@ffcbaf9` → `dpl_8KU2aFuWX7NHaphCA3EMsWrfGx7r` (21/10). Rollback anchor `dpl_725vkXucJ1fR2dNH62oqF4M46t2F`. Owner UAT PASS 21/10.

**Test chặn tái diễn.** `__tests__/imageUpload.test.ts` (chạy trong `npm test` + CI `Security`):
- `root cause: a Blob with a .name property is sent as "blob" in FormData` — giữ cơ chế gốc làm tài liệu sống.
- `asUploadFile keeps the original name and the compressed type` — file gửi đi phải qua `validateUpload`.
- `validator: rejects iPhone HEIC/HEIF with an actionable message`.
- `error message: …` (2 ca) — lỗi server không bị nuốt.
- `ImageUploader validates before upload and shows the server error` — kiểm nguồn: có `asUploadFile(`, không còn toast chung "Upload failed".

**Bài học.**
1. **Thêm kiểm tra phía server thì phải chạy lại đường đi thật của client.** `39b68e8` thêm whitelist đuôi file là đúng về bảo mật, nhưng không ai upload thử qua UI có nén ảnh → hỏng 6 tháng.
2. **Không nuốt lỗi.** Server đã trả lý do rõ ràng; client đổi thành "Upload failed" làm mất 6 tháng. Toast lỗi phải mang thông điệp server + mã HTTP.
3. **Thư viện có thể trả `Blob` dù trông như `File`.** Trước khi `FormData.append`, đảm bảo là `File` có tên, hoặc truyền tên ở tham số thứ 3.
4. **Đọc dữ liệu thật để định mốc lỗi**, đừng đoán từ git log: URL ảnh `-blob` trên Prod cho thấy mốc đúng là `39b68e8`, không phải `9178133` như kết luận ban đầu.

---

## Chi tiết ISS-002 → ISS-025 (ghi bù 21/10/2026)

Mỗi mục: **Nguồn** (nơi đọc được bằng chứng) · **Root cause** · **Sửa** · **Chặn tái diễn** · **Bài học**. Nhãn mặc định PRIOR-EVIDENCE.

### ISS-002
**Upstash vượt free tier (2024-11-15).** Nguồn: `docs/UPSTASH_DATABASE_MIGRATION_2024-11-15.md`.
Root cause: 822K lượt đọc/tháng (99,8%) — trang public, chatbot, admin đều đọc KV, không ai theo dõi usage. Sửa: tạo database mới, chuyển dữ liệu.
Chặn tái diễn: chưa có cảnh báo usage tự động; 15/10/2026 Hưng kiểm tay 3,1K/500K lệnh (sau khi bỏ cache ở ISS-006 vẫn rất thấp).
Bài học: dịch vụ free tier phải có người nhìn usage định kỳ.

### ISS-003
**`/about` lỗi trên mobile + chatbot tràn màn hình (2025-11-17).** Nguồn: `docs/MOBILE_FIXES_2025-11-17.md`.
Root cause: trang public gọi `/api/admin/content/about` (middleware chặn khách); chatbot `h-[600px] w-[420px]` cố định. Sửa: API public riêng, layout responsive.
Bài học: trang public không bao giờ gọi API admin; test cả viewport mobile.

### ISS-004
**Token đặt lại mật khẩu lộ vào chat log (2025-11-19).** Nguồn: `PRODUCTION_DEPLOY_CHECKLIST.md` (Bug #2).
Root cause: chatbot ghi `pathname` chứa token, lưu KV 90 ngày và gửi trong email cảnh báo. Sửa: tắt chatbot ở trang auth, lọc pathname (`lib/chatLogger.ts`), endpoint dọn token đã lộ.
Bài học: không log phần URL nhạy cảm; lọc mọi dữ liệu trước khi lưu/gửi.

### ISS-005
**Secret thật trong docs của repo public — lặp 2 lần (11/2025, 05/2026).** Nguồn: commit `43c2afd`, `971e979`, `docs/SECURITY_REVIEW_HANDOVER_2026-04-25.md`, session Claude Code 29/06/2026.
Root cause: ghi giá trị thật (mật khẩu admin, token Upstash, API key) vào checklist/hướng dẫn lúc setup rồi commit. Lần 2 cho thấy lần 1 chỉ dọn file, chưa đổi thói quen.
Sửa: thay bằng placeholder, thêm gitleaks + pre-commit + `SECURITY_POLICY.md`; ngày 29/06/2026 Hưng báo đã xong 2 bước "critical" đầu của hướng dẫn rotate (bước 1 là token Upstash/KV; bước 2 không ghi lại trong session). Danh sách rotate đầy đủ ở `SECURITY_REVIEW_HANDOVER_2026-04-25.md` mục 1 — **chưa xác minh từng key đã đổi (UNVERIFIED)**. Git history vẫn chứa giá trị cũ — chỉ an toàn khi mọi key cũ đã rotate.
Chặn tái diễn: gitleaks pre-commit, CI Secret Scanning. Bài học: secret chỉ nằm ở Vercel env / máy Hưng; agent không xem, không in, không tự sinh.

### ISS-006
**Dữ liệu cũ do cache — lặp 3 lần.** Nguồn: commit `0bac7ee`, `8d0c1a2` (21/11/2025), `9297f89` (13/10/2026), `80fbf2c` (14/10/2026), `docs/HANDOVER.md`.
Root cause: (1) 11/2025 API nội dung public bị Vercel cache tĩnh; (2) 10/2026 `@vercel/kv` gọi `fetch` với `cache: 'default'` → Next giữ kết quả đọc KV trong Data Cache vô thời hạn (video, visitor count, sitemap, metadata).
Sửa: `force-dynamic` cho API public; `lib/kv.ts` tạo client `cache: 'no-store'`, 14 import đổi sang `@/lib/kv`.
Chặn tái diễn: quy ước "luôn import `kv` từ `@/lib/kv`" (CLAUDE/handover). Chưa có test tự động — nên thêm test cấm import `@vercel/kv` ngoài `lib/kv.ts`.
Bài học: lỗi cache lặp lại 3 lần → cần guard bằng test, không chỉ bằng ghi chú.

### ISS-007
**Lưu nội dung admin báo 405 (2025-11-21).** Nguồn: `FIX_405_ERROR_DOCUMENTATION.md`, commit `632be98`.
Root cause theo doc cũ: thiếu OPTIONS handler / runtime config; frontend crash khi response không phải JSON. **UNVERIFIED** — chưa kiểm lại giải thích này.
Bài học còn giá trị: client phải xử lý response không phải JSON (cùng mẫu với ISS-001).

### ISS-008
**Endpoint public dễ bị lạm dụng (2025-11-26).** Nguồn: commit `749cced`.
Root cause: `/api/youtube` gọi YouTube + OpenAI không rate limit; `getClientIp()` tin `x-forwarded-for` (giả được); forgot-password không giới hạn → spam email, tốn tiền API.
Sửa: rate limit theo IP chỉ tin `x-vercel-forwarded-for`; forgot-password giới hạn theo IP và email.
Bài học: endpoint nào tốn tiền hoặc gửi email đều cần rate limit phía server.

### ISS-009
**Vector Pinecone trùng / mồ côi / nguy cơ mất — 3 đợt.** Nguồn: commit `d046ccd` (11/2025), `b5aac22` (06/2026, Clawpatch HIGH findings), `16e5206` (07/2026), `docs/CODE_REVIEW_2026-07-28.md`.
Root cause: dùng sai API xoá/liệt kê (topK 10000, `deleteMany` theo filter sai); xoá vector cũ trước khi bộ mới ghi đủ; xoá document để lại vector.
Sửa: liệt kê phân trang; staged replacement (ghi bộ mới đủ 100% → chuyển → xoá cũ), rollback khi lỗi giữa chừng.
Chặn tái diễn: `__tests__/videoVectorLifecycle.test.ts`. Bài học: thao tác dữ liệu luôn "tạo mới → chuyển → xoá cũ".

### ISS-010
**Transcript video rỗng từ 04/2026 (phát hiện 2026-07-12).** Nguồn: `docs/FIX_VIDEO_TRANSCRIPT_PIPELINE_2026-07-12.md`, memory `project-youtube-transcript-workflow.md`.
Root cause: YouTube đổi endpoint transcript (HTTP 400); `getVideoTranscript()` nuốt lỗi trả `''` → 5 video mới chỉ có 1–2 vector mỏng. Request từ IP Vercel còn bị soft-block.
Sửa: lấy caption track trực tiếp + fallback (`19e41e1`, `ea8becb`), badge "⚠ No transcript", nút Re-fetch, script `scripts/repair-video-transcripts.ts` (dry-run mặc định).
Chặn tái diễn: `__tests__/videoTranscriptFallback.test.ts`; quy trình import video → chạy repair từ máy local.
Bài học: phụ thuộc API không chính thức sẽ gãy định kỳ → cần fallback + cảnh báo ngay trên UI.

### ISS-011
**Admin hiện 0 vector sau khi đổi model embedding (2026-05-01).** Nguồn: commit `9a8f14d`.
Root cause: vector giả `new Array(1536)` cứng trong 4 chỗ, index mới dùng `text-embedding-3-large` 3072 chiều → lỗi lệch dimension.
Sửa: lấy dimension từ `describeIndexStats()`. Bài học: đổi model/cấu hình thì tìm mọi hằng số phụ thuộc.

### ISS-012
**API admin truy cập được không cần đăng nhập + đăng nhập không giới hạn thử (2026-06-01).** Nguồn: commit `b5aac22`, session Claude Code 01/06/2026.
Root cause: một số GET (blog, projects, cleanup) thiếu `auth()`; rate limit đặt ở `/signin` trong khi NextAuth v5 xác thực ở `/callback/credentials`.
Sửa: thêm guard; rate limit phủ `/callback/credentials`. Chặn tái diễn: `__tests__/security.test.ts` (một phần, kiểm text nguồn).
Bài học: kiểm auth bằng request thật không có session cho từng route admin.

### ISS-013
**Prompt injection qua chat history + transcript lộ qua API public (2026-07-28).** Nguồn: `docs/CODE_REVIEW_2026-07-28.md` (mục 1, 2), commit `1f38b18`.
Root cause: API chat đưa nguyên `history` client gửi (kể cả role `system`) vào OpenAI; `/api/videos` trả nguyên object có transcript dù comment ghi "Remove sensitive fields".
Sửa: `sanitizeChatHistory()` (chỉ user/assistant, giới hạn độ dài); `toPublicVideo()` (payload −91%).
Chặn tái diễn: `__tests__/chatContext.test.ts`, `__tests__/relatedVideos.test.ts` (shape public không có transcript).
Bài học: comment nói "đã xử lý" phải có test chứng minh.

### ISS-014
**Traffic ẩn danh có thể làm video biến mất khỏi website (2026-07-28).** Nguồn: `docs/CODE_REVIEW_2026-07-28.md` (mục 3), commit `11ce154`.
Root cause: `/api/videos` (public) → phát hiện lệch số → tự rebuild: xoá `videos:all` rồi ghi lại từ danh sách mà `getVideo()` nuốt lỗi đọc → một lỗi KV thoáng qua là mất video khỏi index.
Sửa: `readVideoStrict()` (lỗi đọc → abort rebuild), bỏ tự rebuild ở đường public, admin rebuild từ chối danh sách rỗng (409).
Chặn tái diễn: chưa có test tự động (đã kiểm bằng giả lập lỗi tầng fetch lúc sửa). Bài học: request public không được kích hoạt thao tác ghi/xoá.

### ISS-015
**Inbox "cần trả lời" đếm sai + key KV không TTL (2026-07-28).** Nguồn: `docs/CODE_REVIEW_2026-07-28.md` (mục 4, 5), commit `678c79a`.
Root cause: record `chat:*` có TTL nhưng index list không dọn; `markAsReplied()` dùng del + lpush (đảo thứ tự, có khe mất dữ liệu); `visitors:*` và zset analytics của rate limit không TTL.
Sửa: `LREM` atomic, đếm và liệt kê dùng chung một hàm, TTL cho index/visitor, tắt `analytics` của Ratelimit.
Bài học: mọi key có thời hạn thì index trỏ tới nó cũng phải có thời hạn.

### ISS-016
**Suýt làm chết n8n + 3 bot Telegram khi chuyển domain (2026-08-24) — near-miss.** Nguồn: session Claude Code 24/08/2026, `docs/HANDOVER.md` mục DNS, memory `project-hungreo-domain-dns.md`.
Root cause: agent quét vài subdomain phổ biến rồi kết luận "domain trắng", khuyên đổi nameserver sang Vercel. Hưng hỏi lại → quét kỹ thấy `n8n` và `bot` đang chạy trên VPS; zone mới sẽ không có 2 record này.
Xử lý: không đổi nameserver, chỉ sửa 1 record A của apex; ghi cảnh báo "không đổi nameserver / không bấm Reset DNS".
Bài học: trước khi xoá/đổi, quét đủ phạm vi bằng dữ liệu thật; owner hỏi lại là tín hiệu phải kiểm sâu hơn.

### ISS-017
**Trang chi tiết blog/project HTTP 500 (2026-09-08).** Nguồn: `docs/FIX_2026-09-08_DETAIL_PAGES_SSR.md`, `docs/PROD_SSR_2026-09-08.md`, commit `408b965`.
Root cause: `isomorphic-dompurify` khởi tạo jsdom khi server nạp module → `jsdom → parse5` (ESM) → `ERR_REQUIRE_ESM` trước khi render. Build local vẫn pass vì Node local hỗ trợ require(ESM).
Sửa: dùng `dompurify` trực tiếp ở client. Chặn tái diễn: `npm run test:ssr` (`__tests__/detailPagesSSR.test.ts`, không nằm trong `npm test`).
Bài học: build pass ≠ runtime OK; tái hiện đúng điều kiện runtime của Prod.

### ISS-018
**Chatbot mất nguồn / gán sai tác giả / kéo nguồn cũ (2026-09-08 → 09-09).** Nguồn: `docs/AUDIT_2026-09-08_WEBSITE_KNOWLEDGE.md`, `docs/FOLLOWUP_SCOPE_2026-09-09.md`, commit `a994b0b`, `1f65e9e`, `3f9c280`, `a446fba`.
Root cause: retrieval chọn 1 video "best" rồi thay toàn bộ context; video đang xem lấn câu hỏi mới; prompt bỏ kênh/tác giả nên bot gán video bên thứ ba cho Hưng; mọi link trong history đều bị kéo vào lượt sau.
Sửa: giữ nhiều nguồn có giới hạn, truyền đủ metadata nguồn, chỉ dùng lượt assistant gần nhất khi câu hỏi tham chiếu lượt trước.
Chặn tái diễn: `__tests__/chatRetrieval.test.ts`, `chatMultiSource.test.ts`, `chatContext.test.ts`.
Bài học: đúng URL chưa đủ — phải đúng chủ thể/tác giả.

### ISS-019
**Related Videos bị ẩn trên Prod (2026-10-13).** Nguồn: commit `9297f89`, `docs/HANDOVER.md`.
Root cause: server component gọi HTTP `/api/videos` qua `https://$VERCEL_URL` — URL deployment bị deployment protection chặn → nhận trang SSO HTML → `Unexpected token '<'` → khối bị ẩn.
Sửa: đọc KV trực tiếp (`lib/relatedVideos.ts`), xoá `lib/getBaseUrl.ts`. Chặn tái diễn: `__tests__/relatedVideos.test.ts`.
Bài học: server không gọi HTTP vào chính mình; đọc dữ liệu trực tiếp.

### ISS-020
**CI `Security` đỏ ~5 tuần (09/09 → 14/10/2026).** Nguồn: commit `4b9efab`, `docs/HANDOVER.md`.
Root cause: `lib/translateVideo.ts` tạo client OpenAI ngay khi import → `next build` trên GitHub Actions (không có key) fail. Không ai xem CI nên đỏ kéo dài.
Sửa: dùng `getOpenAIClient()` tạo lười. Chặn tái diễn: quy trình release bắt buộc "build không env" + chờ CI xanh trước deploy.
Bài học: CI đỏ phải là việc ưu tiên; client SDK luôn tạo lười.

### ISS-021
**Console đỏ 404 + `/admin` 404 (2026-10-18).** Nguồn: commit `4978a41`, session Claude Code 18–19/10/2026.
Root cause: `app/layout.tsx` khai báo favicon / apple-touch-icon / manifest nhưng `public/` chưa từng có file; không có page `/admin`. Sửa: thêm 5 file + redirect `/admin` → `/admin/dashboard`.
Bài học: lỗi console "vô hại" vẫn che lỗi thật — giữ console sạch.

### ISS-022
**Email trả lời liên hệ lỗi 535 → 534 (2026-10-19).** Nguồn: `docs/HANDOVER.md` (dòng nodemailer), session Claude Code 19/10/2026.
Root cause: (1) 535 — App Password Gmail cũ (đặt 05/2026) đã bị vô hiệu, không phải do nâng nodemailer; (2) 534 — lần sửa đầu dán nhầm mật khẩu chính tài khoản Google vào env. Hưng đã đổi mật khẩu Google sau đó.
Sửa: tạo App Password mới, cập nhật env, redeploy (env đổi phải redeploy mới có hiệu lực).
Bài học: 535 = App Password hỏng, 534 = đang dùng mật khẩu chính; rollback code không giúp. Kiểm env bằng `updatedAt`, không giải mã giá trị.

### ISS-023
**Deploy Prod bị từ chối 400 (2026-10-19).** Nguồn: session Claude Code 19/10/2026, `docs/AGENT_HANDOVER_PROMPT_2026-10-21.md`.
Root cause: agent tự gõ SHA đầy đủ vào `create_deployment` và gõ sai đuôi. Không ảnh hưởng Prod.
Xử lý: lấy SHA bằng `git rev-parse`, deploy lại. Chặn tái diễn: quy tắc "không tự gõ SHA" trong handover prompt.

### ISS-024
**Chatbot không biết nội dung bài blog (phát hiện 2026-10-20).** Nguồn: commit `c610de3`, `docs/HANDOVER.md` (VERIFIED lúc đó bằng chạy lại logic trích xuất trên Prod).
Root cause: scraper chỉ đọc `<section>`; thân bài blog/project nằm trong `<div>` → "Awakening Inner Peace" chỉ index 6/737 chữ. Không rõ lỗi có từ khi nào.
Sửa: trang đánh dấu `data-index-section`, bỏ `[data-index-exclude]`; owner Scrape Website lại. Chặn tái diễn: `__tests__/livingThought.test.ts` (kiểm scraper đọc `data-index-section`).
Bài học: kiểm số chữ thực sự vào index, không chỉ "scrape xong".

### ISS-025
**Thanh tiến độ thao tác dài không chạy (2026-10-20).** Nguồn: commit `8e33652`, Hưng góp ý trong session 20/10/2026.
Root cause: server tạo jobId và làm xong toàn bộ rồi mới trả → client chỉ mở SSE khi việc đã xong; hook đóng/mở stream mỗi lần render.
Sửa: client tạo id và mở SSE trước (`lib/jobId.ts`), stream chờ job tối đa 30 s, callback giữ trong ref. Chặn tái diễn: `__tests__/jobId.test.ts`.
