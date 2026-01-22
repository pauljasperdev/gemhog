# Security Review Log

Cumulative security findings for the Gemhog project. Each review session is
appended below, maintaining full audit trail.

**Purpose:** Single source of truth for security findings. CONCERNS.md
references this file for summary counts only.

**Format:** Append new sessions at the top (most recent first).

---

## Current Status Summary

Quick reference for blocking check before any work.

| Severity | Open | Fixed | Closed (N/A) | Total |
| -------- | ---- | ----- | ------------ | ----- |
| Critical | 0    | 0     | 0            | 0     |
| High     | 0    | 2     | 0            | 2     |
| Medium   | 0    | 1     | 2            | 3     |
| Low      | 0    | 0     | 1            | 1     |

**Blocking findings exist:** NO

**All findings resolved:**

- [SEC-001] High - Missing input validation on AI endpoint - FIXED (03.1-08)
- [SEC-002] High - No rate limiting - FIXED (03.1-08)
- [SEC-003] Medium - Debug logging exposes data - FIXED (03.1-07)
- [SEC-004] Medium - Hardcoded placeholder productId - CLOSED (03.1-07, Polar
  removed)
- [SEC-005] Low - Polar sandbox mode hardcoded - CLOSED (03.1-07, Polar removed)

---

## Review: 2026-01-21 - Gap Closure (03.1-06 through 03.1-09)

**Reviewer:** Claude (agent) **Commit:** Gap closure plans addressing
VERIFICATION.md findings **Scope:**

- packages/core/drizzle.config.ts (env import change)
- packages/core/src/auth/auth.service.ts (static import, Polar removal)
- packages/env/src/server.ts (POLAR vars removed)
- apps/web/src/lib/auth-client.ts (Polar removal)
- apps/web/src/app/dashboard/dashboard.tsx (debug logging removed, Polar
  removal)
- apps/server/src/index.ts (validation and rate limiting added)

### Dependency Audit

```
pnpm security:audit
No known vulnerabilities found
```

### Files Reviewed

| File                                     | Categories Checked                            | Result |
| ---------------------------------------- | --------------------------------------------- | ------ |
| apps/server/src/index.ts                 | Input Validation, Rate Limiting, API Security | PASS   |
| packages/core/src/auth/auth.service.ts   | Auth, Secrets Management                      | PASS   |
| packages/core/drizzle.config.ts          | Secrets Management                            | PASS   |
| packages/env/src/server.ts               | Secrets Management                            | PASS   |
| apps/web/src/lib/auth-client.ts          | Auth                                          | PASS   |
| apps/web/src/app/dashboard/dashboard.tsx | Logging                                       | PASS   |

### Findings Resolved

#### [SEC-001] High - Missing input validation on AI endpoint

- **Status:** FIXED (03.1-08)
- **Fix:** Added Zod schema validation for message array
  - UIMessageSchema validates role, parts array structure
  - Limits: 50 messages max, 100 parts per message, 10KB per text part
  - Proper error response with validation details

#### [SEC-002] High - No rate limiting

- **Status:** FIXED (03.1-08)
- **Fix:** Added in-memory rate limiter
  - 10 requests per minute per client IP
  - Uses x-forwarded-for/x-real-ip for client identification
  - Returns 429 with clear error message when exceeded
  - Periodic cleanup of expired entries

#### [SEC-003] Medium - Debug logging exposes data

- **Status:** FIXED (03.1-07)
- **Fix:** Removed console.log from dashboard.tsx
  - No more subscription data logged in production

#### [SEC-004] Medium - Hardcoded placeholder productId

- **Status:** CLOSED (03.1-07)
- **Reason:** Polar integration removed entirely from codebase
  - @polar-sh/sdk removed from dependencies
  - All Polar-related code deleted
  - Finding no longer applicable

#### [SEC-005] Low - Polar sandbox mode hardcoded

- **Status:** CLOSED (03.1-07)
- **Reason:** Polar integration removed entirely from codebase
  - Finding no longer applicable

### Positive Findings

- **Input validation properly implemented:** Zod schemas with appropriate
  constraints
- **Rate limiting in place:** Simple but effective for single-server deployment
- **Secrets properly redacted:** DATABASE_URL uses Config.redacted() and
  Redacted.value()
- **Cookie security:** httpOnly: true, secure: true, sameSite: "none"
  (intentional for cross-origin API)
