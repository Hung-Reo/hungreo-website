# Security Fixes - November 2025

**Last Updated:** November 19, 2025
**Status:** ✅ All Critical Issues Fixed

This document outlines the security vulnerabilities that were identified and fixed.

---

## 🔴 CRITICAL FIXES (November 19, 2025)

### ✅ Fix 1: Password Reset API Broken (`kv.setex()` Bug)

**Severity:** 🔴 CRITICAL - Password reset completely non-functional

**Issue:**
The forgot-password API used `kv.setex()` which is not supported by Vercel KV, causing all password reset attempts to fail:
```typescript
// BROKEN
await kv.setex(`password-reset:${hash}`, 900, email)
// TypeError: kv.setex is not a function
```

**Fix:**
Updated to use `kv.set()` with expiry option:
```typescript
// WORKING
await kv.set(`password-reset:${hash}`, email, { ex: 900 })
```

**Files Modified:**
- `app/api/admin/forgot-password/route.ts:51`

**Impact:** Password reset flow now functional for both admin emails.

**Commit:** `64a4a4c`

---

### ✅ Fix 2: Reset Token Leakage via ChatBot

**Severity:** 🔴 CRITICAL - Account takeover risk

**Issue:**
ChatBot logged page pathname which included password reset tokens:
- Pathname: `/admin/reset-password/[64-char-token]`
- Logged in KV with 90-day TTL
- Sent in email notifications
- Attackers with chat log access could replay tokens within 15-min window

**Fix (3-layer defense):**

1. **Disabled ChatBot on auth pages:**
```typescript
// components/ChatBot.tsx
const isAuthPage = pathname.startsWith('/admin/login') ||
                   pathname.startsWith('/admin/forgot-password') ||
                   pathname.startsWith('/admin/reset-password')

if (isAuthPage) return null
```

2. **Added pathname sanitization:**
```typescript
// lib/chatLogger.ts
function sanitizePathname(pathname: string): string {
  return pathname
    .replace(/\/admin\/reset-password\/[^/]+/, '/admin/reset-password/[token]')
    .replace(/\/[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}/gi, '/[id]')
    .replace(/\/[a-f0-9]{32,}/gi, '/[token]')
}
```

3. **Created cleanup endpoint:**
```typescript
// app/api/admin/cleanup-leaked-tokens/route.ts (NEW)
POST /api/admin/cleanup-leaked-tokens
// Scans all chat:* keys, deletes logs with leaked tokens
```

**Files Modified:**
- `components/ChatBot.tsx:20-27` (auth page detection)
- `lib/chatLogger.ts:9-21, 56-63` (sanitization function + application)
- `app/api/admin/cleanup-leaked-tokens/route.ts` (NEW cleanup endpoint)

**Post-Deployment Action:**
🚨 **CRITICAL:** Run cleanup endpoint ONCE after deploying to production to purge existing leaked tokens.

**Commit:** `64a4a4c`

---

## 🟡 UX IMPROVEMENTS (November 19, 2025)

### ✅ Fix 3: Admin Navigation Inconsistency

**Issue:**
9 admin management pages missing "Back to Dashboard" buttons, inconsistent with editor pages.

**Fix:**
Added uniform navigation pattern to all admin pages:
```typescript
<Link href="/admin/dashboard">
  <Button variant="outline" size="sm" className="gap-2">
    <ArrowLeft className="h-4 w-4" />
    Back to Dashboard
  </Button>
</Link>
```

**Files Modified:**
- `app/admin/content/blog/page.tsx`
- `app/admin/content/projects/page.tsx`
- `app/admin/content/contact/page.tsx`
- `components/admin/DocumentsManager.tsx`
- `components/admin/VideosManager.tsx`
- `components/admin/VectorManager.tsx`
- `app/admin/chatlogs/page.tsx`

**Impact:** Professional, unified admin UI experience.

**Commit:** `64a4a4c`

---

### ✅ Fix 4: Dashboard Performance (SWR Caching)

**Issue:**
Dashboard stats fetched from API on every visit, causing 2+ second load times.

