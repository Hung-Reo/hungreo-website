# Case study Telegram — nội dung để dán vào admin (15/10/2026)

Project: `ai-powered-personal-assistant-telegram-bot` (admin → Content → Projects). **Không** sửa project OpenClaw.

Theo quyết định của Hưng 15/10: bỏ mọi tỷ lệ % và số đo chưa có bằng chứng (70% thời gian, 80%/50% relevance, 96%, 6 phút → 15–20 giây, uptime 95%, lỗi <5%, $20/$30, tỷ lệ nội dung 70–80%). Giữ chi tiết kỹ thuật có thật (kiến trúc, cách lọc field). Kể theo mạch **quyết định → điều không ổn → thay đổi → bài học**.

Cách dán:
- Ô **Project Title**, **Short Description**, **Tech Stack**, **Key Learnings**: copy chữ thường bên dưới, dán thẳng.
- Ô **Detailed Content** (editor trực quan): mở file này trên GitHub (bản đã hiển thị), bôi đen từ dòng đầu đến dòng cuối của phần "Detailed Content", copy, dán vào editor. Tiêu đề, gạch đầu dòng, khối code sẽ giữ đúng định dạng.

---

## EN

### Project Title (EN) — giữ nguyên

AI-Powered Personal Assistant Telegram Bot

### Short Description (EN)

A Telegram assistant built with n8n and an AI agent that curates content from multiple sources into Vietnamese summaries. The key lesson: choosing what data reaches the model matters as much as choosing the model.

### Detailed Content (EN) — bắt đầu copy từ dòng dưới

## Overview

An earlier experiment: a Telegram assistant that gathers content from curated YouTube channels and news sources, filters it by relevance and sends Vietnamese summaries, so I no longer had to open every source by hand.

### The problem I wanted to solve

Following many channels and news sources had become a task of its own, and the quality was uneven. I wanted one place that brought me the material worth reading.

### The design decision

For the first version I chose **a single AI agent with specialised tools** on n8n, instead of several agents. It kept the whole flow — search, select, summarise, deliver to Telegram — small enough to test end to end and debug quickly.

```
Telegram Bot → AI Agent (GPT-4.1-mini) → Tools:
  ├─ Web search (Tavily + Perplexity)
  ├─ YouTube search (Apify)
  └─ Weather API
```

- Platform: n8n in Docker for development, Render for the hosted version, ngrok for local webhooks.
- Sources: curated YouTube channels (e.g. IBM Technology, NetworkChuck, OpenAI, Anthropic) and RSS feeds.
- Interface: Telegram Bot API, including follow-up questions with live research.

### What did not work

Full API responses were passed straight to the agent. Every video arrived with dozens of fields the agent never used, so the input grew large, responses became slow and costs went up. More data did not mean a better answer.

### The change

I filtered the data **before** it reached the agent, keeping only the fields needed to choose and cite a video, and capped the number of results:

```json
{
  "fields": ["id", "title", "url", "date", "viewCount", "channelName"],
  "maxResults": 10
}
```

According to the project notes, responses became much faster and token use dropped after this change. I am not publishing percentages, because the measurement period and test conditions were not recorded well enough to stand behind them.

### What I took away

- Start with one small flow you can test from beginning to end before adding agents.
- Decide what the model needs to see; trim the rest but keep what lets you trace back to the source.
- Measure under stated conditions before quoting numbers — one fast run is not a result.
- Write things down as you go; the notes are what made this case study possible.

### Status

This case study describes an earlier stage of my work. My current agent work continues in the OpenClaw project.

— hết phần copy (EN) —

### Tech Stack — giữ chung cho EN/VI (dán từng mục)

Đề xuất sửa 1 mục: đổi `API GPT-4.1-mini` thành `OpenAI GPT-4.1-mini`. Danh sách đầy đủ:

- n8n
- OpenAI GPT-4.1-mini
- OpenAI GPT-5-mini
- Docker
- Render Cloud
- Telegram Bot API
- Tavily API
- Perplexity API
- Apify YouTube Scraper
- OpenWeatherMap API

### Key Learnings — danh sách chung EN/VI: xoá 3 mục cũ, thêm 4 mục

- A single AI agent with specialised tools made the first version faster to build and easier to debug.
- Filter data before it reaches the model: send only the fields it needs, but keep what traces back to the source.
- Measure under stated conditions before publishing numbers; one fast run is not a result.
- Writing notes as you build turns an experiment into lessons you can reuse.

---

## VI

