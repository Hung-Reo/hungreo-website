# Password Reset Setup Guide

## Overview

The password reset flow allows admin users to reset their password via email verification with time-limited tokens (15 minutes).

## Architecture

1. **Forgot Password Page** (`/admin/forgot-password`)
   - User enters email
   - System generates secure reset token
   - Email sent with reset link

2. **Reset Password Page** (`/admin/reset-password/[token]`)
   - User clicks link from email
   - Token validated (15-minute expiry)
   - User enters new password
   - Password hash stored in Upstash KV

3. **Security Features**
   - ✅ Tokens expire after 15 minutes
   - ✅ Tokens hashed with SHA-256 before storage
   - ✅ Password strength validation (min 8 chars, uppercase, lowercase, number, special char)
   - ✅ One-time use tokens (deleted after use)
   - ✅ Email enumeration protection (always returns success message)
   - ✅ Password stored as bcrypt hash in KV database

## Setup Instructions

### Step 1: Get Resend API Key

1. Go to [https://resend.com](https://resend.com)
2. Sign up or log in
3. Navigate to **API Keys** section
4. Click **Create API Key**
5. Copy the API key (starts with `re_`)

### Step 2: Add API Key to Environment Variables

#### For Local Development:

Edit `.env.local`:
```bash
# Uncomment and add your API key
RESEND_API_KEY=re_your_actual_api_key_here
```

#### For Vercel Production:

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project: **hungreo-website**
3. Go to **Settings** → **Environment Variables**
4. Add new variable:
   - **Name**: `RESEND_API_KEY`
   - **Value**: `re_your_actual_api_key_here`
   - **Environments**: Production, Preview, Development
5. Click **Save**
6. Redeploy the project

### Step 3: Configure Email Domain (Optional)

By default, emails are sent from `noreply@hungreo.com`. To use a custom domain:

1. In Resend dashboard, go to **Domains**
2. Click **Add Domain**
3. Enter your domain (e.g., `hungreo.com`)
4. Add DNS records as instructed
5. Wait for verification

If not using custom domain, Resend will use their default sending domain for testing.

### Step 4: Update Environment Variable for Production

Add the admin password hash to Vercel:

1. Generate password hash locally:
   ```bash
   node -e "require('bcryptjs').hash('YOUR_PASSWORD', 10).then(console.log)"
   ```

2. Add to Vercel Environment Variables:
   - **Name**: `ADMIN_PASSWORD_HASH`
   - **Value**: `$2b$10$...` (paste the hash WITHOUT escaping $ signs)
   - **Environments**: Production, Preview

   ⚠️ **Important**: In Vercel, use the hash as-is. Only escape `$` as `\$` in local `.env.local` files.

## Testing the Flow

### Local Testing (Without Email)

You can test the flow locally without Resend API key by manually creating reset tokens in KV:

```bash
# In Node.js console or script
const crypto = require('crypto')
const token = crypto.randomBytes(32).toString('hex')
const tokenHash = crypto.createHash('sha256').update(token).digest('hex')

console.log('Reset URL:', `http://localhost:3000/admin/reset-password/${token}`)
console.log('Store in KV:', `password-reset:${tokenHash}`, 'value:', 'hungreo2005@gmail.com', 'expiry:', 900)
```

### Full Flow Testing (With Email)

1. Go to `http://localhost:3000/admin/login`
2. Click **"Forgot password?"**
3. Enter email: `hungreo2005@gmail.com`
4. Check email inbox for reset link
5. Click link (valid for 15 minutes)
6. Enter new password (min 8 chars, uppercase, lowercase, number, special char)
7. Click **"Reset Password"**
8. Redirected to login page
9. Login with new password

## Troubleshooting

### Error: "Email service not configured"

**Cause**: `RESEND_API_KEY` environment variable is missing

**Fix**: Add the API key to `.env.local` (local) or Vercel Environment Variables (production)

### Error: "Invalid or expired reset link"

**Cause**: Token expired (>15 minutes) or already used

**Fix**: Request a new reset link from forgot-password page

### Password Reset Works But Login Fails

**Cause**: Password hash in KV might be incorrect or KV database is different between local/production

**Fix**:
- Check which KV database is being used (see `.env.local` comments)
- For localhost: Use development Upstash database
- For production: Use production Upstash database

### Email Not Received

**Fixes**:
1. Check spam folder
2. Verify `RESEND_API_KEY` is correct
3. Check Resend dashboard for email logs
4. Verify domain is verified (if using custom domain)

## File Structure

```
app/
├── admin/
│   ├── login/page.tsx              # Login page with "Forgot password?" link
│   ├── forgot-password/page.tsx    # Email input form
│   └── reset-password/
│       └── [token]/page.tsx        # Password reset form
├── api/
│   └── admin/
│       ├── forgot-password/route.ts        # Generate token & send email
│       ├── validate-reset-token/route.ts   # Validate token
│       └── reset-password/route.ts         # Update password
lib/
└── auth.ts                         # Checks KV first, then env var for password hash
middleware.ts                       # Allows public access to reset pages
```

## Security Considerations

1. **Token Storage**: Tokens are hashed with SHA-256 before storage in KV
2. **Token Expiry**: 15-minute window reduces attack surface
3. **One-Time Use**: Tokens deleted after successful password reset
4. **Email Enumeration**: Always returns success message regardless of email validity
5. **Password Strength**: Enforced both client-side and server-side
6. **Password Storage**: bcrypt hash (10 rounds) stored in KV
7. **HTTPS Only**: Cookies set to secure in production
8. **Origin Validation**: Admin API routes validate request origin in production

## Production Checklist

- [ ] Add `RESEND_API_KEY` to Vercel environment variables
- [ ] Add `ADMIN_PASSWORD_HASH` to Vercel environment variables
- [ ] Verify email domain in Resend (optional)
- [ ] Test password reset flow on production
- [ ] Verify email delivery works
- [ ] Test password login with new password
- [ ] Remove debug console.log statements from `lib/auth.ts`
- [ ] Ensure production uses correct Upstash KV database

## API Key Management

**Never commit API keys to Git!**

- ✅ `.env.local` is in `.gitignore`
- ✅ Use Vercel Environment Variables for production
- ✅ Rotate API keys if exposed
- ✅ Use different API keys for development/production

## Questions?

For issues or questions, check:
- [Resend Documentation](https://resend.com/docs)
- [NextAuth.js Documentation](https://next-auth.js.org)
- [Upstash KV Documentation](https://docs.upstash.com/redis)
