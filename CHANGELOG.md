# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Fixed - 2025-01-12

#### Critical: SessionProvider Integration
- **Problem**: Navigation component used `useSession()` hook but app layout didn't wrap with `SessionProvider`
  - Error: "useSession() called outside SessionProvider context"
  - Navigation crashed on load, admin link didn't display
- **Solution**: Added `SessionProvider` wrapper to `app/layout.tsx`
  - Imported `SessionProvider` from `@/components/providers/SessionProvider`
  - Wrapped entire app structure within provider
  - Maintains session context across all client components
- **Files Modified**:
  - `app/layout.tsx` - Added SessionProvider wrapper
- **Impact**: Navigation now works correctly, admin link displays when authenticated

#### Documentation: Chrome Path Configuration
- **Problem**: Puppeteer websiteScraper.ts used `process.env.CHROME_PATH` but no documentation in `.env.example`
  - Windows/Linux developers encountered "Chrome not found" errors
  - Unclear how to configure for different operating systems
- **Solution**: Added comprehensive Puppeteer configuration section to `.env.example`
  - Platform-specific Chrome installation paths (MacOS, Windows, Linux)
  - Clear distinction between local development and production (Vercel)
  - Fallback behavior explanation
- **Files Modified**:
  - `.env.example` - Added CHROME_PATH configuration section (lines 57-85)
- **Impact**: Better developer experience across all platforms, prevents setup errors

### Enhanced - 2025-01-12

#### Chatbot Rich Text Formatting
- **Goal**: Make chatbot responses more engaging and readable with markdown formatting
- **Implementation**: Enhanced system prompt with formatting guidelines (prompt engineering only)
  - **Bold text** for key points, names, important terms
  - Bullet points (•) for lists with 2+ items
  - Strategic emoji usage (1-2 per response):
    - 🎓 education, learning, degrees
    - 💼 work, career, professional experience
    - 🚀 projects, innovations, achievements
    - 🏆 awards, accomplishments, success
    - 💡 skills, expertise, insights
    - 🌟 highlights, special mentions
    - 🏠 family, personal life, values
    - 💪 strengths, resilience, growth
    - 🎯 goals, focus areas, objectives
  - Clear section structure with bold headings
  - Short paragraphs (2-3 sentences max) for readability
- **Technical Details**:
  - Uses GPT-4o-mini native markdown support
  - No frontend changes required (existing markdown renderer)
  - Streaming response preserves formatting
- **Files Modified**:
  - `app/api/chat/route.ts` - Enhanced system prompt (lines 80-96)
- **Impact**:
  - More engaging, scannable responses
  - Better visual hierarchy
  - Professional + friendly tone maintained
  - Improved user experience across all chatbot features

### Added - 2025-01-09

#### Vector Database Management System
- **New Admin Page**: `/admin/vectors` - Comprehensive Pinecone vector database management interface
  - Real-time statistics dashboard showing counts by vector type (Website, Documents, Videos, Unknown)
  - Interactive vector list view with metadata inspection
  - Selective deletion by type (website/document/video) or individual vectors
  - "Reset All Data" option with confirmation dialog
  - Loading states and error handling

- **New API Endpoints**:
  - `GET /api/admin/vectors/stats` - Retrieve vector statistics by type
  - `GET /api/admin/vectors?type={website|document|video}` - List vectors filtered by type
  - `DELETE /api/admin/vectors?type={website|document|video|all}` - Delete vectors by type
  - `DELETE /api/admin/vectors?id={vectorId}` - Delete specific vector by ID

- **Pinecone Management Scripts**:
  - `scripts/clear-pinecone-website.js` - Delete only website-scraped vectors
  - `scripts/clear-pinecone-documents.js` - Delete only document vectors
  - `scripts/clear-pinecone-videos.js` - Delete only video vectors
  - `scripts/clear-pinecone.js` - Enhanced with confirmation prompt and usage instructions

- **Vector Categorization**: All vectors now include `vectorType` metadata field for filtering:
  - `website` - Vectors from website scraping
  - `document` - Vectors from uploaded documents
  - `video` - Vectors from YouTube transcripts

### Changed

#### Document Management Improvements
- Enhanced vector metadata in document approval workflow:
  - Added `vectorType: 'document'` for categorization
  - Added `uploadedAt` and `uploadedBy` fields
  - Improved logging during embedding creation and deletion

- Fixed PDF processing Buffer/Uint8Array type mismatch:
  - Convert Buffer to Uint8Array before passing to `unpdf.extractText()`
  - Resolves "Please provide binary data as 'Uint8Array', rather than 'Buffer'" error

- Improved in-memory document storage persistence:
  - Use Node.js global object to survive Next.js hot reloads
  - Prevents 404 errors when updating document status during development

- Enhanced Pinecone deletion logging:
  - Added comprehensive logs for document approval process
  - Added fallback handling for documents without `pineconeIds`
  - Better error messages for debugging

#### Admin Dashboard
- Added "Vector DB" navigation tab linking to `/admin/vectors`

### Fixed
- **Bug**: PDF upload failed with Uint8Array type error
  - **Solution**: Convert Buffer to Uint8Array in `lib/documentProcessor.ts`
- **Bug**: Document status update returned 404 after hot reload
  - **Solution**: Use global object for in-memory storage in `lib/documentManager.ts`
- **Bug**: Unable to distinguish and selectively delete vector types
  - **Solution**: Implemented vector categorization system with metadata filtering

### Technical Details

#### Files Modified
- `app/api/admin/documents/[id]/route.ts` - Enhanced metadata, improved logging
- `lib/documentManager.ts` - Global object pattern for persistence
- `lib/documentProcessor.ts` - Buffer to Uint8Array conversion
- `components/admin/AdminDashboard.tsx` - Added Vector DB navigation link
- `README.md` - Updated with admin features documentation

#### Files Added
- `app/admin/vectors/page.tsx` - Vector management page route
- `app/api/admin/vectors/stats/route.ts` - Vector statistics endpoint
- `app/api/admin/vectors/route.ts` - Vector list and deletion endpoints
- `components/admin/VectorManager.tsx` - Vector management UI component
- `scripts/clear-pinecone-website.js` - Selective website vector deletion
- `scripts/clear-pinecone-documents.js` - Selective document vector deletion
- `scripts/clear-pinecone-videos.js` - Selective video vector deletion

#### Breaking Changes
- None

#### Migration Notes
- Existing vectors in Pinecone without `vectorType` metadata will show as "Unknown" type
- To re-categorize old vectors:
  1. For website vectors: Run website scraping again
  2. For document vectors: Re-upload and approve documents
  3. For video vectors: Re-process YouTube videos

### Security
- Admin-only access to Vector Management endpoints via NextAuth session validation
- All vector deletion operations require confirmation dialogs
- "Delete All" script requires typing "DELETE ALL" to confirm

---

## [Previous Releases]

### Phase 1 - Core Website (Completed)
- Homepage with hero section
- About Me page
- Projects Portfolio
- Blog system with MDX
- Contact page
- Responsive design
- SEO optimization

### Phase 2 - Initial AI Features (Completed)
- RAG-powered chatbot
- Admin authentication
- Document upload system
- Website scraping functionality
- Chat logging
