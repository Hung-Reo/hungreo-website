# Audit hungreo.com — 2026-09-08

Phạm vi: code, website thực tế, baseline chatbot, domain. Không sửa application code, deploy, DNS, cấu hình Vercel, hoặc dữ liệu tri thức. Các lượt xem/chat có thể tạo analytics, chat logs và thông báo fallback theo hành vi sẵn có.

## Kết luận

Website đã có bản sắc: câu chuyện học AI, Văn Hóa Gia Đình, Problem-First, Human + AI. Khoảng trống là liên kết những giá trị ấy với công việc và bài học hiện tại. Chatbot có dữ liệu hữu ích nhưng chưa đáng tin cho tổng hợp nhiều nguồn: thiếu coverage, bỏ thông tin nguồn và có lỗi gán tác giả. Chưa có bằng chứng cần đổi model/vector DB.

Phát hiện cần xử lý trước việc làm đẹp nội dung: cả 6 URL chi tiết dự án/blog công khai trả HTTP 500 khi GET trực tiếp. Trình duyệt vẫn có thể hiện nội dung sau khi JavaScript chạy, nên đây không phải kết luận toàn website trắng/chết.

## Mốc xác minh và giới hạn

- Đã đọc `AGENTS.md`, `CLAUDE.md`, hai handover và review tháng 7.
- Sau `git fetch origin`: `main = origin/main = c36f42e008c303dd339d90439510b89054dfc05f`.
- File có sẵn cần giữ: `?? docs/HANDOVER_2026-09-08_PERSONAL_WEBSITE_KNOWLEDGE.md`.
- Vercel xác nhận ba hostname được gán deployment `dpl_E2GCmbYJgPq9EEn3sCQVDbdVQGyA`, READY, production, tạo 2026-08-24; source `cli`, commit metadata `678c79adf854f8555a6feb0dfba3988114a24905`.
- Diff `678c79a..HEAD` chỉ có `docs/HANDOVER.md`; không có application-code delta. Commit metadata không phải chứng minh byte-for-byte cho mọi file từng deploy bằng CLI.
- Git integration hiện có link GitHub, production branch `main`. Chưa thử push để chứng minh auto-deploy hoạt động; không kế thừa khẳng định cũ “push không deploy”.
- Project production env hiện ghi `PINECONE_INDEX_NAME=hungreo-website-v2`, `OPENAI_EMBEDDING_MODEL=text-embedding-3-large`. Read-only SDK tới index cấu hình local cùng tên trả **197 vectors, 3072 dimensions**. Không chạy lại audit toàn lifecycle/orphan tháng 7.
- Public API hiện trả **13 videos, 3 published projects, 3 published blog posts**. 13 video DTO không có summary có nội dung; không suy từ đó rằng mọi tài liệu trong kho đều thiếu tóm tắt.
- Các website chunks lấy trong replay có `lastScraped` **2026-06-01**. Đây là snapshot trong index đang dùng, không phải đọc trang website theo thời gian thực.
- `.env.production.local` vẫn ghi auth URL cũ; `.env.production` còn tên index cũ. Đây là file local có thể lỗi thời; live `/api/auth/providers` đang trả callback hungreo.com.

## Website: con người, góc nhìn, hành trình

Đã xem Home, About, Knowledge và một project detail bằng Chrome; kiểm tra Home EN/VI, mở chat và video detail ở viewport 390×844. Đây là responsive spot-check, chưa phải UAT thiết bị thật hoặc audit accessibility đầy đủ.

**Điểm có thể giữ và phát huy:** Home kể câu chuyện “Nơi Mọi Thứ Bắt Đầu”, có ba giá trị gia đình. Blog có reflection về nhân văn và giáo dục; OpenClaw case study đã có problem, solution, outcomes, learnings. Không cần tạo CMS mới để bắt đầu.

**Điểm làm Hưng chưa hiện rõ:**

