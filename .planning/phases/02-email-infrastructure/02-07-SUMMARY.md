---
phase: 02-email-infrastructure
plan: 07
subsystem: email
tags: [trpc, server-components, infra-cleanup, effect-ts]

requires:
  - phase: 02-06
    provides: makeEmailServiceLive factory, SUBSCRIBER_TOKEN_SECRET removed from env schema, idiomatic Effect-TS patterns
provides:
  - tRPC subscriber router with subscribe mutation
  - Server component verify/unsubscribe pages (direct token processing)
  - POST-only /api/unsubscribe for RFC 8058 one-click
  - SubscriberTokenSecret removed from all SST infra
  - SES_FROM_EMAIL unconditional (no empty string in dev)
  - Complete removal of SUBSCRIBER_TOKEN_SECRET from entire codebase
affects: [Phase 4 (landing page subscribe form uses tRPC mutation)]

tech-stack:
  added: [effect (api package), @gemhog/env (api package)]
  patterns: [lazy layer construction for testability, env mock pattern for integration tests]

key-files:
  created:
    - packages/api/src/routers/subscriber.ts
  modified:
    - packages/api/src/routers/index.ts
    - packages/api/package.json
    - apps/web/src/lib/email-layers.ts
    - apps/web/src/app/verify/page.tsx
    - apps/web/src/app/unsubscribe/page.tsx
    - apps/web/src/app/api/unsubscribe/route.ts
    - apps/web/src/app/api/unsubscribe/route.test.ts
    - infra/secrets.ts
    - infra/api.ts
    - infra/web.ts
    - apps/web/.env.example
    - apps/server/.env.example
    - packages/api/src/routers/procedures.int.test.ts
  deleted:
    - apps/web/src/app/api/subscribe/route.ts
    - apps/web/src/app/api/subscribe/route.test.ts
    - apps/web/src/app/api/verify/route.ts
    - apps/web/src/app/api/verify/route.test.ts

key-decisions:
  - "Lazy EmailLayers via getEmailLayers() function in subscriber router to avoid module-scope env validation breaking tests"
  - "catchTag+catchAll to Effect.succeed pattern (not Effect.fail) for typed error handling in route handlers"
  - "vi.mock @gemhog/env/server for tests that transitively import modules using typed env"

patterns-established:
  - "getEmailLayers() lazy construction: defer env access to runtime invocation, not module import"
  - "Server component direct data fetching: read searchParams, call Effect pipeline, render based on result"
  - "RFC 8058 POST-only API route: browser visits page (server component), email clients POST to API"

duration: 13min
completed: 2026-01-28
---

# Phase 2 Plan 7: App Layer Refactor Summary

**tRPC subscriber router replaces Next.js subscribe route, verify/unsubscribe pages do direct token processing as server components, SUBSCRIBER_TOKEN_SECRET fully removed from codebase and infra**

## Performance

- **Duration:** 13 min
- **Started:** 2026-01-28T08:21:00Z
- **Completed:** 2026-01-28T08:34:05Z
- **Tasks:** 2
- **Files created:** 1
- **Files modified:** 13
- **Files deleted:** 4

## Accomplishments

- Created tRPC subscriber router with subscribe mutation, replacing the POST /api/subscribe Next.js route handler
- Registered subscriber sub-router in appRouter (`subscriber: subscriberRouter`)
- Added `effect` and `@gemhog/env` as dependencies to `@gemhog/api` package
- Updated email-layers.ts to use `@gemhog/env` package and `makeEmailServiceLive` factory (replacing raw `process.env` and temporary `EmailServiceConsole` placeholder)
- Converted verify page from reading `?status` (redirected from API) to reading `?token` and verifying directly via Effect pipeline
- Converted unsubscribe page from reading `?status` to reading `?token` and unsubscribing directly via Effect pipeline
- Kept POST-only `/api/unsubscribe` route for RFC 8058 one-click email client unsubscribe
- Deleted `/api/subscribe` route and tests (replaced by tRPC)
- Deleted `/api/verify` route and tests (replaced by server component page)
- Removed `SubscriberTokenSecret` from SST `infra/secrets.ts`
- Removed `SUBSCRIBER_TOKEN_SECRET` from `infra/api.ts` and `infra/web.ts` environment configs
- Fixed `SES_FROM_EMAIL` to always be `"hello@gemhog.com"` (no conditional empty string in dev mode)
- Removed `SUBSCRIBER_TOKEN_SECRET` comments from both `.env.example` files
- Rewrote unsubscribe route test for POST-only with `@gemhog/env/server` mock
- Added env mock to `procedures.int.test.ts` to support subscriber router import

## Task Commits

Each task was committed atomically:

1. **Task 1: Create tRPC subscriber router and update email-layers** - `5000108` (feat)
2. **Task 2: Convert verify/unsubscribe pages to server components, clean up routes and infra** - `9f1c53a` (refactor)

## Files Created/Modified

