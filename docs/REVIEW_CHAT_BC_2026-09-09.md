# Review Claude + chatbot B-read/C — 2026-09-09

**Local verified, chưa deploy/commit/push.** Hưng yêu cầu kiểm tra báo cáo Claude và tiếp tục; không kế thừa GO deploy patch SSR thành GO cho thay đổi mới.

## Trạng thái đã kiểm lại

- `git fetch origin`: `main = origin/main = bf83aa6`, worktree sạch khi bắt đầu.
- `hungreo.com` live: `dpl_FTDDTD2bkNpnVzzJjgFznqhzLTAB`, metadata commit `a994b0b`; `bf83aa6` chỉ thêm release report. Đây đúng là Patch A, không phải deployment SSR cũ.
- GET 31/31 URL sitemap: 200 và canonical đúng URL trên hungreo.com. GET `/about` trên www và hungreo.vercel.app: trực tiếp 200, canonical về apex.
- **P3 chưa hoàn thành hợp nhất domain.** Claude đã làm canonical/sitemap (P3-lite); báo cáo `PROD_P3_SEO_2026-09-08.md` cũng ghi redirect chưa làm. Không đổi DNS/alias/redirect trong lượt này.
- Patch A thực sự truyền channel/locator và có missing-source prompt. Tests cũ pass. Báo cáo A/B tháng 8/9 trước là lịch sử; lượt này tự replay từ index cấu hình `hungreo-website-v2`, không lấy báo cáo đó làm bằng chứng hành vi live hôm nay.

## Nguyên nhân và phần làm tiếp

1. **Patch C:** route thay toàn bộ global context bằng 5 chunk của một video. `lib/chatRetrieval.ts` giờ tìm tối đa 3 scope trong discovery top20, query riêng từng video, rồi merge với global top5. Với nhiều scope lấy luân phiên để mỗi scope có chỗ; loại trùng vector ID, tổng tối đa 8 chunk. Một scope vẫn giữ nguyên 5 chunk trước rồi thêm global. Scope lỗi/rỗng giữ phần còn khả dụng; tất cả lỗi/rỗng dùng global cũ. `app/api/chat/route.ts` dùng helper này; prompt/history/rate-limit/logging không đổi.
2. **B-read, mở rộng do bằng chứng mới:** trong replay C-only, đủ 3 video nhưng phần Vibe Coding vẫn có nhận định không được hỗ trợ bởi context. Fetch đúng các vector đã chọn cho thấy `description` là quảng bá lặp lại, `content` mới là transcript (2.2–2.8k ký tự/chunk). `lib/chatContext.ts` giờ ưu tiên full `content` dạng string cho video/document; fallback `description`/`text`. Document có `fileName` được dùng khi thiếu `title`.

Approve route thực tế đã có `fileName` và `content`, nên adapter đọc được cả schema đó lẫn schema `title`/`description`. **Không cần backfill chỉ để đọc các field đã tồn tại này.** Chưa sửa ingestion, chưa xác nhận mọi vector lịch sử có full content; vector thiếu thật cần audit riêng. Website adapter không thay đổi.

## Test và replay

- Tái hiện C trên selection policy cũ: 4 test lỗi mất nguồn fail, 3 fallback test pass. Sau đó thêm test giữ đủ 5 chunk single-video (ban đầu fail 4 != 5), sửa rồi pass.
- Tái hiện B-read: 3 test fail (transcript, đoạn tài liệu sau preview, approve metadata); sửa rồi pass.
- `npm test`: **58/58 PASS** (43 cũ + 11 multi-source + 4 context).
- `npx tsc --noEmit --incremental false`: PASS; đã sửa annotation type của helper replay bị tsc bắt.
- `npm run build` với fixture KV: PASS. Warning dữ liệu browserslist/baseline cũ, không nâng dependency trong patch.
- `git diff --check`: PASS.

Replay cuối: 9 payload baseline retrieval, 5 cặp câu trả lời A/B (`single_vi`, `two_vi`, `three_en`, `unknown_vi`, `document_video_vi`). Cùng embedding/discovery/scoped response và full system prompt Patch A; control bỏ `content`/`fileName` đúng cách đọc cũ, selection cũ chỉ một scope. Dùng model `gpt-4.1-mini`, temperature 0.7, max_tokens 2000 như route, khác ở non-streaming. **Replay ngoài route, không phải phản hồi của deployment mới trên Prod.** Không gọi `/api/chat`, không ghi KV/Pinecone hay gửi email.

