---
phase: 04-landing-page
plan: 01
subsystem: web-app-structure
tags: [next.js, route-groups, fonts, tailwind, hydration]
dependency-graph:
  requires: []
  provides: [route-groups, dm-serif-display-font, font-display-utility]
  affects: [04-02]
tech-stack:
  added: []
  patterns: [next.js-route-groups, next-font-google-variable, mounted-state-hydration-guard]
key-files:
  created:
    - apps/web/src/app/(landing)/layout.tsx
    - apps/web/src/app/(app)/layout.tsx
  modified:
    - apps/web/src/app/layout.tsx
    - apps/web/src/index.css
    - apps/web/src/components/user-menu.tsx
    - lefthook.yml
decisions:
  - id: "04-01-01"
    description: "Route groups (landing) and (app) for layout separation"
    rationale: "Standard Next.js pattern; avoids usePathname hydration issues"
  - id: "04-01-02"
    description: "DM Serif Display loaded via next/font/google with --font-dm-serif variable"
    rationale: "Matches existing Geist font pattern; zero layout shift"
  - id: "04-01-03"
    description: "(app)/layout.tsx is a Server Component (not use client)"
    rationale: "Server Components can render Client Components; Header already has use client"
  - id: "04-01-04"
    description: "Mounted state guard in UserMenu to prevent hydration mismatch"
    rationale: "Server renders Skeleton (isPending=true), client may resolve auth state from cookies immediately; mounted pattern ensures consistent initial render"
metrics:
  duration: 28min
  completed: 2026-01-29
---

# Phase 4 Plan 01: Route Group Restructuring and DM Serif Display Font Summary

Next.js route groups separate landing (headerless) from app (with header) layouts, DM Serif Display font loaded for headline personality, UserMenu hydration mismatch resolved.

## What Was Done

### Task 1: Create route groups and split layouts (c7bf023)

Split the app directory into two route groups and restructured layouts:

- **Root layout** (`apps/web/src/app/layout.tsx`): Added DM_Serif_Display font import with `--font-dm-serif` CSS variable. Removed Header import and grid wrapper. Root now renders: html > body > Providers > {children} + CookieConsentBanner.
- **Landing layout** (`apps/web/src/app/(landing)/layout.tsx`): Simple Server Component pass-through that renders `{children}` with no wrapper. No header, no grid.
- **App layout** (`apps/web/src/app/(app)/layout.tsx`): Server Component with Header + grid layout extracted from the original root layout. Provides the authenticated app chrome.
- **Moved pages**: dashboard, ai, login, success moved into `(app)/` route group. Current page.tsx moved into `(landing)/` route group.
- **Unchanged**: verify/, unsubscribe/, api/, error.tsx, global-error.tsx, favicon.ico remain at root level.

### Task 2: Add font-display Tailwind utility via CSS theme (f5ad2ed)

Added `--font-display` variable to the `@theme inline` block in `index.css`:
```css
--font-display: var(--font-dm-serif), "DM Serif Display", serif;
```
This creates the `font-display` Tailwind utility class for use in components.

### Bug fix: Resolve Header hydration mismatch (b7f8de8)

Fixed two hydration issues exposed by the route group restructuring:

1. **Removed unnecessary "use client" from (app)/layout.tsx** -- Server Components can render Client Components (Header already has its own "use client" directive). This was incorrectly specified in the plan.

2. **Added mounted state guard to UserMenu** -- The server always renders `<Skeleton>` (isPending=true from useSession), but the client may resolve auth state immediately from cookies, rendering `<Link href="/login">` instead. Added `useState(false)` + `useEffect` mounted pattern so both server and client render `<Skeleton>` initially, then update after hydration completes. This also fixes cascading base-ui ID mismatch in the ModeToggle DropdownMenu, which was caused by the UserMenu tree divergence changing sibling component auto-generated IDs.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Fixed lefthook shell expansion with parenthesized paths**

- **Found during:** Task 1 commit
- **Issue:** The `{staged_files}` template in lefthook.yml expanded file paths containing parentheses (from route group directories) inside a `bash -c` single-quoted string, causing shell syntax errors.
- **Fix:** Rewrote biome and typecheck hook commands to use pipe (`|`) multiline YAML syntax instead of nested `bash -c` quoting, allowing lefthook to properly handle paths with special characters.
- **Files modified:** lefthook.yml
- **Commit:** c7bf023

**2. [Rule 1 - Bug] Fixed UserMenu hydration mismatch causing flaky E2E tests**

- **Found during:** Post-task verification (pnpm test)
- **Issue:** UserMenu rendered `<Skeleton>` on server (isPending=true) but `<Link>` on client (auth state resolved from cookies), causing React hydration mismatch. This cascaded to ModeToggle where base-ui generated different IDs due to changed tree structure.
- **Fix:** Added `mounted` state guard so server and client both render Skeleton initially. Removed unnecessary `"use client"` from (app)/layout.tsx.
- **Files modified:** apps/web/src/components/user-menu.tsx, apps/web/src/app/(app)/layout.tsx
- **Commit:** b7f8de8

**3. [Plan correction] (app)/layout.tsx should be Server Component, not "use client"**

- **Found during:** Hydration investigation
- **Issue:** Plan specified `"use client"` for (app)/layout.tsx, but this is unnecessary. Server Components can import and render Client Components -- Header already has its own `"use client"` directive. The original root layout was also a Server Component rendering Header.
- **Fix:** Removed `"use client"` directive from (app)/layout.tsx.
- **Commit:** b7f8de8

## Verification Results

- `pnpm check` passes (biome + TypeScript compilation)
- All 97 unit tests pass across 16 test files
- All 39 integration tests pass across 9 test files
- All 6 E2E tests pass (3 skipped -- cookie consent tests skip when PostHog not configured)
- Full test suite: ALL TESTS PASSED
- Directory structure verified: `(landing)/` and `(app)/` route groups in place
- Root layout confirmed: DM_Serif_Display imported, Header removed
- (app)/layout.tsx confirmed: Server Component, Header imported and rendered with grid
- (landing)/layout.tsx confirmed: simple children pass-through
- index.css confirmed: `--font-display` in @theme inline block

## Decisions Made

| ID | Decision | Rationale |
|----|----------|-----------|
| 04-01-01 | Route groups (landing) and (app) for layout separation | Standard Next.js pattern; avoids usePathname hydration issues |
| 04-01-02 | DM Serif Display via next/font/google with --font-dm-serif variable | Matches existing Geist font pattern; zero layout shift |
| 04-01-03 | (app)/layout.tsx is a Server Component (not "use client") | Server Components can render Client Components; Header already has "use client" |
| 04-01-04 | Mounted state guard in UserMenu | Prevents hydration mismatch from auth state resolving differently on server vs client |

## Next Phase Readiness

Plan 04-02 can proceed immediately. The route groups and font infrastructure are in place:
- Landing page at `(landing)/page.tsx` is ready to be replaced with the marketing page
- `font-display` utility is available for the H1 headline
- No blockers identified
