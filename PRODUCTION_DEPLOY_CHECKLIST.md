# Production Deployment Checklist

**Last Updated:** 2025-11-19
**Status:** ✅ Ready for Production

---

## 🔴 CRITICAL: Security Patches Applied (Nov 19, 2025)

### Vulnerabilities Fixed:
1. **Password Reset Broken** - `kv.setex()` API incompatibility → Fixed with `kv.set(key, value, { ex })`
2. **Reset Token Leakage** - ChatBot logged reset tokens in pathname → Fixed with auth page detection + sanitization
3. **Admin Navigation Inconsistency** - Missing back buttons → Added to all 9 admin pages

### Changes Made:
- ✅ Fixed forgot-password API (`kv.set` with expiry option)
- ✅ Disabled ChatBot on `/admin/login`, `/admin/forgot-password`, `/admin/reset-password/*`
- ✅ Added pathname sanitization in `lib/chatLogger.ts`
- ✅ Created cleanup endpoint `/api/admin/cleanup-leaked-tokens`
- ✅ Added SWR caching to AdminDashboard (instant load on revisit)
- ✅ Added "Back to Dashboard" navigation to all admin pages

**Branch:** `claude/load-and-summarize-01DbSjfdyDdCjiKpyrqa2nzC`
**Commit:** `64a4a4c` - Security fixes + UX improvements

---

## Pre-Deployment

### 1. Environment Variables (Vercel)

**Required:**
- [ ] `ADMIN_EMAIL=hungreo2005@gmail.com`
- [ ] `BACKUP_ADMIN_EMAIL=hung_reo@icloud.com`
- [ ] `ADMIN_PASSWORD_HASH` (⚠️ **NO `\$` escape** in Vercel - use plain bcrypt hash)
- [ ] `RESEND_API_KEY` (⚠️ **Full access key required** for backup email)
- [ ] `NEXTAUTH_URL=https://hungreo-website.vercel.app`
- [ ] `NEXTAUTH_SECRET` (same as local: `wr0NT4pBN8yTwe+/rCM7yCtGurPWUZIbPQYmhLnVykg=`)
- [ ] `UPSTASH_REDIS_REST_URL` (production: `https://large-heron-11467.upstash.io`)
- [ ] `UPSTASH_REDIS_REST_TOKEN` (production token)
- [ ] `KV_REST_API_URL` (same as UPSTASH_REDIS_REST_URL)
- [ ] `KV_REST_API_TOKEN` (same as UPSTASH_REDIS_REST_TOKEN)

**Optional (if not set, features disabled):**
- [ ] `OPENAI_API_KEY`
- [ ] `PINECONE_API_KEY`
- [ ] `PINECONE_INDEX_NAME`
- [ ] `YOUTUBE_API_KEY`

### 2. Code Cleanup ✅

**Already completed in commit `450bdaf`:**
- ✅ Removed debug `console.log` from `lib/auth.ts`
- ✅ Removed debug `console.log` from `app/api/admin/reset-password/route.ts`
- ✅ Middleware origin validation enabled

### 3. Security Verification

**Local Testing (Completed):**
- ✅ Test login with both emails
- ✅ Test password reset flow end-to-end
- ✅ Verify forgot-password API works (200 response)
- ✅ Verify reset token stored in KV
- ✅ Verify ChatBot not visible on auth pages
- ✅ Verify "Back to Dashboard" on all admin pages

**Production Testing (After Deploy):**
- [ ] Test login: `hungreo2005@gmail.com`
- [ ] Test login: `hung_reo@icloud.com`
- [ ] Test forgot-password flow
- [ ] Test reset-password flow with real email
- [ ] Verify emails received (both accounts)
- [ ] Test token expiry (15 minutes)
- [ ] Test used token rejection
- [ ] Verify admin APIs require auth (except reset endpoints)
- [ ] Test ChatBot NOT visible on `/admin/login`, `/admin/forgot-password`, `/admin/reset-password/*`
- [ ] Test ChatBot DOES work on homepage and other pages
- [ ] Test dashboard instant loading (SWR cache)

---

## Deployment Steps

### 1. Push to GitHub

```bash
git checkout main
git merge claude/load-and-summarize-01DbSjfdyDdCjiKpyrqa2nzC
git push origin main
```

### 2. Add Environment Variables to Vercel

Go to: https://vercel.com/hungreos-projects/hungreo-website/settings/environment-variables

**Add all variables from section 1 above.**

**IMPORTANT Notes:**
- ⚠️ `ADMIN_PASSWORD_HASH`: NO `\$` escape in Vercel (use: `$2b$10$8lidLE39zV...` not `\$2b\$10\$...`)
- ⚠️ `RESEND_API_KEY`: Must be **full access** key (not test key) to send to backup email
- ⚠️ Production Upstash KV: Use `https://large-heron-11467.upstash.io` (NOT dev database)

Select environments: **Production, Preview, Development**

### 3. Deploy

Vercel will auto-deploy from `main` branch push.

