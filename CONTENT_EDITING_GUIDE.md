# Content Editing Guide

> Hướng dẫn chỉnh sửa nội dung website dễ dàng

## 📁 Cấu Trúc Content

```
content/
├── blog/           # Blog posts
│   └── *.mdx      # Mỗi file = 1 blog post
└── projects/       # Projects
    └── *.mdx      # Mỗi file = 1 project
```

---

## 📝 Cách Edit Blog Post

### Tạo Blog Post Mới

**Bước 1:** Tạo file mới trong `content/blog/`

```bash
touch content/blog/ten-bai-viet.mdx
```

**Bước 2:** Copy template này:

```markdown
---
title: "Tiêu Đề Bài Viết"
date: "2024-11-06"
description: "Mô tả ngắn gọn (hiển thị trong list)"
tags: ["product-management", "ai", "lessons-learned"]
---

## Heading 1

Nội dung paragraph...

### Subheading

- Bullet point 1
- Bullet point 2

**Bold text** và *italic text*

> Quote text

```typescript
// Code block
const example = "Hello World"
```

[Link text](https://example.com)
```

**Bước 3:** Save file và reload browser - Website tự động update!

### Edit Blog Post Có Sẵn

**Option 1: VSCode (Recommended)**

1. Mở file: `content/blog/sample-post.mdx`
2. Edit nội dung
3. Save (Cmd/Ctrl + S)
4. Reload browser → Thấy changes ngay!

**Option 2: GitHub Online**

1. Vào repo trên GitHub
2. Navigate: `content/blog/sample-post.mdx`
3. Click nút "Edit" (icon bút chì)
4. Edit nội dung
5. Commit changes
6. Vercel auto deploy (2-3 phút)

---

## 🚀 Cách Edit Project

### Tạo Project Mới

**File:** `content/projects/ten-project.mdx`

```markdown
---
title: "Tên Project"
description: "Mô tả ngắn gọn"
tech: ["Next.js", "OpenAI", "TypeScript"]
image: "/images/projects/ten-project.jpg"
github: "https://github.com/user/repo"
demo: "https://demo.com"
---

## The Problem

Mô tả vấn đề...

## The Solution

Mô tả giải pháp...

## Technical Details

Chi tiết technical...
```

### Thêm Hình Ảnh cho Project

**Bước 1:** Upload ảnh vào `public/images/projects/`

```bash
# Copy ảnh vào folder
cp ~/Downloads/my-project.jpg public/images/projects/
```

**Bước 2:** Reference trong MDX:

```markdown
image: "/images/projects/my-project.jpg"
```

---

## ✏️ Markdown Syntax Cheat Sheet

### Text Formatting

```markdown
**Bold text**
*Italic text*
~~Strikethrough~~
`Inline code`
```

### Headings

```markdown
## Heading 2
### Heading 3
#### Heading 4
```

### Lists

```markdown
- Unordered item 1
- Unordered item 2

1. Ordered item 1
2. Ordered item 2
```

### Links

```markdown
[Link text](https://example.com)
```

### Images

```markdown
![Alt text](/images/projects/image.jpg)
```

### Code Blocks

````markdown
```typescript
const hello = "world"
```
````

### Quotes

```markdown
> This is a quote
```

### Tables

```markdown
| Column 1 | Column 2 |
|----------|----------|
| Data 1   | Data 2   |
```

---

## 🔄 Workflow: Edit → Deploy

### Development (Local)

```bash
# 1. Edit file
vim content/blog/my-post.mdx

# 2. Check tại http://localhost:3000
# Changes hiển thị ngay (hot reload)

# 3. Hài lòng thì commit
git add content/blog/my-post.mdx
git commit -m "Add new blog post"
git push
```

### Production (Live Website)

**Vercel Auto Deploy:**

1. Push code lên GitHub
2. Vercel tự động detect changes
3. Build & deploy (2-3 phút)
4. Website live! 🎉

**Kiểm tra status:**
- Vào Vercel Dashboard
- Xem deployment logs
- URL: `https://your-site.vercel.app`

---

