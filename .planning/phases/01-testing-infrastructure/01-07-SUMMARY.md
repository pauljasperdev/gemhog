---
phase: 01-testing-infrastructure
plan: 07
subsystem: testing
tags: [biome, lint, react-hooks, a11y]

# Dependency graph
requires:
  - phase: 01-testing-infrastructure
    provides: Biome lint configuration with --error-on-warnings
provides:
  - Clean lint pass for apps/web/src/app/ai/page.tsx
  - Clean lint pass for apps/web/src/app/dashboard/dashboard.tsx
affects: [verify-commit, ci-pipeline]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - biome-ignore for intentional dependency violations
    - composite keys for nested map iterations

key-files:
  created: []
  modified:
    - apps/web/src/app/ai/page.tsx
    - apps/web/src/app/dashboard/dashboard.tsx

key-decisions:
  - "Use biome-ignore for intentional scroll-on-message-count dependency"
  - "Use composite key (message.id-index) instead of array index for React keys"
  - "Use nullish coalescing instead of non-null assertion for safer null handling"
  - "Prefix unused destructured props with underscore to indicate intentional"

patterns-established:
  - "biome-ignore lint/correctness/useExhaustiveDependencies: for intentional effect triggers"
  - "session: _session destructuring pattern for unused props"

# Metrics
duration: 2min
completed: 2026-01-19
---

# Phase 1 Plan 7: Fix apps/web Lint Warnings Summary

**Resolved Biome lint warnings in AI chat page and Dashboard component enabling clean pre-commit checks for those files**

## Performance

- **Duration:** 2 min
- **Started:** 2026-01-19T18:38:45Z
- **Completed:** 2026-01-19T18:40:56Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments
- Fixed useExhaustiveDependencies warning in ai/page.tsx with biome-ignore comment
- Fixed noArrayIndexKey warning in ai/page.tsx with composite key pattern
- Fixed noNonNullAssertion warning in dashboard.tsx with nullish coalescing
- Fixed noUnusedFunctionParameters warning in dashboard.tsx with underscore prefix

## Task Commits

Each task was committed atomically:

1. **Task 1: Fix lint warnings in ai/page.tsx** - `d63afcd` (fix)
2. **Task 2: Fix lint warnings in dashboard.tsx** - `0b679b8` (fix)

## Files Created/Modified
- `apps/web/src/app/ai/page.tsx` - AI chat page with fixed useEffect dependency and React key
- `apps/web/src/app/dashboard/dashboard.tsx` - Dashboard with safer null handling and unused prop marking

## Decisions Made

1. **biome-ignore for intentional dependency** - The scroll effect intentionally triggers on message count change. Using biome-ignore acknowledges this is intentional rather than adding the dependency to the closure.

2. **Composite key pattern** - Using `${message.id}-${index}` provides a stable unique key that combines the parent's stable ID with the child's position, satisfying React's key requirements without relying solely on array index.

3. **Nullish coalescing over non-null assertion** - `(customerState?.activeSubscriptions?.length ?? 0) > 0` is safer than `length! > 0` because it handles null/undefined gracefully at runtime.

4. **Underscore prefix for unused props** - `session: _session` in destructuring indicates the prop is intentionally unused (kept for future use or API consistency) while silencing the lint warning.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed noArrayIndexKey warning (not in original plan)**
- **Found during:** Task 1 (ai/page.tsx)
- **Issue:** Using `key={index}` in message.parts.map() flagged by Biome
- **Fix:** Changed to `key={\`${message.id}-${index}\`}` for composite key
- **Files modified:** apps/web/src/app/ai/page.tsx
- **Verification:** `pnpm biome lint apps/web/src/app/ai/page.tsx` passes
- **Committed in:** d63afcd (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (1 bug fix)
**Impact on plan:** Minor scope addition - the additional lint warning was in the same file and needed fixing for clean lint pass.

## Issues Encountered

**Plan verification scope mismatch** - The plan's verification section specified `pnpm check` should exit 0, but there are other pre-existing lint issues in the codebase (mode-toggle.tsx, prd.json, label.tsx, etc.) outside this plan's scope. The actual success criteria was met: the two specific files have no warnings.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- apps/web/src/app/ai/page.tsx and dashboard.tsx now pass lint checks
- Plan 01-08 addresses remaining TypeScript errors (hono module)
- Other pre-existing lint issues (mode-toggle.tsx, prd.json, label.tsx) remain for future cleanup

---
*Phase: 01-testing-infrastructure*
*Completed: 2026-01-19*
