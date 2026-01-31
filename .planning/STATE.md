# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-01-24)

**Core value:** Find expert ideas you'd miss. Access the data to evaluate them yourself. Skip the consultant.
**Current focus:** Phase 5 -- Launch Readiness (Phase 4.2 Code Review Fixes complete)

## Current Position

Phase: 4.2 of 5 (Code Review Fixes)
Plan: 2 of 2
Status: Phase complete
Last activity: 2026-01-31 - Completed 04.2-02-PLAN.md (remove conditional test skips)

Progress: [██████████████████] 100% (18/18 plans)

## Performance Metrics

**Velocity:**
- Total plans completed: 18 (Phase 1: 1, Phase 2: 7 core + 2 gap closure, Phase 3: 1 core + 2 gap closure, Phase 4: 1, Phase 4.1: 2, Phase 4.2: 2)
- Average duration: 18min (last 10 measured)
- Total execution time: 320min (GSD-tracked)

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 1 | 1/1 | N/A | N/A (manual) |
| 2 | 9/9 | 174min+ | ~22min |
| 3 | 3/3 | 23min | ~8min |
| 4 | 1/2 | 28min | 28min |
| 4.1 | 2/2 | 38min | ~19min |
| 4.2 | 2/2 | 38min | ~19min |

**Recent Trend:**
- Last 10 plans: 02-08 (25min), 03-01 (10min), 03-02 (4min), 03-03 (9min), 04-01 (28min), 04.1-01 (38min), 04.1-02 (parallel), 04.2-01 (11min), 04.2-02 (27min)
- Trend: Consistent execution, 04.2-02 longer due to parallel plan interference requiring retries

*Updated after each plan completion*

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

- [V0]: SST-agnostic application code (app reads env vars, no SST SDK imports)
- [V0]: Security-first development (Zod validation, auth checks, security review required)
- [V1]: Email via Resend (replacing AWS SES in Phase 4.1)
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
- [03-01]: cookieless_mode: "on_reject" for PostHog consent management (not deprecated opt_out_capturing_by_default)
- [03-01]: Custom DOM event pattern for CookieSettingsButton re-open trigger
- [03-01]: snake_case event names per PostHog convention
- [03-01]: Anonymous-only analytics (no posthog.identify calls)
- [03-01]: PostHog defaults: "2025-11-30" for auto SPA pageview tracking
- [03-02]: Unconditional PostHogProvider -- PostHog handles not-yet-loaded state via internal queue
- [03-02]: Explicit person_profiles: identified_only -- defensive best practice for anonymous-only analytics
- [03-03]: Explicit cleanup() in afterEach for happy-dom -- @testing-library/react does not auto-cleanup
- [04-01]: Route groups (landing) and (app) for layout separation -- standard Next.js pattern
- [04-01]: DM Serif Display loaded via next/font/google with --font-dm-serif CSS variable
- [04-01]: (app)/layout.tsx is a Server Component (not "use client") -- Server Components can render Client Components
- [04-01]: Mounted state guard in UserMenu prevents hydration mismatch from auth state resolving differently on server vs client
- [04.1-01]: Hardcoded "Gemhog <hello@gemhog.com>" as from address at both email callsites
- [04.1-01]: Exponential backoff retry (500ms base, 3 retries) for transient Resend errors
- [04.1-01]: RESEND_API_KEY validated with startsWith("re_") prefix check
- [04.2-01]: RESEND_API_KEY required (not optional) with re_ prefix validation
- [04.2-01]: makeEmailLayers factory in @gemhog/core/email consolidates layer construction
- [04.2-01]: SendEmailParams uses content: { html, text? } instead of flat html field
- [04.2-01]: Local dev uses re_local_dev_placeholder for RESEND_API_KEY validation
- [04.2-01]: makeEmailLayers detects placeholder key and uses EmailServiceConsole (centralized fallback)
- [04.2-02]: All conditional test skips removed -- tests run unconditionally

### Pending Todos

None yet.

### Blockers/Concerns

None. All tests (unit, integration, E2E) pass with zero skips.

## Session Continuity

Last session: 2026-01-31
Stopped at: Phase 4.2 complete (Code Review Fixes). All code review issues addressed. Ready for Phase 5 (Launch Readiness).
Resume file: None
