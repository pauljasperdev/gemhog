# Security Verification Checklist

**Purpose:** Systematic security review for agent workflows. Run after implementation, before E2E tests. Critical/high findings block merge.

**Output:** Each review produces a `SECURITY-REVIEW.md` in the feature/phase directory with findings and sign-off.

---

## How to Use This Checklist

1. Review each category relevant to the changes made
2. Mark items as PASS, FAIL (with severity), or N/A
3. Document findings in SECURITY-REVIEW.md
4. Critical/High findings must be fixed before merge
5. Medium findings tracked in CONCERNS.md for follow-up
6. Low findings documented but don't block

**Severity Levels:**
- **Critical**: Immediate exploitation risk (auth bypass, SQL injection, secrets exposed)
- **High**: Significant risk requiring fix before merge (missing validation, broken auth checks)
- **Medium**: Should be fixed soon, tracked in CONCERNS.md
- **Low**: Minor issues, best practice improvements

---

## 1. Input Validation

All user input must be validated at system boundaries.

- [ ] All API endpoints have Zod schemas for input validation
- [ ] Zod schemas have appropriate constraints (max length, patterns, enums)
- [ ] File uploads validated (type, size, content)
- [ ] URL parameters validated before use
- [ ] Query parameters validated before use
- [ ] JSON payloads validated before processing
- [ ] No raw user input passed to database queries
- [ ] No raw user input used in file paths
- [ ] No raw user input used in shell commands

**Common Failures:**
- Missing `.parse()` or `.safeParse()` on user input
- Overly permissive schemas (e.g., `z.string()` without `.max()`)
- Trusting client-side validation alone

---

## 2. Authentication

Verify auth is correctly implemented and enforced.

- [ ] All protected routes use `protectedProcedure` or equivalent middleware
- [ ] Session validation happens server-side, not just client-side
- [ ] Session tokens are HTTP-only, secure, same-site cookies
- [ ] Password requirements enforced (if applicable)
- [ ] Rate limiting on auth endpoints (login, signup, password reset)
- [ ] Account lockout after failed attempts (if applicable)
- [ ] Logout properly invalidates session
- [ ] Auth state not stored in localStorage (use HTTP-only cookies)

**Common Failures:**
- Using `publicProcedure` for routes that need auth
- Checking auth only on frontend, not backend
- Session tokens in localStorage vulnerable to XSS

---

## 3. Authorization

Verify users can only access their own resources.

- [ ] Resource ownership verified before read/write operations
- [ ] User can only modify their own data
- [ ] Admin routes properly restricted
- [ ] No IDOR (Insecure Direct Object Reference) vulnerabilities
- [ ] Subscription/payment status checked for premium features
- [ ] API keys/tokens scoped appropriately

**Common Failures:**
- Fetching resource by ID without checking ownership: `db.select().where(eq(id, userId))` missing the userId check
- Trusting user-provided IDs without verification

---

## 4. Secrets Management

No secrets should be exposed in code or logs.

- [ ] No hardcoded API keys, passwords, or secrets in code
- [ ] All secrets loaded from environment variables
- [ ] Environment variables validated at startup (Zod schema in `packages/env/`)
- [ ] `.env` files in `.gitignore`
- [ ] No secrets logged (check console.log, error messages)
- [ ] Error messages don't expose internal details
- [ ] Source maps disabled in production (if applicable)

**Common Failures:**
- Hardcoded test credentials left in code
- `console.log(user)` exposing session tokens
- Stack traces sent to client in production

---

## 5. SQL/Database Security

Prevent injection and data leakage.

- [ ] Using Drizzle ORM parameterized queries (no raw SQL with string concatenation)
- [ ] No `sql.raw()` with user input
- [ ] Database errors don't expose schema details to users
- [ ] Sensitive columns excluded from default selects (passwords, tokens)
- [ ] Database connection uses SSL in production

**Common Failures:**
- `sql.raw(\`SELECT * FROM users WHERE id = ${userId}\`)` — use parameterized queries
- Returning full user object including password hash

---

## 6. XSS Prevention

Prevent cross-site scripting attacks.

- [ ] React's default escaping used (no `dangerouslySetInnerHTML` with user content)
- [ ] User-generated content sanitized before rendering
- [ ] URLs validated before use in `href` or `src` attributes
- [ ] Content-Security-Policy headers configured
- [ ] No inline scripts with user data

