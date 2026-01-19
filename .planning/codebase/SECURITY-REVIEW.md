# Security Review Log

Cumulative security findings for the Gemhog project.
Each review session is appended below, maintaining full audit trail.

**Purpose:** Single source of truth for security findings. CONCERNS.md references
this file for summary counts only.

**Format:** Append new sessions at the top (most recent first).

---

## Current Status Summary

Quick reference for blocking check before any work.

| Severity | Open | Fixed | Total |
|----------|------|-------|-------|
| Critical | 0 | 0 | 0 |
| High | 2 | 0 | 2 |
| Medium | 1 | 0 | 1 |
| Low | 0 | 0 | 0 |

**Blocking findings exist:** YES (2 High, 1 Medium)

**Open findings:**
- [SEC-001] High - Missing input validation on AI endpoint
- [SEC-002] High - No rate limiting
- [SEC-003] Medium - Debug logging exposes data

---

## Review: 2026-01-19 - Initial Security Review Migration

**Reviewer:** Claude (agent)
**Commit:** Initial baseline from codebase analysis
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
- **Recommendation:** Remove debug logging or guard with `process.env.NODE_ENV` check
- **Status:** Open

### Summary

| Severity | Count | Status |
|----------|-------|--------|
| Critical | 0 | - |
| High | 2 | Open |
| Medium | 1 | Open |
| Low | 0 | - |

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

**Reviewer:** Claude (agent)
**Commit:** [commit message or git ref]
**Scope:**
- [file1.ts] (changed)
- [file2.ts] (imports file1)
- [file3.ts] (callers of file1)

### Dependency Audit

\`\`\`
[output of pnpm audit --audit-level low]
\`\`\`

### Files Reviewed

| File | Categories Checked | Result |
|------|-------------------|--------|
| path/to/file.ts | Auth, Input Validation | PASS |

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
|----------|-------|--------|
| Critical | 0 | - |
| High | 0 | - |
| Medium | 0 | - |
| Low | 0 | - |

### Sign-off

- [ ] Checked for pre-existing blocking findings
- [ ] Dependency audit passed
- [ ] All Critical/High/Medium resolved
- [ ] Low findings documented
- [ ] Ready for completion
```
