# Security Fixes - November 2025

## 🔐 Critical Security Issues Fixed

This document outlines the security vulnerabilities that were identified and fixed.

---

## ✅ Fix 1: Strict Origin Validation

### **Issue:**
The middleware used `.includes()` for origin validation, which could be bypassed:
```typescript
// VULNERABLE
origin.includes(host) // ❌ "https://hungreo.com.evil.com" passes
```

### **Fix:**
Implemented strict hostname comparison using URL parsing:
```typescript
// SECURE
const originUrl = new URL(origin)
isValidOrigin = originUrl.hostname === host // ✅ Exact match only
```

### **File Modified:**
- `middleware.ts:19-40`

---

## ✅ Fix 2: Debug Logging Control

### **Issue:**
Chat API logged sensitive data including:
- User IP addresses
- Full vector metadata (potentially contains PII)
- Query contents

### **Fix:**
Added `ENABLE_DEBUG_LOGS` environment variable to control logging:
```typescript
const DEBUG_MODE = process.env.ENABLE_DEBUG_LOGS === 'true'

if (DEBUG_MODE) {
  console.log('[Chat] Sensitive data...') // Only in debug mode
}
```

### **File Modified:**
- `app/api/chat/route.ts:16, 25, 107-116`

### **Production Setup:**
Do NOT set `ENABLE_DEBUG_LOGS=true` in production. Logs are disabled by default.

---

## ✅ Fix 3: Password Hash in Environment Variable

### **Issue:**
Admin password hash was hardcoded in source code:
```typescript
// VULNERABLE
const ADMIN_PASSWORD_HASH = '$2b$10$...' // ❌ Exposed in Git
```

### **Fix:**
Moved to environment variable with validation:
```typescript
// SECURE
const ADMIN_PASSWORD_HASH = process.env.ADMIN_PASSWORD_HASH // ✅ From env
if (!ADMIN_PASSWORD_HASH) {
  throw new Error('ADMIN_PASSWORD_HASH is required')
}
```

### **File Modified:**
- `lib/auth.ts:17-25, 53-58`

### **Setup Instructions:**

1. **Generate a new password hash:**
   ```bash
   node -e "require('bcryptjs').hash('YOUR_SECURE_PASSWORD', 10).then(console.log)"
   ```

2. **Add to Vercel Environment Variables:**
   - Go to: Vercel Dashboard → hungreo-website → Settings → Environment Variables
   - Add:
     - Name: `ADMIN_PASSWORD_HASH`
     - Value: `$2b$10$8lidLE39zVUZc54.e6U1Ref7DEd94zlhmqhzroQNm3iMkY/pL66my`
     - Environment: Production, Preview, Development

3. **Recommended New Password:**
   - Use a strong password (12+ characters, mixed case, numbers, symbols)
   - Example: `Admin@2025!Secure`
   - Hash generated: `$2b$10$8lidLE39zVUZc54.e6U1Ref7DEd94zlhmqhzroQNm3iMkY/pL66my`

---

## ✅ Fix 4: Password Reset Functionality

### **New Feature:**
Added secure password reset with email verification.

### **Flow:**
1. User visits `/admin/forgot-password`
2. Enters email (must match `ADMIN_EMAIL`)
3. System generates secure reset token
4. Email sent with reset link (expires in 15 minutes)
5. User clicks link → `/admin/reset-password/[token]`
6. Enters new password
7. System generates new hash and stores in KV
8. User copies hash to Vercel environment variables

### **Files Created:**
- `app/api/admin/forgot-password/route.ts` - Send reset email
- `app/api/admin/reset-password/route.ts` - Process password reset
- `app/admin/forgot-password/page.tsx` - Forgot password UI
- `app/admin/reset-password/[token]/page.tsx` - Reset password UI

### **Files Modified:**
- `lib/auth.ts:9, 53-58` - Check KV for password hash first
- `app/admin/login/page.tsx:103-110` - Added "Forgot password?" link

### **Required Environment Variables:**

1. **RESEND_API_KEY** (for email)
   - Sign up at: https://resend.com
   - Get API key from: Dashboard → API Keys
   - Add to Vercel:
     - Name: `RESEND_API_KEY`
     - Value: `re_...`

