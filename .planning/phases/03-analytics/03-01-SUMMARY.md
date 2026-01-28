---
phase: 03-analytics
plan: 01
subsystem: analytics
tags: [posthog, analytics, cookie-consent, gdpr, tracking, next-js-rewrites]

# Dependency graph
requires:
  - phase: 02-email-signup
    provides: verify page, subscriber flow, env schema patterns
provides:
  - PostHog SDK initialized with consent-aware cookieless mode
  - Cookie consent banner with accept/decline
  - Analytics utility module with typed event constants
  - Custom funnel events (landing_page_viewed, signup_completed)
  - Next.js reverse proxy rewrites for ad-blocker bypass
  - SST secret and infra config for PostHog deployment
affects: [04-landing-page, 05-deployment]

# Tech tracking
tech-stack:
  added: [posthog-js]
  patterns: [consent-aware analytics, cookieless-mode-on-reject, custom-event-dispatch, next-js-rewrites-proxy]

key-files:
  created:
    - apps/web/src/components/cookie-consent.tsx
    - apps/web/src/lib/analytics.ts
    - apps/web/src/app/verify/verify-analytics.tsx
  modified:
    - apps/web/package.json
    - packages/env/src/web.ts
    - packages/env/src/local-dev.ts
    - packages/env/src/web.test.ts
    - apps/web/src/lib/sentry/instrumentation.client.ts
    - apps/web/src/instrumentation-client.ts
    - apps/web/src/components/providers.tsx
    - apps/web/next.config.ts
    - apps/web/src/app/layout.tsx
    - apps/web/src/app/page.tsx
    - apps/web/src/app/verify/page.tsx
    - apps/web/src/index.css
    - infra/secrets.ts
    - infra/web.ts

key-decisions:
  - "cookieless_mode: on_reject ensures zero tracking before consent"
  - "Custom DOM event (show-cookie-consent) for re-opening banner from footer"
  - "Event constants use snake_case per PostHog convention"
  - "No posthog.identify() calls -- anonymous-only analytics"

patterns-established:
  - "Analytics events: use AnalyticsEvents constants + trackEvent wrapper"
  - "Cookie consent: PostHog get_explicit_consent_status() for consent checks"
  - "PostHog proxy: /ph/* rewrites bypass ad blockers via Next.js rewrites"
  - "PostHog defaults: 2025-11-30 enables auto SPA pageview tracking"

# Metrics
duration: 10min
completed: 2026-01-28
---

# Phase 3 Plan 1: PostHog Analytics with GDPR Cookie Consent Summary

**PostHog analytics with cookieless_mode consent management, cookie banner, funnel events, and Next.js ad-blocker bypass rewrites**

## Performance

- **Duration:** 10 min
- **Started:** 2026-01-28T21:12:08Z
- **Completed:** 2026-01-28T21:21:54Z
- **Tasks:** 3 (+ 1 deviation fix)
- **Files modified:** 15

## Accomplishments
- PostHog SDK installed and initialized with `cookieless_mode: "on_reject"` for GDPR compliance
- Cookie consent banner renders on first visit with accept/decline, dismisses after choice
- Analytics utility module exports typed event constants and `trackEvent` function with referrer attribution
- Custom funnel events: `landing_page_viewed` on home page, `signup_completed` on verification success
- Next.js `/ph/*` rewrites proxy PostHog API requests through the app domain (ad-blocker bypass)
- SST secret (`PosthogKey`) and infra environment configuration ready for deployment

## Task Commits

Each task was committed atomically:

1. **Task 1: PostHog SDK setup, env vars, initialization, and Next.js rewrites** - `e453549` (feat)
2. **Task 2: Cookie consent banner with accept/decline and footer link** - `6f35fb3` (feat)
3. **Task 3: Analytics utility module and custom signup funnel events** - `995563b` (feat)
4. **Deviation: Add NEXT_PUBLIC_POSTHOG_KEY env var tests** - `8cb2ce0` (test)

## Files Created/Modified

### Created
- `apps/web/src/components/cookie-consent.tsx` - Cookie consent banner with CookieSettingsButton for footer
- `apps/web/src/lib/analytics.ts` - Typed analytics event constants and trackEvent wrapper
- `apps/web/src/app/verify/verify-analytics.tsx` - Client component firing signup_completed on verification

### Modified
- `apps/web/package.json` - Added posthog-js dependency
- `packages/env/src/web.ts` - Added NEXT_PUBLIC_POSTHOG_KEY to client env schema
- `packages/env/src/local-dev.ts` - Added PostHog key local dev default
- `packages/env/src/web.test.ts` - Added env var tests for PostHog key (guardrail compliance)
- `apps/web/src/lib/sentry/instrumentation.client.ts` - PostHog init alongside Sentry
- `apps/web/src/components/providers.tsx` - PostHogProvider wrapping React tree
- `apps/web/next.config.ts` - PostHog rewrites and skipTrailingSlashRedirect
- `apps/web/src/app/layout.tsx` - CookieConsentBanner added to layout
- `apps/web/src/app/page.tsx` - landing_page_viewed event on mount
- `apps/web/src/app/verify/page.tsx` - VerifyAnalytics component integrated
- `apps/web/src/index.css` - fade-in-up keyframe for banner animation
- `infra/secrets.ts` - PosthogKey SST secret
- `infra/web.ts` - NEXT_PUBLIC_POSTHOG_KEY environment variable

## Decisions Made
- **cookieless_mode: "on_reject"** over deprecated `opt_out_capturing_by_default` -- PostHog's modern consent API ensures zero tracking before user consent
- **Custom DOM event pattern** for CookieSettingsButton -- `window.dispatchEvent(new CustomEvent("show-cookie-consent"))` avoids prop drilling and works across component boundaries
- **snake_case event names** per PostHog convention (landing_page_viewed, signup_completed, signup_started)
- **No posthog.identify()** -- anonymous-only analytics as specified in plan (no user identification)
- **defaults: "2025-11-30"** enables automatic SPA pageview tracking via browser history API, no manual pageview component needed

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Added NEXT_PUBLIC_POSTHOG_KEY env var tests**
- **Found during:** Verification (full test pipeline)
- **Issue:** Guardrail test `every env var in schema must have a test` failed because NEXT_PUBLIC_POSTHOG_KEY was added to schema without corresponding tests in web.test.ts
- **Fix:** Added 3 tests (absent, present, empty string) and updated local defaults test to verify PostHog key fallback
- **Files modified:** packages/env/src/web.test.ts
- **Verification:** All 85 unit tests pass including guardrail
- **Committed in:** 8cb2ce0

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Required for test guardrail compliance. No scope creep.

## Issues Encountered
- Integration tests fail due to Docker/Postgres not being available in the execution environment -- this is a pre-existing infrastructure issue documented in STATE.md, not caused by this plan's changes. All 85 unit tests pass cleanly.

## User Setup Required

External service requires manual configuration:
- **PostHog project**: Create project at PostHog Dashboard if not exists
- **Environment variable**: `NEXT_PUBLIC_POSTHOG_KEY` from PostHog Dashboard > Settings > Project API Key
- **SST secret**: Run `sst secret set PosthogKey <key>` for deployment

## Next Phase Readiness
- Analytics infrastructure complete and ready for Phase 4 landing page
- `signup_started` event constant exported and ready for Phase 4 email signup form
- `CookieSettingsButton` exported for Phase 4 footer integration
- `trackEvent` utility available for any future custom events

---
*Phase: 03-analytics*
*Completed: 2026-01-28*
