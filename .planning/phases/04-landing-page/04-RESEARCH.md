# Phase 4: Landing Page - Research

**Researched:** 2026-01-29
**Domain:** Marketing landing page with email signup (Next.js / React / TailwindCSS)
**Confidence:** HIGH

## Summary

This phase replaces the current scaffold home page (`/`) with a dark-themed,
hero-only marketing landing page featuring an inline email signup form. The
technical surface is narrow: a single React page component, a signup form
component wiring into the existing tRPC `subscriber.subscribe` mutation, a
minimal footer, and layout adjustments to remove the header for this route.

The existing codebase provides nearly everything needed. The tRPC subscriber
mutation, PostHog analytics events, cookie consent banner, and shadcn/ui
primitives (Button, Input) are all in place. The primary work is visual design
(dark theme with emerald accents), form UX (inline email + submit, loading
states, success/error transitions), layout restructuring (remove header on
landing page, vertically center content), and font selection.

**Primary recommendation:** Build a single `page.tsx` that is a Server Component
shell wrapping a `"use client"` signup form component. Use existing
`@tanstack/react-form` + tRPC `mutationOptions()` pattern from the sign-in form.
Force dark mode on the landing route via the `dark` class on a wrapping element.
Use Tailwind's built-in emerald color palette directly (no custom CSS variables
needed). Keep Geist Sans for body text; add a display serif font (DM Serif
Display via `next/font/google`) for the H1 to create personality.

## Standard Stack

The established libraries/tools for this domain:

### Core (Already Installed)

| Library                  | Version | Purpose                          | Why Standard                                          |
| ------------------------ | ------- | -------------------------------- | ----------------------------------------------------- |
| Next.js                  | 16.1.1  | Page routing, SSR/RSC            | Already the framework                                 |
| React                    | 19.2.3  | UI rendering                     | Already installed                                     |
| TailwindCSS              | 4.1.10  | Styling                          | Already configured with shadcn/ui                     |
| shadcn/ui                | 3.6.2   | Button, Input components         | Already installed and customized                      |
| @tanstack/react-form     | 1.27.3  | Form state management            | Already used in sign-in-form.tsx                      |
| @tanstack/react-query    | 5.90.12 | Data fetching / mutations        | Already integrated with tRPC                          |
| @trpc/tanstack-react-query | 11.7.2 | tRPC + React Query bridge       | Already set up with createTRPCOptionsProxy            |
| posthog-js               | 1.336   | Analytics events                 | Already configured with consent                       |
| Zod                      | 4.1.13  | Form/input validation            | Already used server-side in subscriber router         |
| next/font/google         | (Next)  | Font loading                     | Already used for Geist; add DM Serif Display          |

### Supporting (Already Installed)

| Library        | Version | Purpose                  | When to Use                              |
| -------------- | ------- | ------------------------ | ---------------------------------------- |
| Lucide React   | 0.546.0 | Icons (loading spinner)  | Loading state on submit button           |
| Sonner         | 2.0.5   | Toast notifications      | Only if needed for unexpected errors     |
| next-themes    | 0.4.6   | Theme management         | Already in Providers; landing overrides  |

### Nothing New to Install

No new dependencies are required. Everything needed is already in the project.

### Alternatives Considered

| Instead of           | Could Use             | Tradeoff                                             |
| -------------------- | --------------------- | ---------------------------------------------------- |
| @tanstack/react-form | React 19 `useFormStatus` | Would diverge from existing form pattern (sign-in) |
| @tanstack/react-form | react-hook-form       | Different library; project already uses TanStack Form |
| Geist + DM Serif     | Inter + Playfair      | Geist already loaded; switching adds no value        |

## Architecture Patterns

### Recommended Project Structure