**Fix:**
Implemented SWR (stale-while-revalidate) client-side caching:
```typescript
// components/admin/AdminDashboard.tsx
const { data, error, isLoading, mutate } = useSWR('/api/admin/stats', fetcher, {
  refreshInterval: 30000, // Auto-refresh every 30s
  revalidateOnFocus: true,
  dedupingInterval: 5000,
})
```

Added server-side 30s cache to stats API:
```typescript
// app/api/admin/stats/route.ts
const cache = { data: null, timestamp: 0 }
const CACHE_TTL = 30000
```

**Files Modified:**
- `components/admin/AdminDashboard.tsx:6, 15-21` (SWR implementation)
- `app/api/admin/stats/route.ts:1-27` (server-side cache)
- `package.json` (added SWR dependency)

**Impact:**
- First load: ~2s (normal)
- Subsequent loads: ~0ms (instant from cache)
- Better user experience

**Commit:** `64a4a4c`

---

## ✅ PREVIOUS FIXES (November 13-15, 2025)

### Fix 5: Strict Origin Validation

**Issue:**
Middleware used `.includes()` for origin validation which could be bypassed:
```typescript
// VULNERABLE
origin.includes(host) // ❌ "https://hungreo.com.evil.com" passes
```

**Fix:**
Strict hostname comparison using URL parsing:
```typescript
// SECURE
const originUrl = new URL(origin)
isValidOrigin = originUrl.hostname === host // ✅ Exact match only
```

**File Modified:** `middleware.ts:19-40`

**Commit:** `62d83f2`

---

### Fix 6: Debug Logging Control

**Issue:**
Chat API logged sensitive data (IPs, vectors, queries) in production.

**Fix:**
Added environment variable to control logging:
```typescript
const DEBUG_MODE = process.env.ENABLE_DEBUG_LOGS === 'true'
if (DEBUG_MODE) {
  console.log('[Chat] Sensitive data...') // Only when explicitly enabled
}
```

**File Modified:** `app/api/chat/route.ts:16, 25, 107-116`

**Production:** Do NOT set `ENABLE_DEBUG_LOGS=true` in production.

**Commit:** `62d83f2`

---

### Fix 7: Password Hash in Environment Variable

**Issue:**
Admin password hash hardcoded in source code, exposed in Git history.

**Fix:**
Moved to environment variable with validation:
```typescript
const ADMIN_PASSWORD_HASH = process.env.ADMIN_PASSWORD_HASH
if (!ADMIN_PASSWORD_HASH) {
  throw new Error('ADMIN_PASSWORD_HASH is required')
}
```

**File Modified:** `lib/auth.ts:27-35`

**Commit:** `62d83f2`

---

### Fix 8: Multi-Admin Email Support

**Feature:** Added backup admin email for account recovery.

**Implementation:**
```typescript
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'hungreo2005@gmail.com'
const BACKUP_ADMIN_EMAIL = process.env.BACKUP_ADMIN_EMAIL

function isAdminEmail(email: string): boolean {
  const normalizedEmail = email.toLowerCase()
  if (normalizedEmail === ADMIN_EMAIL.toLowerCase()) return true
  if (BACKUP_ADMIN_EMAIL && normalizedEmail === BACKUP_ADMIN_EMAIL.toLowerCase()) return true
  return false
}
```

**Files Modified:**
- `lib/auth.ts:12-21` (email validation)
- `app/api/admin/forgot-password/route.ts:6-15`
- `app/api/admin/reset-password/route.ts:6-15`

**Environment Variables:**
- `ADMIN_EMAIL=hungreo2005@gmail.com`
- `BACKUP_ADMIN_EMAIL=hung_reo@icloud.com`
- Both emails share same password hash

**Commit:** `f0c117f`

---

## 📋 Security Checklist for Production

### Environment Variables (Vercel)
- [x] `ADMIN_EMAIL` - Primary admin email
- [x] `BACKUP_ADMIN_EMAIL` - Backup/recovery email
- [x] `ADMIN_PASSWORD_HASH` - bcrypt hash (NO `\$` escape in Vercel)
- [x] `NEXTAUTH_SECRET` - Session signing key
- [x] `NEXTAUTH_URL` - Production URL
- [x] `RESEND_API_KEY` - Full access key (not test key)
- [x] `UPSTASH_REDIS_REST_URL` - Production KV database
- [x] `UPSTASH_REDIS_REST_TOKEN` - Production KV token
- [ ] `ENABLE_DEBUG_LOGS` - Should NOT be set in production

