---
phase: 04-landing-page
plan: 01
subsystem: web-app-structure
tags: [next.js, route-groups, fonts, tailwind]
dependency-graph:
  requires: []
  provides: [route-groups, dm-serif-display-font, font-display-utility]
  affects: [04-02]
tech-stack:
  added: []
  patterns: [next.js-route-groups, next-font-google-variable]
key-files:
  created:
    - apps/web/src/app/(landing)/layout.tsx
    - apps/web/src/app/(app)/layout.tsx
  modified:
    - apps/web/src/app/layout.tsx
    - apps/web/src/index.css
    - lefthook.yml
decisions:
  - id: "04-01-01"
    description: "Route groups (landing) and (app) for layout separation"
    rationale: "Standard Next.js pattern; avoids usePathname hydration issues"
  - id: "04-01-02"
    description: "DM Serif Display loaded via next/font/google with --font-dm-serif variable"
    rationale: "Matches existing Geist font pattern; zero layout shift"
  - id: "04-01-03"
    description: "(app)/layout.tsx is use client because Header is a client component"
    rationale: "Server Component layout cannot render client component without boundary"
metrics:
  duration: 9min
  completed: 2026-01-29
---

# Phase 4 Plan 01: Route Group Restructuring and DM Serif Display Font Summary

JWT-free structural refactor: Next.js route groups separate landing (headerless) from app (with header) layouts, DM Serif Display font loaded for headline personality.

## What Was Done

### Task 1: Create route groups and split layouts (c7bf023)

Split the app directory into two route groups and restructured layouts:

- **Root layout** (`apps/web/src/app/layout.tsx`): Added DM_Serif_Display font import with `--font-dm-serif` CSS variable. Removed Header import and grid wrapper. Root now renders: html > body > Providers > {children} + CookieConsentBanner.
- **Landing layout** (`apps/web/src/app/(landing)/layout.tsx`): Simple Server Component pass-through that renders `{children}` with no wrapper. No header, no grid.
- **App layout** (`apps/web/src/app/(app)/layout.tsx`): Client component with Header + grid layout extracted from the original root layout. Provides the authenticated app chrome.
- **Moved pages**: dashboard, ai, login, success moved into `(app)/` route group. Current page.tsx moved into `(landing)/` route group.
- **Unchanged**: verify/, unsubscribe/, api/, error.tsx, global-error.tsx, favicon.ico remain at root level.

### Task 2: Add font-display Tailwind utility via CSS theme (f5ad2ed)

Added `--font-display` variable to the `@theme inline` block in `index.css`:
```css
--font-display: var(--font-dm-serif), "DM Serif Display", serif;
```
This creates the `font-display` Tailwind utility class for use in components.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Fixed lefthook shell expansion with parenthesized paths**

- **Found during:** Task 1 commit
- **Issue:** The `{staged_files}` template in lefthook.yml expanded file paths containing parentheses (from route group directories) inside a `bash -c` single-quoted string, causing shell syntax errors.
- **Fix:** Rewrote biome and typecheck hook commands to use pipe (`|`) multiline YAML syntax instead of nested `bash -c` quoting, allowing lefthook to properly handle paths with special characters.
- **Files modified:** lefthook.yml
- **Commit:** c7bf023

## Verification Results

- `pnpm check` passes (biome + TypeScript compilation)
- All 97 unit tests pass across 16 test files
- E2E: 5 passed, 3 skipped, 1 failed (pre-existing hydration mismatch in auth.e2e.test.ts:52, documented in STATE.md)
- Directory structure verified: `(landing)/` and `(app)/` route groups in place
- Root layout confirmed: DM_Serif_Display imported, Header removed
- (app)/layout.tsx confirmed: Header imported and rendered with grid
- (landing)/layout.tsx confirmed: simple children pass-through
- index.css confirmed: `--font-display` in @theme inline block

## Decisions Made

| ID | Decision | Rationale |
|----|----------|-----------|
| 04-01-01 | Route groups (landing) and (app) for layout separation | Standard Next.js pattern; avoids usePathname hydration issues |
| 04-01-02 | DM Serif Display via next/font/google with --font-dm-serif variable | Matches existing Geist font pattern; zero layout shift |
| 04-01-03 | (app)/layout.tsx is "use client" | Header is a client component; layout must be client to render it |

## Next Phase Readiness

Plan 04-02 can proceed immediately. The route groups and font infrastructure are in place:
- Landing page at `(landing)/page.tsx` is ready to be replaced with the marketing page
- `font-display` utility is available for the H1 headline
- No blockers identified