- **CORS configured:** Uses specific origin from env, not "\*"
- **No debug logging:** Dashboard cleaned up
- **Env validation:** t3-oss/env validates at import time

### Summary

| Severity | Count | Status           |
| -------- | ----- | ---------------- |
| Critical | 0     | -                |
| High     | 0     | All fixed        |
| Medium   | 0     | All fixed/closed |
| Low      | 0     | All closed       |

### Sign-off

- [x] Checked for pre-existing blocking findings (all resolved)
- [x] Dependency audit passed (no vulnerabilities)
- [x] All Critical/High/Medium resolved
- [x] Ready for completion

---

## Review: 2026-01-21 - Phase 3.1 Code Review Fixes

**Reviewer:** Claude (agent) **Commit:** Phase 3.1 complete (03.1-01 through
03.1-05) **Scope:**

- packages/env/src/server.ts (secrets handling with t3-oss/env)
- packages/env/src/web.ts (web env config)
- packages/core/src/auth/auth.service.ts (authentication)
- packages/core/drizzle.config.ts (database config)
- packages/core/src/payment/\* (deleted - dead code removal)
- apps/server/src/index.ts (caller)
- packages/api/src/context.ts (caller)

### Dependency Audit

```
pnpm audit --audit-level low
No known vulnerabilities found
```

### Files Reviewed

| File                                   | Categories Checked | Result                        |
| -------------------------------------- | ------------------ | ----------------------------- |
| packages/env/src/server.ts             | Secrets Management | PASS - Uses Config.redacted() |
| packages/env/src/web.ts                | Secrets Management | PASS                          |
| packages/core/src/auth/auth.service.ts | Auth, Secrets, SQL | PARTIAL - 2 findings          |
| packages/core/drizzle.config.ts        | Secrets, SQL       | PASS - Build-time only        |
| apps/server/src/index.ts               | API Security, CORS | PASS                          |
| packages/api/src/context.ts            | Auth               | PASS                          |

### Findings

#### [SEC-004] Medium - Hardcoded placeholder productId

- **File:** `packages/core/src/auth/auth.service.ts:42`
- **Category:** Secrets Management / Configuration
- **Description:** Polar checkout uses hardcoded `productId: "your-product-id"`
  placeholder
- **Risk:** Checkout will fail or use wrong product if deployed without changing
  code
- **Recommendation:** Move to environment variable `POLAR_PRODUCT_ID`
- **Status:** Open

#### [SEC-005] Low - Polar sandbox mode hardcoded

- **File:** `packages/core/src/auth/auth.service.ts:21`
- **Category:** Configuration
- **Description:** Polar client uses hardcoded `server: "sandbox"`
- **Risk:** Will use sandbox environment in production unless code is changed
- **Recommendation:** Make configurable via env var `POLAR_ENVIRONMENT`
  (sandbox/production)
- **Status:** Open (Low - non-blocking)

### Positive Findings

- **Secrets properly redacted:** DATABASE_URL, BETTER_AUTH_SECRET,
  POLAR_ACCESS_TOKEN use Config.redacted() and Redacted.value()
- **Cookie security:** httpOnly: true, secure: true, sameSite: "none"
  (intentional for cross-origin API)
- **No secrets in git:** .env files properly gitignored, none tracked
- **Parameterized queries:** Drizzle ORM used throughout
- **CORS configured:** Uses specific origin from env, not "\*"
- **Env validation:** t3-oss/env validates at import time, fails fast

### Summary

| Severity | Count | Status         |
| -------- | ----- | -------------- |
| Critical | 0     | -              |
| High     | 0     | -              |
| Medium   | 1     | Open (SEC-004) |
| Low      | 1     | Open (SEC-005) |

### Sign-off

- [x] Checked for pre-existing blocking findings (3 exist: SEC-001, SEC-002,
      SEC-003)
- [x] Dependency audit passed (no vulnerabilities)
- [ ] All Critical/High/Medium resolved (SEC-004 new Medium finding)
- [x] Low findings documented (SEC-005)
- [ ] Ready for completion (SEC-004 blocks)

---

## Review: 2025-01-21 - Entity Documentation Generation

**Reviewer:** Claude (agent) **Commit:** Entity generation for codebase
intelligence **Scope:**

- 35 new `.planning/intel/entities/*.md` files (documentation only)
- `.planning/intel/index.json` (formatting fix)

### Dependency Audit

Not applicable - no dependencies added or changed. Only markdown documentation
files created.

### Files Reviewed

