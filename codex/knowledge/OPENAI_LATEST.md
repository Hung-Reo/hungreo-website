# OpenAI Latest (tóm tắt nhanh)

Cập nhật gần nhất: 2026-02-02.

Mục tiêu: ghi lại các điểm cần nhớ khi làm việc với Codex/OpenAI cho repo này. Hãy kiểm tra lại nếu đã quá 60 ngày.

## Codex CLI
- Cài đặt: `npm i -g @openai/codex`.
- Codex hoạt động như một agent CLI có thể chạy tool, đọc/ghi file trong sandbox.
- Khi cần info mới nhất (model, pricing, policy), phải tra cứu nguồn chính thức OpenAI.

## Models (tổng quan thực dụng)
- Dòng model hiện đại thường gặp: GPT-4o, GPT-4o-mini, o-series.
- Một số bảng giá có mục `codex-mini-latest` và `gpt-5.1-codex-mini`.
- Hãy ưu tiên model được chỉ định trong repo hoặc env nếu có.

## Structured Outputs
- Có ràng buộc với parallel function calls.
- JSON schema có thể ảnh hưởng ZDR eligibility.
- Chỉ dùng khi thực sự cần output đúng schema.

## Tài liệu chính thức (nếu cần xác minh)
- OpenAI Codex: trang sản phẩm OpenAI.
- OpenAI API Models: docs models.
- OpenAI Pricing: bảng giá chính thức.

## Quy tắc an toàn khi cập nhật
- Nếu yêu cầu “latest” hoặc “today”, luôn xác minh lại từ OpenAI.
- Không dựa vào trí nhớ khi thông tin có thể thay đổi theo thời gian.
