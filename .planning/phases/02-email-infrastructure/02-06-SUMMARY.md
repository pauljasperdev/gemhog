---
phase: 02-email-infrastructure
plan: 06
subsystem: email
tags: [effect-ts, refactoring, env, pnpm-catalog, conventions]

requires:
  - phase: 02-05
    provides: EmailServiceLive, EmailServiceAuto, SES integration, subscriber token signing
provides:
  - Idiomatic Effect-TS patterns in token.ts, subscriber.service.ts, email.service.ts
  - makeEmailServiceLive factory function (replaces EmailServiceLive + EmailServiceAuto)
  - SUBSCRIBER_TOKEN_SECRET removed from env schema
  - effect in pnpm catalog
  - Observability and deferred improvement guidance in CONVENTIONS.md
affects: [02-07 (email-layers factory wiring, route BETTER_AUTH_SECRET migration)]

tech-stack:
  added: []
  patterns: [mapError for error type transformation, requireByEmail helper, Console.log in Effect pipelines, makeEmailServiceLive factory]

key-files:
  created: []
  modified:
    - packages/core/src/email/token.ts
    - packages/core/src/email/subscriber.service.ts
    - packages/core/src/email/email.service.ts
    - packages/core/src/email/index.ts
    - apps/web/src/lib/email-layers.ts
    - packages/env/src/server.ts
    - packages/env/src/server.test.ts
    - pnpm-workspace.yaml
    - .planning/codebase/CONVENTIONS.md

key-decisions:
  - "mapError instead of catchAll for DB query error transformation (preserves downstream typed errors)"
  - "requireByEmail helper encapsulates null-check-then-fail pattern for subscriber lookups"
  - "makeEmailServiceLive factory replaces EmailServiceLive+EmailServiceAuto (env reads at app layer)"
  - "Hardcoded eu-central-1 region in SES client (no process.env in service layer)"
  - "Items 18 (bigserial+nanoid IDs) and 19 (test file organization) explicitly deferred with rationale"

patterns-established:
  - "mapError for DB query error wrapping: transforms error type without intercepting downstream errors"
  - "requireByEmail pattern: flatMap null-check into typed Effect.fail for not-found cases"
  - "Console.log from effect (not console.log) in Effect pipelines for testability"
  - "Factory function pattern for services needing runtime config (makeEmailServiceLive(senderEmail))"

duration: 54min
completed: 2026-01-27
---

# Phase 2 Plan 6: Core Email Effect-TS Refactoring Summary

**Idiomatic Effect-TS patterns for token/subscriber/email services, SUBSCRIBER_TOKEN_SECRET removed, pnpm catalog with effect, deferred improvement documentation**

## Performance

- **Duration:** 54 min
- **Started:** 2026-01-27T20:27:13Z
- **Completed:** 2026-01-27T21:21:49Z
- **Tasks:** 2
- **Files modified:** 9

## Accomplishments

- Refactored token.ts to use Effect.gen with Effect.fail per error case (no throw/catch inside Effect.try)
- Replaced catchAll with mapError across subscriber.service.ts, added requireByEmail helper, flattened control flow
- Converted EmailServiceConsole to use Effect Console.log, created makeEmailServiceLive factory, removed EmailServiceAuto
- Removed SUBSCRIBER_TOKEN_SECRET from env schema (token signing uses BETTER_AUTH_SECRET)
- Added effect to pnpm catalog and documented observability patterns + deferred improvements in CONVENTIONS.md

## Task Commits

Each task was committed atomically:

1. **Task 1: Refactor core email services to idiomatic Effect-TS** - `619174e` (refactor)
2. **Task 2: Remove SUBSCRIBER_TOKEN_SECRET, update catalog, conventions, document deferrals** - `656dd93` (chore)

## Files Created/Modified

- `packages/core/src/email/token.ts` - Effect.gen with Effect.fail per error case
- `packages/core/src/email/subscriber.service.ts` - mapError, requireByEmail helper, flat control flow
- `packages/core/src/email/email.service.ts` - Console.log, makeEmailServiceLive factory, no EmailServiceAuto
- `packages/core/src/email/index.ts` - Updated barrel exports (makeEmailServiceLive replaces EmailServiceAuto/Live)
- `apps/web/src/lib/email-layers.ts` - Temporary EmailServiceConsole placeholder (02-07 adds factory wiring)
- `packages/env/src/server.ts` - Removed SUBSCRIBER_TOKEN_SECRET from schema
- `packages/env/src/server.test.ts` - Removed SUBSCRIBER_TOKEN_SECRET test block
- `pnpm-workspace.yaml` - Added effect ^3.19 to catalog
- `.planning/codebase/CONVENTIONS.md` - Observability section, deferred improvements (items 18, 19)

## Decisions Made

- **mapError over catchAll:** catchAll intercepts all errors in the downstream pipeline, which could swallow typed errors like SubscriberNotFoundError. mapError only transforms the error type without intercepting the success path. This is the correct pattern for DB query error wrapping.
- **requireByEmail helper:** Encapsulates the null-check-then-fail pattern so verify() and unsubscribe() have flat, declarative control flow instead of nested if/else.
- **Factory function for EmailServiceLive:** makeEmailServiceLive(senderEmail) accepts the sender email as a parameter, moving process.env reads to the app layer. Hardcodes region to eu-central-1 since the project only deploys to one region.
- **Deferred items 18 and 19:** Explicitly documented in CONVENTIONS.md with rationale for deferral and criteria for when to implement. Item 18 (bigserial+nanoid) deferred to database hardening phase. Item 19 (test subfolder) deferred until domain grows beyond ~8 files.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Updated email-layers.ts to prevent build failure**
- **Found during:** Task 1 (removing EmailServiceAuto from core)
- **Issue:** apps/web/src/lib/email-layers.ts imports EmailServiceAuto from core. Removing the export without updating the consumer caused Turbopack build failure.
- **Fix:** Replaced EmailServiceAuto with EmailServiceConsole as temporary placeholder. Plan 02-07 will properly wire makeEmailServiceLive factory.
- **Files modified:** apps/web/src/lib/email-layers.ts
- **Verification:** pnpm check passes, all tests pass including web build integration tests
- **Committed in:** 619174e (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Necessary to keep build green. No scope creep -- the fix is minimal and plan 02-07 handles the proper factory wiring.

## Issues Encountered

None -- all tests passed on first attempt after refactoring.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Core email services now follow idiomatic Effect-TS patterns
- makeEmailServiceLive factory is ready for plan 02-07 to wire into email-layers.ts
- SUBSCRIBER_TOKEN_SECRET removed from env schema; app routes still use process.env fallback until 02-07 migrates to BETTER_AUTH_SECRET
- All 118 unit tests + 39 integration tests pass

---
*Phase: 02-email-infrastructure*
*Completed: 2026-01-27*
