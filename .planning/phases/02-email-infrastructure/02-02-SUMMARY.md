---
phase: 02-email-infrastructure
plan: 02
subsystem: email
tags: [drizzle, pgEnum, hmac, crypto, token, subscriber, effect, tagged-error]

# Dependency graph
requires:
  - phase: 02-email-infrastructure
    plan: 01
    provides: APP_URL env var for token URL generation
  - phase: 01-foundation
    provides: Drizzle schema patterns, Effect TaggedError patterns, env schema, test infrastructure
provides:
  - Subscriber Drizzle schema with pgEnum status (pending/active/unsubscribed)
  - HMAC token module (createToken/verifyToken) for stateless verification/unsubscribe links
  - Tagged errors for entire email domain (EmailSendError, SubscriberError, SubscriberNotFoundError, InvalidTokenError)
  - Test fixtures for subscriber table operations
  - "@gemhog/core/email" and "./email/subscriber.sql" export paths
  - SUBSCRIBER_TOKEN_SECRET optional env var
affects: [02-03, 02-04, 02-05, subscriber-service, email-service, email-templates]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "HMAC-signed stateless tokens (no DB storage) for verification/unsubscribe"
    - "pgEnum for subscriber status state machine (pending/active/unsubscribed)"

key-files:
  created:
    - packages/core/src/email/subscriber.sql.ts
    - packages/core/src/email/email.errors.ts
    - packages/core/src/email/token.ts
    - packages/core/src/email/token.test.ts
    - packages/core/src/email/test-fixtures.ts
    - packages/core/src/email/index.ts
  modified:
    - packages/core/package.json
    - packages/env/src/server.ts
    - packages/env/src/server.test.ts
    - apps/server/.env.example
    - apps/web/.env.example

key-decisions:
  - "SUBSCRIBER_TOKEN_SECRET is optional in dev (tokens created with passed secret, not env var read)"
  - "Token module uses pure functions (no Effect wrapping) - secret passed as parameter"
  - "Single email.errors.ts file for entire email domain (not split per subdomain)"
  - "No UTM columns in subscriber schema (PostHog handles attribution in Phase 3)"

patterns-established:
  - "HMAC token pattern: createToken/verifyToken as pure functions with secret parameter"
  - "Email domain structure: subscriber.sql.ts, email.errors.ts, token.ts, test-fixtures.ts, index.ts"

# Metrics
duration: 14min
completed: 2026-01-27
---

# Phase 2 Plan 2: Email Domain Foundation Summary

**Subscriber Drizzle schema with pgEnum status, HMAC token module (TDD-verified create/verify), tagged errors, and @gemhog/core/email export path**

## Performance

- **Duration:** 14 min
- **Started:** 2026-01-27T11:43:16Z
- **Completed:** 2026-01-27T11:57:40Z
- **Tasks:** 2
- **Files modified:** 11

## Accomplishments
- Created subscriber Drizzle schema with pgEnum status (pending/active/unsubscribed), indexes on email and status, no UTM columns
- Implemented HMAC token module with createToken/verifyToken using Node.js crypto (createHmac, timingSafeEqual)
- Added 10 TDD test cases covering token creation, verification, expiry, tampering, malformed input, and roundtrip
- Added tagged errors for entire email domain: EmailSendError, SubscriberError, SubscriberNotFoundError, InvalidTokenError
- Added SUBSCRIBER_TOKEN_SECRET optional env var with min 32 char validation and 3 env tests
- Registered @gemhog/core/email and ./email/subscriber.sql export paths in package.json
- All 68 unit tests + 29 integration tests pass with zero failures

## Task Commits

Each task was committed atomically:

1. **Task 1: Create email domain schema, errors, and package wiring** - `5ad1387` (feat)
2. **Task 2: Create HMAC token module with TDD + add SUBSCRIBER_TOKEN_SECRET env var** - `6861f94` (test)

## Files Created/Modified
- `packages/core/src/email/subscriber.sql.ts` - Drizzle schema with pgEnum subscriberStatusEnum and subscriber table
- `packages/core/src/email/email.errors.ts` - Tagged errors: EmailSendError, SubscriberError, SubscriberNotFoundError, InvalidTokenError
- `packages/core/src/email/token.ts` - HMAC token creation and verification (pure functions, Node.js crypto)
- `packages/core/src/email/token.test.ts` - 10 TDD test cases for token module
- `packages/core/src/email/test-fixtures.ts` - truncateSubscriberTable and createTestSubscriber helpers
- `packages/core/src/email/index.ts` - Barrel exports for email domain
- `packages/core/package.json` - Added ./email and ./email/subscriber.sql export paths
- `packages/env/src/server.ts` - Added SUBSCRIBER_TOKEN_SECRET optional env var
- `packages/env/src/server.test.ts` - Added 3 tests for SUBSCRIBER_TOKEN_SECRET
- `apps/server/.env.example` - Added commented SUBSCRIBER_TOKEN_SECRET entry
- `apps/web/.env.example` - Added commented SUBSCRIBER_TOKEN_SECRET entry

## Decisions Made
- SUBSCRIBER_TOKEN_SECRET is optional in env schema because dev doesn't need token verification (emails go to console). Production enforcement via SST secret at infra level.
- Token module uses pure functions with secret as parameter (not Effect-wrapped, not reading env vars). This enables deterministic testing and flexible secret injection.
- Single email.errors.ts file for entire email domain (all error types in one file) rather than splitting per concern.
- No UTM columns in subscriber schema -- PostHog handles attribution tracking in Phase 3.

## Deviations from Plan
None - plan executed exactly as written.

## Issues Encountered
- Biome lint rejected non-null assertions (`result!.email`) in token tests. Fixed by using optional chaining (`result?.email`) which is functionally equivalent after the `not.toBeNull()` assertion.

## User Setup Required
None - SUBSCRIBER_TOKEN_SECRET is optional for local development. No external service configuration required.

## Next Phase Readiness
- Email domain foundation complete with schema, errors, tokens, and exports
- Subscriber service (Plan 03) can build on this foundation: import schema, use errors, generate tokens
- Email sending service (Plan 04) can use EmailSendError for typed SES failures
- Token module ready for verification/unsubscribe URL generation
- No blockers or concerns

---
*Phase: 02-email-infrastructure*
*Completed: 2026-01-27*
