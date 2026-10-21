# Issue Log — hungreo.com

Mỗi lỗi đã gặp trên Prod (hoặc suýt lên Prod) một mục. Mục đích: lần sau gặp triệu chứng giống thì tra ở đây trước, và mỗi lỗi phải có test chặn tái diễn.

**Cách ghi:** thêm 1 dòng vào bảng + 1 mục chi tiết bên dưới. ID tăng dần `ISS-NNN`. Ngày theo giờ VN. Nhãn bằng chứng: VERIFIED / PRIOR-EVIDENCE / ASSUMPTION / UNVERIFIED. Repo public — không ghi secret, IP, dữ liệu cá nhân.

| ID | Ngày phát hiện | Triệu chứng | Root cause (1 dòng) | Sửa (commit → deploy) | Trạng thái |
|---|---|---|---|---|---|
| [ISS-001](#iss-001) | 2026-10-20 | Upload ảnh Featured Image trong admin blog luôn báo "Upload failed" | Ảnh nén gửi lên với tên `"blob"` → server từ chối đuôi `.blob` (400), client nuốt lỗi | `6541723` → `main@ffcbaf9` → `dpl_8KU2aFuWX7NHaphCA3EMsWrfGx7r` | Đóng — owner UAT PASS 21/10 |

---

## ISS-001

**Upload ảnh Featured Image (admin blog) luôn thất bại với "Upload failed"**

| | |
|---|---|
| Phát hiện | 2026-10-20, Hưng báo khi sửa blog |
| Tồn tại | 2026-04-25 (`39b68e8`) → 2026-10-21 (~6 tháng) |
| Phạm vi | `components/admin/ImageUploader.tsx` — dùng ở trang sửa blog và trang sửa project. Ô Screenshot của Projects upload riêng (không nén) nên không dính |
| Mức độ | Trung bình: không upload được ảnh bìa mới; không mất dữ liệu, không ảnh hưởng trang public |

**Triệu chứng.** Chọn ảnh JPG/PNG hợp lệ → toast "Upload failed", không có ảnh. Không có thông tin gì thêm trên màn hình.

**Root cause (VERIFIED — tái hiện trong bản copy local, code server giống Prod).**
1. `browser-image-compression` 2.0.2 trả về `Blob`, chỉ gắn thêm thuộc tính `blob.name` — không phải `File`.
2. `FormData.append('image', blob)` không truyền tên file → theo chuẩn, trình duyệt gửi tên `"blob"`.
3. `validateUpload()` (thêm ở `39b68e8`, security review 25/04/2026) lấy đuôi từ tên file → `.blob` không nằm trong whitelist → 400 "File type not allowed".
4. `ImageUploader` bỏ qua nội dung lỗi của server, chỉ hiện "Upload failed" → không ai biết lý do.

Bằng chứng mốc thời gian: ảnh Featured của bài "Awakening Inner Peace" upload 24/04/2026 có URL `images/1777040361555-blob` — trước `39b68e8` server vẫn nhận tên "blob". Nén ảnh có từ `9178133` (17/11/2025) nhưng chưa gây lỗi cho tới khi thêm kiểm tra đuôi. Ảnh cũ tên `-blob` vẫn hiển thị bình thường (200, `image/png`).

**Sửa (`6541723`).**
- `lib/uploadClient.ts` → `asUploadFile()`: bọc ảnh nén thành `File` giữ tên gốc.
- Client kiểm tra trước bằng chính `validateUpload()` của server (một nguồn luật duy nhất).
- HEIC/HEIF (ảnh iPhone) báo rõ "Export as JPEG or PNG first"; `accept` chỉ 5 định dạng server nhận.
- `getUploadErrorMessage()`: toast hiện lỗi server + mã HTTP; lỗi một file không chặn các file sau.

**Deploy.** `main@ffcbaf9` → `dpl_8KU2aFuWX7NHaphCA3EMsWrfGx7r` (21/10). Rollback anchor `dpl_725vkXucJ1fR2dNH62oqF4M46t2F`. Owner UAT PASS 21/10.

**Test chặn tái diễn.** `__tests__/imageUpload.test.ts` (chạy trong `npm test` + CI `Security`):
- `root cause: a Blob with a .name property is sent as "blob" in FormData` — giữ cơ chế gốc làm tài liệu sống.
- `asUploadFile keeps the original name and the compressed type` — file gửi đi phải qua `validateUpload`.
- `validator: rejects iPhone HEIC/HEIF with an actionable message`.
- `error message: …` (2 ca) — lỗi server không bị nuốt.
- `ImageUploader validates before upload and shows the server error` — kiểm nguồn: có `asUploadFile(`, không còn toast chung "Upload failed".

**Bài học.**
1. **Thêm kiểm tra phía server thì phải chạy lại đường đi thật của client.** `39b68e8` thêm whitelist đuôi file là đúng về bảo mật, nhưng không ai upload thử qua UI có nén ảnh → hỏng 6 tháng.
2. **Không nuốt lỗi.** Server đã trả lý do rõ ràng; client đổi thành "Upload failed" làm mất 6 tháng. Toast lỗi phải mang thông điệp server + mã HTTP.
3. **Thư viện có thể trả `Blob` dù trông như `File`.** Trước khi `FormData.append`, đảm bảo là `File` có tên, hoặc truyền tên ở tham số thứ 3.
4. **Đọc dữ liệu thật để định mốc lỗi**, đừng đoán từ git log: URL ảnh `-blob` trên Prod cho thấy mốc đúng là `39b68e8`, không phải `9178133` như kết luận ban đầu.
