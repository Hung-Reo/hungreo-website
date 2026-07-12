# Fix: Video Transcript Pipeline Broken (2026-07-12)

## Triệu chứng

Chatbot không trả lời được nội dung các video mới upload (từ 04/2026), dù admin đã bấm "Generate Embeddings". Bot chỉ biết title + description, không biết nội dung video.

## Root cause (đã verify)

YouTube thay đổi API khoảng **12/2025–04/2026**: endpoint nội bộ `get_transcript` (được `youtubei.js` dùng trong `info.getTranscript()`) trả về **HTTP 400** cho mọi video. Chuỗi hậu quả:

1. `getVideoTranscript()` trong `lib/videoManager.ts` catch lỗi và trả về `''` **im lặng** — không cảnh báo.
2. Video được lưu vào KV với transcript rỗng, admin không biết.
3. Khi generate embeddings, công thức là `title + description + transcript` → chỉ tạo 1-2 vector mỏng (vài chục từ).
4. Chatbot có system prompt "chỉ trả lời từ context trong DB" → không có gì để trả lời.

**Bằng chứng:** 7 video thêm ≤ 27/11/2025 đều có transcript đầy đủ (195–16.063 từ); 5 video thêm ≥ 24/04/2026 đều 0 từ.

## Fix

### 1. `lib/videoManager.ts` — `getVideoTranscript()`

- **Đường chính mới:** tải thẳng caption track qua `caption_tracks[].base_url + fmt=json3` (timedtext), thay vì endpoint `get_transcript` đã hỏng. Endpoint cũ giữ làm fallback.
- **Chọn track thông minh:** English thủ công → English auto-generated → track thủ công bất kỳ (thường là ngôn ngữ gốc) → track đầu tiên. (Video nhiều phụ đề, ví dụ TED talks có 10 tracks, sẽ không vớ nhầm ngôn ngữ khác.)
- **Bắt buộc `Innertube.create({ generate_session_locally: true })`** — thiếu option này YouTube soft-block: trả HTTP 200 nhưng body rỗng.

### 2. `app/api/admin/videos/[id]/route.ts` — PATCH

Thêm flag `refetchTranscript`: lấy lại transcript từ YouTube, lưu KV, có thể kết hợp `generateEmbeddings: true` để re-embed luôn trong 1 call. Trả 502 kèm message rõ nếu vẫn không lấy được.

### 3. `components/admin/VideosManager.tsx`

- Badge **"⚠ No transcript"** trên video row khi transcript rỗng (trước đây fail hoàn toàn im lặng).
- Nút **"Re-fetch Transcript"** gọi PATCH `refetchTranscript + generateEmbeddings`.

### 4. `scripts/repair-video-transcripts.ts` (mới)

Script backfill mặc định chỉ dry-run. Khi ghi dữ liệu phải chỉ đích danh một video và environment. Vector mới được stage dưới generation ID riêng; chỉ khi tất cả chunks thành công mới switch KV, sau đó mới xoá vectors cũ.

```bash
npx tsx scripts/repair-video-transcripts.ts                     # list missing only
npx tsx scripts/repair-video-transcripts.ts --video-id=<youtube-id> # fetch dry-run
npx tsx scripts/repair-video-transcripts.ts --apply \
  --environment=production --video-id=<youtube-id>
```

## Kết quả repair (production, 2026-07-12)

| Video | Transcript | Vectors (trước → sau) |
|---|---|---|
| 1ItQnh3LWeg — AI Gave You A Promotion | 2.324 từ | 1 → 7 |
| yhGzXULZkEw — What to teach when AI writes the code | 2.001 từ | 1 → 6 |
| PplmzlgE0kg — Anthropic product team (Cat Wu) | 16.657 từ | 2 → 44 |
| 7rzYDM6vMtI — OpenClaw (Peter Steinberger, TED) | 1.776 từ | 1 → 6 |
| Zsb8Ety67mo — John C. Maxwell (on Failure) | 7.719 từ | 1 → 20 |

**Hoàn tất 5/5.** 2 video cuối bị YouTube rate-limit (HTTP 429) ~1 giờ trong lúc repair, chạy lại script sau khi hết chặn là xong.

**Verify end-to-end (production):** bot đã trả lời đúng nội dung transcript cho câu hỏi về video Anthropic (EN), AI Promotion (VI), John Maxwell (VI) — hiệu lực ngay không cần deploy vì vectors ghi thẳng vào Pinecone. Code fix đã deploy production ngày 2026-07-12 (commit 19e41e1).

## Lessons learned

1. **Không bao giờ nuốt lỗi im lặng ở bước ingest dữ liệu** — transcript fail phải hiện cảnh báo cho admin ngay tại UI.
2. **Dependency vào API không chính thức (Innertube) sẽ gãy định kỳ** — cần đường fallback + monitoring (badge cảnh báo giúp phát hiện sớm lần sau).
3. **Chạy nhiều request YouTube liên tục sẽ bị soft-block tạm thời** (HTTP 200 body rỗng) — script repair nên retry sau cooldown.
4. ✅ **Đã verify khác biệt environment (2026-07-12).** Test thực tế với video `0-_js3fzvys`: nút Re-fetch trên production thất bại, trong khi local lấy được 2.716 từ. Khả năng cao là YouTube soft-block/rate-limit request từ datacenter IP hoặc session hiện tại; một A/B test chưa đủ để kết luận mọi Vercel IP bị chặn vĩnh viễn.

## Quy trình import video mới (từ 2026-07-12)

Trong khi transcript fetch từ production còn bị soft-block/rate-limit, dùng local fallback:

1. **Import video trên admin production** như bình thường (`/admin/videos` → Batch Import). Metadata (title, description, thumbnail) vẫn lấy được vì dùng YouTube Data API chính thức. Transcript sẽ rỗng — badge "⚠ No transcript" sẽ hiện.
2. **Chạy 1 lệnh trên máy local** (repo hungreo-Website):
   ```bash
   npx tsx scripts/repair-video-transcripts.ts --video-id=<youtube-id>
   npx tsx scripts/repair-video-transcripts.ts --apply \
     --environment=production --video-id=<youtube-id>
   ```
   Lệnh đầu dry-run; chỉ lệnh có `--apply` mới ghi KV/Pinecone. Pipeline stage đủ vectors mới trước khi switch KV và cleanup vectors cũ.
3. Xong — bot trả lời được ngay, không cần deploy.

**Lưu ý:** UI không cho Generate Embeddings khi transcript còn trống. Nút "Re-fetch Transcript" trên production có thể tiếp tục fail khi YouTube soft-block/rate-limit environment hiện tại; failure được lưu thành `no_captions`, `blocked`, hoặc `failed` để admin biết bước xử lý tiếp theo.
