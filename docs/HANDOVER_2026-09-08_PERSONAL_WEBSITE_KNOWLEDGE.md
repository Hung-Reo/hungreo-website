# Handover — Personal website & knowledge synthesis

Ngày: 2026-09-08. Repo: `/Users/hungdinh/Development/hungreo-Website`.

## Mục tiêu session mới

Hưng muốn website `https://hungreo.com` thể hiện con người, trải nghiệm, góc nhìn và hành trình học của mình rõ hơn. Chatbot đã trả lời tốt từng video nhưng cần rà soát khả năng tổng hợp nhiều nguồn và gắn kiến thức với bối cảnh của Hưng. Đồng thời kiểm tra vai trò domain `hungreo.vercel.app` sau khi chuyển domain chính.

Ưu tiên simple-safe-effective, ít chi phí vận hành, tận dụng code hiện có. Bắt đầu bằng audit và baseline thực tế, rồi đưa tối đa 3 cải thiện đáng làm theo impact/effort/cost. Không mặc định cần viết lại RAG hoặc đổi vector DB.

## Bằng chứng và mốc thời gian

- Kiểm tra local ngày 2026-09-08: branch `main`, HEAD `c36f42e`, worktree sạch trước khi thêm file này. Local `origin/main` cùng HEAD; chưa fetch remote hoặc kiểm tra deployment live trong lượt handover.
- `docs/HANDOVER.md` cập nhật 2026-08-24 ghi nhận chuyển sang hungreo.com, hungreo.vercel.app còn sống. Hưng xác nhận lại domain mới trong chat. `lib/metadata.ts` hiện default BASE_URL là `https://hungreo.com`.
- Những số liệu transcript/vector và production test bên dưới là bằng chứng ngày 2026-07-14, KHÔNG phải số liệu live tháng 9.
- Repo có các fix sau session tháng 7: `1f38b18` (sanitize chat history + public video DTO), `11ce154` (public stats không phá indexes; strict read khi rebuild), `678c79a` (inbox indexes, TTL, dependency fixes). Đọc code mới trước khi sửa, giữ nguyên các bảo vệ này.

## Việc đã hoàn tất trong chat này

1. Transcript hybrid fallback, commit `ea8becb`:
   - Direct YouTube captions trước; primary thất bại thì dùng Supadata khi có `SUPADATA_API_KEY`.
   - Supadata `mode=native&text=true`, không tự bật AI transcription.
   - Re-fetch từ Admin kết hợp fetch + embedding; validate transcript, timeout và lỗi có trạng thái rõ.
   - Không bảo đảm lấy được transcript của mọi video: video thiếu captions, private/restricted, quota/provider failure vẫn có thể fail.
2. Vector lifecycle, commit `16e5206`:
   - Stage generation mới đủ chunks → persist IDs trong KV → cleanup generation cũ.
   - Delete tìm union của KV-tracked IDs, prefix và metadata videoId; bảo vệ retry khi cleanup lỗi.
   - Repair CLI mặc định dry-run; writes cần `--apply --environment=production --video-id=<id>`.
3. Chat retrieval, commit `f283ad9`:
   - Report: câu VI hỏi Self-study Blueprint không tìm thấy dữ liệu dù đã embedded.
   - Vector video rank #11, score ~0.3728; bot cũ topK 5 bỏ qua nó.
   - Fix discovery topK 20 → nhận diện title → query filter videoId topK 5; fallback global top5.
   - Production test đúng câu VI đã trả lessons có link video. Hưng tự retest và xác nhận output chi tiết.
   - Khi đó 34 tests pass, typecheck/build pass; deployment `dpl_4uAxqQPyWPfwq1yqEEKVicduiZBP`. Đây là deployment lịch sử, không dùng làm current release.
4. Audit ngày 2026-07-14:
   - Self-study `O8_isifBeKk`: 3378 từ, 10 chunks 0..9, 1 generation.
   - 13 videos trong KV và Pinecone; 155 video vectors + 42 loại khác = 197 total.
   - Không orphan/untracked/missing/duplicate chunk. Không cần cleanup thêm lúc đó.
   - Production dùng index `hungreo-website-v2`, embedding `text-embedding-3-large` (3072 dimensions). Đã sửa index local `.env.production.local` từ index cũ sang v2. Phải verify config hiện tại, chỉ hiển thị tên/non-secret config.

## Giới hạn retrieval hiện tại đã thấy trong code ngày 2026-09-08

- `lib/chatRetrieval.ts` trả về tối đa MỘT video scope. Valid page-context videoId thắng title matching, kể cả query có thể hỏi nội dung khác.
- Title matching chỉ thấy những video lọt discovery top20; video ngoài nhóm này vẫn có thể bị bỏ sót.
- `app/api/chat/route.ts` gửi tối đa 5 matches; khi có video scope thì thay toàn bộ context bằng chunks của video đó.
- Global top5 có thể chứa nhiều nguồn nhưng không có bảo đảm source diversity hoặc coverage. Không được kết luận bot hoàn toàn không thể tổng hợp, cũng không coi câu trả lời dài là bằng chứng tổng hợp đúng.
- Embedding query chỉ từ `sanitizedMessage`; sanitized history được thêm ở bước tạo câu trả lời sau retrieval. Follow-up như “áp dụng hai ý đó cho mình?” có thể thiếu đối tượng khi tìm kiếm.
- Cần đọc thêm toàn bộ repo để xác định có curated summaries/personal knowledge ở nơi khác; chưa audit đầy đủ tầng này.

## Hướng rà soát và cải thiện đáng đánh giá

### 1. Đo khả năng chatbot trước

