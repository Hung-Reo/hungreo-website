# Production — chatbot follow-up scope, 2026-09-09

## Release và phạm vi

Hưng đã cấp **GO deploy**. Deployment hoàn tất, technical smoke PASS; **owner UAT chưa có kết quả**.

- Commit local: `a446fba48ea0d49fce33391608ae44c05220a909` (chưa push).
- Production: `dpl_3XVuKb4NDoiL7RZ2ufmPW3h3srTy`.
- URL: `https://hungreo-website-lu2npqux1-hungreos-projects.vercel.app`.
- Deployment trước: `dpl_7SSSKis3voJXiMNUvDfui9Gk5PYq` — rollback anchor, không tự rollback.
- Alias `hungreo.com`, `www.hungreo.com`, `hungreo.vercel.app`, `hungreo-website.vercel.app` đã xác minh bằng `vercel alias ls`.
- Chỉ hai file trong commit: `lib/chatRetrieval.ts`, `__tests__/chatMultiSource.test.ts`.
- Nguồn deploy là `git archive HEAD` trong thư mục sạch, chỉ thêm `.vercel/project.json`. Các docs đang dirty/untracked không được đưa vào bản deploy. Không publish nội dung nháp, nâng dependency, đổi DNS hay migration dữ liệu.

## Trước / sau

Trước fix (reproduction local): câu hỏi CV sau hai video vẫn bị ép 6/8 chunk video cũ. Sau fix local: giữ 5 chunk CV từ global discovery và không gọi scoped query từ history. Đây là số liệu test selection, không phải số chunk đo qua API production.

Trước promote: build Vercel PASS, project detail GET 200; chat trên candidate qua `vercel curl` trả đủ hai video và đúng kênh. Local trước deploy: 72/72 tests, typecheck và fixture build PASS.

Sau promote, chuỗi liên tục qua **POST https://hungreo.com/api/chat**, dùng đúng câu trả lời thật làm history, page context `/`, ngày 09/09 khoảng 13:20–13:21 giờ Việt Nam:

| Ca | Hành vi thực tế | Kết quả |
|---|---|---|
| Self-study Blueprint + Rainer Stropek | So sánh cả hai, đúng The Mindset Mentor Podcast / TEDx Talks, link `O8_isifBeKk` và `yhGzXULZkEw` | PASS |
| “Vậy hai nguồn vừa so sánh khác nhau ở đâu khi áp dụng?” | Giữ hai nguồn và hai link | PASS |
| “Bỏ qua các video. Kinh nghiệm công việc của Hưng trong CV hoặc website công khai là gì?” | Trả lời kinh nghiệm, dẫn `/about`, apex, `/projects`; không dẫn hai video cũ | PASS cho topic switch |
| “Tóm tắt video Vibe Coding trong kho kiến thức, dẫn link video đó.” | Nội dung Vibe Coding và link `iLCDSY2XX7E`, không dẫn video cũ | PASS |

Cả 4 request HTTP 200, SSE kết thúc `[DONE]`. Smoke xác minh đổi nguồn/citations; không phải kiểm chứng độc lập mọi câu tóm tắt hoặc số liệu CV. Candidate có một đoạn trộn EN/VI; còn lỗi diễn đạt “Replet” trong câu Vibe Coding trên apex, không sửa prompt trong release này.

Chat route thật có thể ghi chat log/rate-limit theo cơ chế hiện có; không gửi email thử riêng. Dữ liệu thô giữ local tại `/tmp/hungreo-topic-chat-candidate.sse`, `/tmp/hungreo-prod-topic-smoke.json`.

## Website / domain / logs

- 31/31 URL sitemap HTTP 200 và canonical đúng từng URL.
- `www.hungreo.com/about?smoke=topic` và `hungreo-website.vercel.app/about?smoke=topic`: 308 → apex, giữ path/query.
- `hungreo.vercel.app/`: 200, `X-Robots-Tag: noindex, nofollow`.
- Anonymous `/admin/dashboard`: 307 → `/admin/login`.
- Không có HTTP 5xx trong logs deployment mới, cửa sổ `2026-09-09T06:15:00Z` đến `06:21:35Z`.
- **Có lỗi ứng dụng, không được gọi là “logs sạch”:** `Error fetching related videos: SyntaxError: Unexpected token '<'`. Khối Related Videos bị ẩn, trang chính vẫn 200.
- Đã gọi cùng trang Vibe Coding trên deployment cũ bằng `vercel curl`; logs cũ `06:21:39Z` tái hiện đúng lỗi. Không phải regression của hai file chatbot lần này.
- Code hiện có: `components/features/RelatedVideos.tsx` gọi HTTP qua `getBaseUrl()` (`lib/getBaseUrl.ts` ưu tiên `VERCEL_URL`) rồi parse HTML thành JSON. Deployment protection là nguyên nhân khả dĩ, chưa truy vết response nội bộ đầy đủ. Bước nhỏ tiếp theo: dùng helper đọc video trực tiếp hiện có, test filter/current ID/limit; đây là patch riêng.
- Kết quả HTTP lưu `/tmp/hungreo-prod-http-smoke.json`.

## Commands đã dùng

```bash
git archive HEAD  # trích xuất bằng Python vào thư mục tạm sạch
vercel deploy --prod --skip-domain --yes --meta baseCommit=a446fba48ea0d49fce33391608ae44c05220a909
vercel curl /projects/openclaw-personal-ai-operations-platform --deployment https://hungreo-website-lu2npqux1-hungreos-projects.vercel.app
vercel promote https://hungreo-website-lu2npqux1-hungreos-projects.vercel.app --yes
vercel alias ls
python3 /tmp/hungreo-prod-topic-smoke.py
python3 /tmp/hungreo-prod-http-smoke.py
```

## Owner UAT khoảng 2 phút

Mở https://hungreo.com, refresh, mở chat mới. Gửi lần lượt trong cùng cuộc trò chuyện:

1. “So sánh Self-study Blueprint với What to teach when AI writes the code của Rainer Stropek, dẫn link cả hai.” → hai nguồn và hai link.
2. “Vậy hai nguồn vừa so sánh khác nhau ở đâu khi áp dụng?” → vẫn nói về hai nguồn đó.
3. “Bỏ qua các video. Kinh nghiệm công việc của Hưng là gì? Chỉ dẫn nguồn liên quan.” → trả lời về Hưng, không kéo video cũ vào.

Hưng xác nhận PASS hoặc gửi câu hỏi + câu trả lời có vấn đề. Chưa dùng technical smoke thay cho owner UAT. Nội dung draft, dependency và Search Console/nemotron vẫn theo scope riêng trong handover.
