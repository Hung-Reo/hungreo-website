# Prod release — follow-up, Patch D, hợp nhất hostname · 2026-09-09

Trạng thái: **đã deploy, smoke PASS trên production**. GO: "4 việc chưa làm
bạn proceed cho tới complete tất cả".

## Bản phát hành

- Commits `3f9c280` (chatbot), `7db2ecb` (redirect), `ef5f8be` (sửa đường lui).
- Deployment cuối `dpl_7SSSKis3voJXiMNUvDfui9Gk5PYq` —
  `hungreo-website-d5a3gjxuq-hungreos-projects.vercel.app`.
- Mốc rollback: `dpl_E1tszcHyk7ht12iD3hf2pzwjDm2W` (B-read + C).

## 1. Follow-up + Patch D

**Follow-up** — retrieval chỉ embed tin nhắn mới, nên câu "hai nguồn vừa so
sánh khác nhau ở đâu" không tìm lại được nguồn nào. `extractVideoIdsFromHistory()`
đọc link YouTube trong các lượt **assistant** đã sanitize và dùng làm scope bổ
sung. Chỉ đọc lượt assistant: link đó do server tự dựng từ context nó chọn nên
không thể bị lợi dụng để trỏ retrieval vào videoId tuỳ ý. ID vẫn qua
`getValidVideoId`.

**Patch D** — trang đang xem trước đây luôn là scope đầu. Giờ câu hỏi gọi tên
video khác thì scope theo tên đứng trước, video đang xem giữ một suất phía sau;
câu hỏi không gọi tên ai thì video đang xem vẫn là scope chính như cũ.

| Ca (chạy thật trên hungreo.com) | Trước | Sau |
|---|---|---|
| Follow-up "hai nguồn vừa so sánh…" | 0 video, báo thiếu nguồn | **2 video**, không báo thiếu |
| Đang xem Self-study, hỏi video Rainer | chỉ video đang xem | **dẫn đúng video Rainer** |

## 2. Hợp nhất hostname

| Host | Trước | Sau |
|---|---|---|
| `hungreo.com` | 200 | 200 |
| `www.hungreo.com` | 200 | **308** → apex, giữ path+query |
| `hungreo-website.vercel.app` | 200 | **308** → apex |
| `hungreo.vercel.app` | 200 | 200 + **`X-Robots-Tag: noindex, nofollow`** |
| `www.hungreo.com/api/*` | 200 | 200 (cố ý không redirect) |

Ba lựa chọn có chủ ý:

- **308 chứ không 301** — giữ method và body, POST bị redirect vẫn nguyên vẹn.
- **`/api` không redirect** — integration nào đang trỏ hostname khác vẫn chạy;
  search engine không index API nên không ảnh hưởng mục tiêu.
- **`hungreo.vercel.app` noindex thay vì redirect** — xem mục sau.

Làm trong `middleware.ts`, vốn đã chạy trên mọi route để gắn security header,
nên **không thêm invocation**. Không đổi DNS, nameserver hay alias Vercel.

### Lỗi đã mắc và đã sửa

Commit `7db2ecb` redirect luôn `hungreo.vercel.app` và ghi trong HANDOVER rằng
URL deployment thay vai trò đường lui. **Sai.** Kiểm trên production cho thấy URL
deployment trả **302 sang Vercel SSO** vì deployment protection đang bật — khách
ẩn danh không vào được. Nếu apex có sự cố DNS thì sẽ không còn đường nào dùng.

`ef5f8be` trả `hungreo.vercel.app` về 200 và chỉ gắn `noindex`. Google không xếp
nó cạnh apex nữa, còn vai trò đường lui vẫn nguyên vì noindex không ảnh hưởng
người dùng thật. Chỉ phát hiện vì kiểm URL deployment bằng request thật thay vì
tin rằng nó "chắc là mở".

## 3. IP VPS — kết luận khác với đánh giá trước

Trước đây mình báo IP VPS trong git history là bề mặt tấn công cần xử lý. **Đánh
giá đó sai trọng số.** `n8n.hungreo.com` và `bot.hungreo.com` là record A công
khai, nên `dig +short A n8n.hungreo.com` trả IP cho bất kỳ ai. IP **không phải bí
mật** và không thể là bí mật khi subdomain còn phải phân giải.

Hệ quả: rewrite git history không mua được gì — tốn một lần force-push lên repo
public, GitHub vẫn giữ commit mồ côi truy cập được bằng SHA, mà IP vẫn nằm trong
DNS. **Không rewrite.** Việc gỡ IP khỏi docs (`458d29a`) vẫn giữ vì nó là vệ sinh
tốt, không phải vì nó bịt được gì.

Phòng thủ thật nằm ở cấu hình VPS. Claude Code không SSH được vào VPS trong phiên
này (bị permission classifier chặn), nên phần này Hưng tự chạy — lệnh ở
`docs/VPS_SSH_HARDENING.md`.

## Regression sweep sau deploy

| Check | Kết quả |
|---|---|
| Sitemap | 31 URL, 31/31 trả 200 |
| `/admin/dashboard` anonymous | chuyển tới `/admin/login` |
| Chatbot 2 nguồn | 2 video, attribution đúng |
| DNS `n8n` / `bot` / nameserver | không đổi |

Local trước deploy: `npm test` **63/63** PASS, `npx tsc --noEmit` PASS,
`npm run build` (fixture KV, sau `rm -rf .next`) PASS.

## Giới hạn còn lại

- **Nguồn ngoài discovery top20** vẫn không tự tìm được; title matching vẫn
  lexical, chưa có source catalog lookup.
- Follow-up chỉ nhận lại nguồn mà assistant **đã dẫn link**. Nếu lượt trước
  không có link (ví dụ chỉ nói về tài liệu), follow-up vẫn không tìm lại được.
- 308 bị browser cache lì. Nếu cần đổi ý về `www`, sửa `REDIRECT_HOSTS` rồi
  deploy, nhưng người đã truy cập phải xoá cache mới thấy.
- Chưa kiểm Search Console nên chưa kết luận duplicate indexing đã hết.