```
apps/web/src/
├── app/
│   ├── page.tsx                    # Landing page (Server Component shell)
│   ├── privacy/
│   │   └── page.tsx                # Privacy policy page (new, simple)
│   └── layout.tsx                  # Modified: conditional header removal
├── components/
│   ├── signup-form.tsx             # Client component: email form + tRPC mutation
│   ├── signup-form.test.tsx        # Unit tests for signup form
│   ├── landing-footer.tsx          # Footer: copyright + privacy link + cookie settings
│   └── landing-footer.test.tsx     # Unit tests for footer
├── lib/
│   └── analytics.ts               # Already has SIGNUP_STARTED, SIGNUP_COMPLETED
└── tests/e2e/
    └── home.e2e.test.ts            # Update existing E2E tests
```

### Pattern 1: Landing Page as Server Component Shell

**What:** The page.tsx is a React Server Component that renders static content
(H1, subheadline) and embeds a client component for the interactive form.
**When to use:** When the page has both static marketing content and interactive
form elements.

```typescript
// apps/web/src/app/page.tsx (Server Component)
import { SignupForm } from "@/components/signup-form";
import { LandingFooter } from "@/components/landing-footer";

export default function LandingPage() {
  return (
    <div className="dark flex min-h-svh flex-col items-center justify-center bg-gray-950 px-4 text-white">
      <main className="w-full max-w-xl text-center">
        <h1 className="font-display text-4xl font-bold tracking-tight sm:text-5xl">
          We listen to financial podcasts so you don&apos;t have to
        </h1>
        <p className="mt-4 text-lg text-gray-400">
          Investment ideas, trends, and expert takes — delivered to your inbox.
        </p>
        <div className="mt-8">
          <SignupForm />
        </div>
      </main>
      <LandingFooter />
    </div>
  );
}
```

### Pattern 2: tRPC Mutation with @tanstack/react-form

**What:** Use `useMutation(trpc.subscriber.subscribe.mutationOptions())` and
wire it into `useForm`'s `onSubmit` via `mutateAsync`.
**When to use:** Forms that submit to tRPC mutations. This matches the existing
sign-in form pattern.

```typescript
// apps/web/src/components/signup-form.tsx
"use client";

import { useMutation } from "@tanstack/react-query";
import { useForm } from "@tanstack/react-form";
import { z } from "zod";
import { trpc } from "@/trpc/client";
import { AnalyticsEvents, trackEvent } from "@/lib/analytics";

export function SignupForm() {
  const subscribe = useMutation(trpc.subscriber.subscribe.mutationOptions());

  const form = useForm({
    defaultValues: { email: "" },
    validators: {
      onSubmit: z.object({ email: z.email("Please enter a valid email") }),
    },
    onSubmit: async ({ value }) => {
      trackEvent(AnalyticsEvents.SIGNUP_STARTED);
      await subscribe.mutateAsync(value);
      trackEvent(AnalyticsEvents.SIGNUP_COMPLETED);
    },
  });

  if (subscribe.isSuccess) {
    return (
      <p className="text-emerald-400" role="status">
        Check your inbox to confirm your subscription.
      </p>
    );
  }

  return (
    <form onSubmit={(e) => { e.preventDefault(); form.handleSubmit(); }}>
      {/* inline email + button layout */}
    </form>
  );
}
```

### Pattern 3: Force Dark Mode on Landing Page

**What:** The landing page uses a permanent dark background regardless of the
user's system/theme preference. Use `className="dark"` on a wrapping div to
scope Tailwind's dark: variants, plus explicit bg/text colors.
**When to use:** When a specific route needs to always be dark, while other
routes respect user theme.

There are two approaches:

1. **Approach A: Wrap landing page content in `<div className="dark">`** --
   Tailwind's dark variant selector `&:is(.dark *)` scopes correctly. The
   shadcn/ui CSS variables for `.dark` will apply within this scope. This is
   simpler and avoids layout.tsx changes.

2. **Approach B: Use a route group layout** -- Create
   `app/(landing)/layout.tsx` that forces dark class on `<html>`. More complex,
   may fight with next-themes.

**Recommendation:** Approach A. Add `className="dark"` on the landing page's
outermost div. Use explicit dark-mode colors (bg-gray-950, text-white,
text-gray-400) rather than relying on CSS variables. This avoids any conflict
with next-themes and keeps the change self-contained.

