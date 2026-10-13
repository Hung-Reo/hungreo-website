# Dependency triage và kế hoạch nâng — 2026-09-09

**Đã rà và lập kế hoạch; chưa nâng package, chưa deploy hoặc gửi mail.** Không coi npm audit là bằng chứng từng advisory khai thác được trên production. Không dùng `npm audit fix --force`.

## Snapshot và phạm vi

`npm audit --omit=dev --json` trên lockfile `main@e14382d`: 18 package entries bị đánh dấu (1 critical, 15 high, 1 moderate, 1 low). Đây là số package trực tiếp/gián tiếp, không phải 18 lỗ hổng độc lập đã chứng minh. `next@14.2.35`, `nodemailer@7.0.13` là hai direct dependencies được kiểm đường sử dụng kỹ hơn. Các direct entries khác gồm `next-auth`, `puppeteer-core`, `dompurify`; không được bỏ qua chỉ vì báo cáo cũ nói bộ ESLint là dev-only.

Raw audit local: `/tmp/hungreo-final-review-audit.json`. Registry checked 09/09/2026: nhánh Next 15.5 có `15.5.25`; nhánh Nodemailer 9 có `9.1.1`. npm audit đề xuất major mới hơn (`next@16.3.4`, `nodemailer@10.0.1`) nhưng đó không phải lựa chọn bắt buộc. Refresh version/advisory khi bắt đầu triển khai.

## 1. Next.js: không phải sự cố RCE khẩn trên Vercel vì hai advisory tháng 8

[Thông báo chính thức Vercel ngày 25/08/2026](https://vercel.com/changelog/nextjs-august-2026-security-release) xác nhận ứng dụng hosted trên Vercel được bảo vệ khỏi hai critical này:

- AVIF/libheif: managed Image Optimization đã chặn đường xử lý bị ảnh hưởng.
- Windows RCE: Vercel runtime dùng Linux, không chịu điều kiện Windows của advisory.

Vì vậy, không dùng nhãn critical của npm để kết luận hungreo.com đang có đường RCE tương ứng. Điều này **không chứng minh** mọi advisory Next khác đều đã được khắc phục.

Code hiện tại: Next App Router, có Server Components, không custom Node server; `next.config.js` không có rewrites, Pages Router/i18n routing hay CSP nonce setup. Những advisory yêu cầu custom server/Pages i18n/rewrites không có cùng đường áp dụng đã thấy trong repo. Nhóm RSC/Server Action/HTTP-cache DoS vẫn cần đối chiếu bản vá và hành vi nền tảng; chưa chạy payload DoS trên Prod. Không tắt AVIF hay đổi middleware mù để xử lý cảnh báo đã được platform bảo vệ.

**Kế hoạch:** trong cửa sổ bảo trì kế tiếp, spike riêng với `next@15.5.25` và `eslint-config-next` tương ứng để chỉ vượt một major trước. Đây là ứng viên cần test, chưa phải release approved. Kiểm async `params`/`searchParams`, `cookies`/`headers`, caching/fetch và các peer dependency; không ép peer deps bằng `--legacy-peer-deps`. Nếu dependency tree hoặc support lifecycle buộc phải đi 16 thì lập diff/effort riêng trước.

Acceptance: tests/typecheck/build, 31 URL sitemap/canonical, sáu detail HTTP200, auth login/logout + anonymous rejection, streaming chatbot, hostname redirect/noindex. Chỉ smoke Prod sau GO deploy; không đưa các thay đổi mail/CMS chung release.

## 2. Nodemailer: thu hẹp bề mặt trước khi chọn upgrade

`lib/gmailSender.ts` dùng SMTP Gmail với app password. `sendMail` nhận các field cố định `from`, `to`, `subject`, `html`; không nhận object transport/message tuỳ ý từ user. Caller `app/api/admin/contact-requests/reply/route.ts` yêu cầu admin, rồi dùng email từ contact request đã lưu.

Không thấy app dùng `raw`, `jsonTransport`, OAuth2 token fetch, `envelope.size`, List-* headers hoặc gọi legacy `resolveContent`. Vì vậy nhiều advisory không khớp đường gọi hiện tại. Tuy nhiên địa chỉ người nhận vẫn là dữ liệu từ bên ngoài; lỗi address parser/CRLF cần kiểm tra, không được loại trừ cả package chỉ vì nút gửi mail nằm trong admin. Chưa kiểm toàn bộ code nội bộ/transitive của NextAuth.

**Kế hoạch:** candidate nhỏ hơn đề xuất audit là `nodemailer@9.1.1` (advisory đã thấy có range kết thúc ở 9.1.0 hoặc thấp hơn). Thử trên branch riêng, kiểm `@types/nodemailer` và peer `next-auth/@auth/core`; nếu không tương thích thì chọn version vá được peers hỗ trợ hoặc nâng auth riêng. Không khẳng định chỉ đổi version này sẽ cho audit zero.

Acceptance: dùng transport stub kiểm mail VI/EN, tên người nhận, Unicode, HTML escaping, rejected recipient/send failure; không đánh dấu request resolved nếu send thất bại. Test auth guards. Mail thật chỉ gửi tới địa chỉ Hưng chỉ định sau GO gửi mail riêng. Upgrade package không tự cho phép gửi email thử.

## 3. Phần còn lại và thứ tự thực hiện

| Thứ tự | Việc nhỏ | Kết quả phải có |
|---|---|---|
| Trước release dependency | Phân loại direct/transitive, đường gọi thật và version vá | Không lấy tổng audit làm danh sách bug runtime; rà thêm `dompurify`/`puppeteer-core`/NextAuth |
| Cửa sổ bảo trì kế tiếp | Thử Next 15.5.25 riêng | Diff nâng framework, checks và kế hoạch rollback; chưa gộp email |
| Release riêng sau đó | Thử Nodemailer 9.1.1 | Transport tests + compatibility; GO riêng cho mail thật |

Ước lượng effort: triage bổ sung vài giờ; spike framework 1–2 ngày làm việc tùy số route async; mail khoảng nửa ngày gồm test. Đây là ước lượng lập kế hoạch, không phải lịch tự động/commit ngày deploy. Không tạo automation.

Các mục code cũ `data.email` chưa escape trong Resend HTML, reset-password/analytics thiếu rate limit và SSE heartbeat vẫn là backlog riêng. Triage lần này xác nhận email HTML interpolation và thiếu rate-limit trong hai route vẫn có; chưa sửa hoặc test tấn công Prod. Không tranh thủ refactor 38 auth routes trong release dependency.

## Commands đã dùng

```bash
npm audit --omit=dev --json
npm view next@15.5 version --json
npm view nodemailer@9 version --json
npm view next@15.5.25 peerDependencies engines --json
npm view nodemailer@9.1.1 engines --json
```

Đường dẫn code kiểm tra: `next.config.js`, `middleware.ts`, `lib/auth.ts`, `lib/gmailSender.ts`, `lib/emailNotifier.ts`, `app/api/admin/contact-requests/reply/route.ts`, `app/api/admin/reset-password/route.ts`, `app/api/analytics/track/route.ts`.