- Home nói “20 năm Business Analyst”, About dẫn bằng “Experienced Head of IT”, portfolio project mô tả Product Manager. Các vai trò có thể cùng đúng, nhưng thiếu một câu nối mạch nghề nghiệp và góc nhìn hiện tại; không tự kết luận CV sai.
- Hero và CTA thiên về CV/portfolio. Trên mobile, “Dự án nổi bật” bắt đầu khoảng y=3883 px, sau câu chuyện nguồn gốc khá dài. Chưa có khối ngắn, có ngày xác nhận, trả lời “đang xây gì / vừa học gì / vì sao việc đó quan trọng với Hưng”.
- Project OpenClaw có nhiều chi tiết vận hành; `Key Learnings` lặp trong nội dung và section riêng. Chưa dẫn người đọc từ quyết định của Hưng tới một kết quả hoặc thay đổi cách nghĩ dễ hiểu.
- Các số như giảm 70% thời gian, relevance >80%, uptime >95% là **tuyên bố đang công khai trong case study**, chưa được audit này xác minh bằng telemetry. Nên gắn kỳ đo/cách đo, hoặc ghi rõ kết quả thử nghiệm thời điểm đó.
- Knowledge đang là danh mục video với mô tả nguyên bản, kể cả quảng cáo. Chưa thấy reflection riêng của Hưng hay liên kết các nguồn thành một bài học. Nhãn “AI Tools” chưa diễn đạt rõ đây là thư viện học tập.
- Khi chọn VI, video detail và chat welcome vẫn có English. Knowledge nói có full transcript nhưng trang chi tiết quan sát được chỉ có player + description + chat; cần chỉnh lời giới thiệu đúng chức năng, giữ nguyên bảo vệ không xuất transcript công khai.

### Lỗi HTTP 500 ở nội dung chi tiết

GET trực tiếp cả 3 `/projects/<slug>` và 3 `/blog/<slug>` trong public API đều trả 500. Vercel runtime errors của deployment hiện tại ghi:

```text
ERR_REQUIRE_ESM: require() of ES Module .../jsdom/node_modules/parse5/dist/index.js
from .../jsdom/lib/jsdom/browser/parser/html.js not supported
routes=/blog/[slug], /projects/[slug]
digest=1348626282
```

`app/projects/[slug]/page.tsx:11` và blog detail import `isomorphic-dompurify` ở module scope. Local dependency tree: `isomorphic-dompurify@2.30.0 → jsdom@27.0.1 → parse5@8.0.0`. Import trực tiếp trên Node local v22.16.0 PASS, nên cần tái hiện production build/runtime trước khi chọn bản vá; chưa khẳng định một version pin cụ thể sẽ giải quyết.

Trình duyệt sau khi tải JS vẫn render được OpenClaw detail. HTTP error vẫn là vấn đề cho truy cập trực tiếp, crawler và link preview; chưa đo tác động thực tế lên Google indexing. `npm test` hiện không bắt lỗi SSR này.

## Baseline chatbot: 9 lượt live

Đầu vào/đầu ra đầy đủ và replay metadata an toàn ở `CHATBOT_BASELINE_2026-09-08.json`. Mỗi case chạy một lần; kết quả cho thấy failure modes, không đại diện tỷ lệ lỗi thống kê.

| Case | Nguồn mong đợi | Kết quả live | Thời gian hoàn tất |
|---|---|---|---:|
| single_vi | Self-study Blueprint | 3 bài học phù hợp nội dung mẫu; đúng video ID. Mốc phút chỉ có chapter list, chưa xác minh chính xác từng đoạn | 10.74s |
| two_vi | Self-study + Rainer Stropek | Chỉ dẫn Rainer; vẫn so sánh rồi nói không có Self-study | 7.53s |
| three_en | Self-study + Rainer + Vibe Coding | Chỉ dẫn Vibe Coding; tổng hợp cả nguồn thiếu, còn gọi bootcamp bên thứ ba là “Hung’s AI Agent Bootcamp” | 6.32s |
| personal_vi | Website Hưng + Self-study | Có dữ kiện website và đề xuất, nhưng không có nguồn video hay URL kiểm chứng | 8.58s |
| followup_vi | Hai nguồn của two_vi | Nhắc lại phân tích cũ; vẫn thiếu link Self-study | 5.43s |
| switch_vi | Rainer, dù pageContext=Self-study | Từ chối vì không có thông tin Rainer, dù video có trong kho | 2.26s |
| unknown_vi | Không có tài liệu Zeta-742 | Thừa nhận không có thông tin, không bịa nội dung | 2.64s |
| website_doc_en | Website + CV nếu có | Tách facts/inference nhưng không dẫn URL/document chính xác; chưa chứng minh đã dùng CV | 6.57s |
| document_video_vi | Văn Hóa Gia Đình + Self-study | Chỉ dẫn video; suy đoán tài liệu bị thiếu; gán người trình bày video cho Hung Dinh | 11.02s |