Tạo bộ câu hỏi nhỏ EN/VI, ghi expected sources + actual sources + độ đúng + latency/cost:
- Một video: lessons của Self-study Blueprint.
- Nhiều nguồn: so sánh hai video có thật trong kho; tổng hợp nguyên tắc học/leadership từ ít nhất 3 nguồn.
- Cá nhân: áp dụng kiến thức vào hành trình BA → AI Product Builder của Hưng, chỉ dựa trên dữ liệu Hưng đã công khai/xác nhận.
- Follow-up nhiều lượt, đổi chủ đề khi đang xem video, title không xuất hiện trong top20.
- Câu hỏi không có dữ liệu: thừa nhận giới hạn, không bịa.

Sau baseline, cân nhắc intent single-source/multi-source, đa dạng hóa nguồn trong context, và dùng history có kiểm soát để resolve follow-up. Chứng minh bằng regression tests; đừng chỉ tăng topK vô hạn. Chỉ thêm summary index hoặc model call khi thấy lợi ích đủ rõ.

### 2. Cá nhân hóa nội dung và trải nghiệm

Audit trang Home/About/Projects/Knowledge và chat trên hungreo.com cả mobile/desktop. Đánh giá website đang trả lời được “Hưng là ai, đang làm gì, tin vào điều gì, đã học và áp dụng điều gì?” hay chưa.

Candidate: nội dung “What I'm building now”, project case studies có quyết định/kết quả/lesson thực tế, learning notes liên kết nhiều nguồn với reflection của Hưng. Phân biệt rõ lời nguồn, phần tổng hợp AI và quan điểm Hưng đã duyệt; không tự gán nhận định của video thành niềm tin của Hưng. Hỏi Hưng về audience/mục tiêu chính khi repo không đủ thông tin.

### 3. Domain migration

Kiểm tra live apex/www/vercel.app: status/redirect chain, canonical, sitemap, robots, internal links, OG URLs, auth callback/session và env site URL. Đối chiếu Vercel domain settings bằng quyền hiện có.

Đánh giá hungreo.com làm domain public chính và vercel.app redirect hay giữ access kỹ thuật. Chưa thay DNS/domain trong handover; chưa xác nhận live redirect hoặc SEO setup. Không giả định cần xóa project/deployment domain để dùng custom domain.

Theo `docs/HANDOVER.md`, DNS ở Hostinger; `n8n.hungreo.com` và `bot.hungreo.com` dùng VPS riêng. KHÔNG đổi nameserver/reset DNS hoặc đụng các subdomain này để xử lý website. Verify records trước mọi đề xuất thay đổi.

## Tài liệu và file cần đọc

- `AGENTS.md`, `CLAUDE.md` nếu có; `docs/HANDOVER.md`; `docs/CODE_REVIEW_2026-07-28.md`.
- `docs/FIX_VIDEO_TRANSCRIPT_PIPELINE_2026-07-12.md`.
- `app/api/chat/route.ts`, `lib/chatRetrieval.ts`, `lib/inputValidator.ts`, `lib/openai.ts`.
- `lib/videoManager.ts`, `lib/supadataTranscript.ts`, `lib/videoEmbeddingManager.ts`, `lib/videoVectorLifecycle.ts`, `lib/pinecone.ts`.
- `app/api/admin/videos/[id]/route.ts`, `components/admin/VideosManager.tsx`, `scripts/repair-video-transcripts.ts`.
- `lib/metadata.ts`, `app/layout.tsx`, `app/sitemap.ts`, `app/robots.ts`, `next.config.js`, `lib/auth.ts`.
- `__tests__/chatRetrieval.test.ts`, các tests video lifecycle/transcript/security.

## Các hướng dẫn cũ phải đối chiếu, không copy mù

`docs/HANDOVER.md` tháng 8 mô tả import luôn thất bại trên Vercel và chỉ repair local; mô tả này không phản ánh fallback Supadata đã thành công trong chat này. Hướng dẫn CLI repair ở đó cũng phải so với parser hiện tại. Không hạ Sensitive secrets thành plain env theo ví dụ `--no-sensitive`; kiểm tra tài liệu CLI và cấu hình thật. Các tuyên bố “Git push không tự deploy” cần verify lại integration hiện tại.

## Quy trình và phạm vi quyền

Tiếng Việt; Plan sau evidence → Do → Test/Check → Review → Report. Giữ dirty work của Hưng. Không lộ secrets/PII, không đưa transcript trở lại public DTO, không bỏ sanitizer/auth, không xóa/re-embed toàn index để thử retrieval.

Session mới bắt đầu bằng audit/read-only và đề xuất cụ thể; yêu cầu handover này chưa phải GO deploy, đổi DNS, mua dịch vụ hoặc migration dữ liệu. Không kế thừa GO cho bug fix tháng 7 thành quyền rollout các feature mới. Làm thay đổi local trong phạm vi Hưng duyệt rồi test, review trước thao tác Production.

Commands tham khảo: `git status --short --branch`, `git log -5 --oneline`, `npm test`, `npx tsc --noEmit`, `npm run build`. Không cần chạy build/test chỉ vì tạo handover. Dependency audit cũ không đại diện tình trạng tháng 9; refresh khi làm release, không tự trộn major upgrade vào cải thiện RAG/UI.

## Đầu ra mong muốn của session mới

Audit ngắn có evidence và tối đa 3 ưu tiên; mỗi ưu tiên nêu vấn đề, cải thiện cụ thể, impact/effort/cost, acceptance criteria. Đề xuất một bước đầu tiên nhỏ, giúp website thể hiện Hưng rõ hơn và/hoặc chatbot tổng hợp có nguồn tốt hơn. Rồi đi tiếp theo lựa chọn của Hưng.
