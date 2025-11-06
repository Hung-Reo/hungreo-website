# Phase 2: AI Features Setup Guide

This guide will help you configure and test the AI features (Chatbot and YouTube Summarizer) for your website.

## Prerequisites

You need to obtain API keys from the following services:

1. **OpenAI API** - For GPT-4o-mini and text embeddings
2. **Pinecone** - For vector database (RAG chatbot)
3. **YouTube Data API v3** - For fetching video metadata

## Step 1: Get OpenAI API Key

1. Go to [OpenAI Platform](https://platform.openai.com/)
2. Sign in or create an account
3. Navigate to **API Keys** section
4. Click **Create new secret key**
5. Copy the key (starts with `sk-...`)

**Cost**: ~$0.50-2/month for typical usage
- GPT-4o-mini: $0.150 per 1M input tokens, $0.600 per 1M output tokens
- text-embedding-3-small: $0.020 per 1M tokens

## Step 2: Get Pinecone API Key

1. Go to [Pinecone](https://www.pinecone.io/)
2. Sign up for free account
3. Create a new index:
   - Name: `hungreo-website` (or your choice)
   - Dimensions: **1536** (for OpenAI text-embedding-3-small)
   - Metric: **cosine**
   - Cloud: **AWS** (free tier)
   - Region: Choose closest to you
4. Go to **API Keys** section
5. Copy your API key

**Cost**: Free tier includes:
- 1 index
- 100K vectors
- Sufficient for personal website

## Step 3: Get YouTube Data API Key

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable **YouTube Data API v3**:
   - Go to **APIs & Services** > **Library**
   - Search for "YouTube Data API v3"
   - Click **Enable**
4. Create credentials:
   - Go to **APIs & Services** > **Credentials**
   - Click **Create Credentials** > **API Key**
   - Copy the API key
   - (Optional) Restrict the key to YouTube Data API v3

**Cost**: Free tier includes:
- 10,000 quota units per day
- Each video metadata request = 1 unit
- Sufficient for personal use

## Step 4: Configure Environment Variables

1. Open the `.env.local` file in your project root
2. Fill in your API keys:

```bash
# OpenAI API (for GPT-4o-mini and embeddings)
OPENAI_API_KEY=sk-your-actual-openai-key-here

# Pinecone Vector Database
PINECONE_API_KEY=your-actual-pinecone-key-here
PINECONE_INDEX_NAME=hungreo-website

# YouTube Data API v3
YOUTUBE_API_KEY=AIzaSy-your-actual-youtube-key-here
```

3. Save the file

**Important**: Never commit `.env.local` to Git. It's already in `.gitignore`.

## Step 5: Generate Vector Embeddings (For Chatbot)

The AI chatbot uses RAG (Retrieval-Augmented Generation) to answer questions about your blog posts and projects. You need to generate embeddings first:

```bash
# Run the embedding generation script
npx tsx scripts/generate-embeddings.ts
```

This script will:
1. Read all blog posts and projects from `content/` folder
2. Generate embeddings using OpenAI
3. Upload vectors to Pinecone

**When to run this**:
- After initial setup
- Whenever you add/update blog posts or projects
- Before deploying to production

## Step 6: Test Locally

1. Start the development server:
```bash
npm run dev
```

2. Open http://localhost:3000

3. Test the **AI Chatbot**:
   - Look for the chat icon in bottom-right corner
   - Click to open chat window
   - Try asking: "What projects has Hung worked on?"
   - Try asking in Vietnamese: "Hung có kinh nghiệm gì về AI?"

4. Test the **YouTube Summarizer**:
   - Go to **AI Tools** in navigation
   - Or visit: http://localhost:3000/tools/youtube
   - Paste a YouTube URL (e.g., https://www.youtube.com/watch?v=dQw4w9WgXcQ)
   - Click "Tóm tắt video"
   - Wait for AI to generate summary

## Step 7: Deploy to Production

1. Add environment variables to Vercel:
   - Go to your Vercel project dashboard
   - Navigate to **Settings** > **Environment Variables**
   - Add all three API keys:
     - `OPENAI_API_KEY`
     - `PINECONE_API_KEY`
     - `PINECONE_INDEX_NAME`
     - `YOUTUBE_API_KEY`

2. Run embedding generation locally before deploying:
```bash
npx tsx scripts/generate-embeddings.ts
```

3. Commit and push your Phase 2 changes:
```bash
git add .
git commit -m "Add Phase 2: AI features (Chatbot + YouTube Summarizer)"
git push origin main
```

4. Vercel will automatically redeploy

## Features Overview

### 1. AI Chatbot (RAG-powered)

**Location**: Available on all pages (bottom-right corner)

**Capabilities**:
- Answers questions about your background, projects, and blog posts
- Uses RAG to retrieve relevant content from your website
- Supports both English and Vietnamese
- Real-time streaming responses

**How it works**:
1. User asks a question
2. Question is converted to vector embedding
3. Pinecone searches for similar content
4. Retrieved content is sent to GPT-4o-mini as context
5. AI generates a contextual answer

### 2. YouTube Summarizer

**Location**: `/tools/youtube` (AI Tools in navigation)

**Capabilities**:
- Accepts any YouTube video URL
- Fetches video metadata (title, channel, publish date)
- Generates Vietnamese summary using AI
- Displays embedded video player

**How it works**:
1. Extracts video ID from URL
2. Fetches video metadata via YouTube Data API
3. Sends video description to GPT-4o-mini
4. AI generates structured summary in Vietnamese

## Troubleshooting

### Chatbot not responding
- Check if `OPENAI_API_KEY` is set correctly
- Check if `PINECONE_API_KEY` and `PINECONE_INDEX_NAME` are set
- Run `npx tsx scripts/generate-embeddings.ts` to populate Pinecone
- Check browser console for errors

### YouTube Summarizer errors
- Verify `YOUTUBE_API_KEY` is set correctly
- Check if YouTube Data API v3 is enabled in Google Cloud Console
- Ensure the video URL is valid and public
- Check API quota (10,000 units/day for free tier)

### "API key not configured" error
- Make sure `.env.local` file exists in project root
- Verify all keys are filled in (no placeholder values)
- Restart the development server: `npm run dev`

### Pinecone connection issues
- Verify index dimensions are set to **1536**
- Check index name matches `PINECONE_INDEX_NAME` in `.env.local`
- Ensure index is in "Ready" state in Pinecone dashboard

## Cost Estimation

**Monthly costs for moderate usage** (~100 visitors, 500 chat messages, 50 video summaries):

- OpenAI: $1-2/month
  - Chatbot: ~$0.50
  - YouTube Summarizer: ~$0.50
  - Embeddings: ~$0.10
- Pinecone: Free (within free tier limits)
- YouTube API: Free (within quota)

**Total: ~$1-2/month**

## Next Steps

After completing Phase 2 setup:

1. **Content Creation**: Add more blog posts and projects to improve chatbot knowledge
2. **Analytics**: Consider adding tracking to see how users interact with AI features
3. **Enhancements**:
   - Add conversation history to chatbot
   - Support video transcript for more accurate YouTube summaries
   - Add more AI tools (e.g., blog post generator)

## Support

If you encounter issues:
1. Check the error messages in browser console and terminal
2. Verify all API keys are correct
3. Review the troubleshooting section above
4. Check API usage/quotas in respective dashboards

---

**Phase 2 Complete!** 🎉

Your personal website now has powerful AI features to engage visitors and showcase your technical skills.