Median hoàn tất **6.57s**, khoảng **2.26–11.02s**; median time-to-first-text **2.24s**. Đây là phép đo HTTP/SSE từ máy local, không phải latency từng provider hoặc mobile UI.

**Độ đúng nguồn:** ca document_video_vi nói Hưng trình bày Self-study Blueprint trong khi public catalog và player ghi kênh **The Mindset Mentor Podcast**. Gắn đúng URL chưa đủ để coi citation đúng nếu tác giả/chủ thể bị gán sai. Ca single kiểm tra nội dung với context/chapter mẫu; chưa nghe lại toàn video hoặc kiểm tra từng phát biểu của cả corpus.

**Chi phí:** API stream hiện không trả usage nên không thể báo số tiền thực trả. Code gọi một embedding, một discovery query và có thể thêm một scoped query, sau đó một `gpt-4.1-mini` generation, tối đa 2000 output tokens. Thêm 9 embedding requests để replay retrieval; không re-embed tài liệu hoặc ghi Pinecone. Không lấy model `gpt-4o-mini` trong AGENTS làm bằng chứng model endpoint hiện tại.

### Root causes đối chiếu code và replay

Replay dùng logic local hiện tại và read-only Pinecone; **không phải trace gắn với đúng request production trước đó**. Chỉ lưu IDs/titles/scores, không xuất raw transcript hoặc nội dung tài liệu vào artifact.

1. **Chọn một video làm mất nguồn khác.** `lib/chatRetrieval.ts:146` chọn một `best`; `app/api/chat/route.ts:131` thay toàn bộ context bằng scope đó. Replay two_vi có cả Self-study trong discovery (rank 18), nhưng selected 5/5 chunks chỉ Rainer. three_en cũng thấy Self-study trong discovery nhưng chọn 5/5 Vibe Coding. Đây không chỉ là thiếu topK.
2. **Video đang xem lấn át yêu cầu mới.** `lib/chatRetrieval.ts:94` ưu tiên mọi videoId hợp lệ trước query. Replay switch_vi chọn Self-study mặc dù câu hỏi chỉ rõ bỏ qua video đang xem.
3. **History không tham gia retrieval.** Embedding chỉ dùng message mới; sanitized history được thêm sau. Replay followup_vi không có video nào trong selected context. Câu trả lời có thể tiếp tục từ câu trả lời sai trước đó.
4. **Thông tin nguồn bị bỏ.** `app/api/chat/route.ts:156` chỉ chuyển title, description/text, type, videoId vào prompt; bỏ `page`, `documentId`, `channelTitle`, ngày scrape. Website chunks đã có `page`, không cần migration để dẫn URL website đúng.
5. **Document adapter bỏ nội dung đầy đủ.** Document vectors mẫu live có `description` 500 ký tự và `content` 842–910 ký tự; chat chỉ dùng description. `app/api/admin/documents/approve/route.ts:92` còn ghi `content/fileName` mà không ghi `description/title`, khiến adapter hiện tại có thể gửi “No description/Untitled” cho dữ liệu tạo bằng nhánh này. Chưa chứng minh nhánh đó được dùng trong các lượt baseline.
6. **Lẫn nguồn lịch sử và nguồn xuất bản.** Replay lấy `blog-sample-post`, title “Tại Sao Problem-Solving Trước, AI Sau”, khớp `content/blog/sample-post.mdx`, không có trong 3 bài CMS public hiện tại. Đây là sample vector đang được truy xuất; không có nghĩa mọi ý trong đó sai. Cần phân biệt trạng thái xuất bản/curated, không tự xóa.