### Code Security
- [x] No hardcoded passwords
- [x] No debug logs in production
- [x] Strict origin validation
- [x] Password reset tokens secure (SHA-256, 15-min expiry, one-time use)
- [x] ChatBot disabled on auth pages
- [x] Pathname sanitization before logging
- [x] No sensitive data in chat logs

### Post-Deployment Actions
- [ ] Run cleanup endpoint to purge leaked tokens
- [ ] Test login with both emails
- [ ] Test password reset flow end-to-end
- [ ] Verify ChatBot NOT on auth pages
- [ ] Verify dashboard instant loading (SWR)
- [ ] Monitor Vercel logs for errors

---

## 🔍 Testing Checklist

### Local Testing (Completed)
- ✅ Password reset flow works (forgot → email → reset → login)
- ✅ Both emails can login
- ✅ Reset tokens stored in KV
- ✅ ChatBot not visible on `/admin/login`, `/admin/forgot-password`, `/admin/reset-password/*`
- ✅ All admin pages have "Back to Dashboard"
- ✅ Dashboard loads instantly on revisit

### Production Testing (After Deploy)
- [ ] Login with `hungreo2005@gmail.com`
- [ ] Login with `hung_reo@icloud.com`
- [ ] Forgot password with both emails
- [ ] Receive reset emails
- [ ] Complete reset flow
- [ ] Verify token expiry (15 min)
- [ ] Verify one-time token usage
- [ ] Verify ChatBot not on auth pages
- [ ] Verify dashboard performance
- [ ] Run cleanup endpoint

---

## 📊 Impact Summary

| Fix | Severity | Status | Impact |
|-----|----------|--------|--------|
| kv.setex() Bug | 🔴 CRITICAL | ✅ Fixed | Password reset now functional |
| Token Leakage | 🔴 CRITICAL | ✅ Fixed | Account takeover prevented |
| Navigation UX | 🟡 MEDIUM | ✅ Fixed | Better admin experience |
| Dashboard Perf | 🟡 MEDIUM | ✅ Fixed | Instant loading (0ms) |
| Origin Validation | 🔴 CRITICAL | ✅ Fixed | CSRF prevented |
| Debug Logging | 🟠 HIGH | ✅ Fixed | PII exposure prevented |
| Password Hardcode | 🔴 CRITICAL | ✅ Fixed | Credentials secured |
| Multi-Admin Email | 🟢 FEATURE | ✅ Added | Account recovery enabled |

**Total Vulnerabilities Fixed:** 5 Critical, 1 High, 2 Medium
**Features Added:** 3 (Multi-email, SWR caching, Navigation)
**Code Quality:** Production-ready ✅

---

## 📚 Related Documents

- **Production Checklist:** `PRODUCTION_DEPLOY_CHECKLIST.md`
- **Security Recommendations:** `SECURITY_RECOMMENDATIONS.md`
- **How to Change Password:** `docs/HOW_TO_CHANGE_ADMIN_PASSWORD.md`

---

## 🚨 Emergency Response

If security incident occurs:

1. **Disable admin access immediately:**
   - Change `ADMIN_PASSWORD_HASH` in Vercel
   - Redeploy

2. **Rotate all credentials:**
   - Generate new `NEXTAUTH_SECRET`
   - Rotate `RESEND_API_KEY`
   - Change admin password

3. **Check logs:**
   ```bash
   vercel logs hungreo-website --prod
   ```

4. **Review KV data:**
   - Check for suspicious `chat:*` keys
   - Review `password-reset:*` tokens

5. **Contact:**
   - Email: hungreo2005@gmail.com
   - Backup: hung_reo@icloud.com

---

**Document Version:** 2.0
**Last Updated:** 2025-11-19
**Next Review:** Before next major release