| Ca | Control Patch A | B-read + C local |
|---|---|---|
| Một Self-study | 5 chunk Self-study | Giữ 5, thêm global; đúng The Mindset Mentor Podcast và URL |
| So sánh 2 video | Chỉ Rainer | Có Rainer + Self-study, trả so sánh và dẫn cả hai |
| Tổng hợp 3 video | Chỉ Vibe Coding, nội dung quảng bá | Đủ 3; Vibe Coding nêu bắt đầu MVP rồi iterate; đã đối chiếu trực tiếp transcript chunk12 |
| Văn Hóa Gia Đình + video | Chỉ Self-study | Có document và video, đọc full chunk; tên tài liệu không có URL bịa |
| Zeta-742 không tồn tại | Báo thiếu | Vẫn báo thiếu |
| Personal / website+CV | Global như cũ | Không đổi selection; chưa bảo đảm tìm được video/CV được nhắc |
| Follow-up | Không tìm lại được video từ history | Vẫn chưa giải quyết |
| Switch khi đang xem video | Chỉ video đang xem | Có thêm video được gọi tên; page-context priority/prompt vẫn cũ, chưa nghiệm thu D |

Các URL YouTube được dẫn trong 5 câu sau đều thuộc context đã chọn. Đây là check URL/context, không dùng HTTP200 để kết luận nội dung được dẫn là đúng. Câu trả lời vẫn có lỗi trình bày nhẹ: nhãn `Watch here` hoặc URL thay tên nguồn dù prompt yêu cầu tên; không tuyên bố Patch A đã bảo đảm format tuyệt đối. Chỉ một lần mỗi ca ở temperature 0.7, không phải tỷ lệ chống hallucination. Không suy diễn đủ link thành đầy đủ căn cứ; chính kiểm tra transcript đã bắt lỗi C-only.

## Cost và giới hạn còn lại

- Không thêm LLM call trong production flow. Vẫn một embedding + một completion. Pinecone tối đa 1 discovery + 3 scoped queries, chạy scoped song song; trước tối đa 1+1.
- Prompt tokens control → after: single 4008→4978; two 4432→5919; three 2249→6341; unknown 2324→2952; document+video 4494→5473. Tăng khoảng 22–182%; chưa quy đổi USD hoặc đo bill thực. Số chunk có trần không đồng nghĩa số token không tăng.
- Discovery vẫn top20, title matching vẫn lexical; nguồn ngoài top20 không tự được tìm. Chưa có source catalog lookup, history-aware retrieval, hay giải quyết page-context khi đổi chủ đề.
- Dữ liệu website/vector có thể là nội dung lịch sử. Patch không xác minh tuyên bố tiểu sử/vận hành trong nội dung CMS là hiện trạng hôm nay.
- Chưa smoke route thật của bản mới, chưa deploy, chưa owner UAT. Nếu được GO, deploy đúng patch này và test 2-video/3-video/document+video; route thật có chat log/rate-limit writes và khả năng email fallback như kiến trúc hiện tại.

## Files và commands

Production code: `lib/chatRetrieval.ts`, `lib/chatContext.ts`, `app/api/chat/route.ts`. Tests: `__tests__/chatMultiSource.test.ts`, `__tests__/chatContext.test.ts`, script runner trong `package.json`. Helper: `scripts/replay-chat-retrieval.ts`.

```bash
npm test
npx tsc --noEmit --incremental false
# Terminal riêng, read-only public snapshot, không credentials:
npx tsx scripts/serve-ssr-fixtures.ts
KV_REST_API_URL=http://127.0.0.1:3102 KV_REST_API_TOKEN=local-fixture npm run build
# Dùng cấu hình API hiện có; embeddings/completions có tính phí:
npx tsx scripts/replay-chat-retrieval.ts /tmp/hungreo-retrieval-bc-final-20260909.json --generate
# Có thể chỉ chọn ca cần retest bằng --cases=single_vi,document_video_vi
git diff --check
```

[Evidence](REVIEW_CHAT_BC_2026-09-09_EVIDENCE.json) giữ hash code retrieval/context, ID/chunk/title, token usage và public HTTP checks; không lưu raw transcript/document. Raw answers replay nằm trong `/tmp` để review tại máy, không commit.

Bước tiếp theo nhỏ: GO deploy **B-read + C** sau khi review diff; giữ Patch D và redirect là thay đổi riêng. Không cần migration dữ liệu cho patch này.
