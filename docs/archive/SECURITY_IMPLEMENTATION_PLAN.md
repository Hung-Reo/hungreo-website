# Security Implementation Plan
**For Production Deployment - Minimum Requirements**

> **Status**: Planning Phase - No Code Implementation Yet
>
> **Last Updated**: Jan 13, 2025
>
> **Objective**: Implement minimum security requirements to confidently deploy to production

---

## Overview

This document outlines the security implementation plan for the Hungreo Website, focusing on critical security measures needed before production deployment. The plan prioritizes high-impact, essential security features while deferring nice-to-have improvements for post-launch iterations.

---

## Phase 1: Critical Security Issues (MUST HAVE)

### 1. Rate Limiting for Chatbot API 🚨 **HIGH PRIORITY**

**Problem**:
- Chatbot API (`/api/chat`) currently has no rate limiting
- Vulnerable to abuse/spam attacks
- Could result in unexpected OpenAI API costs
- Susceptible to DoS attacks

**Solution**: Implement Upstash Rate Limit

**Technical Approach**:
```
Dependencies:
- @upstash/ratelimit (already have @upstash/redis)

Implementation Points:
- /app/api/chat/route.ts - Add rate limiter middleware
- Use sliding window algorithm
- Limit: 10 requests per minute per IP
- More lenient: 50 requests per hour per IP

Configuration:
- Use Upstash Redis (already configured for KV)
- Add UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN to env

Error Handling:
- Return 429 Too Many Requests
- Include Retry-After header
- User-friendly error message in Vietnamese/English
```

**Files to Modify**:
- `/app/api/chat/route.ts` - Add rate limit check at the beginning
- `/lib/rateLimit.ts` - New file for rate limiter configuration
- `.env.local` - Add Upstash Redis REST credentials

**Testing Plan**:
- Test with multiple rapid requests from same IP
- Verify 429 response after limit exceeded
- Test that different IPs have separate limits
- Verify chatbot UI displays rate limit error gracefully

---

### 2. Input Validation & Sanitization 🚨 **HIGH PRIORITY**

**Problem**:
- User input to chatbot not validated for length/content
- No sanitization before sending to OpenAI
- Vulnerable to prompt injection attacks
- File uploads (CV/documents) not validated properly

**Solution**: Comprehensive input validation

**Technical Approach**:

**Chatbot Input Validation**:
```
Validation Rules:
- Message length: 1 - 1000 characters
- Reject empty messages
- Trim whitespace
- Check for suspicious patterns (excessive special chars, script tags, etc.)
- Sanitize markdown to prevent XSS

Implementation:
- Validate in /app/api/chat/route.ts before processing
- Return 400 Bad Request with clear error message
```

**File Upload Validation**:
```
For /app/api/admin/documents/route.ts:
- File size limit: Max 10MB
- Allowed types: .pdf, .docx, .txt only
- Validate MIME type (not just extension)
- Scan file content for malicious patterns
- Sanitize filename (no special chars, path traversal)

For YouTube Transcript:
- Already handled by youtube-transcript library
- Add validation for videoId format (11 chars, alphanumeric + - _)
```

**Files to Modify**:
- `/app/api/chat/route.ts` - Add message validation
- `/app/api/admin/documents/route.ts` - Add file validation
- `/app/api/admin/videos/route.ts` - Add videoId validation
- `/lib/inputValidator.ts` - New file for reusable validation functions

**Testing Plan**:
- Test with very long messages (>1000 chars)
- Test with empty messages
- Test with suspicious input (SQL injection patterns, script tags)
- Test file upload with wrong file types (.exe, .sh, .js)
- Test file upload with oversized files

---

### 3. Admin Authentication Security 🚨 **HIGH PRIORITY**

**Problem**:
- Need to verify session validation is working correctly
- No brute-force protection on login
- Need to audit cookie security settings

**Current State**:
```
Using NextAuth.js with:
- Credentials provider
- bcrypt for password hashing ✅
- Session stored in JWT ✅

Potential Issues:
- No rate limiting on /api/auth/signin
- No account lockout after failed attempts
- Cookie settings might not be production-ready
```

**Solution**: Harden authentication

**Technical Approach**:

**Brute-Force Protection**:
```
Implement rate limiting on /api/auth/signin:
- Limit: 5 failed attempts per 15 minutes per IP
- After 5 failures: Lock for 15 minutes
- After 10 failures: Lock for 1 hour
- Track by IP address

Storage:
- Use Upstash Redis for tracking attempts
- Key format: auth:attempts:{ip}
- TTL: Auto-expire after lockout period
```

**Cookie Security**:
```
Verify NextAuth configuration in /lib/auth.ts:
- httpOnly: true ✅ (prevents XSS)
- secure: true in production (HTTPS only)
- sameSite: 'lax' (CSRF protection)
- maxAge: 30 days (reasonable session length)

Check JWT secret:
- NEXTAUTH_SECRET must be strong (32+ chars random)
- Never commit to git
- Regenerate for production
```

