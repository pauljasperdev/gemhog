---
phase: 03-analytics
plan: 02
subsystem: analytics
tags: [posthog, person-profiles, race-condition-fix, gap-closure]

# Dependency graph
requires:
  - phase: 03-analytics-01
    provides: PostHog SDK init, PostHogProvider, consent banner
provides:
  - PostHogProvider unconditional rendering (race condition fix)
  - Explicit person_profiles: identified_only for anonymous-only analytics
affects: [04-landing-page]

# Tech tracking
tech-stack:
  added: []
  patterns: [unconditional-posthog-provider, explicit-person-profiles]

key-files:
  created: []
  modified:
    - apps/web/src/components/providers.tsx
    - apps/web/src/lib/sentry/instrumentation.client.ts

key-decisions:
  - "Unconditional PostHogProvider -- PostHog handles not-yet-loaded state via internal queue"
  - "Explicit person_profiles: identified_only -- defensive best practice for anonymous-only analytics"

patterns-established:
  - "PostHogProvider always renders unconditionally (never gate on __loaded)"
  - "PostHog init explicitly declares person_profiles mode"

# Metrics
duration: 4min
completed: 2026-01-29
---

# Phase 3 Plan 2: PostHog Gap Closure Summary

**Unconditional PostHogProvider (consent banner race fix) and explicit person_profiles: identified_only for anonymous-only cost optimization**

## Performance

- **Duration:** 4 min
- **Started:** 2026-01-29T08:20:02Z
- **Completed:** 2026-01-29T08:24:53Z
- **Tasks:** 1
- **Files modified:** 2

## Accomplishments
- Fixed PostHogProvider race condition where consent banner could fail to appear on first render due to synchronous `posthog.__loaded` check
- Added explicit `person_profiles: "identified_only"` to PostHog init for anonymous-only analytics cost optimization (up to 4x cheaper event processing)
- Closed both post-verification issues identified in 03-VERIFICATION.md

## Task Commits

Each task was committed atomically:

1. **Task 1: Add person_profiles to PostHog init and commit both fixes** - `fc1da56` (fix)

## Files Created/Modified

### Modified
- `apps/web/src/components/providers.tsx` - Removed `posthogReady`/`__loaded` conditional, PostHogProvider now renders unconditionally
- `apps/web/src/lib/sentry/instrumentation.client.ts` - Added `person_profiles: "identified_only"` to PostHog init config

## Decisions Made
- **Unconditional PostHogProvider rendering** -- PostHog's internal event queue handles the not-yet-loaded state gracefully, no need to gate on `__loaded` which creates a race condition with no re-render trigger
- **Explicit person_profiles: "identified_only"** -- while currently the default, being explicit prevents unexpected behavior if PostHog changes defaults and ensures anonymous events are processed at lower cost

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
- Integration tests fail due to Docker/Postgres not available (pre-existing infrastructure issue documented in STATE.md). All 85 unit tests pass with no regressions.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- All Phase 3 analytics gaps resolved
- PostHog integration fully correct and defensive
- Ready for Phase 4 landing page development

---
*Phase: 03-analytics*
*Completed: 2026-01-29*
