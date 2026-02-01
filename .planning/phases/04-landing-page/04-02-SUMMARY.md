---
phase: 04-landing-page
plan: 02
subsystem: landing-page-ui
tags: [landing-page, signup-form, tRPC, tanstack-form, analytics, e2e]
dependency-graph:
  requires: [04-01]
  provides: [landing-page-ui, signup-form, landing-footer]
  affects: [05-01, 05-02]
tech-stack:
  added: []
  patterns:
    [tanstack-react-form, tRPC-mutation, analytics-events, responsive-form]
key-files:
  created:
    - apps/web/src/components/signup-form.tsx
    - apps/web/src/components/landing-footer.tsx
    - apps/web/src/components/signup-form.test.tsx
    - apps/web/src/components/landing-footer.test.tsx
  modified:
    - apps/web/src/app/(landing)/page.tsx
    - apps/web/tests/e2e/home.e2e.test.ts
decisions:
  - id: "04-02-01"
    description:
      "output element for success message instead of role=status paragraph"
    rationale:
      "Semantic HTML: output element implicitly has role=status for screen
      readers"
  - id: "04-02-02"
    description: "tanstack/react-form with Zod validators for signup form"
    rationale: "Follows plan specification; avoids custom useState form state"
metrics:
  completed: 2026-01-29
---

# Phase 4 Plan 02: Landing Page UI, Signup Form, Footer, and Tests Summary

Complete landing page at `/` with dark theme, DM Serif Display headline, email
signup form wired to tRPC mutation with analytics events, footer with
privacy/cookie links, and comprehensive unit + E2E tests.

## What Was Done

### Task 1: Build landing page, signup form, and footer components (b6b3adc)

Built three components for the landing page:

- **Landing page** (`apps/web/src/app/(landing)/page.tsx`): Server Component
  with metadata export. Dark gray-950 background, vertically centered layout, DM
  Serif Display H1 ("We listen to financial podcasts so you don't have to"),
  gray subheadline, SignupForm and LandingFooter imports.
- **SignupForm** (`apps/web/src/components/signup-form.tsx`): Client component
  using @tanstack/react-form with Zod email validation. Wires to
  `trpc.subscriber.subscribe.mutationOptions()` via useMutation. Fires
  `SIGNUP_STARTED` and `SIGNUP_COMPLETED` analytics events via trackEvent.
  Responsive layout (stacked mobile, inline desktop). Emerald CTA button.
  Success state shows confirmation message via `<output>` element. Error state
  shows alert. Privacy consent text with /privacy link.
- **LandingFooter** (`apps/web/src/components/landing-footer.tsx`): Client
  component with copyright year, Privacy Policy link, and CookieSettingsButton.
  Centered dot separators.

### Task 2: Write unit tests and update E2E tests (abc5f84)

- **signup-form.test.tsx** (5 tests): Renders email input/button, privacy link,
  success message, disabled state while submitting, error messages. Mocks tRPC
  client, useMutation, react-form, analytics, and next/link.
- **landing-footer.test.tsx** (3 tests): Copyright year, privacy link href,
  cookie settings button.
- **home.e2e.test.ts** (4 tests): Homepage loads with H1, page has email
  input/button, signup form is visible and enabled, footer has privacy and
  cookie links.

## Deviations from Plan

None. Implementation matches plan specification.

## Verification Results

- `pnpm test` passes (full pipeline)
- 111 unit tests pass across 21 test files
- 39 integration tests pass across 9 test files
- 11 E2E tests pass
- ALL TESTS PASSED

## Decisions Made

| ID       | Decision                               | Rationale                               |
| -------- | -------------------------------------- | --------------------------------------- |
| 04-02-01 | `<output>` element for success message | Semantic HTML with implicit role=status |
| 04-02-02 | tanstack/react-form + Zod for form     | Plan specification; avoids custom state |

## Next Phase Readiness

Phase 4 landing page is complete. Phase 5 (Launch Readiness) can proceed —
branding assets, legal pages, SEO, and auth lockdown.