**Session Validation Audit**:
```
Review all admin routes:
- /app/admin/*/page.tsx - Check auth() calls
- /app/api/admin/*/route.ts - Check session validation

Verify pattern:
const session = await auth()
if (!session?.user || (session.user as any).role !== 'admin') {
  return redirect('/admin/login') or 401
}
```

**Files to Modify**:
- `/lib/auth.ts` - Review and update cookie settings
- `/app/api/auth/signin/route.ts` - Add brute-force protection (if custom endpoint)
- `/middleware.ts` - Add rate limiting for auth routes
- `.env.local` - Verify NEXTAUTH_SECRET is strong

**Testing Plan**:
- Test 5+ failed login attempts → verify lockout
- Test successful login after lockout expires
- Verify cookies have correct flags (httpOnly, secure)
- Test session expiration after 30 days
- Attempt to access admin routes without session

---

### 4. API Route Protection 🚨 **HIGH PRIORITY**

**Problem**:
- Need to verify ALL admin APIs check authentication
- No CSRF protection
- Need to validate request origins

**Solution**: Comprehensive API security audit

**Technical Approach**:

**Authentication Audit**:
```
Audit ALL admin API routes:
✅ /app/api/admin/documents/route.ts
✅ /app/api/admin/documents/[id]/route.ts
✅ /app/api/admin/videos/route.ts
✅ /app/api/admin/videos/[id]/route.ts
✅ /app/api/admin/vectors/route.ts

Verify each has:
const session = await auth()
if (!session?.user || (session.user as any).role !== 'admin') {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
}
```

**CSRF Protection**:
```
NextAuth.js provides CSRF protection for auth endpoints ✅

For custom admin APIs:
- Add CSRF token validation
- Use next-csrf package OR
- Implement custom token in session
- Verify Origin header matches expected domain

Implementation:
- Check request Origin/Referer headers
- Reject if not from same origin
- Add to middleware for all /api/admin/* routes
```

**Request Origin Validation**:
```
In production:
- Only accept requests from hungreo.com domain
- Reject cross-origin requests (unless explicitly allowed)

Implementation in /middleware.ts:
- Check Origin header
- Check Referer header
- Allow only production domain + localhost (in dev)
```

**Files to Modify**:
- `/middleware.ts` - Add origin validation and CSRF checks
- All `/app/api/admin/*/route.ts` - Verify auth checks present
- `/lib/csrf.ts` - New file for CSRF token utilities

**Testing Plan**:
- Attempt to call admin APIs without session → expect 401
- Attempt to call admin APIs from different origin → expect 403
- Test with valid session → expect success
- Test CSRF protection with forged requests

---

### 5. Environment Variables Security 🔒 **MEDIUM PRIORITY**

**Problem**:
- Need to ensure .env.local is not exposed
- Need to verify sensitive keys not committed to git
- Need to audit Vercel environment variables

**Solution**: Environment security audit

**Technical Approach**:

**Git Security**:
```
Verify .gitignore includes:
✅ .env.local
✅ .env*.local
✅ .env.production

Check git history:
git log --all --full-history -- .env*

If found:
- Use BFG Repo-Cleaner to remove from history
- Rotate ALL exposed secrets immediately
```

**Sensitive Variables Audit**:
```
Current sensitive vars:
- OPENAI_API_KEY
- PINECONE_API_KEY
- PINECONE_INDEX_NAME
- KV_REST_API_URL
- KV_REST_API_TOKEN
- NEXTAUTH_SECRET
- ADMIN_EMAIL
- ADMIN_PASSWORD (hashed)

For Production (Vercel):
- Add all to Vercel Environment Variables
- Use "Production" environment only
- Enable "Encrypted" flag for secrets
- Never log these values
```

**Environment Variable Best Practices**:
```
1. Never commit .env files
2. Use different values for dev/staging/production
3. Rotate secrets regularly (quarterly)
4. Use Vercel's built-in secret management
5. Document required env vars in README

Create .env.example:
- List all required variables
- Use placeholder values
- Add comments explaining each
```

**Files to Create**:
- `/.env.example` - Template for required environment variables
- `/docs/ENVIRONMENT_SETUP.md` - Documentation for setting up env vars

**Testing Plan**:
- Verify .env.local not in git history
- Test app works with Vercel environment variables
- Verify no env vars logged in console/errors
- Test app fails gracefully if critical env var missing

---

## Phase 2: Important But Can Deploy Without (NICE TO HAVE)

### 6. Content Security Policy (CSP)

**Problem**: No CSP headers to prevent XSS attacks

**Solution**: Add CSP headers via next.config.js

