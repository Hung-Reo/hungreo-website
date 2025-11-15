# How to Change Admin Password

## Current Password
- Email: `hungreo2005@gmail.com`
- Password: `Admin@123`

---

## Step-by-Step Guide

### 1. Generate New Password Hash

Run this command in your terminal:

```bash
node -e "require('bcryptjs').hash('YOUR_NEW_PASSWORD', 10).then(console.log)"
```

Example:
```bash
node -e "require('bcryptjs').hash('MyNewSecurePassword123!', 10).then(console.log)"
```

This will output a hash like:
```
$2b$10$XyZ123AbC456DeF789GhI012JkL345MnO678PqR901StU234VwX567
```

### 2. Update the Code

Edit `lib/auth.ts` and replace the `ADMIN_PASSWORD_HASH` value:

```typescript
// Find this line (around line 19):
const ADMIN_PASSWORD_HASH = '$2b$10$AtE9SRSkrQ0ClwQi7OLY3OlWYvcgTR7k2bABJBUyW9PU.pb1Ss612'

// Replace with your new hash:
const ADMIN_PASSWORD_HASH = '$2b$10$XyZ123AbC456DeF789GhI012JkL345MnO678PqR901StU234VwX567'
```

### 3. Commit and Deploy

```bash
git add lib/auth.ts
git commit -m "security: update admin password hash"
git push origin main
vercel --prod
```

### 4. Test

Try logging in at https://hungreo.vercel.app/admin/login with your new password.

---

## Why Hardcoded?

The password hash is hardcoded in the code (not in environment variables) because:

1. **Vercel Environment Variable Issue**: Vercel's env vars break bcrypt hashes due to `$` character interpretation
2. **Git Security**: The hash is safe to commit to Git because:
   - It's one-way encrypted (cannot be reversed to get the password)
   - Only you know the actual password
   - Attackers would need to brute-force the hash (bcrypt is designed to be slow)

---

## Security Best Practices

1. **Use a Strong Password**:
   - At least 12 characters
   - Mix of uppercase, lowercase, numbers, and symbols
   - Example: `MyApp2024!SecureP@ss`

2. **Keep Password Secret**:
   - Don't share it
   - Don't write it down
   - Use a password manager

3. **Regular Updates**:
   - Change password every 6-12 months
   - Change immediately if you suspect it's compromised

---

## Troubleshooting

**Q: I forgot my password!**

A: Generate a new hash with a password you remember, update `lib/auth.ts`, and deploy.

**Q: Can I use environment variables instead?**

A: Not recommended due to Vercel's `$` character issues. Hardcoding the hash is actually more reliable and still secure.

**Q: Is it safe to have the hash in Git?**

A: Yes! Bcrypt hashes are:
- One-way (cannot be reversed)
- Salted (unique even for same password)
- Slow to brute-force (designed to take ~100ms per attempt)

An attacker would need billions of years to crack a strong password's hash.
