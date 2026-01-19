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

**Pre-existing lint failures (BLOCKER):**

- Issue: Multiple Biome lint warnings cause `pnpm check` to exit non-zero
- Files: `apps/web/src/app/ai/page.tsx` (useExhaustiveDependencies), `packages/db/test/global-setup.ts` (useNodejsImportProtocol), and others
- Impact: CI/pre-commit blocks all commits until fixed
- Fix approach: Run `pnpm check --write` to auto-fix, or manually address each warning
- Status: **Must fix for Phase 1 completion**

**Pre-existing type errors (BLOCKER):**

- Issue: TypeScript errors in apps/server cause `pnpm check-types` to exit non-zero
- Files: `apps/server/` package
- Impact: CI/pre-commit blocks all commits until fixed
- Fix approach: Fix type errors in apps/server
- Status: **Must fix for Phase 1 completion**

**Integration test script bug (BLOCKER):**

- Issue: `test:integration` uses `--project @gemhog/db` but db is excluded from root vitest.config.ts
- File: `package.json` line 29
- Impact: `pnpm test:integration` always fails with "No projects matched the filter"
- Fix approach: Change to `--config packages/db/vitest.config.ts`
- Status: **Must fix for Phase 1 completion** (tracked in 01-04-PLAN.md)

**E2E test missing env vars (BLOCKER):**

- Issue: Playwright webServer fails to start - requires BETTER_AUTH_SECRET (min 32 chars)
- File: `playwright.config.ts`
- Impact: `pnpm test:e2e` always fails with "Invalid environment variables"
- Fix approach: Add test env vars to webServer config or create .env.test
- Status: **Must fix for Phase 1 completion** (tracked in 01-04-PLAN.md)

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

Security findings from reviews. See `.planning/codebase/SECURITY-REVIEW.md` for
full audit trail and details. Critical/High/Medium must be resolved before
declaring work complete.

### Current Open Findings

**Summary (as of 2026-01-19):**

| Severity | Open | Fixed |
|----------|------|-------|
| Critical | 0 | 0 |
| High | 2 | 0 |
| Medium | 1 | 0 |
| Low | 0 | 0 |

**Blocking findings exist:** YES (2 High, 1 Medium)

**Open findings (details in SECURITY-REVIEW.md):**
- [SEC-001] High - Missing input validation on AI endpoint
- [SEC-002] High - No rate limiting
- [SEC-003] Medium - Debug logging exposes data

_Last synced from SECURITY-REVIEW.md: 2026-01-19_

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
