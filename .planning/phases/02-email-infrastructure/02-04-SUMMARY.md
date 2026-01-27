---
phase: 02-email-infrastructure
plan: 04
subsystem: api
tags: [next-api-routes, effect, subscribe, verify, unsubscribe, rfc-8058, double-opt-in, list-unsubscribe]

requires:
  - phase: 02-email-infrastructure/02-03
    provides: SubscriberService, EmailService, token module, mock layers, email templates
provides:
  - POST /api/subscribe endpoint (creates subscriber, sends verification email)
  - GET /api/verify endpoint (validates token, activates subscriber)
  - POST /api/unsubscribe endpoint (RFC 8058 one-click unsubscribe)
  - GET /api/unsubscribe endpoint (browser-based unsubscribe)
  - Verification status page (success, expired, invalid, error)
  - Unsubscribe confirmation page (success, invalid, error)
  - Shared Effect layer composition for API routes
  - List-Unsubscribe headers in verification emails
affects: [02-05, 04-landing-page]

tech-stack:
  added: [effect (web app dependency)]
  patterns: [Effect.runPromise for API route handlers, Effect.catchTag for typed error handling, shared layer composition]

key-files:
  created:
    - apps/web/src/app/api/subscribe/route.ts
    - apps/web/src/app/api/subscribe/route.test.ts
    - apps/web/src/app/api/verify/route.ts
    - apps/web/src/app/api/verify/route.test.ts
    - apps/web/src/app/api/unsubscribe/route.ts
    - apps/web/src/app/api/unsubscribe/route.test.ts
    - apps/web/src/app/verify/page.tsx
    - apps/web/src/app/unsubscribe/page.tsx
    - apps/web/src/lib/email-layers.ts
  modified:
    - apps/web/package.json
    - pnpm-lock.yaml

key-decisions:
  - "Effect.catchTag used inside Effect pipeline (not try/catch around runPromise) for typed error handling"
  - "Shared EmailLayers composition in lib/email-layers.ts for reuse across all email API routes"
  - "Privacy-safe duplicate handling: same 200 response regardless of email existence"
  - "List-Unsubscribe + List-Unsubscribe-Post headers included in verification emails for RFC 8058 compliance"
  - "Pending subscribers receive verification email on re-signup (fresh token each time)"

patterns-established:
  - "Next.js API route + Effect pattern: build Effect.gen program, provide layers, run with Effect.runPromise"
  - "Error handling in Effect API routes: use Effect.catchTag inside pipeline, not try/catch outside"
  - "Shared layer composition: centralize Effect layer wiring in lib/email-layers.ts"
  - "Route test pattern: mock EmailLayers via vi.mock, use NextRequest for proper URL parsing"

duration: 43min
completed: 2026-01-27
---

# Plan 02-04: API Endpoints and Status Pages Summary

**Next.js API routes for double opt-in subscribe/verify/unsubscribe flows with RFC 8058 one-click support, Effect layer composition, and 15 unit tests**

## Performance

- **Duration:** 43 min
- **Started:** 2026-01-27T13:20:07Z
- **Completed:** 2026-01-27T14:03:16Z
- **Tasks:** 2
- **Files modified:** 11

## Accomplishments
- Full double opt-in subscription flow: subscribe creates pending subscriber and sends verification email, verify activates subscriber
- RFC 8058 one-click unsubscribe support via POST endpoint for Gmail/Apple Mail native unsubscribe buttons
- Browser-based unsubscribe via GET endpoint with redirect to confirmation page
- Privacy-safe duplicate handling: same success response regardless of email existence
- List-Unsubscribe and List-Unsubscribe-Post headers included in verification emails
- Status pages for verify (success/expired/invalid/error) and unsubscribe (success/invalid/error)
- Effect layer composition pattern established for API routes
- 15 new unit tests covering all endpoints and error cases

## Task Commits

1. **Task 1: Subscribe and verify API endpoints** - `e5c72fa` (feat)
2. **Task 2: Unsubscribe endpoint with RFC 8058 one-click** - `56e5406` (feat)

## Files Created/Modified
- `apps/web/src/app/api/subscribe/route.ts` - POST /api/subscribe with Zod validation and Effect pipeline
- `apps/web/src/app/api/subscribe/route.test.ts` - 5 tests for subscribe endpoint
- `apps/web/src/app/api/verify/route.ts` - GET /api/verify with token validation and redirect
- `apps/web/src/app/api/verify/route.test.ts` - 4 tests for verify endpoint
- `apps/web/src/app/api/unsubscribe/route.ts` - POST (RFC 8058) and GET (browser) unsubscribe
- `apps/web/src/app/api/unsubscribe/route.test.ts` - 6 tests for unsubscribe endpoint
- `apps/web/src/app/verify/page.tsx` - Verify status page with Tailwind styling
- `apps/web/src/app/unsubscribe/page.tsx` - Unsubscribe confirmation page
- `apps/web/src/lib/email-layers.ts` - Shared Effect layer composition
- `apps/web/package.json` - Added effect dependency
- `pnpm-lock.yaml` - Updated lockfile

## Decisions Made
- Used Effect.catchTag inside the Effect pipeline rather than try/catch around Effect.runPromise -- this preserves typed error handling and avoids issues with Effect wrapping errors
- Created shared EmailLayers composition in `lib/email-layers.ts` rather than inlining in each route -- reduces duplication and makes it easy to swap EmailServiceConsole for SES implementation later
- Pending subscribers receive fresh verification email on re-signup (no rate limiting per CONTEXT.md)
- Unsubscribe tokens generated with 365-day expiry (long-lived for List-Unsubscribe header compatibility)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Added effect dependency to web app**
- **Found during:** Task 1 (Subscribe endpoint implementation)
- **Issue:** effect package not available in apps/web, needed for Effect.runPromise in API routes
- **Fix:** Ran `pnpm add effect@^3.19 --filter web`
- **Files modified:** apps/web/package.json, pnpm-lock.yaml
- **Verification:** Type checking passes, all tests pass
- **Committed in:** `e5c72fa` (Task 1 commit)

**2. [Rule 1 - Bug] Fixed verify route error handling pattern**
- **Found during:** Task 1 (Verify route tests failing)
- **Issue:** InvalidTokenError thrown inside Effect pipeline was not caught by external try/catch around Effect.runPromise -- errors from runPromise are wrapped differently
- **Fix:** Moved error handling inside Effect pipeline using Effect.catchTag("InvalidTokenError", ...) and Effect.catchAll for other errors
- **Files modified:** apps/web/src/app/api/verify/route.ts
- **Verification:** All 4 verify tests pass (including expired and invalid token cases)
- **Committed in:** `e5c72fa` (Task 1 commit)

---

**Total deviations:** 2 auto-fixed (1 blocking, 1 bug)
**Impact on plan:** Both fixes necessary for correct operation. No scope creep.

## Issues Encountered
- E2E tests (Playwright) stuck during baseline verification -- pre-existing environment issue, not caused by our changes. Unit and integration tests all pass.

## User Setup Required
None -- console email service used in dev, no external configuration needed.

## Next Phase Readiness
- All API endpoints ready for landing page integration (Phase 4)
- Full double opt-in flow works end-to-end with console email in dev
- SES implementation needed in Plan 02-05 for production email sending
- Status pages ready for styling refinement if needed

---
*Plan: 02-04*
*Completed: 2026-01-27*
