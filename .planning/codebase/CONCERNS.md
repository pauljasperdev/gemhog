# Codebase Concerns

**Analysis Date:** 2026-01-15

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

**None detected** - Codebase appears to be in early development without reported bugs.

## Security Considerations

**Missing input validation on AI endpoint:**
- Risk: Malformed or oversized payloads could cause resource exhaustion
- File: `apps/server/src/index.ts` (lines 38-51)
- Current mitigation: None
- Recommendations: Add Zod validation for message array, limit message count

**Debug logging exposes data:**
- Risk: `console.log` of subscription data in production
- File: `apps/web/src/app/dashboard/dashboard.tsx` (line 18)
- Current mitigation: None
- Recommendations: Remove debug logging or guard with environment check

**No rate limiting:**
- Risk: AI endpoint vulnerable to abuse/DoS
- File: `apps/server/src/index.ts` (AI endpoint)
- Current mitigation: None
- Recommendations: Add rate limiting middleware

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

*Concerns audit: 2026-01-15*
*Update as issues are fixed or new ones discovered*
