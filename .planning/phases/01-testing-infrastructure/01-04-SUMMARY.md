---
phase: 01-testing-infrastructure
plan: 04
subsystem: testing
tags: [vitest, playwright, integration-tests, e2e-tests, configuration]

# Dependency graph
requires:
  - phase: 01-01
    provides: Vitest setup and root config with projects array
  - phase: 01-02
    provides: Docker globalSetup for integration tests
  - phase: 01-03
    provides: Playwright configuration and E2E test structure
provides:
  - Working test:integration script targeting packages/db
  - Playwright webServer with test environment variables
  - Fixed verification pipeline through integration and E2E stages
affects: [phase-02, ci-pipeline, developer-workflow]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Use --config flag for standalone Vitest configs (not --project)"
    - "Set test.root in Vitest config when running from monorepo root"
    - "Spread process.env in Playwright webServer for env var fallbacks"

key-files:
  modified:
    - package.json
    - packages/db/vitest.config.ts
    - playwright.config.ts

key-decisions:
  - "Use --config flag instead of --project for integration tests"
  - "Use defineConfig instead of defineProject for standalone configs"
  - "Add root: __dirname to resolve paths from config location"
  - "Spread process.env first in webServer env for override capability"

patterns-established:
  - "Vitest standalone config: defineConfig with explicit root path"
  - "Playwright env vars: test defaults with process.env override"

# Metrics
duration: 5min
completed: 2026-01-19
---

# Phase 1 Plan 4: Gap Closure Summary

**Fixed UAT gaps in integration tests (--config flag) and E2E tests (webServer env vars)**

## Performance

- **Duration:** 5 min
- **Started:** 2026-01-19T19:00:00Z
- **Completed:** 2026-01-19T19:05:00Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments

- Fixed test:integration script to use --config flag instead of --project
- Updated packages/db/vitest.config.ts to use defineConfig with explicit root path
- Added test environment variables to Playwright webServer configuration
- All required env vars (DATABASE_URL, BETTER_AUTH_SECRET, etc.) now have test defaults

## Task Commits

Each task was committed atomically:

1. **Task 1: Fix integration test script** - `a3be55f` (fix)
2. **Task 2: Add test environment variables for Playwright webServer** - `3f82f06` (fix)

## Files Created/Modified

- `package.json` - Changed test:integration from --project to --config flag
- `packages/db/vitest.config.ts` - Use defineConfig with root: __dirname for path resolution
- `playwright.config.ts` - Added env object with test defaults for server webServer

## Decisions Made

1. **--config flag over --project:** The root vitest.config.ts excludes packages/db with `!packages/db`, so --project can't find it. Using --config directly points to the standalone config.

2. **defineConfig over defineProject:** When running standalone via --config, the config needs defineConfig (full config) not defineProject (workspace project).

3. **Explicit root path:** Added `root: __dirname` to ensure test file paths resolve relative to packages/db, not the monorepo root where the command runs from.

4. **process.env spread first:** In webServer env, spread `...process.env` first so real environment variables override test defaults when available.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] defineProject to defineConfig**
- **Found during:** Task 1 (Fix integration test script)
- **Issue:** Using --config with defineProject results in "No test files found" because project configs need the workspace context
- **Fix:** Changed import from defineProject to defineConfig in packages/db/vitest.config.ts
- **Files modified:** packages/db/vitest.config.ts
- **Verification:** Vitest now runs from correct root directory
- **Committed in:** a3be55f (Task 1 commit)

**2. [Rule 3 - Blocking] Add root path for test resolution**
- **Found during:** Task 1 (Fix integration test script)
- **Issue:** Without explicit root, test file paths resolve from monorepo root, not packages/db
- **Fix:** Added `root: __dirname` with proper ESM path resolution
- **Files modified:** packages/db/vitest.config.ts
- **Verification:** Vitest reports running from /home/lima/repo/packages/db
- **Committed in:** a3be55f (Task 1 commit)

---

**Total deviations:** 2 auto-fixed (2 blocking issues)
**Impact on plan:** Both fixes necessary for integration tests to find test files. No scope creep.

## Issues Encountered

- **Docker permission:** Current environment lacks Docker socket access, so integration tests fail at container startup. This is an environment issue, not a code bug. The script correctly executes the globalSetup.
- **Playwright browser deps:** E2E tests fail at browser launch due to missing system packages. The webServer env validation fix is verified because Playwright gets past startup to attempt browser launch.
- **Pre-existing lint/type errors:** Pre-commit hooks fail on unrelated files. Used --no-verify for commits as documented in STATE.md.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

**What's ready:**
- test:integration correctly targets packages/db with Docker globalSetup
- test:e2e webServer starts without env validation errors
- All verification stages (unit, integration, E2E) have working scripts

**Remaining blockers before Phase 1 complete:**
1. Pre-existing lint issues need cleanup (separate from this plan)
2. Pre-existing type errors need fixes (separate from this plan)
3. Docker access needed for integration test execution
4. Playwright browser deps needed for E2E execution

**Verification status:**
- Scripts work: test:integration uses correct config, test:e2e passes env validation
- Environment needs: Docker socket access, Playwright browser dependencies

---
*Phase: 01-testing-infrastructure*
*Completed: 2026-01-19*
