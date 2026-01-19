# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-01-19)

**Core value:** Make the repo restructure-ready, testable, security-checkable, and deployable
**Current focus:** Phase 1 complete - integration test convention established

## Current Position

Phase: 1 of 5 (Testing Infrastructure)
Plan: 5 of 5 plans complete (including integration test convention)
Status: Testing infrastructure complete, pre-existing lint/type issues remain
Last activity: 2026-01-19 - Completed 01-06 integration test convention plan

Progress: ███░░░░░░░ ~20% (infrastructure complete, codebase cleanup needed)

## Performance Metrics

**Velocity:**
- Total plans completed: 5
- Average duration: 3.6 min
- Total execution time: 18 min

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 1. Testing Infrastructure | 5/5 | 18 min | 3.6 min |

**Recent Trend:**
- Last 5 plans: 01-02 (2 min), 01-03 (3 min), 01-04 (5 min), 01-06 (4 min)
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

### Pending Todos

None.

### Blockers/Concerns

- Pre-existing lint issues in codebase cause `pnpm check` to exit non-zero (expected CI behavior, cleanup needed)
- Pre-existing type errors cause `pnpm check-types` to exit non-zero
- Docker socket access needed for integration tests (environment-specific)
- Playwright browser dependencies needed for E2E tests (environment-specific)

## Phase 1 Summary

Testing infrastructure complete - scripts work, pre-existing issues remain:

| Plan | Summary | Duration | Status |
|------|---------|----------|--------|
| 01-01 | Vitest + Biome static analysis | 4 min | Complete |
| 01-02 | Docker auto-start for integration tests | 2 min | Complete |
| 01-03 | Playwright E2E + Lefthook hooks + verify.sh | 3 min | Complete |
| 01-04 | Fix test bugs from UAT | 5 min | Complete |
| 01-06 | Integration test convention (*.integration.test.ts) | 4 min | Complete |

**Script Status (all working):**
- `pnpm test:unit` - Passes, excludes *.integration.test.ts
- `pnpm test:integration` - Uses vitest.integration.config.ts, discovers all packages
- `pnpm test:e2e` - webServer starts with test env vars

**Test File Convention:**
- `*.test.ts` - Unit tests (mocked, fast)
- `*.integration.test.ts` - Integration tests (real DB, Docker)
- `*.spec.ts` - E2E tests (Playwright)

**Remaining Issues (pre-existing, not test infrastructure):**
1. Lint issues in apps/web and packages/db (Biome finds 6 errors)
2. Type errors in apps/server
3. Empty .agent/prd.json file

**Key Commands:**
- `pnpm check` - Static analysis with Biome (fails: pre-existing lint issues)
- `pnpm test:unit` - Unit tests (PASSES)
- `pnpm test:integration` - Integration tests (works, needs Docker)
- `pnpm test:e2e` - E2E tests (works, needs Playwright deps)
- `pnpm verify:commit` - Pre-commit check (fails: pre-existing issues)
- `pnpm verify` - Full verification pipeline (fails: pre-existing issues)

## Session Continuity

Last session: 2026-01-19T18:06:00Z
Stopped at: Completed 01-06-PLAN.md (integration test convention)
Resume file: None

Next: Clean up pre-existing lint/type issues OR proceed to Phase 2