### Pattern 4: Conditional Header Removal

**What:** The landing page should not show the Header component. The layout.tsx
currently always renders `<Header />`.
**When to use:** When specific routes need different chrome.

Two approaches:

1. **Route groups:** Move landing page to `app/(landing)/page.tsx` with its own
   layout that omits Header. Other pages stay in `app/(app)/` with Header.

2. **Conditional rendering:** Check the route in layout and conditionally render.

**Recommendation:** Route groups `(landing)` and `(app)`. This is the standard
Next.js pattern for different layouts per route segment. It avoids client-side
route checking and is the cleanest separation.

```
app/
├── (landing)/
│   ├── layout.tsx      # No header, no grid, just Providers + cookie banner
│   └── page.tsx        # Landing page
├── (app)/
│   ├── layout.tsx      # Header + grid layout (existing pattern)
│   ├── dashboard/
│   ├── ai/
│   └── ...
├── layout.tsx          # Root: <html>, <body>, fonts, Providers
├── privacy/
│   └── page.tsx        # Privacy policy (standalone)
├── verify/
│   └── page.tsx        # Email verification (existing)
└── unsubscribe/
    └── page.tsx        # Unsubscribe (existing)
```

### Anti-Patterns to Avoid

- **Using ThemeProvider/next-themes to force dark:** Don't try to override the
  theme provider per-route. It will cause hydration mismatches and flicker. Use
  the `dark` class directly instead.
- **Client-side route detection for header visibility:** Don't use
  `usePathname()` in layout to conditionally render Header. Use route groups.
- **Building a custom form library:** Use @tanstack/react-form -- it is already
  installed and used.
- **Adding new tRPC endpoints:** The `subscriber.subscribe` mutation already
  exists and handles all edge cases (duplicate emails, re-sends for pending).
- **Custom email validation:** Use Zod's built-in `z.email()`. Don't write regex.

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem                    | Don't Build              | Use Instead                                    | Why                                             |
| -------------------------- | ------------------------ | ---------------------------------------------- | ------------------------------------------------ |
| Email validation           | Custom regex             | Zod `z.email()`                                | Edge cases (internationalized emails, etc.)      |
| Form state management      | useState for each field  | @tanstack/react-form `useForm`                 | Already used; handles validation, submission     |
| Mutation state tracking    | Custom loading/error state | tRPC `mutationOptions()` + `useMutation`     | isPending, isSuccess, error built in             |
| Analytics tracking         | Direct posthog.capture   | `trackEvent()` from `@/lib/analytics`          | Centralized, typed event constants               |
| Cookie consent re-open     | Custom state management  | `CookieSettingsButton` component               | Already built with custom DOM event pattern      |
| Font loading               | Manual `<link>` tags     | `next/font/google`                             | Automatic optimization, zero layout shift        |
| Dark mode scoping          | CSS-in-JS / custom logic | Tailwind `dark:` variant with `.dark` class    | Already configured in index.css                  |

**Key insight:** This phase is almost entirely UI/UX work. The backend, API, and
analytics infrastructure are already complete. Do not add backend code.

## Common Pitfalls

### Pitfall 1: Hydration Mismatch with Dark Mode

**What goes wrong:** Using next-themes to force dark on a specific route causes
hydration mismatches because the server renders one theme while the client may
render another.
**Why it happens:** next-themes uses `localStorage` and system preference, which
aren't available server-side.
**How to avoid:** Use explicit Tailwind classes (`bg-gray-950 text-white`) on the
landing page rather than relying on theme CSS variables. Wrap content in a
`<div className="dark">` for any `dark:` prefixed utilities.
**Warning signs:** Console errors about hydration mismatch, flash of wrong
background color.

### Pitfall 2: Form Not Preventing Default Submission

