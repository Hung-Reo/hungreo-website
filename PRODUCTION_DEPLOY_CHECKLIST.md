# Production Deployment Checklist

## Pre-Deployment

### 1. Environment Variables (Vercel)
- [ ] `ADMIN_EMAIL=hungreo2005@gmail.com`
- [ ] `BACKUP_ADMIN_EMAIL=hung_reo@icloud.com`
- [ ] `ADMIN_PASSWORD_HASH` (without `\$` escape)
- [ ] `RESEND_API_KEY` (full access key)
- [ ] `NEXTAUTH_URL=https://hungreo-website.vercel.app`
- [ ] `NEXTAUTH_SECRET` (same as local)
- [ ] `UPSTASH_REDIS_REST_URL` (production KV)
- [ ] `UPSTASH_REDIS_REST_TOKEN` (production KV)

### 2. Code Cleanup
- [ ] Remove debug `console.log` from `lib/auth.ts` (lines 67-68, 76)
- [ ] Remove debug `console.log` from `app/api/admin/reset-password/route.ts` (line 87)
- [ ] Verify middleware origin validation is enabled

### 3. Security Verification
- [ ] Test login with both emails
- [ ] Test password reset flow end-to-end
- [ ] Verify forgot-password API is public
- [ ] Verify reset-password API is public
- [ ] Verify validate-token API is public
- [ ] Test token expiry (15 minutes)
- [ ] Test used token rejection
- [ ] Verify other admin APIs require auth

## Deployment Steps

1. **Push to GitHub**
   ```bash
   git add .
   git commit -m "feat: production-ready admin auth with backup email"
   git push origin main
   ```

2. **Add Environment Variables to Vercel**
   - Go to Vercel Dashboard → Project → Settings → Environment Variables
   - Add all variables from checklist above
   - Select environments: Production, Preview, Development

3. **Deploy**
   - Vercel will auto-deploy from main branch
   - Or manual deploy: `vercel --prod`

4. **Post-Deployment Tests**
   - [ ] Test login: `hungreo2005@gmail.com`
   - [ ] Test login: `hung_reo@icloud.com`
   - [ ] Test forgot-password flow
   - [ ] Test reset-password flow
   - [ ] Verify emails are received
   - [ ] Test password change affects both emails

## Rollback Plan

If issues occur:
1. Revert to previous Vercel deployment
2. Check Vercel logs for errors
3. Verify environment variables are correct
4. Check Upstash KV dashboard for data

## Monitoring

After deployment:
- Monitor Vercel logs for auth errors
- Check Resend dashboard for email delivery
- Monitor Upstash KV usage
- Test login weekly to ensure no regressions

## Common Issues

### Issue: Login fails after deployment
**Fix:** Verify `ADMIN_PASSWORD_HASH` in Vercel (no `\$` escape)

### Issue: Password reset email not received
**Fix:**
1. Check Resend dashboard logs
2. Verify RESEND_API_KEY is full access
3. Check spam folder

### Issue: "Invalid or expired reset link"
**Fix:**
1. Check Upstash KV is production database
2. Verify token hasn't expired (15 min)
3. Token is one-time use - request new reset

### Issue: One email works, other doesn't
**Fix:**
1. Verify both emails in `ADMIN_EMAIL` and `BACKUP_ADMIN_EMAIL`
2. Restart dev server to reload env vars
3. Check logs for "Email not authorized"

## Success Criteria

Deployment is successful when:
- ✅ Both emails can login
- ✅ Password reset emails are received
- ✅ Reset flow completes successfully
- ✅ Both emails share same password
- ✅ No errors in Vercel logs
- ✅ Email delivery confirmed in Resend

## Notes

- Password hash in KV takes precedence over env var
- Both emails always share the same password
- Resend full access key required for backup email
- Token expiry is 15 minutes
- Tokens are one-time use only
