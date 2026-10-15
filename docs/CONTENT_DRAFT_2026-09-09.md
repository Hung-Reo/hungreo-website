# Nội dung đề xuất — chờ Hưng duyệt câu chữ mục 0, chưa publish

Đây là bản copy EN/VI có thể đưa vào website sau khi duyệt. Ngôi “mình/I” là giọng văn đề xuất cho Hưng, chưa được coi là tuyên bố cá nhân đã xác nhận. Không thay CMS hoặc code Home trong lượt này.

## 0. Bản theo input Hưng 15/10 — chờ duyệt câu chữ

Hưng đã chốt: (1) giọng "mình / I" OK; (2) chủ đề tháng 9–10 như dưới; (3) **bỏ** các tỷ lệ 70/80/95% trong case study, giữ mô tả định tính ở mục 2. Bản này **thay** phần copy mục 1 bên dưới; vị trí và cách đưa vào code giữ nguyên.

### VI — cập nhật tháng 10/2026

**Đang xây**

Tháng 9 và tháng 10, mình tập trung xây các AI Agent làm việc thật: trang bị cho chúng công cụ (tools) và kỹ năng (skills) phù hợp, đồng thời đặt chúng trong môi trường an toàn (sandbox) để mỗi hành động của AI trong công việc kinh doanh đều nằm trong tầm kiểm soát.

Tháng 10 này, trọng tâm là Personal AI: mình rà soát lại chỉ dẫn (instructions) cho các agent để chúng hiểu mình hơn — cách mình làm việc, điều mình ưu tiên và những nguyên tắc mình giữ.

Link: **Xem dự án OpenClaw** → `/projects/openclaw-personal-ai-operations-platform`

**Đang học**

Mình đang học sâu hơn về bảo mật cho AI: làm sao để agent được giao đúng quyền cần thiết và chạy trong sandbox khi thực hiện hành động thật cho doanh nghiệp. Song song, mình dành thời gian tìm hiểu sâu hơn về giáo dục — việc học và dạy sẽ thay đổi thế nào khi AI trở thành người đồng hành hằng ngày.

Link: **Khám phá thư viện kiến thức** → `/tools/knowledge`

### EN — updated October 2026

**Building now**

Through September and October, I've been building AI agents that do real work: giving them the right tools and skills, and running them inside a sandbox so every action an AI takes in a business setting stays under control.

This month the focus is Personal AI: I'm reviewing the instructions my agents follow so they understand me better — how I work, what I prioritise and the principles I hold to.

Link: **Explore the OpenClaw project** → `/projects/openclaw-personal-ai-operations-platform`

**Learning now**

I'm going deeper into AI security: how to give an agent only the permissions it needs and keep it sandboxed when it acts for a real business. Alongside that, I'm learning more about education — how learning and teaching change when AI becomes an everyday companion.

Link: **Explore the knowledge library** → `/tools/knowledge`

---

## 1. Home: Đang xây / Đang học

Vị trí đề xuất: sau các nút Projects/About, trước Core Values. Hai khối dùng card hiện có, không thêm animation, thư viện hoặc API. Khi đưa vào code, dùng `t('home.now.*')` trong `LanguageContext` như convention hiện tại.

### VI — cập nhật tháng 09/2026

**Đang xây**

Mình đang phát triển hungreo.com thành nơi ghi lại hành trình từ Business Analyst đến AI Product Builder: những sản phẩm đang thử, quyết định đã đưa ra và bài học rút ra khi đưa AI vào sử dụng thực tế.

Gần đây, mình tập trung cải thiện chatbot của website để kết nối nhiều video và tài liệu, giữ đúng tác giả và dẫn nguồn mà người đọc có thể kiểm tra.

Link: **Xem hành trình xây website** → `/projects/hungreo-personal-portfolio-website`

**Đang học**

Điều mình đang thực hành là biến một câu hỏi rộng thành bước thử nhỏ: xác định vấn đề, đo trước khi sửa, rồi kiểm tra kết quả bằng tình huống thật. Với AI, một câu trả lời thuyết phục vẫn cần được đối chiếu với nguồn.

Mình dùng thư viện kiến thức này để lưu những nội dung muốn học tiếp. Ý kiến của tác giả nguồn và bài học mình rút ra sẽ được trình bày riêng.

Link: **Khám phá thư viện kiến thức** → `/tools/knowledge`

### EN — updated September 2026

**Building now**

I’m developing hungreo.com as a record of my journey from Business Analyst to AI Product Builder: the products I’m exploring, the decisions behind them, and what I learn from putting AI into practice.

Recently, I’ve focused on helping the website’s chatbot connect ideas across videos and documents while preserving authorship and providing sources readers can check.

Link: **Explore the website project** → `/projects/hungreo-personal-portfolio-website`

**Learning now**

I’m practising how to turn a broad question into a small experiment: define the problem, measure before changing anything, and check the result against real situations. With AI, even a convincing answer needs to be checked against its sources.

This knowledge library holds material I want to keep learning from. The original author’s ideas and my own reflections will be presented separately.

Link: **Explore the knowledge library** → `/tools/knowledge`

## 2. Case study: Telegram Personal Assistant

Thay phần mô tả ngắn và body EN/VI của project `ai-powered-personal-assistant-telegram-bot`. Không sửa nhầm project OpenClaw. Bản nháp dưới đây dùng thông tin đang được công bố; mô tả như một giai đoạn thử nghiệm lịch sử, không xác nhận bot hay hạ tầng đó vẫn chạy hôm nay.

### VI — mô tả ngắn

