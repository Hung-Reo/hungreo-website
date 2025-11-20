# Security Policy

**Last Updated:** November 19, 2025

## 🔐 Secret Management Policy

### What Should NEVER Be Committed

❌ **Passwords** - Never commit real passwords, even in documentation
❌ **API Keys** - OpenAI, Pinecone, Resend, YouTube API keys
❌ **Database Tokens** - Upstash, Vercel KV tokens
❌ **Auth Secrets** - NextAuth secrets, session keys
❌ **Email Addresses** - Real email addresses (use placeholders)
❌ **Bcrypt Hashes** - While hashed, still shouldn't be public

### Safe Placeholders to Use

✅ **Passwords:** `YOUR_SECURE_PASSWORD`, `[your-password]`
✅ **API Keys:** `YOUR_API_KEY_HERE`, `sk-proj-example...`
✅ **Tokens:** `YOUR_UPSTASH_TOKEN_HERE`, `AxxxYourTokenHere`
✅ **Emails:** `your-email@example.com`, `admin@yourdomain.com`

---

## 🛡️ Automated Security Scanning

### GitHub Actions Workflow

Every push and PR triggers automatic security scans:

1. **TruffleHog** - Scans for high-entropy secrets
2. **Gitleaks** - Scans for known secret patterns
3. **Password Check** - Custom scan for exposed passwords
4. **Token Check** - Scans for API keys and tokens
5. **Dependency Scan** - `npm audit` for vulnerabilities

### Pre-commit Hook

Before each commit, the `.husky/pre-commit` hook runs:

- Checks markdown files for passwords
- Scans for API keys and tokens
- Blocks commit if secrets detected

**To bypass (NOT RECOMMENDED):**
```bash
git commit --no-verify  # Only for false positives
```

---

## 🔥 If Secrets Are Exposed

### Immediate Actions

1. **Rotate ALL credentials immediately:**
   ```bash
   # Rotate Upstash token
   # → Go to https://console.upstash.com → Settings → REST API → Rotate Token

   # Change admin password
   node -e "require('bcryptjs').hash('NewSecurePassword!2025', 10).then(console.log)"

   # Update Vercel env vars
   vercel env rm ADMIN_PASSWORD_HASH production
   vercel env add ADMIN_PASSWORD_HASH production

   vercel env rm UPSTASH_REDIS_REST_TOKEN production
   vercel env add UPSTASH_REDIS_REST_TOKEN production

   # Redeploy
   vercel --prod
   ```

2. **Remove from Git history:**
   ```bash
   # Install BFG Repo-Cleaner
   brew install bfg

   # Remove password from history
   bfg --replace-text passwords.txt

   # Force push (DANGEROUS - coordinate with team)
   git push --force
   ```

3. **Monitor for suspicious activity:**
   - Check Vercel logs for unauthorized access
   - Review Upstash KV data for tampering
   - Monitor email alerts from Resend

---

## 📋 Secret Rotation Schedule

### Required Rotations

| Secret | Rotation Frequency | Last Rotated |
|--------|-------------------|--------------|
| Admin Password | Every 90 days | [Update date] |
| NEXTAUTH_SECRET | Every 180 days | [Update date] |
| Upstash Tokens | After any exposure | [Update date] |
| API Keys | After any exposure | [Update date] |

### How to Rotate

**Admin Password:**
```bash
# 1. Generate new hash
node -e "require('bcryptjs').hash('YourNewPassword', 10).then(console.log)"

# 2. Update .env.local
ADMIN_PASSWORD_HASH="$2b$10$..."

# 3. Update Vercel
vercel env rm ADMIN_PASSWORD_HASH production
vercel env add ADMIN_PASSWORD_HASH production

# 4. Test login
```

**Upstash Token:**
```bash
# 1. Go to Upstash Console → Settings → REST API
# 2. Click "Rotate Token"
# 3. Copy new token
# 4. Update .env.local and Vercel env vars
# 5. Redeploy
```

**NEXTAUTH_SECRET:**
```bash
# 1. Generate new secret
openssl rand -base64 32

# 2. Update .env.local
NEXTAUTH_SECRET="new-secret-here"

# 3. Update Vercel env vars
# 4. Redeploy (will log out all users)
```

---

## ✅ Security Checklist for Contributors

Before committing:

- [ ] No passwords in code or docs
- [ ] No API keys in code or docs
- [ ] No database tokens in code or docs
- [ ] Used placeholders for examples
- [ ] `.env.local` not committed (in `.gitignore`)
- [ ] Pre-commit hook passed
- [ ] Reviewed diff for sensitive data

Before deploying:

- [ ] All env vars set in Vercel
- [ ] No debug logging enabled in production
- [ ] Secrets rotated if exposed
- [ ] Security scan passed on GitHub
- [ ] Reviewed recent commits for leaks

---

## 🚨 Reporting Security Vulnerabilities

**DO NOT** create public GitHub issues for security vulnerabilities.

Instead:

1. **Email:** hungreo2005@gmail.com
2. **Subject:** `[SECURITY] Vulnerability Report`
3. **Include:**
   - Description of vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if any)

**Response Time:** We aim to respond within 24 hours.

---

## 📚 Related Documents

- **Security Fixes:** `docs/SECURITY_FIXES.md`
- **Security Recommendations:** `SECURITY_RECOMMENDATIONS.md`
- **Production Checklist:** `PRODUCTION_DEPLOY_CHECKLIST.md`

---

## 📝 Incident Log

### November 19, 2025 - Exposed Secrets in Documentation

**Severity:** 🔴 CRITICAL

**Discovered:** Automated scan found:
- Password `Admin@123` in 8 documentation files
- Real Upstash token in `docs/UPSTASH_DATABASE_MIGRATION_2024-11-15.md`

**Actions Taken:**
1. ✅ Removed all passwords from documentation
2. ✅ Replaced real token with placeholder
3. ✅ Added automated security scanning (GitHub Actions)
4. ✅ Implemented pre-commit hooks
5. ✅ Created security policy documentation
6. 🔄 **PENDING:** Rotate Upstash token in production
7. 🔄 **PENDING:** Change admin password

**Lessons Learned:**
- Never put real credentials in documentation, even for examples
- Always use placeholders like `YOUR_TOKEN_HERE`
- Automated scanning catches mistakes before they reach production

---

**Document Version:** 1.0
**Last Review:** 2025-11-19
**Next Review:** 2025-12-19 (monthly)