**Or manual deploy:**
```bash
vercel --prod
```

### 4. 🚨 CRITICAL: Run Cleanup Endpoint (ONCE)

**Immediately after first production deploy**, run this to purge any leaked tokens:

```bash
# Option 1: Using authenticated browser
# 1. Login to https://hungreo-website.vercel.app/admin/login
# 2. Open DevTools → Network tab
# 3. POST to: https://hungreo-website.vercel.app/api/admin/cleanup-leaked-tokens
# (should return summary of deleted logs)

# Option 2: Using curl with session cookie
curl -X POST https://hungreo-website.vercel.app/api/admin/cleanup-leaked-tokens \
  -H "Cookie: [copy session cookie from browser]"
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Cleanup complete. Scanned X chat logs, deleted Y logs containing leaked tokens.",
  "scanned": X,
  "deleted": Y,
  "deletedKeys": ["chat:123...", ...]
}
```

### 5. Post-Deployment Tests

Run all tests from **Section 3 - Production Testing** above.

---

## Rollback Plan

If issues occur:

1. **Revert to previous Vercel deployment**
   - Go to Vercel Dashboard → Deployments
   - Find last working deployment
   - Click "..." → "Redeploy"

2. **Check Vercel logs for errors**
   ```bash
   vercel logs hungreo-website --prod
   ```

3. **Verify environment variables are correct**
   - Check for `\$` escape issues in `ADMIN_PASSWORD_HASH`
   - Verify production Upstash KV credentials

4. **Check Upstash KV dashboard for data**
   - Visit: https://console.upstash.com
   - Verify `password-reset:*` keys exist
   - Verify `admin:password-hash` is set

---

## Monitoring

After deployment:

- **Vercel Logs:** Monitor for auth errors
  ```bash
  vercel logs hungreo-website --prod --follow
  ```

- **Resend Dashboard:** Check email delivery at https://resend.com/emails

- **Upstash KV:** Monitor usage at https://console.upstash.com

- **Weekly Health Checks:**
  - Test login with both emails
  - Test password reset flow
  - Verify dashboard performance (should load instantly on revisit)

---

## Common Issues & Fixes

### Issue: Login fails after deployment
**Symptom:** "Invalid credentials" error
**Root Cause:** Incorrect `ADMIN_PASSWORD_HASH` format in Vercel
**Fix:**
1. Verify hash in Vercel has NO `\$` escape: `$2b$10$...` (correct) vs `\$2b\$10\$...` (wrong)
2. Hash should start with `$2b$10$` (60 chars total)
3. Redeploy after fixing

### Issue: Password reset email not received
**Symptom:** Form submits, 200 response, but no email
**Root Causes:**
1. **Test API key limitation** - Can only send to registered email
2. **Wrong email address** - Check spam folder
3. **Resend service down** - Check https://resend.com/status

**Fixes:**
1. Verify `RESEND_API_KEY` is **full access key** (not test key starting with `re_test_`)
2. Check Resend dashboard logs at https://resend.com/emails
3. Check spam/junk folder
4. Test with registered email first (`hungreo2005@gmail.com`)

### Issue: "Invalid or expired reset link"
**Symptom:** Clicking email link shows error
**Root Causes:**
1. **Token expired** (15-minute TTL)
2. **Token already used** (one-time use)
3. **Wrong KV database** (dev vs prod mismatch)

**Fixes:**
1. Request new password reset (tokens expire after 15 min)
2. Tokens are one-time use - request fresh link
3. Verify Vercel uses production Upstash KV: `https://large-heron-11467.upstash.io`
4. Check KV for token: `password-reset:*` keys

### Issue: One email works, other doesn't
**Symptom:** `hungreo2005@gmail.com` works but `hung_reo@icloud.com` fails
**Root Cause:** Missing `BACKUP_ADMIN_EMAIL` environment variable
**Fixes:**
1. Verify both emails in Vercel environment variables:
   - `ADMIN_EMAIL=hungreo2005@gmail.com`
   - `BACKUP_ADMIN_EMAIL=hung_reo@icloud.com`
2. Redeploy after adding missing var
3. Check logs for "Email not authorized" message

### Issue: kv.setex is not a function
**Symptom:** TypeError in forgot-password API
**Root Cause:** Old code using incompatible `kv.setex()` API
**Fix:**
- ✅ **Already fixed in commit `64a4a4c`**
- Verify `app/api/admin/forgot-password/route.ts` line 51 uses:
  ```typescript
  await kv.set(`password-reset:${hash}`, email, { ex: 900 })
  ```

### Issue: ChatBot leaking reset tokens
**Symptom:** Reset tokens appear in chat logs or email alerts
**Fix:**
- ✅ **Already fixed in commit `64a4a4c`**
- ChatBot disabled on auth pages
- Pathname sanitization added
- Run cleanup endpoint to purge existing leaks

### Issue: Dashboard slow to load
**Symptom:** Dashboard takes 2+ seconds every time
**Fix:**
- ✅ **Already fixed with SWR caching in commit `64a4a4c`**
- Dashboard should load instantly on subsequent visits (0ms)
- If still slow, check browser cache and SWR configuration

