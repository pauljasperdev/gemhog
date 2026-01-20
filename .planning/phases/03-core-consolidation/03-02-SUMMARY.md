---
phase: 03-core-consolidation
plan: 02
subsystem: auth
tags: [effect, better-auth, drizzle, jwt, session]

# Dependency graph
requires:
  - phase: 03-01
    provides: Core package foundation with Effect database layers
provides:
  - AuthService Effect Layer wrapping better-auth
  - Auth schema (user, session, account, verification) in packages/core
  - Mock AuthService layers for unit testing
  - Backward-compatible auth export for gradual migration
affects: [03-03, apps/server]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Lazy getter pattern for auth instance (getAuth())"
    - "Proxy pattern for backward-compatible exports"
    - "Deferred env validation via require() for testability"

key-files:
  created:
    - packages/core/src/auth/auth.sql.ts
    - packages/core/src/auth/auth.errors.ts
    - packages/core/src/auth/auth.service.ts
    - packages/core/src/auth/auth.mock.ts
    - packages/core/src/auth/index.ts
    - packages/core/src/auth/auth.test.ts
  modified:
    - packages/core/package.json

key-decisions:
  - "Defer env validation via require() instead of top-level import for testability"
  - "Use getAuth() lazy getter pattern for backward compatibility"
  - "Proxy pattern for auth export to maintain existing import paths"

patterns-established:
  - "Effect.tryPromise wrapping at better-auth boundary"
  - "Mock Layer pattern: Layer.succeed(Service, mockImplementation)"
  - "Domain file structure: {domain}.sql.ts, {domain}.errors.ts, {domain}.service.ts, {domain}.mock.ts, index.ts"

# Metrics
duration: 6min
completed: 2026-01-20
---

# Phase 3 Plan 2: Auth Domain Migration Summary

**AuthService Effect Layer wrapping better-auth with deferred env validation for unit testing**

## Performance

- **Duration:** 6 min
- **Started:** 2026-01-20T08:03:28Z
- **Completed:** 2026-01-20T08:09:03Z
- **Tasks:** 3
- **Files modified:** 7

## Accomplishments
- Auth schema (user, session, account, verification) migrated to packages/core/src/auth/
- AuthService Context.Tag wraps better-auth with Effect.tryPromise
- Mock layers (AuthServiceTest, AuthServiceTestUnauthenticated) enable unit testing without env vars
- Backward-compatible auth export via Proxy pattern

## Task Commits

Each task was committed atomically:

1. **Task 1: Migrate auth schema and create error types** - `2b623de` (feat)
2. **Task 2: Create AuthService with Effect Layer** - `2b2b160` (feat)
3. **Task 3: Create unit test for AuthService** - `77a7b1c` (test)

Note: Task 2 was part of commit 2b2b160 (incorrectly labeled 03-03 from prior run).

## Files Created/Modified
- `packages/core/src/auth/auth.sql.ts` - Drizzle schema for user, session, account, verification tables
- `packages/core/src/auth/auth.errors.ts` - Domain errors: AuthError, SessionNotFoundError, SessionExpiredError, UnauthorizedError
- `packages/core/src/auth/auth.service.ts` - AuthService Context.Tag + AuthLive layer
- `packages/core/src/auth/auth.mock.ts` - AuthServiceTest and AuthServiceTestUnauthenticated mock layers
- `packages/core/src/auth/index.ts` - Auth domain public API exports
- `packages/core/src/auth/auth.test.ts` - Unit tests for AuthService with mock layers
- `packages/core/package.json` - Added check-types script

## Decisions Made
- **Defer env validation via require():** Changed from top-level `import { env }` to dynamic `require()` inside createAuth() to allow unit tests to import AuthService without triggering env validation
- **Lazy getter pattern:** Added getAuth() function that caches the auth instance for backward compatibility with existing imports
- **Proxy pattern for auth export:** Used `new Proxy({} as BetterAuthInstance, ...)` to maintain existing `import { auth }` usage while deferring actual creation until access

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Fixed env validation blocking unit tests**
- **Found during:** Task 3 (unit test creation)
- **Issue:** auth.service.ts imported @gemhog/env/server at top level, causing env validation to trigger when importing AuthService for testing
- **Fix:** Changed to dynamic require() inside createAuth() function to defer env validation until runtime
- **Files modified:** packages/core/src/auth/auth.service.ts
- **Verification:** Unit tests now pass without env variables
- **Committed in:** 77a7b1c (Task 3 commit)

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Auto-fix necessary for testability. No scope creep.

## Issues Encountered
None - plan executed as expected after auto-fix.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Auth domain complete in packages/core
- Ready for 03-03 (payment domain migration) to use similar patterns
- AuthService can be used by apps/server via `import { auth } from "@gemhog/core/auth"`

---
*Phase: 03-core-consolidation*
*Completed: 2026-01-20*
