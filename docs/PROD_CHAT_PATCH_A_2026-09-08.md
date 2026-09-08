# Prod release — chatbot Patch A (nguồn + tác giả) · 2026-09-08

Trạng thái: **đã deploy, smoke PASS trên production**. GO: "P2 Patch A đi".

Phạm vi: **chỉ** sửa cách dựng context và system prompt. **Không** đụng
retrieval, model, Pinecone, KV hay dữ liệu. Patch B/C/D chưa làm.

## Bản phát hành

- Commit `a994b0b` trên `main` (đã push).
- Deployment `dpl_FTDDTD2bkNpnVzzJjgFznqhzLTAB` —
  `hungreo-website-lyhkvs1sy-hungreos-projects.vercel.app`.
- Deployment trước (mốc rollback): `dpl_BGG2QLAQVor6CLmcXDHYD5NsLTEe`.

## Gốc lỗi

`app/api/chat/route.ts` dựng context chỉ từ `title` / `description` /
`type` / `videoId`. Mọi field cho biết **ai sản xuất** chunk và **kiểm
chứng ở đâu** đều bị bỏ, dù có sẵn trong metadata. Probe read-only index
production `hungreo-website-v2` (197 vectors) ngày 08/09:

| vectorType | Field bị bỏ | Giá trị thật |
|---|---|---|
| video | `channelTitle` | `The Mindset Mentor Podcast` |
| website | `page` | `/about`, `/` |
| document | `documentId` | `doc_1764226748060_ssobx09lf` |

Vì thế bot nói video *How to Teach Yourself Anything (The Self-Study
Blueprint)* là "của Hung Dinh", và trả lời câu hỏi về website mà không
dẫn được URL nào.

## Thay đổi

`lib/chatContext.ts` dựng mỗi nguồn thành một block có Author/Channel và
locator:

- **video** → `channelTitle` + `https://www.youtube.com/watch?v=<videoId>`
- **website** → `Hung Dinh (hungreo.com)` + URL tuyệt đối dựng từ `page`
- **document** → `Reference: <documentId> (not publicly accessible)`,
  **không** có URL — file private, không được bịa link

Vector video đời cũ không có `channelTitle` thì **để trống** attribution
thay vì đoán.

Prompt thêm hai khối: `SOURCE ATTRIBUTION` (channel là người sản xuất,
không phải Hưng; Hưng *curate* chứ không *trình bày*) và `MISSING SOURCES`
(đặt ngay sau CRITICAL RESTRICTION).

## Đo bằng A/B replay có control

6 câu lấy từ `CHATBOT_BASELINE_2026-09-08.json`. Replay ngoài route
(read-only Pinecone + gọi OpenAI trực tiếp) để **không** ghi chat log,
rate-limit key hay email fallback vào production. Control = context +
prompt cũ, chạy cùng payload, cùng lúc.

| Ca | Trước (control) | Sau |
|---|---|---|
| `document_video_vi` | "video ... **của Hung Dinh**" | "của **kênh The Mindset Mentor Podcast**" |
| `single_vi` | không nêu kênh | nêu kênh; link dùng đúng tên video |
| `website_doc_en` | 0 URL | 4 URL hungreo.com |
| `personal_vi` | 0 URL | 6 URL hungreo.com |
| `two_vi` | lặng lẽ so sánh nguồn không có trong context | báo thiếu Self-study trước, chỉ trả lời phần thực sự có |
| `unknown_vi` | từ chối đúng | từ chối đúng — không regression |

Mọi URL bot trích dẫn đều được GET kiểm tra: 200, không có link bịa.

## Regression mình tự gây ra rồi sửa

Vòng 1 làm honesty **tệ hơn control**: với `document_video_vi`, context
5/5 chunk là video Self-study, **không có** tài liệu Văn Hóa Gia Đình,
nhưng bot dựng nguyên bảng so sánh với một cột Văn Hóa Gia Đình bịa ra —
trong khi bản cũ nói thẳng "tôi không có thông tin".

Nguyên nhân: khối MISSING SOURCES đặt **trước** CRITICAL RESTRICTION và
đọc được thành "nêu phần thiếu rồi cứ trả lời tiếp". Chuyển xuống sau và
viết lại thành lệnh cấm cụ thể thì hết.

Vòng 2 lộ hai lỗi nữa: bot in nhãn nội bộ `[S5]` ra câu trả lời (nhãn
dạng ngoặc vuông trông như ký hiệu trích dẫn — đổi sang `Source N:`), và
lách quy tắc bằng "dựa trên giả định" / "giả sử" / "có thể tập trung".

**Chỉ phát hiện được vì chạy control cùng payload.** Nếu chỉ nhìn bản mới
thì bảng so sánh trông rất thuyết phục.

## Kiểm tra trên production sau deploy

| Check | Kết quả |
|---|---|
| Chat "3 bài học Self-study Blueprint" | nêu đúng The Mindset Mentor Podcast; link đúng tên video; không lộ nhãn |
| Chat câu hỏi về website | dẫn `hungreo.com`, `hungreo.com/about` |
| Sitemap | 31 URL, 31/31 trả 200 |
| Trang detail blog/project | 200 |
| Canonical `/` | `https://hungreo.com` |
| `/admin/dashboard` anonymous | chuyển tới `/admin/login` |

Local trước deploy: `npx tsc --noEmit` PASS, `npm test` **43/43** PASS
(34 cũ + 9 test mới `__tests__/chatContext.test.ts`), `npm run build` PASS.

## Giới hạn

- **`two_vi` chưa xong.** Bot hết bịa nội dung nguồn thiếu, nhưng gốc là
  retrieval chỉ lấy được 1 video (`app/api/chat/route.ts` thay **toàn bộ**
  context bằng scope một video — root cause #1 của audit). Prompt chỉ giảm
  được, không triệt được. Phải chờ **Patch C**.
- Chưa làm Patch B (document adapter dùng `content` đầy đủ; approve route
  ghi thiếu `description`/`title`) và Patch D (pageContext + follow-up).
- Mỗi ca replay chạy một lần, `temperature: 0.7` → kết quả cho thấy chiều
  hướng, không phải tỷ lệ thống kê.
- API vẫn không trả token usage nên chưa đo được chi phí thực. Context dài
  hơn vì thêm Author/Channel + URL mỗi nguồn.
- Chưa chạy lại đủ 9 câu baseline; đã chạy 6, bỏ `followup_vi` và
  `switch_vi` vì cả hai phụ thuộc retrieval/pageContext (Patch C/D).
