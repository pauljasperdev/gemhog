# Codebase Concerns

**Analysis Date:** 2026-01-15 **Updated:** 2026-01-19

## Severity Definitions

| Severity     | Meaning                                           | Action                             |
| ------------ | ------------------------------------------------- | ---------------------------------- |
| **Critical** | Immediate exploitation risk, data breach possible | Block merge, fix immediately       |
| **High**     | Significant risk, likely to cause issues          | Block merge, fix before deployment |
| **Medium**   | Should be fixed soon                              | Track here, fix in next sprint     |
| **Low**      | Minor issues, best practices                      | Document, fix when convenient      |

## Tech Debt

**Hardcoded Polar product ID:**

- Issue: Placeholder `"your-product-id"` in Polar checkout integration
- File: `packages/auth/src/index.ts` (line 36)
- Why: Scaffolding from template, not replaced
- Impact: Checkout functionality will fail in production
- Fix approach: Replace with actual Polar product ID

**Hardcoded sandbox environment:**

- Issue: `server: "sandbox"` hardcoded in Polar client
- File: `packages/auth/src/lib/payments.ts` (line 6)
- Why: Development setup, not parameterized
- Impact: Production will incorrectly use sandbox
- Fix approach: Use environment variable for server mode

## Known Bugs

**None detected** - Codebase appears to be in early development without reported
bugs.

## Security Considerations

Security findings from reviews. Critical/High must be resolved before merge. See
`SECURITY-CHECKLIST.md` for review process.

### High Severity

**[SEC-001] Missing input validation on AI endpoint:**

- Severity: **High**
- Risk: Malformed or oversized payloads could cause resource exhaustion
- File: `apps/server/src/index.ts` (lines 38-51)
- Category: Input Validation
- Status: Open
- Recommendations: Add Zod validation for message array, limit message count

**[SEC-002] No rate limiting:**

- Severity: **High**
- Risk: AI endpoint vulnerable to abuse/DoS, potential cost explosion
- File: `apps/server/src/index.ts` (AI endpoint)
- Category: Rate Limiting
- Status: Open
- Recommendations: Add rate limiting middleware (e.g., Hono rate-limiter)

### Medium Severity

**[SEC-003] Debug logging exposes data:**

- Severity: **Medium**
- Risk: `console.log` of subscription data could expose sensitive info in
  production logs
- File: `apps/web/src/app/dashboard/dashboard.tsx` (line 18)
- Category: Logging
- Status: Open
- Recommendations: Remove debug logging or guard with `process.env.NODE_ENV`
  check

### Low Severity

None currently tracked.

## Performance Bottlenecks

**No significant bottlenecks detected** - Codebase is relatively small and new.

**Potential future concern:**

- AI endpoint accepts unlimited message history
- File: `apps/server/src/index.ts` (line 40)
- Could impact token limits and memory with large conversations

## Fragile Areas

**AI endpoint error handling:**

- Why fragile: No try-catch around JSON parsing, AI SDK calls
- File: `apps/server/src/index.ts` (lines 38-51)
- Common failures: Invalid JSON, API errors propagate unhandled
- Safe modification: Add comprehensive error handling
- Test coverage: None

**Auth form error handling:**

- Why fragile: Assumes specific error object structure
- Files: `apps/web/src/components/sign-in-form.tsx`, `sign-up-form.tsx`
- Common failures: `error.error.message` could be undefined
- Safe modification: Add defensive checks
- Test coverage: None

## Scaling Limits

**No explicit limits detected** - Would need load testing to determine.

## Dependencies at Risk

**None critical** - Dependencies are modern and actively maintained.

## Missing Critical Features

**Missing .env.example files:**

- Problem: No documentation of required environment variables
- Current workaround: Read source code or copy from teammate
- Blocks: Onboarding new developers
- Implementation complexity: Low

**Missing environment validation for AI key:**

- Problem: `GOOGLE_GENERATIVE_AI_API_KEY` not in Zod schema
- File: `packages/env/src/server.ts`
- Current workaround: Runtime crash if missing
- Blocks: Fail-fast validation at startup
- Implementation complexity: Low

## Test Coverage Gaps

**No tests exist:**

- What's not tested: Entire codebase
- Risk: Regressions, silent failures
- Priority: High (especially auth flows, API endpoints)
- Difficulty to test: Moderate (need to set up Vitest)

**Critical areas needing tests:**

- Authentication flows (`packages/auth/`, sign-in/sign-up forms)
- API procedures (`packages/api/src/routers/`)
- AI endpoint error scenarios
- Database schema migrations

## Documentation Gaps

**Missing setup documentation:**

- Polar integration setup not documented
- `GOOGLE_GENERATIVE_AI_API_KEY` requirement not documented in README
- Environment variable purposes not explained

---

_Concerns audit: 2026-01-15_ _Security severity tracking added: 2026-01-19_
_Update as issues are fixed or new ones discovered_ _Security findings should
include: ID, severity, risk, file, category, status, recommendations_
