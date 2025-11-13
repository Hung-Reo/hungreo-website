# Admin Dashboard for Chat Logs - Implementation Plan

**Status:** 📝 **PLANNED** (Not Yet Implemented)
**Priority:** Phase 2 (Post-Production)
**Estimated Time:** 6-8 hours
**Dependencies:** Security Phase 1 ✅ (Completed)

---

## Overview

Build a comprehensive admin dashboard to view, filter, analyze, and export chatbot conversation logs stored in Upstash Redis (Vercel KV).

**Goal:** Enable the admin to:
1. View all chat interactions
2. Filter by date range, keywords, needs reply status
3. Analyze chat statistics (volume, response time, top questions)
4. Export data to CSV/JSON for further analysis
5. Mark chats as "replied" or "resolved"

---

## User Stories

### As an admin, I want to:
1. **View all chat logs** in a paginated table (20 per page)
2. **Filter chats** by date range, needs reply status, keywords
3. **See chat statistics** (total chats, today/week/month, avg response time)
4. **See top questions** (most frequently asked)
5. **Export chat logs** to CSV or JSON for analysis
6. **Mark chats as replied** to track which questions have been addressed
7. **View chat details** (full conversation, page context, relevant docs)

---

## Features Breakdown

### 1. Chat Logs Table 📊
**Location:** `/app/admin/chatlogs/page.tsx`

**Columns:**
- ID (truncated, e.g., `chat_170...xyz789`)
- Timestamp (formatted: `Jan 13, 2025 14:30`)
- User Message (truncated to 100 chars)
- Assistant Response (truncated to 100 chars)
- Page Context (e.g., `about`, `ai-tools`)
- Response Time (in ms or seconds)
- Needs Reply (badge: ✅ Yes / ❌ No)
- Actions (View Details, Mark as Replied)

**Features:**
- Sortable columns (timestamp, response time)
- Pagination (20 logs per page)
- Expandable rows (click to see full message)
- Search/filter bar (keywords, date range)

### 2. Chat Statistics Dashboard 📈
**Location:** Top section of `/app/admin/chatlogs/page.tsx`

**Metrics:**
- **Total Chats** (all time)
- **Chats Today** (last 24 hours)
- **Chats This Week** (last 7 days)
- **Chats This Month** (last 30 days)
- **Needs Reply** (count of unanswered questions)
- **Avg Response Time** (in milliseconds)

**Visualizations:**
- Bar chart: Chats per day (last 7 days)
- Pie chart: Chats by page context
- Line chart: Response time trend (last 30 days)

**Libraries:**
- Use **Recharts** (already popular in Next.js ecosystem)
- Or **Chart.js** (simpler, but needs React wrapper)

### 3. Top Questions View 🔝
**Location:** Sidebar or separate tab

**Data Source:** `stats:top-questions` (sorted set in Redis)

**Display:**
- Question text
- Frequency count (how many times asked)
- Last asked timestamp

**Use Case:** Identify content gaps and FAQ opportunities

### 4. Needs Reply Inbox 📥
**Location:** Separate tab in `/app/admin/chatlogs/page.tsx`

**Data Source:** `inbox:needs-reply` (list in Redis)

**Features:**
- Show only chats with `needsHumanReply: true`
- Mark as replied button → removes from inbox
- Email notification toggle (on/off)

### 5. Export Functionality 📥
**Buttons:**
- Export to CSV
- Export to JSON

**Implementation:**
- Client-side download (use `file-saver` library)
- Or server-side API endpoint (`/api/admin/chatlogs/export`)

**CSV Format:**
```csv
ID,Timestamp,Date,Time,User Message,Assistant Response,Page Context,Relevant Docs,Response Time (ms),Needs Reply
chat_123,1705132800000,2025-01-13,14:30:00,"Hung có kinh nghiệm AI không?","Có, Hung có...",about,5,2340,NO
```

**JSON Format:**
```json
[
  {
    "id": "chat_123",
    "timestamp": 1705132800000,
    "userMessage": "Hung có kinh nghiệm AI không?",
    "assistantResponse": "Có, Hung có...",
    "pageContext": { "page": "about" },
    "relevantDocs": 5,
    "responseTime": 2340,
    "needsHumanReply": false
  }
]
```

### 6. Chat Details Modal 🔍
**Trigger:** Click on row in table

**Display:**
- Full user message (no truncation)
- Full assistant response (formatted markdown)
- Page context (page, category, videoId)
- Relevant docs count
- Response time
- Session ID
- Timestamp (formatted)

**Actions:**
- Mark as Replied
- Copy to Clipboard
- Close

---

## UI/UX Design

### Layout Structure

