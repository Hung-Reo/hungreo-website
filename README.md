# Personal Brand Portfolio Website

> Building in public: BA → PM transition journey with AI - **Built with Claude Code** ❤️

## 🎯 Project Vision

A personal portfolio website showcasing my transition from Business Analyst to Product Manager, featuring AI-powered projects, lessons learned, and technical insights. This platform serves as both a professional portfolio and a knowledge-sharing hub for the community.

## 📊 Project Status

- **Current Phase:** Phase 5 - Complete ✅
- **Status:** Production-Ready 🚀
- **Started:** November 2025
- **Completed:** November 18, 2025

## 🚀 Features

### ✅ Phase 1: Core Infrastructure
- Authentication (NextAuth v5)
- Storage (Vercel KV, Vercel Blob)
- Content Manager library
- Base types and utilities

### ✅ Phase 2: Projects Management
- Admin projects CRUD (upload, parse documents)
- Project editor with screenshots & learnings
- Public projects list with tech stack filtering
- Public project detail pages

### ✅ Phase 3: Blog Features
- AI-powered blog polishing (OpenAI GPT-4o-mini)
- Blog editor with categories & tags
- Admin blog list with stats & filters
- Public blog pages (list & detail)
- Related posts algorithm

### ✅ Phase 4: SEO & Production Ready
- Meta tags (title, description, keywords)
- Open Graph tags for social sharing
- Twitter Card support
- JSON-LD structured data
- Dynamic sitemap.xml generation
- Robots.txt configuration
- Homepage enhancement (featured projects & latest posts)

### ✅ Phase 5: Contact Management & Footer
- Flexible contact CRUD (8 predefined types)
- Admin interface with reorder & visibility toggle
- Dynamic public contact page
- Bilingual support (EN/VI)
- Claude Code attribution in footer

## 🛠️ Tech Stack

| Category | Technology | Reason |
|----------|-----------|---------|
| **Framework** | Next.js 14 (App Router) | SEO, performance, easy deployment |
| **Language** | TypeScript | Type safety, better DX |
| **Styling** | Tailwind CSS | Rapid development, consistency |
| **Content** | MDX | Git-based, no database needed |
| **Deployment** | Vercel | Free tier, zero config |
| **AI** | OpenAI GPT-4.1-mini | Cost-effective, powerful |
| **Vector DB** | Pinecone | Fast semantic search, managed service |
| **Storage** | Vercel KV, Vercel Blob | Key-value store, file storage |
| **Auth** | NextAuth.js | Secure admin authentication |
| **Scraping** | Puppeteer | Full React rendering for accurate content extraction |

## 📁 Project Structure

```
portfolio-website/
├── app/                    # Next.js 14 App Router
│   ├── page.tsx           # Homepage
│   ├── about/             # About page
│   ├── projects/          # Projects portfolio
│   ├── blog/              # Blog with MDX
│   ├── contact/           # Contact page
│   └── api/               # API routes (Phase 2)
├── components/            # Reusable UI components
│   ├── ui/               # Base components
│   ├── layout/           # Layout components
│   └── features/         # Feature-specific components
├── content/              # MDX content files
│   ├── blog/            # Blog posts (.mdx)
│   └── projects/        # Project documentation (.mdx)
├── lib/                 # Utilities
│   ├── mdx.ts          # MDX processing
│   └── utils.ts        # Helper functions
├── public/             # Static assets
│   ├── images/        # Images and screenshots
│   └── icons/         # Icons and logos
└── styles/            # Global styles
```

## 🎨 Design Principles

1. **Content First** - Clear, readable, accessible
2. **Performance** - Fast loading, optimized images
3. **Responsive** - Mobile-first approach
4. **SEO** - Optimized for search engines
5. **Simplicity** - Clean, minimalist design

## 📝 Content Strategy

### Projects to Showcase
1. **K12 Chatbot AI** - Educational assistant
2. **Auto Lesson Plan Generator** - AI-powered planning
3. **Personal Assistant** (n8n + Telegram) - Automation
4. **Real Estate Search Bot** - Property search automation

### Blog Topics (Initial 5 Posts)
1. "Tại Sao Problem-Solving Trước, AI Sau"
2. "Những Sai Lầm AI Lớn Nhất Của Tôi"
3. "BA → PM: Hành Trình & Bài Học"
4. "Online Teachers Thay Đổi Tư Duy Của Tôi"
5. "Chạy Bộ & Leadership: Điểm Chung?"

