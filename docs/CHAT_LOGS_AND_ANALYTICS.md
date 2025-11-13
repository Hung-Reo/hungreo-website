# Chat Logs and Analytics Guide
**Understanding Your Chatbot Data & How to Pull Reports**

> **Last Updated**: Jan 13, 2025
>
> **Purpose**: Guide for accessing, analyzing, and exporting chatbot interaction data

---

## Overview

Your chatbot automatically logs all conversations to Upstash Redis (Vercel KV) for analytics and improvement. This document explains where the data is stored, how to access it, and how to generate reports.

---

## 1. Where Are Chat Logs Stored?

### Storage Location: **Upstash Redis (Vercel KV)**

Your chat logs are stored in **Upstash Redis**, which is configured as Vercel KV in your project.

**Connection Details**:
- Service: Vercel KV (powered by Upstash Redis)
- Access: Via `@vercel/kv` package
- Location: `/lib/chatLogger.ts` (logging logic)
- Retention: 90 days (automatic TTL)

---

## 2. What Data Is Logged?

### Chat Log Structure

Each chat interaction stores the following data:

```typescript
interface ChatLog {
  id: string                    // Unique ID: "chat_1234567890_abc123"
  sessionId: string             // Session ID for grouping conversations
  userMessage: string           // User's question
  assistantResponse: string     // AI's response
  timestamp: number             // Unix timestamp (milliseconds)
  pageContext?: {               // Where user was when asking
    page: string                // e.g., "ai-tools", "about"
    category?: string           // e.g., "AI Works", "Leadership"
    videoId?: string            // YouTube video ID if viewing video
  }
  relevantDocs?: number         // How many vectors retrieved from Pinecone
  responseTime?: number         // API response time in milliseconds
  needsHumanReply?: boolean     // Flag if AI couldn't answer confidently
}
```

### Example Log Entry

```json
{
  "id": "chat_1705132800000_xyz789",
  "sessionId": "session_1705132800000_abc456",
  "userMessage": "Hung có kinh nghiệm về AI không?",
  "assistantResponse": "Có, Hung có kinh nghiệm về AI thông qua...",
  "timestamp": 1705132800000,
  "pageContext": {
    "page": "about",
    "category": null,
    "videoId": null
  },
  "relevantDocs": 5,
  "responseTime": 2340,
  "needsHumanReply": false
}
```

---

## 3. Redis Data Structure

### Keys and Storage Pattern

Your Redis database uses the following key structure:

```
chat:{id}                    → Individual chat log (Hash)
chats:{YYYY-MM-DD}           → List of chat IDs for specific date
stats:total-chats            → Counter for total chats
stats:top-questions          → Sorted set of most asked questions
inbox:needs-reply            → List of chats needing human response
```

### Example Keys

```
chat:chat_1705132800000_xyz789
chats:2025-01-13
stats:total-chats
stats:top-questions
inbox:needs-reply
```

---

## 4. How to Access Chat Logs

### Option 1: Via Admin Dashboard (Recommended)

**Current Status**: ⚠️ Chat Logs admin page not yet implemented

**When Implemented**:
1. Navigate to: `https://hungreo.com/admin/chatlogs`
2. View stats dashboard:
   - Total chats
   - Chats today/week/month
   - Top questions
   - Needs reply inbox
3. Filter by date range
4. Export to CSV/JSON

**Action Required**: Need to create admin UI for chat logs (see Section 6)

---

### Option 2: Via Script (Current Method)

Create a script to query Redis directly:

**Create `/scripts/get-chat-logs.js`**:

```javascript
require('dotenv').config({ path: '.env.local' })
const { kv } = require('@vercel/kv')

async function getChatLogs(startDate, endDate) {
  try {
    const logs = []
    const currentDate = new Date(startDate)

    while (currentDate <= endDate) {
      const dateStr = currentDate.toISOString().split('T')[0]
      console.log(`\n📅 Fetching logs for ${dateStr}...`)

      // Get all chat IDs for this date
      const chatIds = await kv.lrange(`chats:${dateStr}`, 0, -1)
      console.log(`   Found ${chatIds.length} chats`)

      // Fetch each chat log
      for (const chatId of chatIds) {
        const log = await kv.get(`chat:${chatId}`)
        if (log) {
          logs.push(log)
        }
      }

      currentDate.setDate(currentDate.getDate() + 1)
    }

    console.log(`\n✅ Total logs retrieved: ${logs.length}`)
    return logs
  } catch (error) {
    console.error('❌ Error fetching logs:', error)
    return []
  }
}

async function exportToJSON(logs, filename) {
  const fs = require('fs')
  fs.writeFileSync(filename, JSON.stringify(logs, null, 2))
  console.log(`\n💾 Exported to ${filename}`)
}

async function exportToCSV(logs, filename) {
  const fs = require('fs')

  // CSV Headers
  const headers = [
    'ID',
    'Timestamp',
    'Date',
    'Time',
    'User Message',
    'Assistant Response',
    'Page Context',
    'Relevant Docs',
    'Response Time (ms)',
    'Needs Reply'
  ].join(',')

  // CSV Rows
  const rows = logs.map(log => {
    const date = new Date(log.timestamp)
    return [
      log.id,
      log.timestamp,
      date.toLocaleDateString(),
      date.toLocaleTimeString(),
      `"${log.userMessage.replace(/"/g, '""')}"`,
      `"${log.assistantResponse.replace(/"/g, '""')}"`,
      log.pageContext?.page || 'unknown',
      log.relevantDocs || 0,
      log.responseTime || 0,
      log.needsHumanReply ? 'YES' : 'NO'
    ].join(',')
  })

  const csv = [headers, ...rows].join('\n')
  fs.writeFileSync(filename, csv)
  console.log(`\n📊 Exported to ${filename}`)
}

// Usage
;(async () => {
  const startDate = new Date('2025-01-01')
  const endDate = new Date('2025-01-31')

  console.log('🔍 Fetching chat logs...')
  console.log(`   Start: ${startDate.toDateString()}`)
  console.log(`   End: ${endDate.toDateString()}`)

  const logs = await getChatLogs(startDate, endDate)

  if (logs.length > 0) {
    // Export as JSON
    await exportToJSON(logs, 'chat-logs-jan-2025.json')

    // Export as CSV
    await exportToCSV(logs, 'chat-logs-jan-2025.csv')

    // Print summary
    console.log('\n📊 SUMMARY:')
    console.log(`   Total Chats: ${logs.length}`)
    console.log(`   Needs Reply: ${logs.filter(l => l.needsHumanReply).length}`)
    console.log(`   Avg Response Time: ${(logs.reduce((sum, l) => sum + (l.responseTime || 0), 0) / logs.length).toFixed(0)}ms`)
  } else {
    console.log('\n⚠️  No logs found for this date range')
  }
})()
```

**How to Use**:

```bash
# Run the script
node scripts/get-chat-logs.js

# Output files:
# - chat-logs-jan-2025.json (full data)
# - chat-logs-jan-2025.csv (spreadsheet format)
```

---

### Option 3: Via Vercel KV Dashboard

**Direct Database Access**:

1. Go to: https://vercel.com/dashboard
2. Select your project
3. Go to "Storage" tab
4. Click on your KV database
5. Use the "Data Browser" to query keys

**Useful Queries**:

```bash
# Get today's chat IDs
LRANGE chats:2025-01-13 0 -1

# Get specific chat log
GET chat:chat_1705132800000_xyz789

# Get total chats count
GET stats:total-chats

# Get top 10 questions
ZRANGE stats:top-questions 0 9 WITHSCORES REV

