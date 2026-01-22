---
phase: 04-sst-deployment
plan: 01
subsystem: infra
tags: [sst, hono, aws-lambda, env-validation, t3-env]

# Dependency graph
requires:
  - phase: 03.3-env-unification
    provides: t3-env server env schema
provides:
  - GOOGLE_GENERATIVE_AI_API_KEY env validation
  - SST CLI availability (sst v3.17)
  - hono/aws-lambda adapter availability
affects: [04-02-sst-config, 04-03-lambda-handler]

# Tech tracking
tech-stack:
  added: [sst ^3.17]
  patterns: []

key-files:
  created: []
  modified:
    - packages/env/src/server.ts
    - packages/env/src/server.test.ts
    - package.json
    - pnpm-lock.yaml

key-decisions:
  - "hono/aws-lambda built into hono package, not separate @hono/aws-lambda"
  - "Test mocks must include all required env vars from schema"

patterns-established:
  - "All env vars in server schema must be added to vi.mock for @gemhog/env/server"

# Metrics
duration: 7min
completed: 2026-01-22
---

# Phase 4 Plan 01: SST Dependencies Summary

**SST v3.17 installed with AI API key env validation and test mock updates**

## Performance

- **Duration:** 7 min
- **Started:** 2026-01-22T19:48:52Z
- **Completed:** 2026-01-22T19:55:38Z
- **Tasks:** 2
- **Files modified:** 6

## Accomplishments

- Added GOOGLE_GENERATIVE_AI_API_KEY to server env schema (fail-fast at startup)
- Installed SST v3.17.37 as devDependency for CLI and infra code
- Verified hono/aws-lambda adapter available (built into hono 4.11.4)
- Updated all auth test mocks to include new required env var

## Task Commits

Each task was committed atomically:

1. **Task 1: Add GOOGLE_GENERATIVE_AI_API_KEY to env validation** - `25ea807` (feat)
2. **Task 2: Install SST and Hono Lambda dependencies** - `3e42bd4` (chore)

## Files Created/Modified

- `packages/env/src/server.ts` - Added GOOGLE_GENERATIVE_AI_API_KEY validation
- `packages/env/src/server.test.ts` - Added test for new env var validation
- `packages/core/src/auth/auth.test.ts` - Added env var to mock
- `packages/core/src/auth/auth.int.test.ts` - Added env var to mock
- `package.json` - Added sst ^3.17 devDependency
- `pnpm-lock.yaml` - Lockfile update

## Decisions Made

1. **hono/aws-lambda is built into hono** - The plan specified `@hono/aws-lambda` as a
   separate package, but the Lambda adapter is actually at `hono/aws-lambda` export path
   within the hono package. No separate install needed.

2. **Test mocks must include all required env vars** - When adding new required env vars
   to server schema, all vi.mock calls for `@gemhog/env/server` must be updated to include
   the new var, or tests will fail.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed auth test mocks missing new env var**

- **Found during:** Task 2 (running full test suite after SST install)
- **Issue:** Auth tests failed with foreign key constraint violation - root cause was env
  mock missing GOOGLE_GENERATIVE_AI_API_KEY, causing t3-env to throw during import
- **Fix:** Added GOOGLE_GENERATIVE_AI_API_KEY to vi.mock for @gemhog/env/server in:
  - packages/core/src/auth/auth.test.ts
  - packages/core/src/auth/auth.int.test.ts
- **Verification:** All 40 tests pass
- **Committed in:** 3e42bd4 (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (1 bug)
**Impact on plan:** Essential fix for test correctness. No scope creep.

## Issues Encountered

- Plan referenced `@hono/aws-lambda` package which doesn't exist on npm. Research file had
  outdated info. Actual import path is `hono/aws-lambda` from the hono package itself.
  Resolved by verifying hono exports.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- SST CLI available via `pnpm exec sst`
- hono/aws-lambda exports `handle` and `streamHandle` for Lambda handler
- GOOGLE_GENERATIVE_AI_API_KEY validated at startup
- Ready for 04-02: SST config and infra structure

---

*Phase: 04-sst-deployment*
*Completed: 2026-01-22*