**What goes wrong:** The form submits via browser default, causing a full page
reload instead of calling the tRPC mutation.
**Why it happens:** Missing `e.preventDefault()` in the form's `onSubmit`.
**How to avoid:** Follow the exact pattern from sign-in-form.tsx:
```typescript
<form onSubmit={(e) => { e.preventDefault(); e.stopPropagation(); form.handleSubmit(); }}>
```
**Warning signs:** Page reloads on form submit, URL gets query params appended.

### Pitfall 3: Analytics Events Firing Before Consent

**What goes wrong:** `trackEvent(SIGNUP_STARTED)` fires before PostHog has
consent, leading to dropped events or GDPR violations.
**Why it happens:** PostHog with `cookieless_mode: "on_reject"` will silently
drop events if user hasn't given consent, which is correct behavior.
**How to avoid:** This is actually fine -- PostHog handles it. The events fire,
and if the user hasn't consented, PostHog drops them. No special handling needed.
**Warning signs:** None -- this is expected behavior.

### Pitfall 4: Layout Shift from Font Loading

**What goes wrong:** Visible text reflow when web fonts load after initial render.
**Why it happens:** Font not preloaded or `display: swap` causes layout shift.
**How to avoid:** Use `next/font/google` which automatically handles preloading,
subsetting, and `font-display: swap`. The Geist font is already configured this
way.
**Warning signs:** CLS (Cumulative Layout Shift) in Lighthouse, visible text
jump.

### Pitfall 5: Cookie Consent Banner Styling on Dark Background

**What goes wrong:** The existing cookie consent banner has hardcoded light-mode
colors (white bg, gray text) that will look correct on the dark landing page
because it uses its own explicit colors. However, the banner's `dark:` variants
(dark:bg-gray-900, dark:border-gray-700) will activate inside the `dark` scoped
wrapper.
**Why it happens:** The banner is rendered inside the root layout's Providers, so
if the landing page wraps content in `dark` class, the banner may or may not be
inside that scope.
**How to avoid:** The CookieConsentBanner is rendered in the root layout.tsx
(not inside the page content), so it sits outside the landing page's `dark`
wrapper. It will use its own styling based on the system/theme preference. If
route groups are used, ensure the banner stays in the root layout.
**Warning signs:** Banner looks wrong (wrong bg color) on the landing page.

### Pitfall 6: E2E Test Fixtures Breaking

**What goes wrong:** Existing E2E tests in `home.e2e.test.ts` check for page
content that will change completely.
**Why it happens:** Tests reference the old scaffold page content (ASCII art).
**How to avoid:** Update existing E2E tests to check for landing page elements
(H1 text, signup form, footer).
**Warning signs:** E2E test failures after deploying.

### Pitfall 7: happy-dom Cleanup in Component Tests

**What goes wrong:** Component tests leak state between tests.
**Why it happens:** happy-dom does not auto-cleanup like jsdom.
**How to avoid:** Always add `afterEach(() => { cleanup(); })` in component
tests. This is documented in TESTING.md and enforced in cookie-consent.test.tsx.
**Warning signs:** Tests pass individually but fail when run together.

## Code Examples

Verified patterns from the existing codebase:

### tRPC Mutation with mutationOptions (v11 Pattern)

```typescript
// Source: tRPC official docs + project's createTRPCOptionsProxy setup
// This is the new v11 pattern used in this project
import { useMutation } from "@tanstack/react-query";
import { trpc } from "@/trpc/client";

const subscribe = useMutation(trpc.subscriber.subscribe.mutationOptions());

// Call the mutation
subscribe.mutate({ email: "user@example.com" });

// Or with async/await in form handler
await subscribe.mutateAsync({ email: "user@example.com" });

// Check states
subscribe.isPending;   // loading
subscribe.isSuccess;   // success
subscribe.isError;     // error
subscribe.error;       // TRPCClientError
```

### Form with @tanstack/react-form (Existing Project Pattern)