**Common Failures:**
- `dangerouslySetInnerHTML={{ __html: userContent }}`
- `href={userProvidedUrl}` without validation (javascript: URLs)

---

## 7. CSRF Protection

Prevent cross-site request forgery.

- [ ] State-changing operations use POST/PUT/DELETE (not GET)
- [ ] CSRF tokens used for form submissions (if not using SameSite cookies)
- [ ] SameSite cookie attribute set to 'Strict' or 'Lax'
- [ ] Origin/Referer headers validated for sensitive operations

**Common Failures:**
- DELETE operation via GET request
- Missing SameSite attribute on session cookies

---

## 8. Rate Limiting

Prevent abuse and DoS.

- [ ] Rate limiting on authentication endpoints
- [ ] Rate limiting on expensive operations (AI calls, external APIs)
- [ ] Rate limiting on public endpoints
- [ ] Appropriate limits for different user tiers
- [ ] Rate limit headers returned to clients

**Common Failures:**
- No rate limiting on AI endpoint allowing cost abuse
- No rate limiting on signup allowing spam accounts

---

## 9. Dependency Security

Third-party code is a common attack vector.

- [ ] `pnpm audit` shows no critical/high vulnerabilities
- [ ] Dependencies are from trusted sources (npm registry)
- [ ] No unnecessary dependencies added
- [ ] Lock file (`pnpm-lock.yaml`) committed and used
- [ ] Dependabot or similar configured for updates

**Common Failures:**
- Ignoring `pnpm audit` warnings
- Using abandoned packages with known vulnerabilities

---

## 10. Logging & Monitoring

Secure logging for debugging without exposure.

- [ ] No sensitive data in logs (passwords, tokens, PII)
- [ ] Log levels appropriate for environment (debug off in prod)
- [ ] Failed auth attempts logged for monitoring
- [ ] Unusual activity patterns detectable
- [ ] Logs don't expose internal file paths or stack traces to users

**Common Failures:**
- `console.log('User logged in:', user)` including session token
- Debug logging left enabled in production

---

## 11. API Security

Secure API design and implementation.

- [ ] CORS configured restrictively (specific origins, not `*`)
- [ ] API versioning strategy in place
- [ ] Appropriate HTTP status codes (not always 200)
- [ ] Response doesn't include unnecessary data
- [ ] Pagination on list endpoints to prevent data dumps
- [ ] Timeouts configured for external API calls

**Common Failures:**
- `cors({ origin: '*' })` in production
- Returning 500 errors with stack traces

---

## 12. File Handling

Secure file upload and storage.

- [ ] File type validation (not just extension, check magic bytes)
- [ ] File size limits enforced
- [ ] Uploaded files stored outside web root
- [ ] Unique/random filenames to prevent overwrites
- [ ] No path traversal in file operations (`../` in filenames)
- [ ] Virus scanning for user uploads (if applicable)

**Common Failures:**
- Trusting `file.mimetype` from client
- Storing uploads in `public/` directory

---

## Security Review Template

```markdown
# Security Review: [Feature/Phase Name]

**Date:** YYYY-MM-DD
**Reviewer:** [Agent/Human]
**Scope:** [Files/components reviewed]

## Summary

| Category | Status | Notes |
|----------|--------|-------|
| Input Validation | PASS/FAIL/N/A | |
| Authentication | PASS/FAIL/N/A | |
| Authorization | PASS/FAIL/N/A | |
| Secrets Management | PASS/FAIL/N/A | |
| SQL/Database | PASS/FAIL/N/A | |
| XSS Prevention | PASS/FAIL/N/A | |
| CSRF Protection | PASS/FAIL/N/A | |
| Rate Limiting | PASS/FAIL/N/A | |
| Dependencies | PASS/FAIL/N/A | |
| Logging | PASS/FAIL/N/A | |
| API Security | PASS/FAIL/N/A | |
| File Handling | PASS/FAIL/N/A | |

## Findings

### Critical
- None / [Description, file:line, remediation]

### High
- None / [Description, file:line, remediation]

### Medium
- None / [Description, file:line, remediation]

### Low
- None / [Description, file:line, remediation]

## Sign-off

- [ ] All critical findings resolved
- [ ] All high findings resolved
- [ ] Medium findings tracked in CONCERNS.md
- [ ] Ready for E2E verification
```

---

*Checklist version: 1.0*
*Last updated: 2026-01-19*
*Based on OWASP Top 10 and project-specific requirements*