## 🎯 Success Metrics

**Phase 1 Completion:**
- ✅ Website live at [username].vercel.app
- ✅ All 5 pages functional
- ✅ 3+ projects documented
- ✅ 5 blog posts published
- ✅ Mobile responsive
- ✅ Lighthouse score > 85
- ✅ Shared on LinkedIn

**Phase 2 Completion:**
- ✅ AI Chatbot answering 90%+ questions correctly
- ✅ YouTube Summarizer working
- ✅ Response time < 5 seconds
- ✅ Monthly costs < $5

## 💰 Budget

- **Phase 1:** $0 (Vercel Free Tier)
- **Phase 2:** ~$1-2/month (OpenAI API for GPT-4.1-mini + embeddings)
- **Optional:** Custom domain (~$12/year)

## 🚦 Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn
- Git

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/portfolio-website.git

# Navigate to project directory
cd portfolio-website

# Install dependencies
npm install

# Run development server
npm run dev

# Open http://localhost:3000
```

### Development Commands

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run type-check   # Run TypeScript checks
```

### Admin Features

The website includes a comprehensive admin dashboard for content management:

**Admin Login:**
- URL: `/admin/login`
- Email: `hungreo2005@gmail.com`
- Password: `Admin@123`

**Admin Dashboard Features:**

1. **Projects Management** (`/admin/content/projects`)
   - Upload project documents (PDF, Markdown)
   - AI-powered parsing and extraction
   - Add screenshots and learnings
   - Tech stack management
   - Publish/draft status toggle

2. **Blog Management** (`/admin/content/blog`)
   - AI polish flow (paste draft → AI generates polished content)
   - Category and tags management
   - Bilingual content editor (EN/VI)
   - Featured post toggle
   - Regenerate AI content

3. **Contact Management** (`/admin/content/contact`) ⭐ NEW
   - 8 contact types: Email, Phone, LinkedIn, GitHub, Twitter, Website, Address, Custom
   - Add/Edit/Delete contact methods
   - Reorder with ⬆️⬇️ buttons
   - Toggle visibility (show/hide on public page)
   - Bilingual labels (EN/VI)

4. **About Page Management** (`/admin/content/about`)
   - Professional journey timeline
   - Education & expertise
   - Training & certifications
   - Core competencies
   - Personal interests

**Other Admin Features:**
- **Documents Management** (`/admin/documents`) - Upload and manage documents
- **Vector Database** (`/admin/vectors`) - Manage Pinecone vectors
- **Chat Logs** (`/admin/chats`) - Monitor chatbot conversations
- **Website Scraping** - One-click content scraping for RAG

## 📚 Documentation

### Implementation Guides
- [Phase 5: Contact Management Guide](/docs/PHASE5_CONTACT_MANAGEMENT_GUIDE.md) ⭐ NEW
- [Phase 4: SEO Implementation](/docs/PHASE4_SEO_GUIDE.md)
- [Phase 3: Blog Features](/docs/PHASE3_BLOG_GUIDE.md)
- [Phase 2: Projects Management](/docs/PHASE2_PROJECTS_GUIDE.md)
- [About Page Implementation](/docs/ABOUT_PAGE_IMPLEMENTATION_GUIDE.md)

### Admin & Deployment
- [Content Editing Guide](/CONTENT_EDITING_GUIDE.md) - How to manage content
- [Deployment Guide](/DEPLOYMENT_GUIDE.md) - How to deploy to production
- [UAT Guide](/UAT_GUIDE.md) - User acceptance testing
- [Security Recommendations](/SECURITY_RECOMMENDATIONS.md)

### Additional Docs

### Additional Docs
- [Implementation Plan](/IMPLEMENTATION_PLAN_PROJECTS_BLOG.md)
- [Configuration Guide](/CONFIGURATION.md)
- [How to Change Admin Password](/docs/HOW_TO_CHANGE_ADMIN_PASSWORD.md)
- [All Documentation](/docs/) - Complete docs folder

## 🌟 Key Features Highlights

### For Visitors
- ✅ Bilingual website (English/Vietnamese)
- ✅ Dynamic homepage with featured projects & latest blog posts
- ✅ Comprehensive about page with professional journey
- ✅ Project portfolio with screenshots & tech stack
- ✅ Blog with categories, tags, and search
- ✅ Dynamic contact page with multiple contact methods
- ✅ SEO optimized (meta tags, Open Graph, sitemap)
- ✅ Mobile-first responsive design

