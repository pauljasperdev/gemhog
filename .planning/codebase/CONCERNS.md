# Codebase Concerns

**Analysis Date:** 2026-01-15 **Updated:** 2026-01-24

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
- Files: `apps/web/src/app/ai/page.tsx` (useExhaustiveDependencies),
  `packages/db/test/global-setup.ts` (useNodejsImportProtocol), and others
- Impact: CI/pre-commit blocks all commits until fixed
- Fix approach: Run `pnpm check --write` to auto-fix, or manually address each
  warning
- Status: **Must fix for Phase 1 completion**

**Pre-existing type errors (BLOCKER):**

- Issue: TypeScript errors in apps/server cause `pnpm check-types` to exit
  non-zero
- Files: `apps/server/` package
- Impact: CI/pre-commit blocks all commits until fixed
- Fix approach: Fix type errors in apps/server
- Status: **Must fix for Phase 1 completion**

**Integration test script bug (BLOCKER):**

- Issue: Integration test config may have stale project references
- Impact: Integration tests may fail with "No projects matched the filter"
- Fix approach: Verify `vitest.integration.config.ts` has correct project
  references
- Status: **Must fix for Phase 1 completion** (tracked in 01-04-PLAN.md)

**E2E test missing env vars (BLOCKER):**

- Issue: Playwright webServer fails to start - requires BETTER_AUTH_SECRET (min
  32 chars)
- File: `playwright.config.ts`
- Impact: E2E tests always fail with "Invalid environment variables"
- Fix approach: Add test env vars to webServer config or create .env.test
- Status: **Must fix for Phase 1 completion** (tracked in 01-04-PLAN.md)

## Known Bugs

**None detected** - Codebase appears to be in early development without reported
bugs.

## Security Considerations

Security findings from reviews. See `.planning/codebase/SECURITY-REVIEW.md` for
full audit trail and details.

### Current Findings Status

**Summary (as of 2026-01-27):**

| Severity | Open | Fixed | Closed (N/A) |
| -------- | ---- | ----- | ------------ |
| Critical | 0    | 0     | 0            |
| High     | 2    | 2     | 0            |
| Medium   | 1    | 1     | 2            |
| Low      | 1    | 0     | 1            |

**Open findings exist:** YES

**Open findings (details in SECURITY-REVIEW.md):**

- [SEC-006] High - Hono vulnerabilities via `sst>opencontrol>hono` - OPEN
  (2026-01-27)
- [SEC-007] High - MCP SDK vulnerabilities via
  `sst>opencontrol>@modelcontextprotocol/sdk` - OPEN (2026-01-27)
- [SEC-008] Medium - Hono body limit/vary header issues via
  `sst>opencontrol>hono` - OPEN (2026-01-27)
- [SEC-009] Low - aws-sdk region validation advisory via `sst>aws-sdk` - OPEN
  (2026-01-27)

**Resolved findings (details in SECURITY-REVIEW.md):**

- [SEC-001] High - Input validation - FIXED (03.1-08)
- [SEC-002] High - Rate limiting - FIXED (03.1-08)
- [SEC-003] Medium - Debug logging - FIXED (03.1-07)
- [SEC-004] Medium - Polar product ID - CLOSED (03.1-07, Polar removed)
- [SEC-005] Low - Polar sandbox mode - CLOSED (03.1-07, Polar removed)

_Last synced from SECURITY-REVIEW.md: 2026-01-27_

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

**None critical** - All dependencies patched via pnpm overrides where needed.

## Missing Critical Features

**Missing .env.example files:**

- Problem: No documentation of required environment variables
- Current workaround: Read source code or copy from teammate
- Blocks: Onboarding new developers
- Implementation complexity: Low

**SST Cloudflare configuration required:**

- Problem: Cloudflare deployment requires zone ID and API token
- Files: `infra/api.ts`, `infra/web.ts`
- Requirements: `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_DEFAULT_ACCOUNT_ID`,
  `CLOUDFLARE_ZONE_ID`
- Workaround: Set environment variables before `sst deploy`
- Implementation complexity: Low (one-time setup)

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

- `GOOGLE_GENERATIVE_AI_API_KEY` requirement not documented in README
- Environment variable purposes not explained

---

_Concerns audit: 2026-01-15_ _Security severity tracking added: 2026-01-19_
_Update as issues are fixed or new ones discovered_ _Security findings should
include: ID, severity, risk, file, category, status, recommendations_