**Technical Approach**:
```javascript
// next.config.js
headers: async () => [
  {
    source: '/(.*)',
    headers: [
      {
        key: 'Content-Security-Policy',
        value: [
          "default-src 'self'",
          "script-src 'self' 'unsafe-eval' 'unsafe-inline'", // Next.js needs unsafe-eval
          "style-src 'self' 'unsafe-inline'",
          "img-src 'self' data: https://i.ytimg.com https://*.vercel.app",
          "font-src 'self'",
          "connect-src 'self' https://api.openai.com https://*.pinecone.io",
          "frame-ancestors 'none'",
        ].join('; '),
      },
    ],
  },
]
```

**Implementation Timeline**: Post-launch (requires thorough testing)

---

### 7. Security Headers

**Problem**: Missing security headers

**Solution**: Add via next.config.js

**Headers to Add**:
- `X-Frame-Options: DENY` (prevent clickjacking)
- `X-Content-Type-Options: nosniff` (prevent MIME sniffing)
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy: camera=(), microphone=(), geolocation=()`

**Implementation Timeline**: Post-launch (low risk)

---

### 8. Security Event Logging

**Problem**: No logging for security events (failed logins, suspicious activity)

**Solution**: Extend chat logger to include security events

**Events to Log**:
- Failed login attempts (IP, timestamp, username)
- Successful logins (IP, timestamp)
- Rate limit violations (IP, endpoint, timestamp)
- Suspicious input patterns (potential injection attempts)
- Admin actions (delete video, delete document, etc.)

**Storage**: Upstash Redis with 90-day TTL

**Implementation Timeline**: Post-launch (nice for monitoring)

---

## Implementation Priority Order

### Week 1 (Critical - Required for Production):
1. **Rate Limiting** (Chatbot + Admin APIs) - 4 hours
2. **Input Validation** (Chatbot + File Uploads) - 3 hours
3. **Admin Auth Hardening** (Brute-force protection) - 3 hours

### Week 2 (Critical - Required for Production):
4. **API Security Audit** (CSRF + Origin validation) - 4 hours
5. **Environment Variables Audit** (Git history + Vercel setup) - 2 hours
6. **Testing & QA** (All Phase 1 features) - 4 hours

### Post-Launch (Nice to Have):
7. **Content Security Policy** - 2 hours
8. **Security Headers** - 1 hour
9. **Security Event Logging** - 3 hours

**Total Estimated Time for Phase 1**: ~20 hours

---

## Success Criteria

Before deploying to production, verify:

- ✅ Chatbot API rate limiting active (10 req/min per IP)
- ✅ Admin login rate limiting active (5 attempts per 15min)
- ✅ All input validated and sanitized
- ✅ File uploads validated (size, type, content)
- ✅ All admin APIs check authentication
- ✅ CSRF protection implemented for admin endpoints
- ✅ Request origin validation active
- ✅ No sensitive data in git history
- ✅ All environment variables set in Vercel
- ✅ Cookie security flags correct (httpOnly, secure, sameSite)
- ✅ Comprehensive testing completed

---

## Risk Assessment

### Pre-Implementation Risks:

**Critical (Before Security Features)**:
- 🔴 Chatbot abuse → OpenAI cost spike
- 🔴 Prompt injection → Chatbot compromise
- 🔴 Admin brute-force → Unauthorized access
- 🟡 File upload abuse → Storage/processing costs
- 🟡 CSRF attacks → Unauthorized admin actions

**Post-Implementation Risks**:
- 🟢 All critical risks mitigated
- 🟡 Nice-to-have features still pending (acceptable)

---

## Rollback Plan

If security implementation causes issues:

1. **Rate Limiting Issues**:
   - Increase limits temporarily
   - Add IP whitelist for testing
   - Disable for specific endpoints if needed

2. **Auth Issues**:
   - Extend lockout TTL
   - Add manual unlock API endpoint
   - Keep original auth flow as fallback

3. **Validation Issues**:
   - Make validation warnings instead of errors (temporarily)
   - Log validation failures for analysis
   - Adjust thresholds based on real usage

---

## Monitoring & Alerts

Post-deployment monitoring:

1. **Upstash Redis Metrics**:
   - Rate limit violations count
   - Auth attempt tracking
   - Memory usage

2. **Vercel Analytics**:
   - 429 (rate limit) response rate
   - 401/403 (auth) response rate
   - API response times

3. **OpenAI Usage**:
   - Daily token consumption
   - Spike detection (>2x average)

4. **Alerts** (via email):
   - >100 rate limit violations per hour
   - >50 failed login attempts per hour
   - OpenAI costs exceed budget

---

## Notes

- This plan focuses on **minimum viable security** for production
- Phase 2 features can be implemented iteratively post-launch
- Regular security audits should be scheduled quarterly
- Keep dependencies updated for security patches
- Monitor OWASP Top 10 for new vulnerabilities

---

**Document Status**: Ready for Review and Implementation
**Next Step**: Await approval to begin Phase 1 implementation
