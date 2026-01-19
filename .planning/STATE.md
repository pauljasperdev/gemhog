# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-01-19)

**Core value:** Make the repo restructure-ready, testable, security-checkable, and deployable
**Current focus:** Phase 1 gap closure - type errors fixed, lint issues remain

## Current Position

Phase: 1 of 5 (Testing Infrastructure)
Plan: 6 of 8 plans complete (01-08 gap closure done)
Status: Type checking passes, lint issues remain for 01-07
Last activity: 2026-01-19 - Completed 01-08 (add missing hono dependency)

Progress: ███░░░░░░░ ~20% (infrastructure complete, lint cleanup needed)

## Performance Metrics

**Velocity:**
- Total plans completed: 6
- Average duration: 3.2 min
- Total execution time: 19 min

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 1. Testing Infrastructure | 6/8 | 19 min | 3.2 min |

**Recent Trend:**
- Last 5 plans: 01-03 (3 min), 01-04 (5 min), 01-06 (4 min), 01-08 (<1 min)
- Trend: Consistent fast execution

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

| Decision | Rationale | Plan |
|----------|-----------|------|
| Use Vitest projects array (not workspace) | Modern approach for Vitest 3.2+ | 01-01 |
| Exclude packages/db from root config | Has Docker globalSetup, runs separately | 01-01 |
| Use --error-on-warnings for Biome | CI-safe exit codes | 01-01 |
| Don't auto-stop Docker containers in teardown | Developers may want them running for db:studio | 01-02 |
| Use pg_isready for PostgreSQL health check | More reliable than container start status | 01-02 |
| Detect external DB via DATABASE_URL hostname | Enables Test-stage AWS without code changes | 01-02 |
| webServer reuseExistingServer: !process.env.CI | Fresh servers in CI, reuse locally | 01-03 |
| Chromium-only for E2E | Faster, sufficient coverage | 01-03 |
| Pre-commit runs biome on staged files + typecheck | Fast checks on commit | 01-03 |
| Use --config flag for integration tests | --project can't find excluded packages | 01-04 |
| defineConfig over defineProject for standalone | Standalone configs need full config object | 01-04 |
| Explicit root path in Vitest config | Paths resolve from monorepo root otherwise | 01-04 |
| Spread process.env first in webServer env | Real env vars override test defaults | 01-04 |
| Use *.integration.test.ts suffix convention | Clear separation from unit tests, glob-discoverable | 01-06 |
| Single test/integration-setup.ts for all packages | Consistent Docker handling, avoids duplication | 01-06 |
| Use isolate: false, fileParallelism: false | Vitest 4 removed poolOptions, these are equivalents | 01-06 |
| Add hono as regular dependency in packages/api | Consistency with apps/server, even for type-only imports | 01-08 |

### Pending Todos

None.

### Blockers/Concerns

- Pre-existing lint issues in codebase cause `pnpm check` to exit non-zero (expected CI behavior, cleanup needed in 01-07)
- Docker socket access needed for integration tests (environment-specific)
- Playwright browser dependencies needed for E2E tests (environment-specific)

## Phase 1 Summary

Testing infrastructure complete - type check passes, lint cleanup pending:

| Plan | Summary | Duration | Status |
|------|---------|----------|--------|
| 01-01 | Vitest + Biome static analysis | 4 min | Complete |
| 01-02 | Docker auto-start for integration tests | 2 min | Complete |
| 01-03 | Playwright E2E + Lefthook hooks + verify.sh | 3 min | Complete |
| 01-04 | Fix test bugs from UAT | 5 min | Complete |
| 01-06 | Integration test convention (*.integration.test.ts) | 4 min | Complete |
| 01-07 | Fix pre-existing lint issues | - | Pending |
| 01-08 | Add missing hono dependency | <1 min | Complete |

**Script Status (all working):**
- `pnpm test:unit` - Passes, excludes *.integration.test.ts
- `pnpm test:integration` - Uses vitest.integration.config.ts, discovers all packages
- `pnpm test:e2e` - webServer starts with test env vars
- `pnpm check-types` - PASSES (fixed in 01-08)

**Test File Convention:**
- `*.test.ts` - Unit tests (mocked, fast)
- `*.integration.test.ts` - Integration tests (real DB, Docker)
- `*.spec.ts` - E2E tests (Playwright)

**Remaining Issues (pre-existing, not test infrastructure):**
1. Lint issues in apps/web (Biome finds errors) - to fix in 01-07
2. Empty .agent/prd.json file - to fix in 01-07

**Key Commands:**
- `pnpm check` - Static analysis with Biome (fails: pre-existing lint issues)
- `pnpm check-types` - Type checking (PASSES)
- `pnpm test:unit` - Unit tests (PASSES)
- `pnpm test:integration` - Integration tests (works, needs Docker)
- `pnpm test:e2e` - E2E tests (works, needs Playwright deps)
- `pnpm verify:commit` - Pre-commit check (fails: pre-existing lint issues)
- `pnpm verify` - Full verification pipeline (fails: pre-existing lint issues)

## Session Continuity

Last session: 2026-01-19T18:39:36Z
Stopped at: Completed 01-08-PLAN.md (add missing hono dependency)
Resume file: None

Next: Execute 01-07-PLAN.md to fix pre-existing lint issues
