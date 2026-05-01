# Environment Separation Guide: Production vs Localhost

**Last Updated:** 2025-12-04
**Project:** Hungreo Website

---

## Overview

This document outlines the strategy for separating production and localhost development environments to prevent data contamination, reduce costs, and improve development workflow.

---

## Current Status

### ✅ Already Separated

#### **Redis/KV Database (Upstash)**
- **Production DB:** `large-heron-11467`
  - URL: `https://large-heron-11467.upstash.io`
  - Used in: `.env`, `.env.production`, `.env.production.local`
  - Stores: Videos, content, blog posts, projects, chat logs, contact requests, documents, rate limiting, admin auth

- **Development DB:** `intent-peacock-38586`
  - URL: `https://intent-peacock-38586.upstash.io`
  - Used in: `.env.local`
  - Same data structure as production, safe for testing

**Status:** ✅ Fully separated, no action needed

---

### ❌ Needs Separation (MUST-DO)

#### **1. Pinecone Vector Database** 🔴 CRITICAL

**Why Critical:**
- Shared index means localhost test embeddings pollute production search results
- Users see incorrect/test data in chatbot responses
- Direct impact on user experience

**Current State:**
- API Key: `pcsk_2Jp3bp_8rdgyVGxJ7whhKCNdurg2pzkJ1WcbZxnzN2dSQmTZYSb7rGMJqQ4d8PyYE96ss5`
- Index: `hungreo-website` (shared)
- Dimensions: 1536 (text-embedding-3-small)
- Metric: Cosine similarity

**Files Using Pinecone:**
- `lib/pinecone.ts` - Main Pinecone client
- `lib/documentManager.ts` - Document embeddings on approval
- `lib/websiteScraper.ts` - Website content embeddings
- `lib/videoManager.ts` - Video embeddings
- `app/api/chat/route.ts` - Chatbot RAG search

**Separation Plan:**
1. Create new Pinecone index: `hungreo-website-dev`
   - Same configuration (1536 dimensions, cosine metric)
   - Free tier allows multiple indexes
2. Add environment variable: `PINECONE_INDEX_NAME`
   - Production: `hungreo-website`
   - Localhost: `hungreo-website-dev`
3. Update `lib/pinecone.ts` to read index name from env
4. Test chatbot and search functionality

**Estimated Effort:** 1-2 hours
**Risk Level:** High (user-facing)

---

#### **2. Vercel Blob Storage** ✅ SHARED (Acceptable)

**Decision: Using shared blob storage for both environments**
- Single developer project - easy to manage
- Infrequent uploads - low risk of clutter
- Cost-effective - no additional storage needed
- Recommendation: Use `test-` or `dev-` prefix for test files

**Current State:**
- Token: `vercel_blob_rw_DOX8eFze0xmUnVT6_OhCgLFYi3Sw4heV9vlWnkKPStORKTu` (shared)
- Used for: Images, CVs, documents >4.5MB

**Files Using Blob:**
- `lib/documentManager.ts` - Document uploads
- `app/api/admin/content/about/upload-cv/route.ts` - CV uploads
- `app/api/admin/content/about/upload-photo/route.ts` - Profile photo
- `app/api/admin/upload/image/route.ts` - Image uploads
- `app/api/admin/content/projects/upload/route.ts` - Project images

**Management Strategy:**
1. Use file naming convention:
   - Test files: prefix with `test-` or `dev-`
   - Production files: normal naming
2. Regularly clean up test files from Vercel dashboard
3. Monitor storage usage to stay within free tier

**No Code Changes Needed:** Shared token works for both environments
**Risk Level:** Low (manageable with naming convention)

---

### ⚠️ Optional Separations (Can Manage Manually)

#### **3. OpenAI API**
**Current:** Shared key (cost impact)
**Workaround:** Monitor usage, careful testing
**Separation Cost:** ~$5-10/month for dev key

#### **4. YouTube Data API**
**Current:** Shared key (quota 10k/day)
**Workaround:** Test imports sparingly
**Separation Cost:** Free (new Google Cloud project)

