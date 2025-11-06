# Deployment Guide

> Checklist để deploy lên Vercel

## 📋 Pre-Deployment Checklist

### Phase 1 (Core Website)

- [ ] **Content Ready**
  - [ ] At least 3 projects in `content/projects/`
  - [ ] At least 5 blog posts in `content/blog/`
  - [ ] About page info updated
  - [ ] Contact links updated (email, LinkedIn, GitHub)

- [ ] **Images**
  - [ ] Profile photo added to `public/images/`
  - [ ] Project screenshots added
  - [ ] All images optimized (< 500KB each)

- [ ] **Configuration**
  - [ ] Update `components/layout/Footer.tsx` with your links
  - [ ] Update `app/layout.tsx` metadata
  - [ ] Update `README.md` with your info

- [ ] **Testing**
  - [ ] Test all pages locally
  - [ ] Check mobile responsive
  - [ ] Test navigation links
  - [ ] Verify MDX rendering

- [ ] **Code Quality**
  - [ ] Run `npm run build` successfully
  - [ ] Fix all TypeScript errors
  - [ ] No console errors

---

## 🚀 Deployment Steps

### Step 1: Prepare Git Repository

```bash
# Initialize git (if not done)
git init

# Add all files
git add .

# Commit
git commit -m "Initial commit: Portfolio website"

# Create GitHub repo and push
git remote add origin https://github.com/yourusername/portfolio.git
git branch -M main
git push -u origin main
```

### Step 2: Deploy to Vercel

**Option A: Vercel Dashboard (Recommended)**

1. Go to [vercel.com](https://vercel.com)
2. Sign in with GitHub
3. Click "New Project"
4. Import your repository
5. Configure:
   - Framework Preset: **Next.js**
   - Root Directory: `./`
   - Build Command: `npm run build`
   - Output Directory: `.next`
6. Click **Deploy**
7. Wait 2-3 minutes ⏳
8. Done! 🎉

**Option B: Vercel CLI**

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
vercel

# Follow prompts
# Deploy to production
vercel --prod
```

### Step 3: Verify Deployment

- [ ] Visit your Vercel URL
- [ ] Test all pages
- [ ] Check mobile view
- [ ] Verify images load
- [ ] Test navigation

---

## 🔧 Post-Deployment Configuration

### Custom Domain (Optional)

1. Buy domain (Namecheap, GoDaddy, etc.)
2. In Vercel Dashboard:
   - Settings → Domains
   - Add your domain
   - Update DNS records (Vercel will guide you)
3. Wait for DNS propagation (5-30 minutes)

### Analytics Setup (Optional)

**Vercel Analytics (Free)**

```bash
npm install @vercel/analytics
```

Update `app/layout.tsx`:

```typescript
import { Analytics } from '@vercel/analytics/react'

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  )
}
```

**Google Analytics**

1. Get GA4 ID from Google Analytics
2. Add to `.env.local`: `NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX`
3. Add tracking script to `app/layout.tsx`

---

## 📝 Phase 2: AI Features Deployment

### Additional Environment Variables

When deploying Phase 2, add these in Vercel Dashboard:

1. Go to Project Settings → Environment Variables
2. Add:
   ```
   OPENAI_API_KEY=sk-your-key
   UPSTASH_VECTOR_REST_URL=https://...
   UPSTASH_VECTOR_REST_TOKEN=...
   YOUTUBE_API_KEY=AIza...
   ```
3. Redeploy

### Cost Monitoring

**Set up billing alerts:**

1. **OpenAI Dashboard**
   - Settings → Billing → Usage limits
   - Set soft limit: $5/month
   - Set hard limit: $10/month

2. **Upstash Dashboard**
   - Monitor usage (free tier is generous)

---

## 🔄 Continuous Deployment

Vercel auto-deploys when you push to GitHub:

```bash
# Make changes
git add .
git commit -m "Update content"
git push

# Vercel automatically:
# 1. Detects push
# 2. Builds project
# 3. Deploys to production
# 4. Done in 2-3 minutes!
```

### Preview Deployments

Every branch/PR gets a unique preview URL:

```bash
# Create feature branch
git checkout -b new-feature

# Make changes and push
git push origin new-feature

# Vercel creates preview URL
# Test before merging to main
```

---

## 🐛 Troubleshooting

### Build Fails

**Error: Type errors**

```bash
# Check locally first
npm run build

# Fix TypeScript errors
# Then push again
```

**Error: Module not found**

```bash
# Ensure all dependencies in package.json
npm install

# Commit package.json and package-lock.json
git add package*.json
git commit -m "Update dependencies"
git push
```

### Images Not Loading

**Problem:** 404 on images

**Solution:**
- Ensure images in `public/` folder
- Use `/images/...` path (not `./images/`)
- Check file names (case-sensitive)

### Slow Build Times

**Problem:** Build takes > 5 minutes

**Solution:**
- Check for large dependencies
- Optimize images before committing
- Use `next/image` for automatic optimization

---

## 📊 Performance Optimization

### Before Launch

Run Lighthouse audit:

1. Open Chrome DevTools
2. Lighthouse tab
3. Generate report
4. Target scores:
   - Performance: > 85
   - Accessibility: > 90
   - Best Practices: > 90
   - SEO: > 90

### Image Optimization

```bash
# Install sharp for better image optimization
npm install sharp

# Next.js will use it automatically
```

### Font Optimization

Already configured with `next/font`:

```typescript
import { Inter } from 'next/font/google'
const inter = Inter({ subsets: ['latin', 'vietnamese'] })
```

---

## 🎉 Launch Checklist

Before announcing:

- [ ] Website accessible at production URL
- [ ] All pages working
- [ ] No console errors
- [ ] Mobile responsive verified
- [ ] Lighthouse score > 85
- [ ] Analytics working (if enabled)
- [ ] Social media links correct
- [ ] Contact info correct

### Announcement Template

**LinkedIn Post:**

```
🚀 Excited to launch my new portfolio website!

After [X] weeks of building in public, my portfolio is now live:
👉 [your-website-url]

What you'll find:
✅ [X] AI-powered projects
✅ [X] blog posts on product management
✅ My journey from BA → PM

Built with: Next.js, TypeScript, Tailwind CSS
Deployed on: Vercel

Feedback welcome! 🙏

#ProductManagement #AI #BuildInPublic #NextJS
```

---

## 🔒 Security Best Practices

- [ ] Never commit `.env.local` (already in .gitignore)
- [ ] Use environment variables for secrets
- [ ] Enable Vercel's security headers
- [ ] Keep dependencies updated
- [ ] Monitor for vulnerabilities: `npm audit`

---

## 📈 Monitoring

### Vercel Dashboard

Monitor:
- Deployment frequency
- Build times
- Error rates
- Traffic (with Analytics)

### Set Up Alerts

1. Vercel → Project Settings → Notifications
2. Enable:
   - Deployment failed
   - Deployment ready
   - Domain issues

---

## 🆘 Need Help?

- **Vercel Docs:** https://vercel.com/docs
- **Next.js Docs:** https://nextjs.org/docs
- **Vercel Discord:** https://vercel.com/discord
- **GitHub Issues:** Open issue in your repo

---

**Deployment success! 🎉**

*Remember: First deployment is always the hardest. After this, it's just `git push` and Vercel handles everything!*