---

## Success Criteria

Deployment is successful when:

- ✅ Both emails can login (`hungreo2005@gmail.com` AND `hung_reo@icloud.com`)
- ✅ Password reset emails are received at both addresses
- ✅ Reset flow completes successfully (token validation → password update → login)
- ✅ Both emails share same password (changing one affects both)
- ✅ No errors in Vercel logs
- ✅ Email delivery confirmed in Resend dashboard
- ✅ ChatBot NOT visible on `/admin/login`, `/admin/forgot-password`, `/admin/reset-password/*`
- ✅ ChatBot DOES work on homepage and other public pages
- ✅ Dashboard loads instantly on revisit (SWR caching working)
- ✅ All admin pages have "Back to Dashboard" button
- ✅ Cleanup endpoint successfully purged leaked tokens (if any)

---

## Technical Notes

### Password Management
- **Password hash storage:** KV takes precedence over env var
- **Both emails share password:** Changing password via reset affects both accounts
- **Password requirements:**
  - Minimum 8 characters
  - Must contain: uppercase, lowercase, number, special character
  - Example: `Admin@2025!Secure`

### Reset Token Security
- **Token generation:** 32-byte random hex (64 chars)
- **Token storage:** SHA-256 hashed in KV
- **Expiry:** 15 minutes (900 seconds)
- **Usage:** One-time use only (deleted after successful reset)
- **Leakage prevention:** ChatBot disabled on auth pages, pathname sanitized before logging

### Email Service
- **Provider:** Resend (https://resend.com)
- **API Key Type:** Full access required (test keys can only send to registered email)
- **Sender:** `Hungreo Website <onboarding@resend.dev>`
- **Recipients:** Both `ADMIN_EMAIL` and `BACKUP_ADMIN_EMAIL` supported

### Database
- **Development:** `https://intent-peacock-38586.upstash.io` (hungreo-dev account)
- **Production:** `https://large-heron-11467.upstash.io` (production account)
- **Keys Used:**
  - `password-reset:{hash}` - Reset tokens (15min TTL)
  - `admin:password-hash` - Current password (overrides env var)
  - `chat:*` - Chat logs (90-day TTL)
  - `chats:{date}` - Daily chat lists

### Performance
- **SWR Caching:** Dashboard stats cached client-side
  - Auto-refresh: Every 30 seconds
  - Revalidate on focus: Yes
  - Deduping: 5 seconds
  - First load: ~2s, Subsequent: ~0ms
- **Server Cache:** Stats API has 30s in-memory cache

---

## Lessons Learned (Bug History)

### Bug #1: kv.setex() Not Supported (Nov 19, 2025)
**Issue:** Password reset API failed with `TypeError: kv.setex is not a function`
**Root Cause:** Vercel KV (`@vercel/kv`) doesn't expose Redis `SETEX` command
**Fix:** Use `kv.set(key, value, { ex: seconds })` instead
**Files Changed:** `app/api/admin/forgot-password/route.ts:51`
**Prevention:** Always check Vercel KV documentation for supported commands

### Bug #2: Reset Token Leaked in Chat Logs (Nov 19, 2025)
**Issue:** Reset tokens appearing in chat logs and email notifications
**Root Cause:** ChatBot logged `pathname` which included `/admin/reset-password/{token}`
**Impact:** Tokens persisted in KV for 90 days, visible in email alerts
**Fix:**
1. Disabled ChatBot on auth pages (`components/ChatBot.tsx`)
2. Added pathname sanitization (`lib/chatLogger.ts`)
3. Created cleanup endpoint (`app/api/admin/cleanup-leaked-tokens/route.ts`)
**Files Changed:** 3 files
**Prevention:** Never log or send sensitive URL segments; sanitize all logged data

### Bug #3: Resend Test API Key Limitation (Earlier)
**Issue:** Password reset email not sent to `hung_reo@icloud.com`
**Root Cause:** Test API keys can only send to registered email address
**Fix:** Upgrade to full access Resend API key
**Prevention:** Use full access API keys in production, document limitations clearly

### Bug #4: Environment Variable Mismatch (Earlier)
**Issue:** Backup email couldn't login after password reset
**Root Cause:** `BACKUP_ADMIN_EMAIL` set to temporary test value instead of actual email
**Fix:** Corrected env var, restarted dev server to reload
**Prevention:** Always verify env vars match expected values, especially after changes

---

## Emergency Contacts

**If critical issues occur:**
- **Email:** hungreo2005@gmail.com
- **Backup Email:** hung_reo@icloud.com
- **GitHub:** https://github.com/Hung-Reo/hungreo-website

**Service Dashboards:**
- **Vercel:** https://vercel.com/hungreos-projects/hungreo-website
- **Resend:** https://resend.com
- **Upstash:** https://console.upstash.com

---

**Document Version:** 2.0
**Last Review:** 2025-11-19
**Next Review:** Before next major deployment