## 📱 Edit Trên Mobile/Tablet

### Option 1: GitHub Mobile App

1. Install GitHub app
2. Mở repo
3. Navigate đến file
4. Tap "Edit"
5. Save → Auto deploy

### Option 2: Working Copy (iOS)

1. Install Working Copy app
2. Clone repo
3. Edit files
4. Commit & push

### Option 3: Termux (Android)

1. Install Termux
2. Clone repo
3. Edit với vim/nano
4. Git push

---

## 🆘 Common Issues & Solutions

### Issue 1: Frontmatter Error

**Problem:**
```
Error: Invalid frontmatter
```

**Solution:**
- Check dấu `---` ở đầu và cuối frontmatter
- Ensure proper YAML syntax
- Dates phải format: `"YYYY-MM-DD"`

### Issue 2: MDX Syntax Error

**Problem:**
```
Error: Unexpected token
```

**Solution:**
- Check ngoặc kép `"` phải đóng đúng
- Code blocks phải có ` ``` ` đầy đủ
- HTML tags phải đóng đúng

### Issue 3: Image Không Hiển Thị

**Problem:** Ảnh không load

**Solution:**
- Check path: `/images/projects/image.jpg`
- Ensure file tồn tại trong `public/`
- File name đúng (case-sensitive)

---

## 💡 Tips & Best Practices

### Writing Tips

1. **Titles should be clear** - User biết được content là gì
2. **Descriptions compelling** - Hook readers trong 1 câu
3. **Use headings** - Break content thành sections
4. **Add code examples** - Show, don't just tell
5. **Include visuals** - Images, diagrams make content engaging

### SEO Tips

1. **Good titles** - Include keywords
2. **Meta descriptions** - 150-160 characters
3. **Use headings hierarchy** - H2 → H3 → H4
4. **Internal links** - Link to other posts/projects
5. **Alt text for images** - Describe images clearly

### Organization Tips

1. **Consistent naming** - Use kebab-case: `my-blog-post.mdx`
2. **Date in filename** - Optional: `2024-11-06-my-post.mdx`
3. **Archive old content** - Move to `content/archive/`
4. **Use tags wisely** - 3-5 tags per post

---

## 🚀 Advanced: Rich Content

### Embedded Videos

```markdown
<iframe
  width="560"
  height="315"
  src="https://www.youtube.com/embed/VIDEO_ID"
  title="Video title"
></iframe>
```

### Custom Components (Future)

```markdown
<CalloutBox type="warning">
  This is a custom callout
</CalloutBox>
```

### Math Equations (If needed)

Install katex and add to MDX config.

---

## ❓ FAQs

**Q: Có cần biết code không?**
A: Không! Chỉ cần biết Markdown cơ bản (như format text trong WhatsApp/Telegram)

**Q: Edit xong bao lâu thì live?**
A:
- Local: Ngay lập tức (hot reload)
- Production: 2-3 phút (Vercel auto deploy)

**Q: Có thể schedule posts không?**
A: Có, set `date` trong frontmatter, hoặc dùng Git commits schedule

**Q: Nếu làm sai thì sao?**
A: Git có version history, có thể revert bất cứ lúc nào:
```bash
git log              # Xem history
git revert HEAD      # Undo commit cuối
```

**Q: Có thể preview trước khi deploy không?**
A: Có! Vercel tạo preview URL cho mỗi PR/branch

---

## 📚 Resources

### Learn Markdown
- [Markdown Guide](https://www.markdownguide.org/)
- [GitHub Markdown Cheatsheet](https://github.com/adam-p/markdown-here/wiki/Markdown-Cheatsheet)

### MDX Docs
- [MDX Official Docs](https://mdxjs.com/)
- [Next.js MDX Guide](https://nextjs.org/docs/app/building-your-application/configuring/mdx)

### Git Basics
- [Git Handbook](https://guides.github.com/introduction/git-handbook/)
- [GitHub Desktop](https://desktop.github.com/) - GUI tool

---

**Happy editing! 🎉**

*Questions? Open an issue on GitHub or reach out!*
