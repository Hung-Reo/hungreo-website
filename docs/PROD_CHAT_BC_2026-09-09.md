# Prod release — chatbot B-read + C · 2026-09-09

Trạng thái: **đã deploy, smoke PASS trên production**. GO: "kiểm lại nếu ok
thì proceed tiếp tục cho Production".

## Bản phát hành

- Commit `1f65e9e` (code) + `9a3525e` (docs), đã push lên `main`.
- Deployment `dpl_E1tszcHyk7ht12iD3hf2pzwjDm2W` —
  `hungreo-website-697w2wr2s-hungreos-projects.vercel.app`.
- Deployment trước (mốc rollback): `dpl_FTDDTD2bkNpnVzzJjgFznqhzLTAB` (Patch A).

## Thay đổi

**Patch C** — route trước đây thay **toàn bộ** global context bằng 5 chunk
của một video, nên câu hỏi 2-3 nguồn chỉ còn 1 video. `lib/chatRetrieval.ts`
giờ lấy tối đa 3 scope trong discovery top20, query song song từng video,
merge round-robin với global top5, loại trùng theo vector ID, trần 8 chunk.
Câu một video vẫn giữ đủ 5 chunk rồi mới thêm global. Scope lỗi/rỗng giữ
phần còn lại; tất cả lỗi thì về đúng global cũ.

**Patch B (chỉ phần đọc)** — video và document ưu tiên `content` đầy đủ,
fallback `description`/`text`; document thiếu `title` thì dùng `fileName`.
Phát hiện khi replay: Vibe Coding có transcript nhưng chatbot chỉ đọc
`description` là đoạn quảng bá lặp lại. Cả hai schema của approve route đều
đọc được nên **không cần backfill dữ liệu**.

Không đụng prompt, history, rate limit, logging, ingestion, DNS.

## Before / After trên production (chạy thật qua hungreo.com)

| Câu hỏi | Trước deploy | Sau deploy |
|---|---|---|
| So sánh 2 video (Self-study + Rainer Stropek) | **1 video**, báo thiếu nguồn | **2 video**, không còn báo thiếu |
| Tổng hợp 3 video (+ Vibe Coding) | **0 video**, báo thiếu nguồn | **3 video** |
| Tài liệu không tồn tại (Zeta-742) | báo thiếu | **vẫn báo thiếu** — không regression |

## Regression sweep sau deploy

| Check | Kết quả |
|---|---|
| Sitemap | 31 URL, 31/31 trả 200 |
| 6 trang detail blog/project | 200 |
| Canonical `/` | `https://hungreo.com` |
| `/admin/dashboard` anonymous | chuyển tới `/admin/login` |
| DNS `n8n` / `bot` / nameserver | không đổi |

Local trước deploy: `npm test` **58/58** PASS, `npx tsc --noEmit` PASS,
`npm run build` (fixture KV, sau `rm -rf .next`) PASS.

## Chi phí

Không thêm LLM call: vẫn 1 embedding + 1 completion mỗi lượt. Pinecone tối
đa 1 discovery + 3 scoped query chạy song song (trước: 1+1).

Prompt tokens control → sau: 4008→4978, 4432→5919, 2249→6341, 2324→2952,
4494→5473. Tăng 22-182% tùy ca, cao nhất **6.8k total tokens/lượt**. Chưa
quy đổi USD, chưa đối chiếu bill thực.

## Giới hạn còn lại

- **Follow-up** vẫn không tìm lại được nguồn từ history (retrieval chỉ embed
  tin nhắn mới).
- **Nguồn ngoài discovery top20** không tự được tìm; title matching vẫn
  lexical, chưa có source catalog lookup.
- **Page-context priority** (Patch D) chưa làm — dù retrieval giờ đã kèm được
  video được gọi tên khi đang xem video khác.
- Replay chạy một lần mỗi ca ở `temperature: 0.7` → cho thấy chiều hướng,
  không phải tỷ lệ thống kê.
- Câu trả lời còn lỗi trình bày nhẹ: đôi khi dùng nhãn "Watch here" hoặc URL
  thay tên nguồn dù prompt yêu cầu tên video.
- Câu trả lời chứa "tôi không có thông tin" vẫn kích hoạt `shouldNotifyHuman`
  → mỗi lần test câu nguồn-không-tồn-tại có thể sinh một email fallback.
