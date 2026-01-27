---
phase: 02-email-infrastructure
plan: 01
subsystem: infra
tags: [env, cors, config, rename]

# Dependency graph
requires:
  - phase: 01-foundation
    provides: CORS_ORIGIN env var in schema, auth, server, tests, infra
provides:
  - APP_URL env var replacing CORS_ORIGIN across entire codebase
  - Semantic env var name ready for expanded use (CORS, token URLs, redirect URLs)
affects: [02-02, 02-03, 02-04, 02-05, email-service, auth-flows]

# Tech tracking
tech-stack:
  added: []
  patterns: []

key-files:
  created: []
  modified:
    - packages/env/src/server.ts
    - packages/env/src/server.test.ts
    - packages/core/src/auth/auth.service.ts
    - packages/core/src/auth/auth.test.ts
    - packages/core/src/auth/auth.int.test.ts
    - apps/server/src/app.ts
    - apps/server/src/startup.int.test.ts
    - apps/server/.env.example
    - apps/web/.env.example
    - playwright.config.ts
    - infra/web.ts
    - infra/api.ts

key-decisions:
  - "Pure rename, no logic changes - APP_URL uses same z.url() validator as CORS_ORIGIN"

patterns-established: []

# Metrics
duration: 7min
completed: 2026-01-27
---

# Phase 2 Plan 1: Rename CORS_ORIGIN to APP_URL Summary

**Renamed CORS_ORIGIN to APP_URL across env schema, auth service, CORS config, all tests, infra, and .env files**

## Performance

- **Duration:** 7 min
- **Started:** 2026-01-27T11:27:10Z
- **Completed:** 2026-01-27T11:34:39Z
- **Tasks:** 2
- **Files modified:** 12

## Accomplishments
- Renamed env var from CORS_ORIGIN to APP_URL in env schema (z.url() validator unchanged)
- Updated all application code: auth service trustedOrigins, server CORS config
- Updated all test files: server.test.ts, auth.test.ts, auth.int.test.ts, startup.int.test.ts
- Updated config and infra: playwright.config.ts, infra/web.ts, infra/api.ts
- Updated .env.example files for both server and web apps
- Updated local .env file for server (gitignored)
- All 55 unit tests + 29 integration tests pass with zero failures

## Task Commits

Each task was committed atomically:

1. **Task 1: Rename CORS_ORIGIN to APP_URL in application code and env schema** - `e1a6f85` (feat)
2. **Task 2: Update all tests, .env.example files, config files, and infra** - `822e737` (feat)

## Files Created/Modified
- `packages/env/src/server.ts` - Env schema: CORS_ORIGIN -> APP_URL
- `packages/core/src/auth/auth.service.ts` - Auth trustedOrigins: env.CORS_ORIGIN -> env.APP_URL
- `apps/server/src/app.ts` - CORS origin config: env.CORS_ORIGIN -> env.APP_URL
- `packages/env/src/server.test.ts` - All test references updated (6+ occurrences)
- `packages/core/src/auth/auth.test.ts` - Mock env updated
- `packages/core/src/auth/auth.int.test.ts` - Integration test env updated
- `apps/server/src/startup.int.test.ts` - Startup test env and test names updated
- `apps/server/.env.example` - Example env file updated
- `apps/web/.env.example` - Example env file updated
- `playwright.config.ts` - E2E test env setup updated
- `infra/web.ts` - SST Next.js environment config updated
- `infra/api.ts` - SST Lambda environment config updated

## Decisions Made
None - followed plan as specified. Pure mechanical rename with no logic changes.

## Deviations from Plan
None - plan executed exactly as written.

## Issues Encountered
None.

## User Setup Required
None - no external service configuration required. Local .env files were updated automatically.

## Next Phase Readiness
- APP_URL env var is ready for expanded use in email verification URLs, password reset links, and redirect URLs
- All subsequent plans in Phase 2 can reference env.APP_URL directly
- No blockers or concerns

---
*Phase: 02-email-infrastructure*
*Completed: 2026-01-27*
