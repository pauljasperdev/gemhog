# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-01-24)

**Core value:** Find expert ideas you'd miss. Access the data to evaluate them yourself. Skip the consultant.
**Current focus:** Phase 3 — Analytics (complete)

## Current Position

Phase: 3 of 5 (Analytics) -- COMPLETE
Plan: 1 of 1
Status: Phase complete
Last activity: 2026-01-28 - Completed 03-01-PLAN.md

Progress: [██████████] 100% (Phase 3)

## Performance Metrics

**Velocity:**
- Total plans completed: 11 (Phase 1: 1, Phase 2: 7 core + 2 gap closure, Phase 3: 1)
- Average duration: 22min (last 9 measured)
- Total execution time: 191min (GSD-tracked)

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 1 | 1/1 | N/A | N/A (manual) |
| 2 | 9/9 | 174min+ | ~22min |
| 3 | 1/1 | 10min | 10min |

**Recent Trend:**
- Last 9 plans: 02-02 (14min), 02-03 (14min), 02-04 (43min), 02-05 (N/A - resumed), 02-06 (54min), 02-07 (13min), 02-09 (4min), 02-08 (25min), 03-01 (10min)
- Trend: 03-01 fast execution -- most SDK setup was pre-staged, focused on consent banner + events + tests

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
- [02-08]: Module-scoped call tracking arrays for mock assertion in tRPC tests
- [02-08]: Conditional skip for web build tests on Node.js 25+ (Turbopack incompatibility)
- [03-01]: cookieless_mode: "on_reject" for PostHog consent management (not deprecated opt_out_capturing_by_default)
- [03-01]: Custom DOM event pattern for CookieSettingsButton re-open trigger
- [03-01]: snake_case event names per PostHog convention
- [03-01]: Anonymous-only analytics (no posthog.identify calls)
- [03-01]: PostHog defaults: "2025-11-30" for auto SPA pageview tracking

### Pending Todos

None yet.

### Blockers/Concerns

- E2E tests (Playwright) stuck during baseline verification -- pre-existing environment issue, not blocking development
- Web build integration tests (startup.int.test.ts) conditionally skipped on Node.js 25+ due to Turbopack filesystem race conditions -- tests will run on Node 18-24 as specified in .node-version
- Docker/Postgres not available in execution environment -- integration tests cannot run, unit tests pass (85/85)

## Session Continuity

Last session: 2026-01-28
Stopped at: Phase 3 complete. Ready for Phase 4 planning.
Resume file: None