## Domain hiện tại

| Host | HTTPS `/` và `/about` | Vercel domain redirect | Auth provider callback |
|---|---|---|---|
| hungreo.com | 200 | null | hungreo.com |
| www.hungreo.com | 200 | null | hungreo.com |
| hungreo.vercel.app | 200 | null | hungreo.com |

- HTTP trên cả ba chuyển 308 sang HTTPS **cùng hostname**, giữ `/about?audit=1`; chưa hợp nhất hostname.
- `/about`, `/projects` canonical và OG URL về hungreo.com. Home, Knowledge landing và category kiểm tra được **thiếu canonical**. Root OG URL về hungreo.com; `/og-default.jpg` trả 200.
- Robots và sitemap cả ba dùng hungreo.com. Sitemap có 5 trang tĩnh + 3 blog + 3 project, chưa có Knowledge/video. `lastmod` trang tĩnh là thời điểm build 2026-08-24, không phải bằng chứng nội dung vừa được cập nhật.
- Source search app/components/lib không thấy hard-coded `hungreo.vercel.app`; payload public project/blog cũng không có chuỗi này. Link điều hướng quan sát được dùng hungreo.com/relative paths. Chưa audit toàn bộ backlink bên ngoài.
- `/admin/dashboard` anonymous → 307 `/admin/login`; `/api/auth/session` anonymous → null. Cookie config là host-only; chưa thực hiện đăng nhập/reset-password để kiểm thử đầy đủ. Không giả định session domain cũ tự chuyển được.
- DNS live: Hostinger `ns1/ns2.dns-parking.com`, apex A `76.76.21.21`, www CNAME `hungreo.com`; n8n và bot A vẫn `<VPS_IP>`. Không thao tác VPS/DNS.

**Đề xuất:** giữ hungreo.com làm public canonical; redirect vĩnh viễn www và alias cũ hungreo.vercel.app về cùng path/query trên hungreo.com. Giữ deployment URLs phục vụ kiểm tra kỹ thuật theo cơ chế access hiện có. Dùng domain redirect của Vercel nếu alias hỗ trợ; nếu không, rule theo hostname chính xác trong Next.js, không wildcard mọi vercel.app. Không cần đổi DNS, nameserver hay xóa project.

