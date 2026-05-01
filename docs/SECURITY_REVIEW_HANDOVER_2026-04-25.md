# Security Review Handover - 2026-04-25

Scope: local repo `/Users/hungdinh/Development/hungreo-Website`, GitHub public repo `Hung-Reo/hungreo-website`, and public production probe for `https://hungreo.vercel.app`.

Status: review-only completed. No security fixes have been applied in code yet.

## Critical / Short-Term Fixes

### 1. Rotate secrets that may have appeared in git history

Severity: Critical

Finding:
- Local docs/history contain secret-looking values and previous commits explicitly mention exposed passwords/tokens.
- Files observed with sensitive references include `PRODUCTION_DEPLOY_CHECKLIST.md`, `docs/CREATE_NEW_UPSTASH_DATABASE.md`, `docs/PRODUCTION_DEPLOYMENT_NOV14_2025.md`, `README.md`, and archived security docs.

Likely cause:
- Real deployment values were written into documentation/checklists during setup and later committed.
- Even if current docs are cleaned, public git history can still expose old values.

Action:
- Rotate at minimum: `NEXTAUTH_SECRET`, `ADMIN_PASSWORD_HASH`, Upstash/KV tokens, OpenAI key, Pinecone key, Resend key, YouTube key, Blob token if applicable, Gmail app password if used.
- After rotation, update only Vercel/GitHub secrets, not repository docs.

Verify:
```bash
git log --all -G 'sk-proj-|pcsk_|re_[A-Za-z0-9_]{20,}|AIza|NEXTAUTH_SECRET=.*[A-Za-z0-9+/=]{20,}|ADMIN_PASSWORD_HASH=.*\$2[aby]\$' -- ':!package-lock.json' ':!.env*'
```

### 2. Fix production dependency vulnerabilities

Severity: Critical / High

Finding:
- `npm audit --omit=dev` reports 24 production vulnerabilities: 1 critical, 12 high, 10 moderate, 1 low.
- Notable packages: `next`, `next-auth`, `next-mdx-remote`, `axios`, `nodemailer`, `undici`, `@vercel/blob`, `dompurify`.

Likely cause:
- Dependencies are pinned/ranged around vulnerable versions and have not been refreshed after newer advisories.

Action:
- First run non-breaking fix:
```bash
npm audit fix
npm test
npm run build
```
- Then handle breaking upgrades separately, especially `next-mdx-remote@6` and `uuid@14` if still reported.

Verify:
```bash
npm audit --omit=dev
npm test
npm run build
```

### 3. Add GitHub security workflow

Severity: High

Finding:
- Public GitHub API reports `.github/workflows` as missing.
- Local `.github/workflows` directory is empty.
- README claims GitHub Actions secret scanning exists, but no workflow is active.

Likely cause:
- Security workflow was planned/documented but never committed, or was removed.

Action:
- Add CI workflow for:
  - gitleaks secret scan
  - `npm audit --omit=dev`
  - `npm test`
  - `npm run build`

Verify:
```bash
gh workflow list
gh run list --limit 5
```

## High / Medium Short-Term Fixes

### 4. Strip internal metadata from public APIs

Severity: Medium / High privacy

Finding:
- Production `/api/content/about` returns `updatedBy` email, CV metadata, Blob URLs, and an `embeddings` key.
- `/api/cv` publicly returns CV file URL and metadata.

Likely cause:
- Public API returns the full KV CMS object instead of a public DTO (data transfer object: object shape prepared for public consumers).

Action:
- Return only fields required by the public UI.
- Remove from public response: `updatedBy`, internal `embeddings`, admin-only upload metadata.
- Confirm whether CV file URL is intentionally public. If yes, keep but document it clearly.

Verify:
```bash
curl -sS https://hungreo.vercel.app/api/content/about | jq 'keys'
curl -sS https://hungreo.vercel.app/api/content/about | grep -E 'updatedBy|embeddings|@'
```

### 5. Stop setting Auth.js cookies on public pages if not required

Severity: Medium privacy/compliance

Finding:
- Public home page and public APIs set `__Host-authjs.csrf-token` and `__Secure-authjs.callback-url`.
- This conflicts with "No Tracking Cookies" messaging, even though these are auth cookies, not ad/tracking cookies.

Likely cause:
- `middleware.ts` wraps broad matchers with `auth()`, so Auth.js touches public requests.

Action:
- Restrict Auth.js middleware to `/admin/*`, `/api/admin/*`, and auth-needed routes.
- Apply generic security headers without invoking Auth.js for public pages.
- If cookies remain necessary, update privacy copy to say "No advertising/tracking cookies; auth cookies only for admin/session flows."

Verify:
```bash
curl -I https://hungreo.vercel.app/ | grep -i set-cookie
curl -I https://hungreo.vercel.app/api/public/visitor-count | grep -i set-cookie
```

### 6. Add CSP and make security headers consistent on early returns

Severity: Medium