# Get chats needing reply
LRANGE inbox:needs-reply 0 -1
```

---

## 5. Analytics and Insights

### Available Metrics

**1. Chat Volume Metrics**:
- Total chats (all time)
- Chats today
- Chats this week (last 7 days)
- Chats this month (last 30 days)

**2. Content Metrics**:
- Top 10 most asked questions
- Question frequency (how many times asked)
- Average response time
- Percentage of chats needing human reply

**3. Context Metrics**:
- Which pages users ask from most
- Which video categories get most questions
- How many relevant documents retrieved per query

### How to Get Stats

**Via Script**:

```javascript
// Create /scripts/get-chat-stats.js
require('dotenv').config({ path: '.env.local' })
const { getChatStats } = require('../lib/chatLogger')

;(async () => {
  const stats = await getChatStats()
  console.log('📊 CHAT STATISTICS\n')
  console.log(`Total Chats: ${stats.totalChats}`)
  console.log(`Today: ${stats.chatsToday}`)
  console.log(`This Week: ${stats.chatsThisWeek}`)
  console.log(`This Month: ${stats.chatsThisMonth}`)
  console.log(`Needs Reply: ${stats.needsReply}`)
  console.log('\nTop Questions:')
  stats.topQuestions.forEach((q, i) => {
    console.log(`  ${i+1}. ${q.question} (${q.count}x)`)
  })
})()
```

**Run**:
```bash
node scripts/get-chat-stats.js
```

---

## 6. Creating Admin Dashboard for Chat Logs

**Recommended Implementation**:

Create a new admin page at `/app/admin/chatlogs/page.tsx`:

**Features to Include**:

1. **Stats Dashboard**:
   - Total chats counter
   - Today/Week/Month breakdown
   - Top questions chart
   - Response time graph

2. **Chat Log Table**:
   - Sortable columns (date, time, needs reply)
   - Filter by date range
   - Search by message content
   - Pagination (20 per page)

3. **Needs Reply Inbox**:
   - Separate view for chats flagged as needing human response
   - Mark as replied button
   - Email notification toggle

4. **Export Functionality**:
   - Export to CSV button
   - Export to JSON button
   - Date range selector

**UI Component Structure**:

```
/app/admin/chatlogs/page.tsx       → Main page
/components/admin/ChatLogsManager.tsx  → Manager component
/components/admin/ChatLogTable.tsx     → Table view
/components/admin/ChatStats.tsx        → Stats dashboard
/app/api/admin/chatlogs/route.ts       → API endpoint (GET, POST)
```

**Estimated Implementation Time**: 6-8 hours

---

## 7. Email Notifications

### How It Works

When the chatbot can't answer confidently, it:

1. Sets `needsHumanReply: true` in the log
2. Adds chat ID to `inbox:needs-reply` list
3. Sends email notification to admin

**Email Triggers** (from `lib/chatLogger.ts`):

- "i don't have that information"
- "i'm not sure"
- "i cannot answer"
- "tôi không có thông tin"
- "liên hệ trực tiếp"

**Email Configuration**:

Currently uses `lib/emailNotifier.ts` (check implementation details there).

---

## 8. Data Retention and Privacy

### Automatic Cleanup

- **TTL**: 90 days (logs auto-expire after 90 days)
- **Daily lists**: Not auto-cleaned (accumulate forever unless manually deleted)
- **Stats counters**: Persist forever

### Manual Cleanup Script

```javascript
// /scripts/cleanup-old-chats.js
require('dotenv').config({ path: '.env.local' })
const { kv } = require('@vercel/kv')

async function cleanupOldChats(daysOld) {
  const cutoffDate = new Date()
  cutoffDate.setDate(cutoffDate.getDate() - daysOld)

  console.log(`🗑️  Cleaning up chats older than ${daysOld} days`)
  console.log(`   Cutoff date: ${cutoffDate.toDateString()}`)

  let deletedCount = 0
  const currentDate = new Date('2025-01-01') // Start from project launch

  while (currentDate < cutoffDate) {
    const dateStr = currentDate.toISOString().split('T')[0]

    // Delete daily list
    await kv.del(`chats:${dateStr}`)
    deletedCount++

    currentDate.setDate(currentDate.getDate() + 1)
  }

  console.log(`✅ Deleted ${deletedCount} daily chat lists`)
}

