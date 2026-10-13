# Follow-up theo chủ đề — local verified

> Cập nhật sau GO deploy: commit `a446fba` đã lên Prod và technical smoke PASS. Xem [release report](PROD_FOLLOWUP_SCOPE_2026-09-09.md). Các dòng “chưa deploy” phía dưới mô tả giai đoạn local trước GO, không phải trạng thái live hiện tại.

Base `main@e14382d`; bản sửa chưa commit/push/deploy. Prod gần nhất được xác minh vẫn là `dpl_7SSSKis3voJXiMNUvDfui9Gk5PYq`, code `ef5f8be`. Không thay CMS, DNS, credentials, model hoặc dữ liệu index.

## Root cause → thay đổi

`extractVideoIdsFromHistory()` trước đây quét mọi lượt assistant trong history, rồi `resolveVideoRetrievalScopes()` luôn thêm các ID đó vào scope. Sau hai video, một câu hỏi mới về CV vẫn dành 6/8 chunk cho video cũ trong reproduction local, làm hụt tài liệu mới và tăng scoped queries không cần thiết.

`lib/chatRetrieval.ts` giờ:

- Chỉ lấy link từ lượt assistant gần nhất. Lượt mới không có link không kéo lại nguồn của chủ đề cũ hơn.
- Chỉ dùng history hint khi câu có tín hiệu tham chiếu nguồn/lượt trước EN/VI. “Bỏ qua”, “đổi chủ đề”, “new topic”… loại bỏ history hint. Câu gọi tên nguồn mới không kế thừa history trừ khi đồng thời nói rõ về nguồn trước.
- Kiểm hostname YouTube và video ID đầy đủ bằng URL parser; không coi chuỗi `youtube.com` nằm trong URL khác là nguồn hợp lệ. Hỗ trợ query parameter đứng trước `v`.
- Sửa comment sai về độ tin cậy: `assistant` history cũng do client cung cấp; sanitizer không chứng minh nguồn gốc server. Hints chỉ phục vụ retrieval, không trao quyền truy cập.

Giữ discovery20, trần3 scoped queries/trần8 chunks, merge đa nguồn, full-content adapter và page-context policy hiện có. Không thêm LLM call, dependency, vector migration hoặc server session store.

## RED → GREEN và checks

Thêm 9 ca vào `__tests__/chatMultiSource.test.ts`. Trước fix thấy 6 ca fail ở lượt đầu; sau đó bắt thêm lỗi một comparison mới còn kéo video thứ ba từ history, sửa tiếp và giữ test. Hai ca còn lại kiểm bảo toàn follow-up EN và so sánh nguồn mới với nguồn trước.

| Ca | Kết quả local cuối |
|---|---|
| Video → hỏi CV, global có 5 chunk CV | Giữ đúng 5 chunk CV, 0 scoped calls từ history |
| Câu độc lập EN / explicit topic change | Không ép history vào scope |
| Follow-up “hai nguồn vừa so sánh…” / “those two sources” | Giữ cả hai nguồn vừa dẫn |
| Gọi tên video mới / comparison mới | Không thêm video lịch sử không được hỏi |
| So sánh video mới với “video vừa rồi” | Giữ source mới và source được tham chiếu |
| Lượt assistant mới không có link | Không hồi sinh nguồn cũ hơn |
| Host giả hoặc ID dài quá 11 ký tự | Không dùng làm hint |

Commands:

```bash
npx tsx __tests__/chatMultiSource.test.ts
npm test
npx tsc --noEmit --incremental false
# Terminal riêng, snapshot API public vào RAM:
npx tsx scripts/serve-ssr-fixtures.ts
KV_REST_API_URL=http://127.0.0.1:3102 KV_REST_API_TOKEN=local-fixture npm run build
git diff --check
```

**72/72 tests PASS**, typecheck/build PASS. Build warning browserslist/baseline dataset cũ, không đổi package để dập warning. Fixture server đã dừng. Logs local: `/tmp/hungreo-topic-final-tests.log`, `/tmp/hungreo-topic-final-build.log`. Không gọi chat route Prod hoặc gửi email thử trong lượt này.

## Giới hạn / review

Đây là heuristic bảo thủ, không phải bộ hiểu ý định hoàn chỉnh. Câu follow-up không có tín hiệu được nhận biết sẽ dùng discovery thông thường; không khẳng định mọi câu nói tắt EN/VI đều được resolve. Nếu câu trả lời mới không dẫn link, follow-up sau đó không có history video hint; đây là ranh giới chủ đề có chủ ý, không tạo persisted source state mới. Page context vẫn có thể bổ sung video đang xem theo policy cũ, ngoài phạm vi lỗi history lần này.

Test chứng minh selection/fallback và routing helper. Chưa chạy câu trả lời model trên deployment mới; không gắn local PASS thành Prod UAT PASS. Lịch sử vẫn được truyền vào completion như trước, nên việc bỏ history khỏi retrieval không tự bảo đảm model không nhắc nội dung cũ.

## Hai đầu việc đi kèm

- [Nội dung Home + case study EN/VI](CONTENT_DRAFT_2026-09-09.md): copy đầy đủ, chờ Hưng duyệt ngôi kể và ưu tiên tháng này. Chưa thay CMS/Home code. Metrics của Telegram Personal Assistant được chuyển sang định tính trong bản nháp, không sửa nhầm OpenClaw.
- [Dependency triage + kế hoạch](DEPENDENCY_PLAN_2026-09-09.md): hoàn thành rà đường sử dụng Next/Nodemailer, đối chiếu bảo vệ Vercel và chọn candidate/acceptance. Chưa nâng package. Các transitive/direct dependency khác còn bước triage theo kế hoạch, không báo “audit zero”.
- `docs/HANDOVER.md` sửa hướng dẫn transcript/env lỗi thời, giới hạn top20, trạng thái bot chưa xác minh và bỏ tuyên bố “xong cả 3 ưu tiên”.

## GO tiếp theo, tách phạm vi

1. GO deploy **chỉ follow-up scope fix** sau khi review diff. Smoke thực qua chat route: hai video → follow-up → chuyển CV → hỏi video mới. Giữ current deployment làm rollback anchor; owner UAT chờ Hưng.
2. GO nội dung để đưa đúng copy đã duyệt vào Home và CMS; cần preview EN/VI trước publish.
3. Upgrade dependency theo plan là task triển khai riêng; không tự bao gồm trong GO chatbot, không gửi email thật khi chưa chỉ định người nhận.