```typescript
// Source: apps/web/src/components/sign-in-form.tsx (existing pattern)
import { useForm } from "@tanstack/react-form";
import { z } from "zod";

const form = useForm({
  defaultValues: { email: "" },
  validators: {
    onSubmit: z.object({
      email: z.email("Please enter a valid email address"),
    }),
  },
  onSubmit: async ({ value }) => {
    await subscribe.mutateAsync(value);
  },
});

// Render with form.Field
<form.Field name="email">
  {(field) => (
    <>
      <input
        type="email"
        value={field.state.value}
        onBlur={field.handleBlur}
        onChange={(e) => field.handleChange(e.target.value)}
      />
      {field.state.meta.errors.map((error) => (
        <p key={error?.message} className="text-red-500 text-sm">
          {error?.message}
        </p>
      ))}
    </>
  )}
</form.Field>

// Submit button state
<form.Subscribe>
  {(state) => (
    <button disabled={!state.canSubmit || state.isSubmitting}>
      {state.isSubmitting ? "Subscribing..." : "Get the free newsletter"}
    </button>
  )}
</form.Subscribe>
```

### Adding a Google Font via next/font

```typescript
// Source: apps/web/src/app/layout.tsx (existing Geist pattern)
import { DM_Serif_Display } from "next/font/google";

const dmSerif = DM_Serif_Display({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-dm-serif",
  display: "swap",
});

// Add to <html> className alongside existing fonts
<html className={`${geistSans.variable} ${geistMono.variable} ${dmSerif.variable}`}>

// Use in CSS via @theme inline or directly in Tailwind
// In index.css:
// @theme inline { --font-display: "DM Serif Display", serif; }
// Then use: className="font-display"
```

### Analytics Event Tracking

```typescript
// Source: apps/web/src/lib/analytics.ts (existing)
import { AnalyticsEvents, trackEvent } from "@/lib/analytics";

// Fire when user clicks submit
trackEvent(AnalyticsEvents.SIGNUP_STARTED);

// Fire after successful mutation
trackEvent(AnalyticsEvents.SIGNUP_COMPLETED);

// Fire on page view (already wired in current page.tsx)
trackEvent(AnalyticsEvents.LANDING_PAGE_VIEWED);
```

### CookieSettingsButton Usage in Footer

```typescript
// Source: apps/web/src/components/cookie-consent.tsx (existing)
import { CookieSettingsButton } from "@/components/cookie-consent";

<CookieSettingsButton className="text-gray-500 hover:text-gray-300 text-xs">
  Cookie Settings
</CookieSettingsButton>
```

### Component Test Pattern (happy-dom)

```typescript
// Source: apps/web/src/components/cookie-consent.test.tsx (existing)
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

afterEach(() => {
  cleanup(); // REQUIRED for happy-dom
});

describe("SignupForm", () => {
  it("renders email input and submit button", () => {
    render(<SignupForm />);
    expect(screen.getByRole("textbox", { name: /email/i })).toBeDefined();
    expect(screen.getByRole("button", { name: /get the free newsletter/i })).toBeDefined();
  });
});
```

## Typography Recommendation

### Font Selection

| Role     | Font               | Weight | Size (mobile/desktop) | Rationale                                    |
| -------- | ------------------ | ------ | --------------------- | -------------------------------------------- |
| H1       | DM Serif Display   | 400    | text-3xl / text-5xl   | Personality, warmth, not sterile              |
| Subtitle | Geist Sans         | 400    | text-lg / text-xl     | Clean readability on dark backgrounds         |
| Body     | Geist Sans         | 400    | text-sm / text-base   | Already loaded, excellent screen readability  |
| Button   | Geist Sans         | 500    | text-sm               | Consistent with existing shadcn/ui buttons    |
| Footer   | Geist Sans         | 400    | text-xs               | Subtle, unobtrusive                          |

### Why DM Serif Display for H1

- Adds warmth and personality to the headline ("not sterile AI-generated")
- High-contrast serif designed specifically for display/headline use
- Pairs beautifully with geometric sans-serifs like Geist
- Available via `next/font/google` for zero-config optimization
- Single weight (400) keeps the bundle small
- The reference site polar.sh uses Geist throughout; adding a serif H1 creates
  the "more personality" the CONTEXT.md requests