### Project Title (VI) — giữ nguyên

Bot Trợ Lý Cá Nhân Telegram Sử Dụng AI

### Short Description (VI)

Trợ lý Telegram xây bằng n8n và một AI agent, chọn lọc nội dung từ nhiều nguồn rồi gửi bản tóm tắt tiếng Việt. Bài học chính: chọn dữ liệu nào đưa vào model quan trọng không kém việc chọn model.

### Detailed Content (VI) — bắt đầu copy từ dòng dưới

## Tổng quan

Một thử nghiệm trước đây: trợ lý Telegram thu thập nội dung từ các kênh YouTube và nguồn tin được chọn lọc, lọc theo mức độ phù hợp rồi gửi bản tóm tắt tiếng Việt, để mình không phải mở từng nguồn thủ công.

### Vấn đề mình muốn giải quyết

Theo dõi nhiều kênh và nguồn tin đã trở thành một công việc riêng, trong khi chất lượng không đồng đều. Mình muốn có một nơi mang đến đúng những nội dung đáng đọc.

### Quyết định thiết kế

Ở phiên bản đầu, mình chọn **một AI agent với các công cụ chuyên biệt** trên n8n thay vì nhiều agent. Cách này giữ toàn bộ luồng — tìm kiếm, chọn lọc, tóm tắt, gửi Telegram — đủ nhỏ để kiểm tra từ đầu đến cuối và gỡ lỗi nhanh.

```
Telegram Bot → AI Agent (GPT-4.1-mini) → Công cụ:
  ├─ Tìm kiếm web (Tavily + Perplexity)
  ├─ Tìm kiếm YouTube (Apify)
  └─ API thời tiết
```

- Nền tảng: n8n chạy Docker khi phát triển, Render cho bản chạy online, ngrok cho webhook ở máy local.
- Nguồn: các kênh YouTube chọn lọc (ví dụ IBM Technology, NetworkChuck, OpenAI, Anthropic) và RSS.
- Giao diện: Telegram Bot API, hỗ trợ hỏi tiếp với nghiên cứu thời gian thực.

### Điều đã không ổn

Toàn bộ phản hồi API được chuyển thẳng vào agent. Mỗi video kéo theo hàng chục field mà agent không dùng tới, khiến đầu vào phình to, phản hồi chậm và chi phí tăng. Nhiều dữ liệu hơn không có nghĩa là câu trả lời tốt hơn.

### Thay đổi

Mình lọc dữ liệu **trước khi** đưa vào agent, chỉ giữ các field cần để chọn và dẫn nguồn một video, đồng thời giới hạn số kết quả:

```json
{
  "fields": ["id", "title", "url", "date", "viewCount", "channelName"],
  "maxResults": 10
}
```

Theo ghi chép của dự án, phản hồi nhanh hơn rõ rệt và lượng token giảm sau thay đổi này. Mình không công bố tỷ lệ phần trăm, vì kỳ đo và điều kiện chạy chưa được ghi lại đủ chặt để đứng sau những con số đó.

### Bài học mình giữ lại

- Bắt đầu bằng một luồng nhỏ kiểm tra được từ đầu đến cuối, rồi mới thêm agent.
- Quyết định model cần thấy gì; cắt phần thừa nhưng giữ thông tin để truy về nguồn.
- Đo trong điều kiện được ghi rõ rồi mới đưa ra con số — một lần chạy nhanh chưa phải là kết quả.
- Ghi chép trong lúc làm; chính những ghi chép đó giúp viết được case study này.

### Trạng thái

Case study này mô tả một giai đoạn trước đây trong hành trình của mình. Công việc với AI agent hiện tại được tiếp tục trong dự án OpenClaw.

— hết phần copy (VI) —

### Key Learnings (VI) — chỉ để tham khảo

Ô **Key Learnings** trong admin là danh sách chung cho cả EN/VI (giống Tech Stack), nên dán bản **EN** ở trên. Bản VI dưới đây để bạn đối chiếu ý.

- Một AI agent với các công cụ chuyên biệt giúp phiên bản đầu xây nhanh hơn và dễ gỡ lỗi hơn.
- Lọc dữ liệu trước khi đưa vào model: chỉ gửi field cần thiết nhưng giữ thông tin truy về nguồn.
- Đo trong điều kiện được ghi rõ trước khi công bố con số; một lần chạy nhanh chưa phải là kết quả.
- Ghi chép trong lúc xây giúp biến một thử nghiệm thành bài học dùng lại được.