Finding:
- Production has HSTS, `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, and `Permissions-Policy` on normal public responses.
- `Content-Security-Policy` is missing.
- Early `401/403` admin API responses did not include all security headers.

Likely cause:
- Headers are set after some middleware early returns.
- CSP has not been implemented.

Action:
- Create a helper for security headers and apply it to all responses, including early returns.
- Add a conservative CSP compatible with Next.js, Vercel Analytics, Vercel Blob, YouTube thumbnails/embeds if used.

Verify:
```bash
curl -I https://hungreo.vercel.app/ | grep -i content-security-policy
curl -I https://hungreo.vercel.app/api/admin/stats | grep -Ei 'x-frame-options|x-content-type-options|referrer-policy|permissions-policy|strict-transport-security'
```

### 7. Standardize upload validation

Severity: Medium

Finding:
- Some upload routes validate only `file.type.startsWith('image/')` or only file extension.
- Some Blob paths use raw `file.name`.

Likely cause:
- Upload endpoints were added over time with route-local validation instead of a shared validator.

Action:
- Use shared validation for extension, MIME allowlist, max size, and sanitized filename.
- Apply to image, CV, project upload, and document upload routes.

Verify:
```bash
rg -n 'file\\.type\\.startsWith|endsWith\\(|file\\.name|put\\(`' app/api/admin
```

## Longer-Term Hardening

1. Enable GitHub settings:
- Secret scanning and push protection.
- Dependabot alerts and security updates.
- Branch protection for `main`: PR required, status checks required, no direct push.

2. Improve secret hygiene:
- Keep real env values only in Vercel/GitHub secrets/password manager.
- Keep `.env.example` placeholders only.
- Consider git history rewrite only if unavoidable; otherwise rotate first and keep monitoring.

3. Add security regression tests:
- Unauthenticated `/api/admin/*` returns `401/403`.
- Public APIs do not expose `updatedBy`, emails, internal fields, or reset tokens.
- Public pages do not set auth cookies unless intentional.
- Upload endpoints reject invalid MIME/extension/oversized files.

4. Review privacy/GDPR wording:
- Current implementation stores contact email and chat logs for operational support.
- Public copy should avoid absolute "No PII storage" if contact requests are stored.
- Recommended wording: "No advertising trackers. Contact details are stored only when you submit them, for support/reply purposes."

5. Consider admin security improvements:
- Shorter admin session max age or explicit idle timeout.
- Optional 2FA for admin identity provider in the future.
- Admin audit log for destructive actions.

## Current Review Limitations

- GitHub CLI was not logged in: `gh auth status` reported no authenticated host.
- Vercel CLI was unavailable or not logged in.
- Therefore, private GitHub settings, Vercel env var names, deployment protection, and project-level settings were not reviewed.
- No authenticated admin production flows were tested.

## Commands Already Run

```bash
npm audit --omit=dev --json
npm audit --json
npm audit fix --dry-run
npm test
npm run lint
curl -I https://hungreo.vercel.app/
curl -sS -D - https://hungreo.vercel.app/api/admin/stats
curl -sS https://api.github.com/repos/Hung-Reo/hungreo-website
```

Notes:
- `npm test` passed 8/8.
- `npm run lint` did not complete because `next lint` prompted for interactive ESLint setup.

## Suggested Sonnet Action Order

1. Rotate secrets outside the repo.
2. Patch dependencies and run build/test.
3. Add GitHub Actions security workflow.
4. Patch public API DTOs to remove internal metadata.
5. Refactor middleware to avoid public auth cookies and centralize security headers.
6. Add CSP.
7. Standardize upload validation.
8. Hand back to Codex for re-review with the verify commands above.

## Review 2 - 2026-04-25

Reviewer: Codex after Sonnet actions.

### What improved

1. Middleware refactor is directionally correct.
- Local production server no longer sets Auth.js cookies on public `/`, `/api/public/visitor-count`, or `/api/content/about`.
- Local responses now include `Content-Security-Policy`.
- Local early admin API `403` includes security headers.

2. Public About API metadata leak is mostly fixed locally.
- Local `/api/content/about` no longer returns `updatedBy` or `embeddings`.
- Local response no longer contains email-like values.
- CV public Blob URLs remain present. This is acceptable only if public CV download is intentional.

3. Upload validation improved.
- New shared `lib/uploadValidator.ts` validates extension, MIME type, size, and sanitized filename.
- Image/photo/CV/document upload routes now use the shared validator.

4. Dependency posture improved but is not complete.
- `npm audit --omit=dev` improved from 24 production vulnerabilities to 10.
- Critical count is now 0.

5. Build/test status is good.
- `npm test` passed 8/8.
- `npm run build` completed successfully.
- `npm ci --ignore-scripts --dry-run` completed successfully.

### Remaining findings

#### R2-1. Production has not been updated yet

Severity: High until deployed

Finding:
- Live `https://hungreo.vercel.app` still sets Auth.js cookies on public pages/APIs.
- Live `/api/content/about` still returns `updatedBy`, `embeddings`, and email-like data.
- Live responses still do not show the new CSP.

Likely cause:
- Sonnet changes are local only or have not been deployed/promoted to production.

Action:
- Deploy after the remaining local fixes below are addressed.
- Re-run production verification after deployment.

Verify after deploy:
```bash
curl -I https://hungreo.vercel.app/ | grep -Ei 'set-cookie|content-security-policy'
curl -sS https://hungreo.vercel.app/api/content/about | grep -E 'updatedBy|embeddings|@'
curl -I https://hungreo.vercel.app/api/admin/stats | grep -Ei 'content-security-policy|x-frame-options|x-content-type-options|referrer-policy|permissions-policy'
```

#### R2-2. Dependency audit still fails

Severity: High

Finding:
- `npm audit --omit=dev` still reports 10 production vulnerabilities: 3 high, 5 moderate, 2 low.
- Remaining high items include `next`, `next-mdx-remote`, and `glob`.
- Full `npm audit` reports 12 vulnerabilities: 5 high, 5 moderate, 2 low.

Likely cause:
- Sonnet applied safe/transitive lockfile updates but did not handle semver-major or framework-level upgrades.

Action:
- Decide whether to:
  - Patch within Next 14 if a safe patched version exists for this project, or
  - Plan a controlled Next 15/16 upgrade.
- Address `next-mdx-remote` separately. If the app no longer uses it at runtime, remove it. If used, migrate to `next-mdx-remote@6` or safer markdown rendering.
- Address `glob` through `eslint-config-next` upgrade or accept as dev-only only after documenting why it is not production-exploitable.

Verify:
```bash
npm audit --omit=dev
npm audit
```

#### R2-3. GitHub dependency audit workflow is non-blocking

Severity: High

Finding:
- `.github/workflows/security.yml` has:
```yaml
continue-on-error: true
```
on `npm audit --omit=dev`.

Likely cause:
- Added to avoid initially failing CI while vulnerabilities remain.

Action:
- Short term: keep as warning only if intentionally staging the rollout.
- Before merging to protected `main`, remove `continue-on-error: true` or set an explicit threshold policy.
- Recommended command:
```yaml
run: npm audit --omit=dev --audit-level=high
```

Verify:
```bash
rg -n 'continue-on-error|npm audit' .github/workflows/security.yml
```

#### R2-4. GitHub secret scan workflow may fail on `.env.example`

Severity: Medium / CI reliability

Finding:
- `.env.example` still contains a bcrypt-looking `ADMIN_PASSWORD_HASH` example.
- The existing gitleaks config has a bcrypt rule that may flag bcrypt hashes outside TS/TSX/JS files.

Likely cause:
- Example hash was kept for setup convenience.

Action:
- Replace the bcrypt hash in `.env.example` with a non-secret placeholder, for example:
```bash
ADMIN_PASSWORD_HASH=replace-with-bcrypt-hash-generated-locally
```
- Keep the generation command in comments.

Verify:
```bash
rg -n '\$2[aby]\$' .env.example
```

#### R2-5. Local `npm run lint` is still not usable in CI-style mode

Severity: Medium

Finding:
- `npm run lint` still triggers Next's interactive ESLint setup prompt.
- Current workflow does not run lint, but developers may assume it works.

Likely cause:
- Missing committed ESLint config or Next lint setup.

Action:
- Either add a proper ESLint config or remove/update the lint script to avoid an interactive command.
- If keeping lint, make it non-interactive and run it in CI.

Verify:
```bash
npm run lint
```

#### R2-6. CSP is present locally but intentionally loose

Severity: Medium / hardening

Finding:
- Local CSP includes `'unsafe-inline'` and `'unsafe-eval'`.

Likely cause:
- Compatibility with Next.js, inline styles, and existing scripts.

Action:
- Accept temporarily as a baseline improvement.
- Long term, tighten CSP with nonces/hashes and remove `'unsafe-eval'` if feasible.

Verify:
```bash
curl -I http://localhost:3000/ | grep -i content-security-policy
```

### Review 2 command results

```bash
npm test
# Passed 8/8

npm run build
# Passed

npm audit --omit=dev
# Fails: 10 vulnerabilities, 0 critical, 3 high, 5 moderate, 2 low

npm audit
# Fails: 12 vulnerabilities, 0 critical, 5 high, 5 moderate, 2 low

npm ci --ignore-scripts --dry-run
# Passed

npm run lint
# Did not complete; interactive Next ESLint setup prompt
```

### Recommended next action order after Review 2

1. Replace example bcrypt hash in `.env.example`.
2. Decide/fix remaining dependency vulnerabilities, at least high severity.
3. Make `security.yml` audit blocking once high vulnerabilities are fixed.
4. Fix or remove interactive `npm run lint`.
5. Deploy to production.
6. Re-run production verification commands.