### Why Keep Geist for Everything Else

- Already loaded (zero additional network requests for body text)
- Designed for screens with excellent readability at small sizes
- Used across the rest of the application, maintaining consistency
- The polar.sh reference also uses Geist

## Color Strategy

### Dark Background

Use Tailwind's `gray-950` (`oklch(0.145 0 0)`) as the primary background.
This matches the existing shadcn/ui dark theme variable for `--background` in
the `.dark` selector. For a slightly warmer feel (matching polar.sh), consider
a very dark neutral with a hint of blue:

| Element             | Color              | Tailwind Class              |
| ------------------- | ------------------ | --------------------------- |
| Page background     | Near-black         | bg-gray-950                 |
| Primary text        | White              | text-white                  |
| Secondary text      | Medium gray        | text-gray-400               |
| Muted text          | Dim gray           | text-gray-500               |
| CTA button bg       | Emerald 500        | bg-emerald-500              |
| CTA button hover    | Emerald 400        | hover:bg-emerald-400        |
| CTA button text     | White              | text-white                  |
| Input bg            | Transparent/dark   | bg-white/5                  |
| Input border        | Subtle gray        | border-gray-700             |
| Input focus border  | Emerald            | focus:border-emerald-500    |
| Error text          | Red                | text-red-400                |
| Success text        | Emerald 400        | text-emerald-400            |
| Footer text         | Dim gray           | text-gray-500               |
| Footer link hover   | Light gray         | hover:text-gray-300         |

### Emerald Accent

Use Tailwind's built-in emerald palette directly. No need to define custom CSS
variables. Key shades:

- **emerald-500** (`#00bc7d`) -- Primary CTA button, focus rings
- **emerald-400** (`#00d492`) -- Hover state, success messages
- **emerald-600** (`#009966`) -- Active/pressed state

## Layout & Spacing

### Responsive Breakpoints

| Element        | Mobile (<640px)         | Desktop (>=640px)             |
| -------------- | ----------------------- | ----------------------------- |
| Max width      | Full width - padding    | max-w-xl (36rem / 576px)     |
| H1 size        | text-3xl (1.875rem)     | text-5xl (3rem)              |
| Subtitle size  | text-base               | text-lg                       |
| Content padding | px-6                   | px-4 (max-w constrains)       |
| Form layout    | Stack (input over btn)  | Inline (input + btn side by side) |
| Vertical center | min-h-svh + flex       | Same                          |

### Form Layout Detail

On mobile (<640px), the email input and submit button should stack vertically
for touch targets. On desktop, they sit side by side in a single row.

```
Desktop: [    email@example.com    ] [ Get the free newsletter ]
Mobile:  [    email@example.com    ]
         [ Get the free newsletter ]
```

## State of the Art

| Old Approach                       | Current Approach                          | When Changed  | Impact                                  |
| ---------------------------------- | ----------------------------------------- | ------------- | --------------------------------------- |
| tRPC `trpc.x.useMutation()`       | `useMutation(trpc.x.mutationOptions())`   | tRPC v11      | More React Query native, compiler-safe  |
| Manual `fetch` for mutations       | tRPC typed mutations                      | Project setup | Type safety, DRY                        |
| CSS variables for all colors       | Direct Tailwind utility classes           | Tailwind v4   | Simpler for static pages                |
| `darkMode: 'class'` in config      | `@custom-variant dark` in CSS             | Tailwind v4   | Already configured in index.css         |

**Deprecated/outdated:**
- The old `trpc.x.useMutation()` hook-based pattern still works but is not
  recommended for new code. Use `useMutation(trpc.x.mutationOptions())`.
- The current page.tsx uses `useQuery(trpc.healthCheck.queryOptions())` which
  is the correct v11 pattern and should be replaced (not the query, but the
  whole page content).

## Open Questions

Things that couldn't be fully resolved:

1. **Privacy Policy Content**
   - What we know: A `/privacy` route is needed (footer links to it, email
     consent text references it). LEGAL-02 and LEGAL-03 are in scope.
   - What's unclear: The exact privacy policy content is not specified in
     CONTEXT.md. It needs GDPR-compliant language about email collection,
     PostHog analytics, and cookie usage.
   - Recommendation: Create a minimal privacy policy page with placeholder
     content that can be filled in. The page itself is a simple static Server
     Component with text.

2. **Email Consent Text Wording**
   - What we know: CONTEXT.md says "Small privacy consent text below form (no
     checkbox) -- friendly tone, mentions privacy policy link". The exact
     wording is at Claude's discretion.
   - What's unclear: Whether "no checkbox" satisfies GDPR's consent
     requirements. The PROJECT.md requires GDPR/CAN-SPAM compliance.
   - Recommendation: The consent text approach (implied consent by submitting
     the form + clear disclosure) is common for newsletter signups and is
     generally acceptable when combined with double opt-in (which is already
     implemented). The text should clearly state what the user is signing up for
     and link to the privacy policy. Example: "By subscribing, you agree to
     receive our newsletter. Unsubscribe anytime. Privacy policy."

3. **Existing Header/Layout for Other Routes**
   - What we know: The landing page removes the header, but other routes
     (dashboard, AI chat) still need it.
   - What's unclear: Whether route groups will require moving existing pages
     or just restructuring layouts.
   - Recommendation: Use Next.js route groups. The landing page goes in
     `(landing)/` with a minimal layout. Other routes go in `(app)/` with the
     existing header layout. Root layout keeps shared concerns (fonts, Providers,
     CookieConsentBanner).

## Sources

### Primary (HIGH confidence)

- **Existing codebase** -- Direct file reads of all relevant source files:
  - `apps/web/src/app/page.tsx` (current home page to replace)
  - `apps/web/src/app/layout.tsx` (current layout with Header)
  - `apps/web/src/components/sign-in-form.tsx` (@tanstack/react-form pattern)
  - `apps/web/src/components/cookie-consent.tsx` (CookieSettingsButton)
  - `apps/web/src/trpc/client.ts` (createTRPCOptionsProxy setup)
  - `packages/api/src/routers/subscriber.ts` (tRPC mutation)
  - `apps/web/src/lib/analytics.ts` (event constants)
  - `apps/web/src/index.css` (Tailwind/shadcn CSS variables)
  - `apps/web/src/components/ui/button.tsx` and `input.tsx` (shadcn primitives)

- **tRPC v11 Official Docs** -- [useMutation docs](https://trpc.io/docs/client/react/useMutation),
  [TanStack React Query integration](https://trpc.io/docs/client/tanstack-react-query/setup)

- **Tailwind CSS v4 Colors** -- [Official color docs](https://tailwindcss.com/docs/colors),
  [Emerald OKLCH palette](https://tailwindcolor.com/emerald)

### Secondary (MEDIUM confidence)

- **polar.sh** -- WebFetch visual analysis: dark-mode-first design, Geist font
  family, modular card layout, dark buttons with transitions
- **Font pairing research** -- Multiple sources recommend DM Serif Display +
  sans-serif for modern premium feel:
  [Typewolf 2026](https://www.typewolf.com/google-fonts),
  [LandingPageFlow](https://www.landingpageflow.com/post/google-font-pairings-for-websites)

### Tertiary (LOW confidence)

- **Dark landing page design patterns** -- WebSearch results for general best
  practices; findings verified against project's actual Tailwind v4 setup

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- everything already installed and verified in codebase
- Architecture: HIGH -- route groups and component patterns are standard Next.js
- Pitfalls: HIGH -- verified against actual codebase code
- Typography: MEDIUM -- font pairing is subjective; recommendation based on
  design research and polar.sh reference
- Color strategy: HIGH -- Tailwind's built-in emerald palette verified

**Research date:** 2026-01-29
**Valid until:** 2026-03-01 (stable; no fast-moving dependencies)