[Google hướng dẫn site move](https://developers.google.com/search/docs/crawling-indexing/site-move-with-url-changes) khuyến nghị permanent redirect 301/308 và canonical tự trỏ URL mới. [Vercel domain redirects](https://vercel.com/docs/domains/working-with-domains/deploying-and-redirecting) là cơ chế cấu hình phù hợp; quyết định triển khai cần GO riêng, sau kiểm tra path/query, assets/API và admin login. Chưa kiểm tra Search Console nên chưa kết luận duplicate indexing đang xảy ra.

## Tối đa 3 cải thiện theo impact / effort / cost

Ước lượng effort cho local implementation + checks, không gồm thời gian Hưng duyệt nội dung hoặc rollout.

| Ưu tiên | Thay đổi cụ thể | Impact | Effort | Cost |
|---|---|---|---|---|
| 1. Đưa nội dung của Hưng tới người đọc ổn định và rõ hơn | Trước hết sửa SSR 500 ở detail; sau đó dùng Home/CMS sẵn có thêm “Đang xây / Đang học”, cập nhật một case study theo quyết định → kết quả → bài học, ghi ngày xác nhận | Rất cao: nội dung là bằng chứng trực tiếp cho con người/hành trình | SSR khoảng 0.5–1 ngày sau khi tái hiện; nội dung pilot 0.5 ngày + Hưng duyệt | Không thêm dịch vụ/LLM |
| 2. Tổng hợp có nguồn và đúng chủ thể | Adapter nguồn dùng full content, title/fileName, page/source ID/channel; lấy nhiều nguồn có giới hạn khi người dùng yêu cầu; pageContext chỉ mặc định cho “video này”; resolve follow-up có kiểm soát; thiếu nguồn thì nói rõ trước khi tổng hợp | Rất cao: giảm trả lời có vẻ đúng nhưng thiếu căn cứ | Chia patch nhỏ, khoảng 1–3 ngày | Giữ KV/Pinecone/model; không cần migration. Token/query có thể tăng, phải đo với baseline |
| 3. Một domain public và metadata nhất quán | www + alias cũ → hungreo.com; canonical riêng từng trang còn thiếu; bổ sung Knowledge vào sitemap | Trung bình: URL nhất quán, giảm phiên bản public trùng lặp | Khoảng 0.5 ngày + kiểm tra sau GO | Không thêm dịch vụ |

**Acceptance #1:** cả 6 deep links trả HTTP 200 khi mở trực tiếp và reload, render nội dung EN/VI, không lỗi ESM mới; sanitizer vẫn chặn HTML nguy hiểm. Pilot Home cho người đọc thấy ngay việc đang làm, một quyết định/bài học có dẫn tới case study; mọi claim mới được Hưng duyệt, số liệu cũ có kỳ đo.

**Acceptance #2:** baseline một nguồn/unknown không regression; case 2–3 nguồn và video+tài liệu lấy đủ nguồn yêu cầu hoặc liệt kê rõ phần thiếu, không bịa so sánh; không gán tác giả bên thứ ba cho Hưng; citation website là URL đúng, tài liệu chưa công khai chỉ dẫn định danh an toàn, không tự xuất Blob private. Follow-up và đổi video trả đúng đối tượng. Chạy lại EN/VI; ghi source coverage, attribution, latency và usage. Không refresh/delete sample vectors nếu chưa có GO dữ liệu riêng.

**Acceptance #3:** HTTPS alias redirect thẳng về đích đúng path/query, không loop; canonical của đích là chính nó; assets/chat và login ở domain chính hoạt động; n8n/bot records không đổi. Session cũ có thể cần đăng nhập lại. Không rollout chỉ dựa trên HTTP 200 của Home.

**Bước đầu tiên đề xuất:** một patch local chỉ để tái hiện và sửa lỗi SSR dependency ở blog/project detail, giữ sanitizer. Test production build + GET trực tiếp đủ 6 trang; review diff trước khi xin GO deploy. Sau đó mới đưa bản nội dung “Đang xây / Đang học” ngắn để Hưng duyệt. Audit này chưa thực hiện patch.

## Checks và artifacts

- `git status --short --branch`, `git fetch origin`, `git log -5 --oneline`, `git diff 678c79a..HEAD --stat`.
- `npm test`: **34/34 PASS**. Không chạy build/typecheck vì không sửa application code; chưa coi đây là release validation.
- `npm ls isomorphic-dompurify jsdom parse5 --depth=4`; import local bằng `node -e` PASS, chưa tái hiện lỗi bundle.
- Python `urllib.request` GET/redirect inspection và 9 POST `/api/chat`, parse SSE, timing; public GET `/api/videos`, `/api/content/projects`, `/api/content/blog`.
- `dig +short NS hungreo.com`, `dig +short A hungreo.com`, `dig +short CNAME www.hungreo.com`, đọc A records n8n/bot.
- Vercel connector `get_project`, `get_deployment`, `get_runtime_errors`; `vercel api` GET project/domains, chỉ phân tích cấu hình cần thiết, không lưu credentials.
- Read-only Pinecone `describeIndexStats` và replay `query`; không `upsert/delete`, không rebuild hay re-embed corpus.
- Script đo tạm ở `/tmp/hungreo-audit-20260908/`; artifact bền trong repo chỉ gồm báo cáo và baseline JSON đã loại raw context/credentials.