2. **ADMIN_EMAIL** (already exists)
   - The email that can reset password
   - Default: `hungreo2005@gmail.com`

3. **NEXTAUTH_URL** (already exists)
   - Production: `https://your-domain.com`
   - Dev: `http://localhost:3000`

### **Dependencies Added:**
```bash
npm install resend
```

---

## 🚀 Deployment Checklist

### **1. Environment Variables (Vercel)**
Add these to Vercel → Settings → Environment Variables:

```env
# Required
ADMIN_PASSWORD_HASH=$2b$10$8lidLE39zVUZc54.e6U1Ref7DEd94zlhmqhzroQNm3iMkY/pL66my
RESEND_API_KEY=re_...
ADMIN_EMAIL=hungreo2005@gmail.com
NEXTAUTH_URL=https://your-production-domain.com

# Optional (for debugging - DO NOT enable in production)
# ENABLE_DEBUG_LOGS=false

# Existing (keep as is)
OPENAI_API_KEY=sk-...
KV_REST_API_URL=https://...
KV_REST_API_TOKEN=...
NEXTAUTH_SECRET=...
```

### **2. Resend Email Setup**

1. Sign up at: https://resend.com
2. Verify your domain (or use `onboarding@resend.dev` for testing)
3. Get API key
4. Update email sender in `app/api/admin/forgot-password/route.ts:44`:
   ```typescript
   from: 'Hungreo Website <noreply@your-domain.com>'
   ```

### **3. Test Password Reset Flow (Local)**

```bash
# 1. Set local env variables
echo "ADMIN_PASSWORD_HASH=$2b$10$8lidLE39zVUZc54.e6U1Ref7DEd94zlhmqhzroQNm3iMkY/pL66my" >> .env.local
echo "RESEND_API_KEY=re_YOUR_KEY" >> .env.local

# 2. Start dev server
npm run dev

# 3. Test flow
# - Go to http://localhost:3000/admin/forgot-password
# - Enter: hungreo2005@gmail.com
# - Check email for reset link
# - Click link and set new password
# - Copy hash and update ADMIN_PASSWORD_HASH in Vercel
```

### **4. Deploy to Production**

```bash
# Build and test
npm run build

# Deploy
git add .
git commit -m "feat: critical security fixes - password reset, strict origin validation, debug logging control"
git push origin main
```

### **5. Verify Production**

1. ✅ Visit `/admin/login` - should work with new password
2. ✅ Try forgot password flow - should receive email
3. ✅ Admin API calls - should validate origin correctly
4. ✅ Chat logs - should NOT show sensitive data (if ENABLE_DEBUG_LOGS not set)

---

## 📊 Security Improvements Summary

| Issue | Severity | Status | Impact |
|-------|----------|--------|--------|
| Hardcoded password hash | 🔴 Critical | ✅ Fixed | Prevents unauthorized access via Git history |
| Loose origin validation | 🔴 Critical | ✅ Fixed | Prevents CSRF attacks with spoofed origins |
| Sensitive data in logs | 🟠 Medium | ✅ Fixed | Prevents PII/data leakage in Vercel logs |
| No password reset | 🟡 Low | ✅ Fixed | Allows secure password changes without code deploy |

---

## 🔒 Best Practices Implemented

1. ✅ **Environment Variables** - All secrets in env, not code
2. ✅ **Secure Token Generation** - Crypto.randomBytes for reset tokens
3. ✅ **Token Expiry** - 15-minute expiry for reset links
4. ✅ **Email Verification** - Reset only works for verified admin email
5. ✅ **Strict Origin Validation** - Exact hostname matching
6. ✅ **Debug Mode Control** - Sensitive logs only in debug mode
7. ✅ **Password Strength** - Minimum 8 characters enforced
8. ✅ **KV Storage** - Password hash can be updated without redeploy

---

## 📞 Support

If you encounter issues, check:
1. Vercel env variables are set correctly
2. Resend API key is valid
3. Email domain is verified in Resend
4. ADMIN_PASSWORD_HASH matches your password

**Generated:** November 19, 2025
**Author:** Claude Code by Anthropic