- `packages/api/src/routers/subscriber.ts` - New tRPC subscriber router with subscribe mutation
- `packages/api/src/routers/index.ts` - Added subscriber sub-router to appRouter
- `packages/api/package.json` - Added effect and @gemhog/env dependencies
- `apps/web/src/lib/email-layers.ts` - Uses env package and makeEmailServiceLive factory
- `apps/web/src/app/verify/page.tsx` - Server component with direct token verification
- `apps/web/src/app/unsubscribe/page.tsx` - Server component with direct token unsubscribe
- `apps/web/src/app/api/unsubscribe/route.ts` - POST-only for RFC 8058
- `apps/web/src/app/api/unsubscribe/route.test.ts` - Updated for POST-only with env mock
- `infra/secrets.ts` - SubscriberTokenSecret removed
- `infra/api.ts` - SUBSCRIBER_TOKEN_SECRET removed, SES_FROM_EMAIL unconditional
- `infra/web.ts` - SUBSCRIBER_TOKEN_SECRET removed, SES_FROM_EMAIL unconditional
- `apps/web/.env.example` - SUBSCRIBER_TOKEN_SECRET lines removed
- `apps/server/.env.example` - SUBSCRIBER_TOKEN_SECRET lines removed
- `packages/api/src/routers/procedures.int.test.ts` - Added env mock for subscriber router import

**Deleted:**
- `apps/web/src/app/api/subscribe/route.ts`
- `apps/web/src/app/api/subscribe/route.test.ts`
- `apps/web/src/app/api/verify/route.ts`
- `apps/web/src/app/api/verify/route.test.ts`

## Decisions Made

- **Lazy EmailLayers construction:** The subscriber router uses `getEmailLayers()` function instead of module-scope `const EmailLayers`. This is because `@gemhog/env/server` validates all env vars at import time via `createEnv()`. Module-scope evaluation would break any test that imports appRouter without env vars set. The lazy function defers env access to when the mutation is actually called.
- **Effect.succeed for error recovery (not Effect.fail + Either):** The unsubscribe POST route initially used `Effect.catchTag -> Effect.fail("invalid") -> catchAll -> Effect.fail("error") -> Effect.either`. This caused the `catchAll` to swallow the `catchTag` result since `"invalid"` was in the error channel. Fixed to use `Effect.succeed` in both catch handlers (matching the verify/unsubscribe page pattern) and simple string comparison on the result.
- **vi.mock for env in integration tests:** Tests that transitively import `@gemhog/env/server` (via subscriber router) need `vi.mock("@gemhog/env/server")` to prevent `createEnv()` from throwing at import time. This pattern was added to `procedures.int.test.ts` and the unsubscribe route test.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed Effect error handling pattern in unsubscribe POST route**
- **Found during:** Task 2 (test verification)
- **Issue:** `Effect.catchTag` converting error to `Effect.fail("invalid")` was then caught by `Effect.catchAll` converting it to `Effect.fail("error")`, making the "invalid" branch unreachable. The `Effect.either` approach reported all errors as 500 instead of 400.
- **Fix:** Changed to `Effect.succeed` in catch handlers (not `Effect.fail`), matching the pattern used in verify/unsubscribe page components. Simple string comparison on success result.
- **Files modified:** apps/web/src/app/api/unsubscribe/route.ts
- **Verification:** All 4 unsubscribe route tests pass (200, 400 missing, 400 tampered, 400 expired)

**2. [Rule 3 - Blocking] Added env mock to procedures.int.test.ts**
- **Found during:** Task 2 (test verification)
- **Issue:** The subscriber router imports `@gemhog/env/server` which validates env vars at import time. The `procedures.int.test.ts` test imports `appRouter` which now includes the subscriber sub-router, causing `createEnv()` to throw "Invalid environment variables" before any tests run.
- **Fix:** Added `vi.mock("@gemhog/env/server")` with test values to the integration test file.
- **Files modified:** packages/api/src/routers/procedures.int.test.ts
- **Verification:** All 3 procedure tests pass (healthCheck, privateData with session, privateData without session)

**3. [Rule 3 - Blocking] Made EmailLayers lazy in subscriber router**
- **Found during:** Task 2 (same root cause as #2)
- **Issue:** Module-scope `const EmailLayers = Layer.mergeAll(env.SES_FROM_EMAIL ? ...)` evaluated `env.SES_FROM_EMAIL` at import time, which is when `@gemhog/env/server` `createEnv()` runs. Even with the vi.mock, the lazy approach is architecturally correct -- env should be read at runtime, not module load.
- **Fix:** Wrapped in `getEmailLayers()` function, called inside the mutation handler.
- **Files modified:** packages/api/src/routers/subscriber.ts
- **Verification:** pnpm check passes, all tests pass

---

**Total deviations:** 3 auto-fixed (1 bug, 2 blocking)
**Impact on plan:** All deviations were necessary for correct test execution. No scope creep -- all fixes are directly related to making the planned changes work correctly.

## Issues Encountered

None beyond the auto-fixed deviations above.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Phase 2 (Email Infrastructure) is now complete -- all 7 plans executed
- Subscribe flow works via tRPC mutation (Phase 4 landing page will call `trpc.subscriber.subscribe.mutate()`)
- Verify and unsubscribe work via server component pages (direct token processing)
- RFC 8058 POST /api/unsubscribe preserved for email client one-click unsubscribe
- Zero references to SUBSCRIBER_TOKEN_SECRET remain in codebase (all token signing uses BETTER_AUTH_SECRET)
- SES_FROM_EMAIL uses real domain in all environments
- All 107 unit tests + 39 integration tests pass

---
*Phase: 02-email-infrastructure*
*Completed: 2026-01-28*