### For Admin (Content Management)
- ✅ Projects CRUD with AI-powered document parsing
- ✅ Blog CRUD with AI polishing (GPT-4o-mini)
- ✅ Contact methods management (add/edit/delete/reorder)
- ✅ About page content management
- ✅ Category & tags management
- ✅ Publish/draft workflow
- ✅ Featured content toggle
- ✅ Image upload & management (Vercel Blob)

### Technical Excellence
- ✅ TypeScript throughout
- ✅ Next.js 14 App Router
- ✅ Server & Client Components
- ✅ ISR caching (60s revalidation)
- ✅ Auth-protected admin routes
- ✅ Toast notifications (Sonner)
- ✅ Loading & error states
- ✅ Markdown content with GFM support

## 📱 Pages Overview

### Public Pages
- `/` - Homepage (hero, values, featured projects, latest posts)
- `/about` - About Me (journey, education, skills, interests)
- `/projects` - Projects List (filterable by tech stack)
- `/projects/[slug]` - Project Detail (full content, screenshots, learnings)
- `/blog` - Blog List (filterable by category, searchable)
- `/blog/[slug]` - Blog Post Detail (full post, related posts)
- `/contact` - Contact Page (dynamic contact methods)

### Admin Pages
- `/admin/login` - Admin Login
- `/admin/content/projects` - Projects Management
- `/admin/content/projects/[id]` - Project Editor
- `/admin/content/blog` - Blog Management
- `/admin/content/blog/[id]` - Blog Editor
- `/admin/content/contact` - Contact Management ⭐ NEW
- `/admin/content/about` - About Page Management

## 🎨 Design & UX

**Design Principles:**
1. **Content First** - Clear, readable, accessible
2. **Performance** - Fast loading, optimized images
3. **Responsive** - Mobile-first approach
4. **SEO** - Optimized for search engines
5. **Simplicity** - Clean, minimalist design

**UI Components:**
- Reusable Button, Card, StatusToggle components
- Toast notifications for user feedback
- Loading spinners for async operations
- Empty states with helpful messages
- Error boundaries for graceful failures

## 📝 Recent Updates

### Phase 5 (November 18, 2025) ⭐ NEW
- **Contact Management System**
  - 8 contact types (Email, Phone, LinkedIn, GitHub, Twitter, Website, Address, Custom)
  - Admin CRUD with reorder & visibility toggle
  - Dynamic public contact page
  - Bilingual labels (EN/VI)

- **Footer Enhancement**
  - Claude Code attribution on all pages
  - Bilingual credit message
  - Link to https://claude.ai/code

**Files Changed:** +706 lines
**Commit:** `df84e52`

### Phase 4 (November 17, 2025)
- Meta tags & Open Graph for social sharing
- Dynamic sitemap.xml & robots.txt
- Homepage enhancement with real data
- Production-ready SEO

### Phase 3 (November 17, 2025)
- Blog management system with AI polish
- Category & tags management
- Public blog pages with search

## 📅 Development Timeline

| Phase | Feature | Status | Date |
|-------|---------|--------|------|
| Phase 1 | Core Infrastructure | ✅ Complete | Nov 16 |
| Phase 2 | Projects Management | ✅ Complete | Nov 16 |
| Phase 3 | Blog Features | ✅ Complete | Nov 17 |
| Phase 4 | SEO & Production | ✅ Complete | Nov 17 |
| Phase 5 | Contact & Footer | ✅ Complete | Nov 18 |

**Total Development Time:** 3 days
**Total Lines of Code:** ~15,000+ lines
**Built with:** Claude Code by Anthropic ❤️

## 🤝 Contributing

This is a personal portfolio project, but feedback and suggestions are welcome! Feel free to open an issue or reach out directly.

## 📄 License

MIT License - feel free to use this as inspiration for your own portfolio!

## 🙏 Acknowledgments

- Built with [Next.js](https://nextjs.org/)
- Styled with [Tailwind CSS](https://tailwindcss.com/)
- Powered by [Vercel](https://vercel.com/)
- AI by [OpenAI](https://openai.com/)

---

**Note:** This project is part of my journey from Business Analyst to Product Manager. Follow along as I build in public and share my learnings!

🚀 **Let's build something amazing!**
