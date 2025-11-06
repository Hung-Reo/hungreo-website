# Personal Brand Portfolio Website

> Building in public: BA → PM transition journey with AI

## 🎯 Project Vision

A personal portfolio website showcasing my transition from Business Analyst to Product Manager, featuring AI-powered projects, lessons learned, and technical insights. This platform serves as both a professional portfolio and a knowledge-sharing hub for the community.

## 📊 Project Status

- **Current Phase:** Phase 1 - Foundation
- **Timeline:** 6 weeks total (3 weeks per phase)
- **Started:** November 2025
- **Target Launch:** Phase 1 in 3 weeks

## 🚀 Features

### Phase 1 (Weeks 1-3) - Core Website
- ✅ Homepage with hero section and featured content
- ✅ About Me page with professional journey
- ✅ Projects Portfolio (3-4 AI projects)
- ✅ Blog with 5 initial posts
- ✅ Contact page
- ✅ Fully responsive design
- ✅ SEO optimized

### Phase 2 (Weeks 4-6) - AI Features
- 🔄 AI Chatbot (RAG-powered Q&A about website content)
- 🔄 YouTube Video Summarizer
- 🔄 Advanced analytics

## 🛠️ Tech Stack

| Category | Technology | Reason |
|----------|-----------|---------|
| **Framework** | Next.js 14 (App Router) | SEO, performance, easy deployment |
| **Language** | TypeScript | Type safety, better DX |
| **Styling** | Tailwind CSS | Rapid development, consistency |
| **Content** | MDX | Git-based, no database needed |
| **Deployment** | Vercel | Free tier, zero config |
| **AI (Phase 2)** | OpenAI GPT-4.1-mini, Upstash Vector | Cost-effective, powerful |

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

## 📚 Documentation

- [IMPLEMENTATION_PLAN.md](./IMPLEMENTATION_PLAN.md) - Detailed implementation plan
- [PRD-website.txt](./PRD-website.txt) - Product Requirements Document

## 🔗 Links

- **Website:** [Coming soon]
- **LinkedIn:** [Your LinkedIn]
- **GitHub:** [Your GitHub]

## 📅 Timeline

### Week 1: Foundation
- Days 1-2: Project setup
- Days 3-5: Build core pages
- Days 6-7: Styling and responsive design

### Week 2: Content
- Days 8-10: Projects section
- Days 11-14: Blog system and content

### Week 3: Polish & Deploy
- Days 15-17: SEO and optimization
- Days 18-19: Testing
- Days 20-21: Deploy and announce

### Week 4-6: AI Features (Phase 2)
- Week 4: AI Chatbot implementation
- Week 5: YouTube Summarizer
- Week 6: Testing and deployment

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