cleanupOldChats(90)
```

### Privacy Compliance

**User Data**:
- No personal information collected (no names, emails, IPs in logs)
- Only stores: message content, timestamp, page context
- Complies with GDPR (no PII stored)

**If User Requests Data Deletion**:
- Not applicable (no user accounts, no PII)
- Logs auto-expire after 90 days

---

## 9. Improving Your Website Based on Logs

### Analysis Workflow

**Weekly Review**:

1. **Run stats script** to see top questions
2. **Identify gaps**: What questions are users asking that AI can't answer?
3. **Update content**: Add blog posts, videos, or documents to fill gaps
4. **Re-generate embeddings**: Upload new content to Vector DB
5. **Test chatbot**: Verify AI can now answer previously unanswerable questions

**Monthly Review**:

1. **Export full logs** to CSV
2. **Analyze trends**: Are certain topics trending?
3. **Content strategy**: Plan new content based on user interest
4. **Performance**: Check average response time (should be <3 seconds)

### Red Flags to Watch For

- **High "needs reply" rate** (>10%) → AI not confident enough, need more content
- **Same question asked many times** → Popular topic, create dedicated content
- **Long response times** (>5 seconds) → OpenAI API slow, consider caching
- **Spam patterns** → Multiple identical messages, need rate limiting

---

## 10. Quick Reference Commands

### Get Chat Logs for Specific Date

```javascript
const logs = await getChatLogs(
  new Date('2025-01-13'),
  new Date('2025-01-13')
)
```

### Get Stats

```javascript
const stats = await getChatStats()
```

### Get Needs Reply Inbox

```javascript
const { getNeedsReplyChats } = require('./lib/chatLogger')
const needsReply = await getNeedsReplyChats()
```

### Mark Chat as Replied

```javascript
const { markAsReplied } = require('./lib/chatLogger')
await markAsReplied('chat_1705132800000_xyz789')
```

---

## 11. Troubleshooting

### Issue: No logs showing up

**Possible Causes**:
- KV_REST_API_URL or KV_REST_API_TOKEN not set
- Chat logging disabled
- Date range incorrect

**Solution**:
```bash
# Check environment variables
echo $KV_REST_API_URL

# Test connection
node -e "require('dotenv').config({path:'.env.local'}); const {kv} = require('@vercel/kv'); kv.get('stats:total-chats').then(console.log)"
```

### Issue: Stats showing zero

**Possible Causes**:
- No chats logged yet
- Stats counter reset
- Wrong date format

**Solution**:
```javascript
// Manually check Redis
await kv.get('stats:total-chats')  // Should return number
await kv.llen('chats:2025-01-13')  // Should return count for today
```

---

## 12. Next Steps

**Immediate Actions**:

1. ✅ Chat logging already implemented and working
2. ⚠️ Create `/scripts/get-chat-logs.js` for easy export
3. ⚠️ Create `/scripts/get-chat-stats.js` for quick stats
4. ⚠️ Build admin dashboard UI (`/admin/chatlogs`)
5. ⚠️ Set up weekly review process

**Future Enhancements**:

- Add chart visualizations (Chart.js or Recharts)
- Implement real-time dashboard with auto-refresh
- Add export scheduling (weekly reports via email)
- Integrate with Google Analytics for cross-analysis
- Add sentiment analysis to understand user satisfaction

---

## Summary

Your chat logs are stored in **Upstash Redis (Vercel KV)** with:
- ✅ 90-day retention
- ✅ Automatic logging for every chat
- ✅ Email notifications for unanswerable questions
- ✅ Built-in analytics functions

**To pull reports right now**:
1. Use the Vercel KV Dashboard (manual)
2. Create the export script from Section 4
3. Run `node scripts/get-chat-logs.js`

**For better long-term solution**:
1. Build admin dashboard UI
2. Implement one-click export
3. Set up regular review process

---

**Document Status**: Complete and Ready to Use
**Scripts**: Ready to be created (copy-paste from Section 4)
