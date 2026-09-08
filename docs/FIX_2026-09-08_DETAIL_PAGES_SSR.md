# Sửa HTTP 500 ở blog/project detail — local verified

> Snapshot bên dưới ghi nhận trước deploy. Cập nhật Prod sau GO của Hưng: xem [release report](PROD_SSR_2026-09-08.md).

Ngày 2026-09-08. Base `main@c36f42e`. Chưa commit/push/deploy. Không đổi DNS, credentials hoặc dữ liệu production.

## Nguyên nhân và bản vá

Hai trang client import `isomorphic-dompurify` ở module scope. Khi server nạp module, thư viện này khởi tạo jsdom ngay, kéo theo `jsdom@27.0.1 → parse5@8.0.0`. Runtime không hỗ trợ `require(ESM)` phát sinh `ERR_REQUIRE_ESM`, trước cả bước render loading shell.

Local Node 22.16.0 bình thường import được module nên build pass chưa chứng minh hết lỗi. Với `--no-experimental-require-module`, production build local tái hiện HTTP 500 giống lỗi đã thấy trong Vercel logs. Flag này dùng để tái hiện điều kiện lỗi; không khẳng định đã đọc được flag Node của deployment live.

`app/blog/[slug]/page.tsx` và `app/projects/[slug]/page.tsx` chỉ render nội dung sau khi `useEffect` tải dữ liệu. Chuyển import sang `dompurify` trực tiếp, giữ nguyên `DOMPurify.sanitize(...)` trước `dangerouslySetInnerHTML`. Không cần DOM giả lập trên server cho hai consumer này.

`package.json` khai báo trực tiếp `dompurify@^3.4.12`, bỏ wrapper không còn consumer. Lockfile giữ nguyên DOMPurify 3.4.12 và mọi version còn lại; loại 36 packages thuộc dependency tree không còn cần thiết. Tham khảo API tại [DOMPurify README](https://github.com/cure53/DOMPurify#readme).

## Bằng chứng trước/sau

| Check | Trước | Sau |
|---|---|---|
| Production build + runtime không có require(ESM), 6 URL chi tiết, mỗi URL GET hai lần | 12/12 HTTP 500 | 12/12 HTTP 200 |
| Server log `ERR_REQUIRE_ESM` | Có, jsdom/parse5 | Không xuất hiện trong lượt kiểm tra |
| Chrome, 3 projects + 3 blog, EN và VI | Không dùng làm tiêu chí duy nhất vì JS có thể cứu render sau HTTP 500 | 12/12 lượt có đúng nội dung và tiêu đề ngôn ngữ |
| HTML độc hại trong fixture local | Không thay dữ liệu production để thử | 12/12 lượt: script bị bỏ, onerror/onload bị bỏ, javascript: href bị bỏ, không có execution marker |
| Nội dung hợp lệ trong cùng fixture | — | Giữ strong và HTTPS link |

`npm test`: **34/34 PASS**. `npx tsc --noEmit --incremental false`: PASS. `npm run build` với KV fixture: PASS. `npm run test:ssr`: PASS. `git diff --check`: PASS.

Test HTTP yêu cầu catalog có published content, không cho empty catalog trở thành false PASS. Test chỉ cho phép URL localhost và đọc nội dung; không dùng nó để gọi production.

## Tái chạy không cần production credentials

KV env local có sẵn báo `WRONGPASS`. Không sửa file env. Helper mới đọc hai API public của hungreo.com thành snapshot trong RAM, giả lập các lệnh KV GET/MGET/KEYS trên localhost và từ chối writes. Nó không nạp credentials.

Terminal 1:

```bash
npx tsx scripts/serve-ssr-fixtures.ts
```

Terminal 2:

```bash
KV_REST_API_URL=http://127.0.0.1:3102 KV_REST_API_TOKEN=local-fixture npm run build
KV_REST_API_URL=http://127.0.0.1:3102 KV_REST_API_TOKEN=local-fixture node --no-experimental-require-module node_modules/next/dist/bin/next start --hostname 127.0.0.1 --port 3100
```

Terminal 3:

```bash
npm run test:ssr
npm test
npx tsc --noEmit --incremental false
```

Để thử sanitizer trên browser, khởi động helper với `--xss` thay vì lệnh Terminal 1. Chỉ fixture RAM có thêm payload; mở các trang detail trên `http://127.0.0.1:3100`, kiểm tra cả EN/VI. Trong DOM, `[data-ssr-sanitizer="safe"]` phải có strong/HTTPS link nhưng không có script, thuộc tính `on*` hoặc `javascript:`; `<html>` không có `data-ssr-xss="executed"`. Browser checks lượt này đã thực hiện đủ 6 URL × 2 ngôn ngữ; helper không tự động hóa browser.

Helper cần API public khả dụng để lấy snapshot; build/SSR sau đó dùng fixture local. Dừng hai server bằng Ctrl-C khi xong. Việc thêm helper TypeScript được typecheck và chạy smoke lại; application build không đổi sau đó.

## Review và giới hạn

- Root cause đã được tái hiện bằng request thật tới production build local, không chỉ bằng import hoặc grep.
- Hai chỗ gọi sanitize và thứ tự parse Markdown → sanitize → render không thay đổi. Browser fixture chứng minh sanitizer còn chạy với nội dung không tin cậy.
- Không thay parser, auth, chatbot, nội dung CMS, layout hoặc domain rules. Chưa thực hiện phần “Đang xây / Đang học” và các ưu tiên tiếp theo.
- Nội dung chi tiết vẫn được tải ở client như kiến trúc hiện có; patch sửa HTTP 500 khi server nạp trang, không chuyển toàn bộ bài viết sang server rendering.
- Chưa có deployment mới hoặc PROD smoke sau bản vá; local PASS không phải PROD PASS.
- GO deploy tiếp theo nên chỉ gồm patch SSR + lockfile. Sau deploy cần GET/reload 6 URL trên hungreo.com và kiểm tra runtime logs; không gộp chatbot/domain vào lần này.

Giữ nguyên ba artifact audit/handover có sẵn trong worktree. Bằng chứng tạm trước/sau ở `/tmp/hungreo-ssr-*-build.log` và `/tmp/hungreo-ssr-*-server.log`.