| File                                      | Categories Checked | Result                   |
| ----------------------------------------- | ------------------ | ------------------------ |
| .planning/intel/entities/\*.md (35 files) | All                | N/A - documentation only |

### Findings

None. This change only adds markdown documentation files to
`.planning/intel/entities/`. These files:

- Contain no executable code
- Handle no user input
- Perform no authentication/authorization
- Access no databases or external services
- Store no secrets
- Are not served to users

The only code change was a formatting fix to `.planning/intel/index.json`
(auto-formatted by biome).

### Summary

| Severity | Count | Status |
| -------- | ----- | ------ |
| Critical | 0     | -      |
| High     | 0     | -      |
| Medium   | 0     | -      |
| Low      | 0     | -      |

### Sign-off

- [x] Checked for pre-existing blocking findings (3 exist, unrelated to this
      work)
- [x] Dependency audit passed (no dependencies changed)
- [x] No new Critical/High/Medium findings from this change
- [x] Documentation-only changes have no security implications
- [x] Ready for completion (pre-existing findings are out of scope for
      documentation task)

---

## Review: 2026-01-19 - Initial Security Review Migration

**Reviewer:** Claude (agent) **Commit:** Initial baseline from codebase analysis
**Scope:** Pre-existing findings migrated from CONCERNS.md

### Dependency Audit

```
Not run during migration - existing findings only
```

### Files Reviewed

Pre-existing findings from codebase analysis (not a new review session).

### Findings

#### [SEC-001] High - Missing input validation on AI endpoint

- **File:** `apps/server/src/index.ts:38-51`
- **Category:** Input Validation
- **Description:** No validation on message array payload to AI endpoint
- **Risk:** Malformed or oversized payloads could cause resource exhaustion
- **Recommendation:** Add Zod validation for message array, limit message count
- **Status:** Open

#### [SEC-002] High - No rate limiting

- **File:** `apps/server/src/index.ts` (AI endpoint)
- **Category:** Rate Limiting
- **Description:** AI endpoint has no rate limiting protection
- **Risk:** Vulnerable to abuse/DoS, potential cost explosion from API calls
- **Recommendation:** Add rate limiting middleware (e.g., Hono rate-limiter)
- **Status:** Open

#### [SEC-003] Medium - Debug logging exposes data

- **File:** `apps/web/src/app/dashboard/dashboard.tsx:18`
- **Category:** Logging
- **Description:** console.log of subscription data in production code
- **Risk:** Could expose sensitive info in production logs
- **Recommendation:** Remove debug logging or guard with `process.env.NODE_ENV`
  check
- **Status:** Open

### Summary

| Severity | Count | Status |
| -------- | ----- | ------ |
| Critical | 0     | -      |
| High     | 2     | Open   |
| Medium   | 1     | Open   |
| Low      | 0     | -      |

### Sign-off

- [x] Pre-existing findings documented
- [ ] Dependency audit passed (not run - migration only)
- [ ] All Critical/High/Medium resolved (3 open findings remain)
- [x] Baseline established for future reviews

---

## Template: New Review Session

Copy this template when adding a new review session:

```markdown
## Review: [YYYY-MM-DD] - [Brief Description]

**Reviewer:** Claude (agent) **Commit:** [commit message or git ref] **Scope:**

- [file1.ts] (changed)
- [file2.ts] (imports file1)
- [file3.ts] (callers of file1)

### Dependency Audit

\`\`\` [output of pnpm audit --audit-level low] \`\`\`

### Files Reviewed

| File            | Categories Checked     | Result |
| --------------- | ---------------------- | ------ |
| path/to/file.ts | Auth, Input Validation | PASS   |

### Findings

#### [SEC-XXX] [Severity] - [Title]

- **File:** `path/to/file.ts:line`
- **Category:** [SECURITY-CHECKLIST.md category]
- **Description:** [what the issue is]
- **Risk:** [what could go wrong]
- **Recommendation:** [how to fix]
- **Status:** Open | Fixed | Deferred (Low only)

### Summary

| Severity | Count | Status |
| -------- | ----- | ------ |
| Critical | 0     | -      |
| High     | 0     | -      |
| Medium   | 0     | -      |
| Low      | 0     | -      |

### Sign-off

- [ ] Checked for pre-existing blocking findings
- [ ] Dependency audit passed
- [ ] All Critical/High/Medium resolved
- [ ] Low findings documented
- [ ] Ready for completion
```
