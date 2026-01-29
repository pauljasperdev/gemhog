---
phase: 03-analytics
plan: 03
subsystem: analytics
tags: [testing-library, vitest, playwright, cookie-consent, posthog, gap-closure]

# Dependency graph
requires:
  - phase: 03-analytics-01
    provides: CookieConsentBanner, CookieSettingsButton, Providers with PostHog
  - phase: 03-analytics-02
    provides: Unconditional PostHogProvider, person_profiles config
provides:
  - Unit test coverage for CookieConsentBanner (visibility, accept, decline, re-open, granted state)
  - Unit test coverage for CookieSettingsButton (default text, custom children, event dispatch)
  - Unit test coverage for Providers (PostHogProvider conditional rendering, Toaster presence)
  - E2E test coverage for cookie consent banner flow (appearance, accept, decline)
  - @testing-library/react dev infrastructure for React component testing
affects: [04-landing-page]

# Tech tracking
tech-stack:
  added: ["@testing-library/react", "@testing-library/user-event"]
  patterns: [react-component-unit-testing, happy-dom-cleanup, posthog-mock-pattern]

key-files:
  created:
    - apps/web/src/components/cookie-consent.test.tsx
    - apps/web/src/components/providers.test.tsx
    - apps/web/tests/e2e/cookie-consent.e2e.test.ts
  modified:
    - apps/web/package.json
    - apps/web/vitest.config.ts
    - vitest.config.ts

key-decisions:
  - "Mock PostHog opt_in/opt_out to update consent status -- mirrors real SDK behavior where consent changes persist"
  - "explicit cleanup() in afterEach for happy-dom -- @testing-library/react does not auto-cleanup in happy-dom environment"
  - "E2E tests skip gracefully when PostHog not configured -- prevents false failures in environments without PostHog key"

patterns-established:
  - "Use @testing-library/react + userEvent for React component unit tests in happy-dom"
  - "Always call cleanup() in afterEach when using happy-dom environment"
  - "Mock posthog-js/react usePostHog with configurable consent status"
  - "Use vi.mock + dynamic import (await import) for React component tests with mocked dependencies"

# Metrics
duration: 9min
completed: 2026-01-29
---

# Phase 3 Plan 3: Cookie Consent and PostHog Test Coverage Summary

**12 unit tests + 3 E2E tests covering CookieConsentBanner, CookieSettingsButton, and Providers components with @testing-library/react**

## Performance

- **Duration:** 9 min
- **Started:** 2026-01-29T10:07:01Z
- **Completed:** 2026-01-29T10:16:40Z
- **Tasks:** 2
- **Files created:** 3
- **Files modified:** 3

## Accomplishments

- Added @testing-library/react and @testing-library/user-event as dev dependencies for React component testing
- Updated vitest configs (web and root) to discover .test.tsx and exclude .int.test.tsx / .e2e.test.tsx files
- Created 9 unit tests for CookieConsentBanner and CookieSettingsButton covering all must-haves: visibility logic (pending/granted), accept/decline calling PostHog SDK, custom DOM event re-open, default/custom button text, event dispatch
- Created 3 unit tests for Providers covering PostHogProvider conditional rendering with/without NEXT_PUBLIC_POSTHOG_KEY and Toaster always rendering
- Created 3 E2E tests for cookie consent banner flow (appearance, accept dismissal, decline dismissal) with graceful skip when PostHog is not configured
- Total test count: 97 unit tests (12 new + 85 existing), all passing with zero regressions
- All 3 test coverage gaps from 03-VERIFICATION.md now closed

## Task Commits

Each task was committed atomically:

1. **Task 1: Add @testing-library/react and unit tests for CookieConsentBanner and Providers** - `74900a7` (test)
2. **Task 2: Add E2E test for cookie consent banner flow** - `a8912e4` (test)

## Files Created/Modified

### Created
- `apps/web/src/components/cookie-consent.test.tsx` - 9 unit tests for CookieConsentBanner and CookieSettingsButton
- `apps/web/src/components/providers.test.tsx` - 3 unit tests for Providers PostHog conditional rendering
- `apps/web/tests/e2e/cookie-consent.e2e.test.ts` - 3 E2E tests for cookie consent banner flow

### Modified
- `apps/web/package.json` - Added @testing-library/react and @testing-library/user-event devDependencies
- `apps/web/vitest.config.ts` - Added .test.tsx include patterns and .int.test.tsx/.e2e.test.tsx exclude patterns
- `vitest.config.ts` - Added .int.test.tsx and .e2e.test.tsx to root exclude patterns
- `pnpm-lock.yaml` - Updated lockfile for new dependencies

## Decisions Made

- **Mock consent status update on opt_in/opt_out** -- Mocks mirror real PostHog SDK behavior where calling opt_in_capturing changes consent status from "pending" to "granted". This prevents useEffect from re-opening the banner after accept/decline in tests.
- **Explicit cleanup() in afterEach** -- @testing-library/react does not auto-cleanup in happy-dom (unlike jsdom). Without explicit cleanup, DOM elements accumulate across test renders causing "multiple elements found" errors.
- **E2E tests skip when PostHog not configured** -- The cookie consent banner only appears when NEXT_PUBLIC_POSTHOG_KEY is set. E2E tests gracefully skip via test.skip() rather than failing, since unit tests already provide thorough component logic coverage.
- **Dynamic import after vi.mock** -- React component tests use `await import()` after `vi.mock()` declarations to ensure mocks are applied before module resolution.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed happy-dom cleanup causing duplicate elements**
- **Found during:** Task 1 verification
- **Issue:** @testing-library/react does not auto-cleanup between tests in happy-dom environment, causing DOM elements from previous renders to accumulate
- **Fix:** Added explicit `cleanup()` import and call in `afterEach` hooks for both test files
- **Files modified:** cookie-consent.test.tsx, providers.test.tsx
- **Commit:** 74900a7

**2. [Rule 1 - Bug] Fixed mock consent status not updating after opt_in/opt_out**
- **Found during:** Task 1 verification
- **Issue:** After clicking Accept, the useEffect re-ran and set visible back to true because mockConsentStatus remained "pending"
- **Fix:** Made mockOptIn and mockOptOut update mockConsentStatus to "granted"/"denied" respectively, mirroring real PostHog behavior
- **Files modified:** cookie-consent.test.tsx
- **Commit:** 74900a7

## Issues Encountered

- Pre-existing E2E auth test failure (hydration mismatch in auth.e2e.test.ts:89) -- unrelated to this plan's changes, documented in STATE.md
- Docker/Postgres not available in execution environment -- integration tests cannot run (pre-existing)

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Phase 3 analytics is fully complete with all gaps closed
- All 3 test coverage gaps from 03-VERIFICATION.md addressed
- 97 unit tests passing with zero regressions
- @testing-library/react infrastructure ready for Phase 4 landing page component testing
- Ready for Phase 4 landing page development

---
*Phase: 03-analytics*
*Completed: 2026-01-29*