Một thử nghiệm trợ lý Telegram dùng n8n và AI để chọn lọc nội dung từ nhiều nguồn. Bài học chính: chọn đúng dữ liệu đưa vào model quan trọng không kém việc chọn model.

### VI — nội dung

**Vấn đề mình muốn giải quyết**

Theo dõi nhiều kênh và nguồn tin khiến việc tìm nội dung đáng đọc trở thành một công việc riêng. Mình thử đưa bước tổng hợp và chọn lọc vào một trợ lý Telegram, để nhận bản tóm tắt tiếng Việt thay vì mở từng nguồn thủ công.

**Quyết định thiết kế**

Ở giai đoạn đầu, mình chọn một AI Agent với các công cụ chuyên biệt trên n8n. Cách này giúp thử luồng từ tìm kiếm, chọn nội dung đến gửi Telegram trong một phạm vi nhỏ trước khi mở rộng.

**Điều đã không hoạt động tốt**

Một điểm nghẽn xuất hiện khi toàn bộ phản hồi API được chuyển thẳng vào model. Những field không cần thiết làm đầu vào dài hơn, kéo theo thời gian xử lý và chi phí. Thêm dữ liệu chưa chắc giúp câu trả lời tốt hơn.

**Thay đổi và kết quả**

Mình chuyển sang chọn các field cần dùng — ID, tiêu đề, URL, ngày, lượt xem và tên kênh — đồng thời giới hạn số kết quả. Ghi chép của dự án mô tả thời gian xử lý giảm sau thay đổi này. Hiện mình chưa công bố các tỷ lệ cải thiện như số đo đã kiểm chứng, vì cần bổ sung kỳ đo, số mẫu và điều kiện chạy.

**Bài học mình giữ lại**

- Bắt đầu bằng một luồng nhỏ có thể kiểm tra từ đầu đến cuối.
- Giảm dữ liệu thừa nhưng giữ thông tin giúp truy về nguồn.
- Phân biệt một lần thử chạy nhanh với hiệu quả ổn định qua nhiều ngày.
- Khi công bố kết quả, ghi rõ cách đo để người khác hiểu con số đại diện cho điều gì.

**Trạng thái bài viết**

Đây là case study của một giai đoạn xây dựng trước đây. Stack, chi phí và trạng thái vận hành hiện tại cần được xác nhận riêng; bài viết không phải dashboard trạng thái live.

### EN — short description

An experiment with n8n and AI to curate content from multiple sources into a Telegram assistant. The main lesson: choosing what reaches the model matters as much as choosing the model itself.

### EN — body

**The problem I wanted to solve**

Following multiple channels and news sources made finding worthwhile material a task of its own. I explored a Telegram assistant that could gather and curate content into Vietnamese summaries, reducing the need to open every source manually.

**The design decision**

For the initial version, I chose one AI Agent with specialised tools on n8n. This kept the search, selection and Telegram delivery flow small enough to test before expanding it.

**What did not work well**

A bottleneck appeared when full API responses were passed directly to the model. Unnecessary fields enlarged the input, increasing processing time and cost. More data did not automatically mean a better answer.

**The change and its outcome**

I selected the fields the agent needed — ID, title, URL, date, view count and channel name — and limited the number of results. The project notes describe shorter processing times after this change. I am not presenting the improvement percentages as verified measurements until the measurement period, sample size and test conditions are documented.

**What I took away**

- Start with a small flow that can be tested from beginning to end.
- Remove unnecessary data while preserving source information.
- Distinguish one fast test from reliable performance over time.
- Explain how results were measured so readers know what the numbers represent.

**Status of this account**

This case study describes an earlier stage of the project. Its current stack, cost and operating status need separate confirmation; this page is not a live status dashboard.

## 3. Xử lý số liệu trước khi publish

Mặc định đề xuất: dùng bản định tính ở trên cho đến khi Hưng có ghi chép đo. Không tự đổi con số chưa kiểm chứng thành “ước tính cá nhân” nếu Hưng chưa xác nhận nguồn ước tính.

| Claim đang public | Thiếu gì để giữ claim | Cách xử lý trong bản nháp |
|---|---|---|
| Giảm 70% thời gian đọc; từ 30+ xuống 10 phút | Khoảng ngày, số ngày đo, thời gian tính những thao tác nào | Bỏ tỷ lệ; nói mục đích giảm mở nguồn thủ công |
| Relevance trên 80%, trước 50% | Định nghĩa relevant, người chấm, số nội dung được chấm | Bỏ tỷ lệ, mô tả chọn lọc theo nhu cầu |
| Uptime >95%, error <5% | Cửa sổ đo, probe, mẫu số; lỗi retry tính thế nào | Không công bố như trạng thái live |
| 6+ phút xuống 15–20 giây; cải thiện 96% | Cùng payload/model/network, số lần chạy, median hoặc percentile | Giữ kết quả định tính theo ghi chép dự án |
| $20/tháng trong ngân sách $30 | Tháng hóa đơn, các dịch vụ được tính, tải sử dụng | Bỏ claim chi phí hiện tại |

**Duyệt để publish:** Hưng xác nhận giọng “mình/I”, chủ đề đang xây/học tháng này và mô tả quyết định của case study. Nếu giữ số liệu, bổ sung bằng chứng tương ứng trước. Sau GO nội dung, cập nhật EN/VI cùng lúc và preview Home/project trước GO publish.

Nguồn: nội dung public API `/api/content/projects` kiểm tra 09/09/2026; các release report chatbot/SSR trong repo. Các số kỹ thuật live của chatbot không được dùng thay bằng chứng đo hiệu quả Telegram bot.
