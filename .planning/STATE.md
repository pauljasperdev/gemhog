# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-01-24)

**Core value:** Find expert ideas you'd miss. Access the data to evaluate them yourself. Skip the consultant.
**Current focus:** Phase 2 — executing gap closure plans

## Current Position

Phase: 2 of 5 (Email Infrastructure) -- GAP CLOSURE
Plan: 02-09 complete (verify/unsubscribe status tests), 02-08 pending (subscriber router tests)
Status: Gap closure in progress
Last activity: 2026-01-28 - Completed 02-09 (verify/unsubscribe page logic tests)

Progress: [██████████] 100% (Phase 2 core) + gap closure

## Performance Metrics

**Velocity:**
- Total plans completed: 9 (Phase 1: 1, Phase 2: 7 core + 1 gap closure)
- Average duration: 24min (last 7 measured)
- Total execution time: 156min (GSD-tracked)

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 1 | 1/1 | N/A | N/A (manual) |
| 2 | 8/9 | 149min+ | ~21min |

**Recent Trend:**
- Last 7 plans: 02-02 (14min), 02-03 (14min), 02-04 (43min), 02-05 (N/A - resumed), 02-06 (54min), 02-07 (13min), 02-09 (4min)
- Trend: 02-09 was fast (files already existed, just needed verification and commits)

*Updated after each plan completion*

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

- [V0]: SST-agnostic application code (app reads env vars, no SST SDK imports)
- [V0]: Security-first development (Zod validation, auth checks, security review required)
- [V1]: Serverless email via AWS SES (no hosted services like Resend)
- [V1]: Free-tier monitoring (Sentry free, CloudWatch for logs)
- [V1]: GDPR/CAN-SPAM compliance (double opt-in, unsubscribe, privacy policy)
- [V1]: tRPC and Better Auth moved to Next.js API routes (Hono reserved for AI streaming only)
- [02-01]: CORS_ORIGIN renamed to APP_URL for semantic correctness (expanded use: CORS, token URLs, redirect URLs)
- [02-02]: SUBSCRIBER_TOKEN_SECRET optional in dev (production enforced via SST secret)
- [02-02]: No UTM columns in subscriber schema (PostHog handles attribution in Phase 3)
- [02-03]: Token module converted to Effect patterns (createToken/verifyToken return Effects)
- [02-03]: SubscriberService does NOT send emails -- API layer orchestrates both services
- [02-04]: Effect.catchTag inside pipeline (not try/catch around runPromise) for typed error handling
- [02-04]: Shared EmailLayers composition in lib/email-layers.ts for all email API routes
- [02-04]: List-Unsubscribe + List-Unsubscribe-Post headers in verification emails (RFC 8058)
- [02-04]: Pending subscribers receive fresh verification email on re-signup
- [02-06]: mapError (not catchAll) for DB query error wrapping -- preserves downstream typed errors
- [02-06]: makeEmailServiceLive factory replaces EmailServiceLive+EmailServiceAuto (env reads at app layer)
- [02-06]: SUBSCRIBER_TOKEN_SECRET removed from env schema -- token signing uses BETTER_AUTH_SECRET
- [02-06]: Items 18 (bigserial+nanoid IDs) and 19 (test subfolder) explicitly deferred with rationale
- [02-07]: Lazy EmailLayers construction (getEmailLayers function) for testability in tRPC router
- [02-07]: vi.mock @gemhog/env/server for tests that transitively import typed env
- [02-07]: Subscribe via tRPC mutation (not Next.js route handler)
- [02-09]: Mock email-layers with Context.GenericTag services for server component logic testing
- [02-09]: HMAC test token helper function avoids mock interference with createToken

### Pending Todos

None yet.

### Blockers/Concerns

- E2E tests (Playwright) stuck during baseline verification -- pre-existing environment issue, not blocking development
- Test coverage gaps: tRPC subscriber router (high) -- 02-08 will close this gap
- Web build integration tests (startup.int.test.ts) flaky due to Next.js filesystem race conditions -- environmental, not code issue

## Session Continuity

Last session: 2026-01-28
Stopped at: Completed 02-09. Next: execute 02-08 for subscriber router tests.
Resume file: None