#### **5. NextAuth Secret**
**Current:** Shared secret (low risk)
**Impact:** Minimal (JWT tokens don't work cross-domain)
**Separation:** `openssl rand -base64 32`

#### **6. Email Services (Resend + Gmail)**
**Current:** Shared credentials
**Workaround:** Delete test emails manually
**Separation:** Console logging in development

---

## Environment File Structure

### Production Files
```
.env                      # Production defaults (committed to repo, no secrets)
.env.production          # Production-specific variables (Vercel)
.env.production.local    # Production secrets (Vercel, not in repo)
```

### Development Files
```
.env.local               # Development-specific variables (gitignored)
.env.development         # Development defaults (optional)
```

### Environment Variable Hierarchy (Next.js)
1. `.env.local` (highest priority for development)
2. `.env.development` / `.env.production` (environment-specific)
3. `.env` (shared defaults)

---

## Implementation Checklist

### Phase 1: Critical Separations (MUST-DO)

- [ ] **Pinecone Vector Index**
  - [ ] Create `hungreo-website-dev` index in Pinecone dashboard
  - [ ] Add `PINECONE_INDEX_NAME` to `.env.production` = `hungreo-website`
  - [ ] Add `PINECONE_INDEX_NAME` to `.env.local` = `hungreo-website-dev`
  - [ ] Update `lib/pinecone.ts` to read index name from env
  - [ ] Test chatbot RAG search on localhost
  - [ ] Deploy and test on production

- [ ] **Vercel Blob Storage**
  - [ ] Create new Blob store in Vercel dashboard for development
  - [ ] Add development token to `.env.local`
  - [ ] Keep production token in `.env.production.local`
  - [ ] Test file uploads on localhost
  - [ ] Verify production uploads still work

### Phase 2: Verification

- [ ] **Redis Database**
  - [ ] Verify `.env.local` uses development database
  - [ ] Add startup validation to prevent production database in development

- [ ] **Environment Validation**
  - [ ] Add `NODE_ENV` checks in critical paths
  - [ ] Log which environment is active on startup
  - [ ] Document environment variables in `.env.example`

### Phase 3: Documentation

- [ ] Update README.md with environment setup instructions
- [ ] Document how to create development resources
- [ ] Add troubleshooting guide for common environment issues

---

## Testing Plan

### Localhost Testing
1. **Pinecone:**
   - Upload test document → verify it goes to dev index
   - Ask chatbot question → verify search uses dev index
   - Check Pinecone dashboard → confirm no prod index changes

2. **Vercel Blob:**
   - Upload test image → verify it goes to dev storage
   - Check Vercel dashboard → confirm no prod storage changes

3. **Redis:**
   - Create test video/blog → verify it goes to dev database
   - Check Upstash dashboard → confirm no prod database changes

### Production Testing
1. Verify all existing data still accessible
2. Test chatbot responses (should not see dev/test data)
3. Verify file uploads work correctly
4. Check admin dashboard functionality

---

## Cost Estimation

| Resource | Production Cost | Development Cost | Total Monthly |
|----------|----------------|------------------|---------------|
| Redis/KV | Free tier | Free tier | $0 |
| Pinecone | Free tier | Free tier | $0 |
| Vercel Blob | Shared | Shared | ~$5-10 (no change) |
| OpenAI | Shared | Shared | Current usage |
| YouTube | Shared | Shared | $0 |
| **Total** | - | - | **$0 additional cost** |

---

## Risk Assessment

### High Risk (User-Facing)
- ⚠️ **Pinecone index** → MUST separate to prevent test data in chatbot
- **Status:** Development index configured, user needs to create it
- **Mitigation:** Follow SETUP_DEV_PINECONE.md

### Low Risk (Manageable)
- ✅ **Redis separated** → No risk
- ✅ **Vercel Blob shared** → Acceptable for single developer, use naming convention
- ⚠️ **OpenAI shared key** → Cost monitoring required, careful testing
- ⚠️ **YouTube shared key** → Quota monitoring required, infrequent usage

---

## Rollback Plan

If issues occur after separation:

1. **Pinecone:**
   - Revert `PINECONE_INDEX_NAME` to `hungreo-website` in `.env.local`
   - Restart dev server
   - (Production unaffected)

3. **Redis:**
   - Update `.env.local` back to production credentials (NOT recommended)

---

## Future Improvements

1. **CI/CD Environment Validation:**
   - Add pre-deployment checks for correct environment variables
   - Prevent accidental deployment with wrong credentials

2. **Monitoring:**
   - Set up alerts for unusual API usage
   - Monitor storage costs by environment

3. **Development Tooling:**
   - Create scripts to seed development databases
   - Automate environment setup for new developers

---

## Support & Questions

**Documentation Owner:** AI Assistant (Claude)
**Last Reviewed:** 2025-12-04
**Next Review:** After implementation completion

For questions or issues, refer to:
- Project README.md
- Vercel documentation
- Pinecone documentation
- Upstash documentation