```
┌─────────────────────────────────────────────────────────────┐
│                     Admin Dashboard Header                   │
│                    (Navigation: Documents | Videos | Chat Logs) │
└─────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────┐
│                     Chat Logs Statistics                     │
│  ┌──────────┬──────────┬──────────┬──────────┬──────────┐  │
│  │  Total   │  Today   │ This Week│This Month│  Needs   │  │
│  │  Chats   │          │          │          │  Reply   │  │
│  │  1,234   │    45    │   312    │   890    │    12    │  │
│  └──────────┴──────────┴──────────┴──────────┴──────────┘  │
└─────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────┐
│  Filters & Actions                                           │
│  ┌───────────────┬───────────────┬──────────┬──────────┐   │
│  │ Date Range    │ Needs Reply   │ Search   │ Export ▼ │   │
│  │ [Last 7 days ▼]│ [All ▼]      │ [______] │          │   │
│  └───────────────┴───────────────┴──────────┴──────────┘   │
└─────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────┐
│                     Chat Logs Table                          │
│  Timestamp          User Message         Response    Needs   │
│  ─────────────────  ──────────────────── ────────── ─────   │
│  Jan 13, 14:30      Hung có kinh ...     Có, Hung... ❌      │
│  Jan 13, 14:25      Tell me about...     Hung Dinh... ❌      │
│  Jan 13, 14:20      What is AI?          I don't ... ✅      │
│  ...                                                          │
│  ┌──────────────────────────────────────────────────────┐   │
│  │            Pagination: < 1 2 3 4 5 >                 │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### Color Scheme (Match Admin Theme)
- Primary: Blue (#3B82F6)
- Success: Green (#10B981)
- Warning: Yellow (#F59E0B)
- Danger: Red (#EF4444)
- Background: Gray (#F9FAFB)
- Text: Dark Gray (#1F2937)

### Components to Reuse
- Use existing admin layout (`/app/admin/layout.tsx`)
- Use existing table styles (similar to Documents/Videos managers)
- Use existing card components (for stats)

---

## Technical Implementation

### File Structure

```
/app/admin/chatlogs/
├── page.tsx                  # Main chat logs page
├── components/
│   ├── ChatLogsTable.tsx     # Table component
│   ├── ChatLogsStats.tsx     # Statistics dashboard
│   ├── ChatLogsFilters.tsx   # Filter controls
│   ├── ChatDetailsModal.tsx  # Modal for full chat view
│   └── ExportButton.tsx      # Export to CSV/JSON
/app/api/admin/chatlogs/
├── route.ts                  # GET: Fetch logs, POST: Mark as replied
├── export/route.ts           # GET: Export to CSV/JSON
/lib/
├── chatLogger.ts             # (Already exists) getChatLogs, getChatStats, markAsReplied
```

### API Endpoints

#### 1. `GET /api/admin/chatlogs`
**Query Params:**
- `startDate` (ISO string, default: 30 days ago)
- `endDate` (ISO string, default: today)
- `needsReply` (boolean, optional)
- `search` (string, optional)
- `limit` (number, default: 20)
- `offset` (number, default: 0)

**Response:**
```json
{
  "success": true,
  "logs": [
    {
      "id": "chat_123",
      "sessionId": "session_123",
      "userMessage": "...",
      "assistantResponse": "...",
      "timestamp": 1705132800000,
      "pageContext": { "page": "about" },
      "relevantDocs": 5,
      "responseTime": 2340,
      "needsHumanReply": false
    }
  ],
  "total": 1234,
  "pagination": {
    "limit": 20,
    "offset": 0,
    "totalPages": 62
  }
}
```

#### 2. `POST /api/admin/chatlogs/mark-replied`
**Body:**
```json
{
  "chatId": "chat_123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Chat marked as replied"
}
```

#### 3. `GET /api/admin/chatlogs/export`
**Query Params:**
- `format` (`csv` or `json`)
- `startDate` (ISO string)
- `endDate` (ISO string)

**Response:**
- CSV file download
- Or JSON file download

### Data Fetching Strategy

#### Option 1: Server-Side Rendering (SSR)
**Pros:**
- Better for SEO (not critical for admin pages)
- No loading state needed

**Cons:**
- Slower page loads
- Full page refresh on filter changes

#### Option 2: Client-Side Fetching (CSR)
**Pros:**
- Faster page loads
- Instant filter updates (no page refresh)
- Better UX for dynamic data

**Cons:**
- Need loading states
- More client-side code

**Recommendation:** Use **Client-Side Fetching** with SWR or React Query
- Use `useSWR` from `swr` library (already popular in Next.js)
- Auto-refresh every 30 seconds (for real-time updates)
- Cache results for better performance

### Implementation Steps

#### Step 1: Create API Endpoint (2 hours)
1. Create `/app/api/admin/chatlogs/route.ts`
2. Implement `getChatLogs` function in `lib/chatLogger.ts`
3. Add filtering logic (date range, needs reply, search)
4. Add pagination logic
5. Test with Postman or curl

#### Step 2: Create Table Component (2 hours)
1. Create `/app/admin/chatlogs/components/ChatLogsTable.tsx`
2. Use `@tanstack/react-table` for sorting, filtering, pagination
3. Add expandable rows for full message view
4. Add "Mark as Replied" button
5. Style with Tailwind CSS

#### Step 3: Create Statistics Dashboard (1.5 hours)
1. Create `/app/admin/chatlogs/components/ChatLogsStats.tsx`
2. Fetch stats from `getChatStats()` (already exists in `lib/chatLogger.ts`)
3. Display metrics in card grid
4. Add optional charts (Recharts)

#### Step 4: Create Filters Component (1 hour)
1. Create `/app/admin/chatlogs/components/ChatLogsFilters.tsx`
2. Date range picker (use `react-datepicker` or native `<input type="date">`)
3. Needs Reply dropdown
4. Search input
5. Export button dropdown

#### Step 5: Implement Export Functionality (1.5 hours)
1. Create `/app/api/admin/chatlogs/export/route.ts`
2. Convert logs to CSV format
3. Convert logs to JSON format
4. Trigger download on client side
5. Test with large datasets

#### Step 6: Create Main Page (1 hour)
1. Create `/app/admin/chatlogs/page.tsx`
2. Compose all components
3. Add SWR for data fetching
4. Add loading states
5. Add error handling

#### Step 7: Testing & Polish (1 hour)
1. Test all filters
2. Test pagination
3. Test export functionality
4. Test mark as replied
5. Fix bugs and improve UX

---

## Dependencies to Install

```bash
npm install swr
npm install @tanstack/react-table
npm install recharts  # For charts (optional)
npm install react-datepicker  # For date range picker (optional)
npm install file-saver  # For client-side file download
```

**Total Size:** ~500KB (minified)

---

## Performance Considerations

### Redis Query Optimization
- **Problem:** Fetching 1000+ chat logs can be slow
- **Solution:** Use pagination (max 20-50 logs per page)
- **Caching:** Use SWR to cache results for 30 seconds

### Large Exports
- **Problem:** Exporting 10,000+ logs can timeout
- **Solution:** Add streaming response for large datasets
- **Alternative:** Generate export in background, email download link

### Real-Time Updates
- **Option 1:** Polling (SWR auto-refresh every 30s)
- **Option 2:** WebSockets (overkill for admin dashboard)
- **Recommendation:** Use polling (simpler, sufficient for admin use)

---

## Security Considerations

### Authentication
- ✅ Already secured via middleware (`/api/admin/*`)
- ✅ Admin session required

### Rate Limiting
- ✅ Already implemented (30 req/min for admin APIs)

### Data Sanitization
- ⚠️ **TODO:** Sanitize user messages before displaying (prevent XSS)
- Use `dangerouslySetInnerHTML` carefully (or avoid it)
- Use markdown library with sanitization (e.g., `remark`)

### Export Limits
- **TODO:** Limit export to max 10,000 logs per request
- Prevent abuse by adding export rate limiting (5 exports per hour)

---

## Future Enhancements (Phase 3)

### 1. Real-Time Dashboard
- Add WebSocket support for live chat monitoring
- Show "new chat" notification badge

### 2. Advanced Analytics
- Sentiment analysis (positive/negative/neutral)
- User satisfaction score (based on response quality)
- Category-based analytics (group by page context)

### 3. AI-Powered Insights
- Automatically suggest FAQ questions
- Detect common issues/complaints
- Generate weekly summary report

### 4. Email Notifications
- Daily digest of unanswered questions
- Alert when >10 chats need reply
- Weekly analytics report

---

## Success Criteria

### Must Have
- ✅ View all chat logs in paginated table
- ✅ Filter by date range
- ✅ Filter by needs reply status
- ✅ Export to CSV
- ✅ View chat statistics
- ✅ Mark chats as replied

### Should Have
- ✅ Search by keywords
- ✅ Export to JSON
- ✅ View top questions
- ✅ Expandable row details

### Nice to Have
- ⚪ Charts/visualizations
- ⚪ Real-time updates
- ⚪ Email notifications

---

## Timeline

| Task | Estimated Time | Status |
|------|---------------|--------|
| API Endpoint | 2 hours | 📝 Planned |
| Table Component | 2 hours | 📝 Planned |
| Statistics Dashboard | 1.5 hours | 📝 Planned |
| Filters Component | 1 hour | 📝 Planned |
| Export Functionality | 1.5 hours | 📝 Planned |
| Main Page | 1 hour | 📝 Planned |
| Testing & Polish | 1 hour | 📝 Planned |
| **TOTAL** | **~10 hours** | 📝 Planned |

**Note:** Initial estimate was 6-8 hours, but with charts and polish, 10 hours is more realistic.

---

## References

- Chat Logs Guide: `docs/CHAT_LOGS_AND_ANALYTICS.md`
- Existing Chat Logger: `lib/chatLogger.ts`
- SWR Documentation: https://swr.vercel.app/
- TanStack Table: https://tanstack.com/table/v8
- Recharts: https://recharts.org/

---

**Document Status:** 📝 Ready for Implementation
**Last Updated:** January 13, 2025
**Next Action:** Review with stakeholder (Hung) before starting implementation
