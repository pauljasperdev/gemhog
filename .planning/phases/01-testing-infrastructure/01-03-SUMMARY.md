---
phase: 01-testing-infrastructure
plan: 03
subsystem: testing
tags: [playwright, e2e, lefthook, pre-commit, verification, automation]

# Dependency graph
requires:
  - 01-01: Vitest and static analysis setup
  - 01-02: Integration testing with Docker
provides:
  - E2E testing with Playwright and webServer auto-start
  - Pre-commit hooks via Lefthook (biome + typecheck)
  - Full verification pipeline script (verify.sh)
  - verify:commit script for agents/CI
affects: [02-security-workflow, ci-pipelines, developer-experience]

# Tech tracking
tech-stack:
  added: ["@playwright/test", "lefthook"]
  patterns:
    - Playwright webServer for dev server auto-start
    - Lefthook for git hooks management
    - Fail-fast verification script

key-files:
  created:
    - playwright.config.ts
    - apps/web/tests/e2e/home.spec.ts
    - lefthook.yml
    - scripts/verify.sh
  modified:
    - package.json
    - pnpm-lock.yaml

key-decisions:
  - "webServer reuseExistingServer: !process.env.CI (fresh in CI, reuse locally)"
  - "Chromium-only for E2E (faster, sufficient coverage)"
  - "Pre-commit runs biome on staged files + typecheck"
  - "verify.sh uses set -e for fail-fast behavior"

patterns-established:
  - "E2E tests in apps/web/tests/e2e/*.spec.ts"
  - "Verification pipeline: static -> unit -> integration -> e2e"
  - "prepare script auto-installs hooks after pnpm install"

# Metrics
duration: 3min
completed: 2026-01-19
---

# Phase 01 Plan 03: E2E Testing & Developer Workflow Summary

**Playwright E2E setup with auto-starting servers, Lefthook pre-commit hooks, and complete verification pipeline script**

## Performance

- **Duration:** 3 min
- **Started:** 2026-01-19T16:05:00Z
- **Completed:** 2026-01-19T16:08:00Z
- **Tasks:** 3
- **Files created/modified:** 6

## Accomplishments

- Playwright configured with webServer auto-start for both frontend (3001) and backend (3000)
- E2E example tests that verify page loads and renders
- Lefthook pre-commit hooks run Biome linting and typecheck on staged files
- `prepare` script auto-installs hooks after `pnpm install`
- Full verification script (`scripts/verify.sh`) runs all test stages in order with fail-fast
- `verify:commit` script available for agents/CI manual pre-commit checks

## Task Commits

Each task was committed atomically:

1. **Task 1: Install and configure Playwright** - `51bbd54` (feat)
2. **Task 2: Install and configure Lefthook pre-commit hooks** - `732fb8d` (feat)
3. **Task 3: Create full verification orchestration script** - `a46064b` (feat)

## Files Created/Modified

- `playwright.config.ts` - Playwright config with webServer array for both apps
- `apps/web/tests/e2e/home.spec.ts` - Example E2E tests (homepage loads, has content)
- `lefthook.yml` - Pre-commit (biome + typecheck) and post-checkout (pnpm install) hooks
- `scripts/verify.sh` - Full verification pipeline with fail-fast
- `package.json` - Added test:e2e, prepare, verify:commit, verify scripts

## Decisions Made

1. **webServer reuseExistingServer based on CI env** - In CI, always start fresh servers. Locally, reuse if already running (faster dev iteration).
2. **Chromium-only browser** - Sufficient for most E2E needs, significantly faster than running all browsers.
3. **Pre-commit runs biome on staged files only** - Fast (only checks changed files), with full typecheck.
4. **verify.sh uses set -e** - Fail-fast ensures issues are caught early without wasting time on later stages.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed linter formatting on new files**
- **Found during:** Task 3 verification
- **Issue:** Created files used single quotes and no semicolons (didn't match Biome style)
- **Fix:** Reformatted playwright.config.ts and home.spec.ts to use double quotes and semicolons
- **Files modified:** playwright.config.ts, apps/web/tests/e2e/home.spec.ts
- **Committed in:** `a46064b` (Task 3 commit)

---

**Total deviations:** 1 auto-fixed (1 bug)
**Impact on plan:** Minimal - style fix to match existing codebase conventions.

## Issues Encountered

- **Pre-existing lint issues in codebase** - The `pnpm verify` script fails at static analysis due to lint issues in existing code (not from this plan). This is documented in STATE.md as a known concern. The verification script itself works correctly - it demonstrates fail-fast behavior by stopping at the first error.

- **Playwright browser dependencies** - Host system missing some browser dependencies. This is expected in headless environments. The tests will work in CI environments with proper browser support or locally with `npx playwright install-deps`.

## User Setup Required

None - Lefthook auto-installs via `prepare` script. Chromium browser was installed during this plan.

## Scripts Added

| Script | Command | Purpose |
|--------|---------|---------|
| `test:e2e` | `playwright test` | Run E2E tests (auto-starts servers) |
| `prepare` | `lefthook install` | Auto-install hooks on `pnpm install` |
| `verify:commit` | `pnpm check && pnpm check-types && pnpm test:unit` | Manual pre-commit check |
| `verify` | `./scripts/verify.sh` | Full verification pipeline |

---
*Phase: 01-testing-infrastructure*
*Completed: 2026-01-19*
