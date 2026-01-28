---
phase: 02-email-infrastructure
plan: 09
subsystem: testing
tags: [effect, vitest, token-validation, server-components]

# Dependency graph
requires:
  - phase: 02-07
    provides: Server component pages with inline getVerifyStatus and getUnsubscribeStatus functions
provides:
  - Extracted verify-status.ts module with getVerifyStatus function
  - Extracted unsubscribe-status.ts module with getUnsubscribeStatus function
  - Unit tests for token-to-status mapping logic (8 tests total)
affects: []

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "vi.mock for Effect layers - mock Context.GenericTag services before import"
    - "HMAC test token generation helper for unit tests"

key-files:
  created:
    - apps/web/src/app/verify/verify-status.ts
    - apps/web/src/app/verify/verify-status.test.ts
    - apps/web/src/app/unsubscribe/unsubscribe-status.ts
    - apps/web/src/app/unsubscribe/unsubscribe-status.test.ts
  modified:
    - apps/web/src/app/verify/page.tsx
    - apps/web/src/app/unsubscribe/page.tsx

key-decisions:
  - "Mock email-layers with Context.GenericTag services instead of mocking @gemhog/core/email"
  - "Use HMAC test token helper function to generate tokens without importing the real createToken"

patterns-established:
  - "Server component logic extraction: Extract async functions from page.tsx to separate .ts modules for testability"
  - "Effect layer mocking: vi.mock @/lib/email-layers with Layer.mergeAll of Context.GenericTag services"

# Metrics
duration: 4min
completed: 2026-01-28
---

# Phase 2 Plan 9: Verify/Unsubscribe Status Tests Summary

**Extracted getVerifyStatus and getUnsubscribeStatus functions with 8 unit tests covering all token-to-status mapping paths**

## Performance

- **Duration:** 4 min
- **Started:** 2026-01-28T11:48:40Z
- **Completed:** 2026-01-28T11:53:36Z
- **Tasks:** 3
- **Files modified:** 6

## Accomplishments

- Extracted getVerifyStatus to testable module with 4 tests (success/expired/invalid/error)
- Extracted getUnsubscribeStatus to testable module with 4 tests (success/invalid/error)
- Both page.tsx files refactored to import from extracted modules
- All 80 unit tests pass (14 test files)

## Task Commits

Each task was committed atomically:

1. **Task 1: Extract and test getVerifyStatus** - `b5a08f0` (test)
2. **Task 2: Extract and test getUnsubscribeStatus** - `5de4705` (test)
3. **Task 3: Run full test suite** - verified (no separate commit, verification only)

## Files Created/Modified

- `apps/web/src/app/verify/verify-status.ts` - Exported getVerifyStatus function and VerifyStatus type
- `apps/web/src/app/verify/verify-status.test.ts` - 4 unit tests for verify status mapping
- `apps/web/src/app/verify/page.tsx` - Imports from verify-status.ts
- `apps/web/src/app/unsubscribe/unsubscribe-status.ts` - Exported getUnsubscribeStatus function and UnsubscribeStatus type
- `apps/web/src/app/unsubscribe/unsubscribe-status.test.ts` - 4 unit tests for unsubscribe status mapping
- `apps/web/src/app/unsubscribe/page.tsx` - Imports from unsubscribe-status.ts

## Decisions Made

- **Mock strategy:** Mock `@/lib/email-layers` with Context.GenericTag services matching the real service tag identifiers. This avoids needing to mock the database layer or @gemhog/core/email.
- **Test token generation:** Use a local HMAC helper function to generate test tokens instead of importing createToken from @gemhog/core/email, which avoids mock interference.

## Deviations from Plan

None - plan executed exactly as written. The extraction and test files were already created (presumably staged during a previous attempt). Verified all tests pass and committed the work.

## Issues Encountered

- **Next.js build integration tests failing:** The startup.int.test.ts tests fail with "ENOENT: no such file or directory" for .next temp files. This is a pre-existing environmental issue (filesystem race condition during concurrent builds), not related to code changes. Documented in STATE.md blockers.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Verify and unsubscribe page logic is now tested (medium-severity gap closed)
- Plan 02-08 (subscriber router tests) provides coverage for tRPC mutations
- Phase 2 gap closure complete after 02-08

---
*Phase: 02-email-infrastructure*
*Completed: 2026-01-28*
