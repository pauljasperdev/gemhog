# Phase 3: Analytics - Research

**Researched:** 2026-01-28
**Domain:** PostHog analytics with GDPR-compliant cookie consent in Next.js App
Router
**Confidence:** HIGH

## Summary

PostHog provides a mature, well-documented JavaScript SDK (`posthog-js`) with
built-in consent management that maps directly to this phase's requirements. The
SDK offers `cookieless_mode: 'on_reject'` which ensures zero tracking before user
consent, `get_explicit_consent_status()` for banner visibility control, and
`opt_in_capturing()` / `opt_out_capturing()` for consent actions. Combined with
the `defaults: '2025-11-30'` configuration, PostHog automatically handles SPA
pageview tracking via the browser history API, eliminating the need for manual
`$pageview` capture components.

The existing codebase already uses `instrumentation-client.ts` for Sentry. This
is the same file PostHog recommends for initialization in Next.js 15.3+. Both
SDKs coexist in the same file without conflict. The project also already has the
env var pattern (t3-env with local-dev defaults), SST secret injection, and
Next.js rewrites support needed for PostHog integration.

**Primary recommendation:** Use `posthog-js` with `cookieless_mode: 'on_reject'`
and `defaults: '2025-11-30'`. Initialize in `instrumentation-client.ts` alongside
Sentry. Build a simple consent banner component. Use Next.js rewrites as a
reverse proxy to avoid ad blockers.

## Standard Stack

### Core

| Library      | Version  | Purpose                            | Why Standard                                                  |
| ------------ | -------- | ---------------------------------- | ------------------------------------------------------------- |
| `posthog-js` | ^1.335.x | Analytics SDK (browser)            | PostHog's official JS SDK with consent management built in    |

### Supporting

| Library | Version | Purpose          | When to Use |
| ------- | ------- | ---------------- | ----------- |
| None    | -       | -                | -           |

No additional libraries needed. `posthog-js` includes the React provider
(`posthog-js/react`), consent management, autocapture, and custom event
capture. No `posthog-node` needed (frontend-only per CONTEXT.md decision).

### Alternatives Considered

| Instead of            | Could Use                   | Tradeoff                                                             |
| --------------------- | --------------------------- | -------------------------------------------------------------------- |
| `posthog-js` built-in consent | Third-party cookie consent lib (e.g., `cookie-consent-banner`) | Unnecessary complexity for single-tool consent. PostHog handles it natively. |
| Next.js rewrites proxy | Direct PostHog API host     | Direct calls get blocked by ad blockers. Rewrites are a one-config solution. |
| `cookieless_mode: 'on_reject'` | `opt_out_capturing_by_default: true` | `on_reject` is newer and more comprehensive: handles cookie-free counting of declined users via server-side hash. |

**Installation:**

```bash
pnpm add posthog-js --filter web
```

## Architecture Patterns

### Recommended Project Structure

```
apps/web/src/
├── instrumentation-client.ts    # EXISTING: Add PostHog init alongside Sentry
├── lib/
│   └── posthog/
│       └── index.ts             # PostHog helpers (consent check utility)
├── components/
│   ├── providers.tsx            # EXISTING: Add PostHogProvider wrapper
│   └── cookie-consent-banner.tsx # New: consent banner component
├── app/
│   ├── page.tsx                 # Landing page: fire landing_page_viewed event
│   └── verify/
│       └── page.tsx             # EXISTING: fire signup_completed on success
packages/env/src/
├── web.ts                       # EXISTING: Add NEXT_PUBLIC_POSTHOG_KEY, NEXT_PUBLIC_POSTHOG_HOST
├── web.test.ts                  # EXISTING: Add env var tests
└── local-dev.ts                 # EXISTING: Add local-dev defaults
infra/
├── secrets.ts                   # EXISTING: Add PosthogKey secret
└── web.ts                       # EXISTING: Add NEXT_PUBLIC_POSTHOG_KEY env var
apps/web/next.config.ts          # EXISTING: Add rewrites for PostHog proxy
```

### Pattern 1: Initialization via `instrumentation-client.ts`

**What:** Initialize PostHog in the same `instrumentation-client.ts` file that
already initializes Sentry. Both SDKs are independent and do not conflict.

**When to use:** Next.js 15.3+ (this project uses Next.js 16.1.1).

**Key configuration:**

```typescript
// apps/web/src/instrumentation-client.ts (EXTEND existing file)
import posthog from "posthog-js";

// PostHog is optional - skip if not configured (local dev)
if (process.env.NEXT_PUBLIC_POSTHOG_KEY) {
  posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY, {
    api_host: "/ph",              // Reverse proxy path (see next.config.ts rewrites)
    ui_host: "https://us.posthog.com",
    defaults: "2025-11-30",       // Modern defaults: history_change pageviews, pageleave
    cookieless_mode: "on_reject", // No cookies until explicit consent
    capture_pageview: "history_change", // Explicit for clarity (same as defaults)
    capture_pageleave: true,
    autocapture: true,
    disable_session_recording: true, // No session replays per CONTEXT.md
    advanced_disable_feature_flags: true, // Not using feature flags
  });
}
```

**Source:** PostHog Next.js docs (https://posthog.com/docs/libraries/next-js),
PostHog JS config docs (https://posthog.com/docs/libraries/js/config)

### Pattern 2: PostHogProvider in React Tree

**What:** Wrap the app in PostHog's React provider so `usePostHog()` hook is
available in all client components. The existing `Providers` component
already wraps the app.

**When to use:** When components need to call `posthog.capture()` or check
consent status.

**Example:**

```typescript
// apps/web/src/components/providers.tsx (EXTEND existing)
import { PostHogProvider } from "posthog-js/react";
import posthog from "posthog-js";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider ...>
      <PostHogProvider client={posthog}>
        <QueryClientProvider client={queryClient}>
          {children}
          <ReactQueryDevtools />
        </QueryClientProvider>
        <CookieConsentBanner />
      </PostHogProvider>
      <Toaster richColors />
    </ThemeProvider>
  );
}
```

**Source:** PostHog Next.js docs (https://posthog.com/docs/libraries/next-js)

### Pattern 3: Consent Banner with `get_explicit_consent_status()`

**What:** A client component that checks PostHog's consent state and shows a
banner when `pending`. Uses `opt_in_capturing()` / `opt_out_capturing()` for
user actions.

**When to use:** On every page load until user makes a choice.

**Key API:**

```typescript
// Check if banner should show
const status = posthog.get_explicit_consent_status();
// Returns: 'pending' | 'granted' | 'denied'

// User accepts
posthog.opt_in_capturing();

// User declines
posthog.opt_out_capturing();
```

**Source:** PostHog cookie consent tutorial
(https://posthog.com/tutorials/nextjs-cookie-banner), PostHog data collection
docs (https://posthog.com/docs/privacy/data-collection)

### Pattern 4: Custom Event Capture for Signup Funnel

**What:** Use `posthog.capture()` with custom event names and properties for the
three-step funnel.

**When to use:** At specific user interaction points.

**Example:**

```typescript
import posthog from "posthog-js";

// Landing page viewed (fire on landing page mount)
posthog.capture("landing_page_viewed", {
  referrer: document.referrer,
});

// Signup started (fire on email form submission)
posthog.capture("signup_started", {
  referrer: document.referrer,
});

// Signup completed (fire on verify page success)
posthog.capture("signup_completed", {
  referrer: document.referrer,
});
```

**Note:** UTM parameters are automatically captured by PostHog's autocapture
from the URL query string. No manual extraction needed.

**Source:** PostHog custom events docs
(https://posthog.com/docs/product-analytics/capture-events)

### Pattern 5: Reverse Proxy via Next.js Rewrites

**What:** Route PostHog API requests through Next.js rewrites so they appear as
same-origin requests, avoiding ad blocker interference.

**When to use:** Always in production.

**Example:**

```typescript
// apps/web/next.config.ts (EXTEND existing)
const nextConfig: NextConfig = {
  // ... existing config
  skipTrailingSlashRedirect: true, // Required for PostHog API trailing slashes
  async rewrites() {
    return [
      {
        source: "/ph/static/:path*",
        destination: "https://us-assets.i.posthog.com/static/:path*",
      },
      {
        source: "/ph/:path*",
        destination: "https://us.i.posthog.com/:path*",
      },
    ];
  },
};
```

**Important:** Do NOT use `/ingest`, `/analytics`, `/tracking`, or `/posthog` as
the proxy path. These are commonly blocked by filter lists. Use something
non-obvious like `/ph` or a random path.

**Source:** PostHog Next.js rewrites docs
(https://posthog.com/docs/advanced/proxy/nextjs)

### Anti-Patterns to Avoid

- **Calling `posthog.identify()`:** Per CONTEXT.md, all visitors are anonymous.
  Never call identify -- it would attach PII to analytics.
- **Manual `$pageview` capture component:** The old pattern of using
  `usePathname()` + `useSearchParams()` to manually fire `$pageview` events is
  deprecated. Use `capture_pageview: 'history_change'` (or `defaults:
  '2025-11-30'`) instead.
- **Using `opt_out_capturing_by_default`:** This is the older API. Use
  `cookieless_mode: 'on_reject'` instead, which provides better behavior:
  cookieless users can still be counted via a privacy-preserving server-side
  hash.
- **Using `has_opted_in_capturing()` to check banner state:** This method had a
  breaking change in PR #1176 that made `isOptedIn` return `true` when no
  preference was set. Use `get_explicit_consent_status()` instead.
- **Setting `persistence: 'cookie'`:** The default `'localStorage+cookie'` is
  correct and handles migration automatically.
- **Importing `posthog-node`:** Per CONTEXT.md decision, this is frontend-only.
  No server-side PostHog SDK.

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
| --- | --- | --- | --- |
| Cookie consent state management | Custom cookie read/write + React state | `posthog.get_explicit_consent_status()` + `opt_in/out_capturing()` | PostHog persists consent state automatically in localStorage, handles edge cases around consent revocation |
| SPA pageview tracking | Manual `usePathname()` + `posthog.capture('$pageview')` | `capture_pageview: 'history_change'` config | Built into SDK, handles pushState/replaceState, captures `$pageleave` with duration/scroll depth automatically |
| Ad blocker evasion | Custom API proxy server | Next.js `rewrites()` in next.config.ts | One config change, runs at the edge, no additional infrastructure |
| UTM parameter capture | Manual URL parsing for utm_source etc. | PostHog autocapture | SDK automatically reads UTM params from URL and attaches to events |
| Cookie consent cookie | Manual `document.cookie` management | PostHog SDK internal persistence | SDK handles its own consent cookie lifecycle |

**Key insight:** PostHog's SDK handles consent, persistence, and pageview
tracking internally. The only custom code needed is: (1) the banner UI
component, (2) three `posthog.capture()` calls for the funnel events, and (3)
the env/config wiring.

## Common Pitfalls

### Pitfall 1: Tracking Before Consent

**What goes wrong:** PostHog fires autocapture events before the user has
accepted cookies, violating GDPR.

**Why it happens:** Default PostHog behavior is to start tracking immediately on
init. Without `cookieless_mode: 'on_reject'`, the SDK sets cookies and captures
events before any consent check.

**How to avoid:** Set `cookieless_mode: 'on_reject'` in the init config. This
ensures no cookies are stored and no personal data is captured until the user
explicitly opts in via `posthog.opt_in_capturing()`.

**Warning signs:** Events appearing in PostHog dashboard from users who never
saw or interacted with the consent banner.

### Pitfall 2: Using Wrong Consent Check Method

**What goes wrong:** Cookie banner never shows, or always shows.

**Why it happens:** `has_opted_in_capturing()` changed behavior in PostHog PR
#1176. It now returns `true` when no preference is set (because `isOptedIn` is
the inverse of `isOptedOut`, and `isOptedOut` defaults to `false`).

**How to avoid:** Use `get_explicit_consent_status()` which returns `'pending'`,
`'granted'`, or `'denied'`. Only these three states, unambiguous.

**Warning signs:** Console logs showing `has_opted_in_capturing() === true` for
a first-time visitor who hasn't interacted with the banner.

### Pitfall 3: PostHog Requests Blocked by Ad Blockers

**What goes wrong:** No analytics data appears for significant portion of users.

**Why it happens:** Ad blockers filter requests to `us.i.posthog.com` and
similar domains.

**How to avoid:** Set up Next.js rewrites as a reverse proxy. Use `api_host:
"/ph"` (non-obvious path) and rewrite to PostHog's servers. Set `ui_host` to
`https://us.posthog.com` so toolbar features still work.

**Warning signs:** Analytics data only appears from mobile browsers or users
without ad blockers.

### Pitfall 4: Missing `skipTrailingSlashRedirect`

**What goes wrong:** PostHog API requests fail silently. Events are not captured.

**Why it happens:** PostHog's API endpoints use trailing slashes (e.g., `/e/`).
Next.js redirects trailing-slash URLs by default, which breaks POST requests to
PostHog.

**How to avoid:** Set `skipTrailingSlashRedirect: true` in `next.config.ts`.

**Warning signs:** Network tab shows 308 redirects on PostHog API calls. No
events in PostHog dashboard.

### Pitfall 5: Double Pageview Capture

**What goes wrong:** Every page navigation fires two `$pageview` events.

**Why it happens:** Using `capture_pageview: true` (or default) alongside a
manual `PostHogPageView` component, or using `capture_pageview: true` with
`defaults: '2025-11-30'` which already sets it to `'history_change'`.

**How to avoid:** Use `defaults: '2025-11-30'` (or explicitly set
`capture_pageview: 'history_change'`) and do NOT add a manual pageview capture
component.

**Warning signs:** Pageview counts are roughly 2x expected. Funnel conversion
rates appear halved.

### Pitfall 6: Forgetting Local Dev Defaults

**What goes wrong:** `pnpm dev:web` fails or Sentry/PostHog env validation
errors in local development.

**Why it happens:** New env vars added to `packages/env/src/web.ts` schema but
not to `local-dev.ts`. The guardrail tests catch this in CI, but the dev
experience breaks immediately.

**How to avoid:** When adding `NEXT_PUBLIC_POSTHOG_KEY` and
`NEXT_PUBLIC_POSTHOG_HOST` to the env schema, also add placeholder values to
`localDevWebEnv` in `packages/env/src/local-dev.ts`. Make both optional in the
schema (like Sentry DSN) so local dev works without a real PostHog project.

**Warning signs:** `pnpm dev:web` throws env validation error.

## Code Examples

Verified patterns from official sources:

### PostHog Init (instrumentation-client.ts)

```typescript
// Source: https://posthog.com/docs/libraries/next-js
// Source: https://posthog.com/tutorials/nextjs-cookie-banner
import posthog from "posthog-js";

if (process.env.NEXT_PUBLIC_POSTHOG_KEY) {
  posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY, {
    api_host: "/ph",
    ui_host: "https://us.posthog.com",
    defaults: "2025-11-30",
    cookieless_mode: "on_reject",
    disable_session_recording: true,
    advanced_disable_feature_flags: true,
  });
}
```

### Cookie Consent Banner Component

```typescript
// Source: https://posthog.com/tutorials/nextjs-cookie-banner
// Source: https://github.com/PostHog/posthog.com/blob/master/contents/tutorials/nextjs-cookie-banner.md
"use client";
import { useEffect, useState } from "react";
import posthog from "posthog-js";

export function CookieConsentBanner() {
  const [consentStatus, setConsentStatus] = useState("");

  useEffect(() => {
    setConsentStatus(posthog.get_explicit_consent_status());
  }, []);

  const handleAccept = () => {
    posthog.opt_in_capturing();
    setConsentStatus("granted");
  };

  const handleDecline = () => {
    posthog.opt_out_capturing();
    setConsentStatus("denied");
  };

  if (consentStatus !== "pending") return null;

  return (
    <div className="fixed bottom-4 left-4 z-50 ...">
      <p>Would you like a cookie?</p>
      <button onClick={handleAccept}>Yes please</button>
      <button onClick={handleDecline}>No thanks</button>
    </div>
  );
}
```

### Custom Funnel Event Capture

```typescript
// Source: https://posthog.com/docs/product-analytics/capture-events
import posthog from "posthog-js";

// Landing page viewed
posthog.capture("landing_page_viewed", {
  referrer: document.referrer,
});

// Signup started (on form submission)
posthog.capture("signup_started", {
  referrer: document.referrer,
});

// Signup completed (on verify success page load)
posthog.capture("signup_completed", {
  referrer: document.referrer,
});
```

### Next.js Rewrites Configuration

```typescript
// Source: https://posthog.com/docs/advanced/proxy/nextjs
const nextConfig: NextConfig = {
  skipTrailingSlashRedirect: true,
  async rewrites() {
    return [
      {
        source: "/ph/static/:path*",
        destination: "https://us-assets.i.posthog.com/static/:path*",
      },
      {
        source: "/ph/:path*",
        destination: "https://us.i.posthog.com/:path*",
      },
    ];
  },
};
```

### Resetting Consent (Footer Link)

```typescript
// Source: https://posthog.com/docs/privacy/data-collection
"use client";
import posthog from "posthog-js";

// Re-show the consent banner by clearing stored preference
function resetConsent() {
  // opt_out resets consent state, banner will show again as 'pending'
  posthog.opt_out_capturing();
  // Reload to show banner fresh
  window.location.reload();
}

// Footer link
<button onClick={resetConsent}>Cookie Settings</button>
```

### Env Var Setup

```typescript
// packages/env/src/web.ts - add to existing schema
NEXT_PUBLIC_POSTHOG_KEY: z.string().optional(),
NEXT_PUBLIC_POSTHOG_HOST: z.string().optional(),

// packages/env/src/local-dev.ts - add to localDevWebEnv
NEXT_PUBLIC_POSTHOG_KEY: "XXXXXX",
NEXT_PUBLIC_POSTHOG_HOST: "http://localhost:3001/ph",

// infra/secrets.ts - add secret
PosthogKey: new sst.Secret("PosthogKey"),

// infra/web.ts - add to environment
NEXT_PUBLIC_POSTHOG_KEY: secrets.PosthogKey.value,
NEXT_PUBLIC_POSTHOG_HOST: $dev ? "http://localhost:3001/ph" : `https://${domain}/ph`,
```

## State of the Art

| Old Approach                           | Current Approach                                  | When Changed         | Impact                                                                 |
| -------------------------------------- | ------------------------------------------------- | -------------------- | ---------------------------------------------------------------------- |
| `capture_pageview: true`               | `capture_pageview: 'history_change'`              | posthog-js 2025-05   | Automatic SPA navigation tracking, no manual component needed          |
| Manual `PostHogPageView` component     | `defaults: '2025-11-30'`                          | posthog-js 2025-05   | Eliminates boilerplate; handles pageview + pageleave automatically     |
| `opt_out_capturing_by_default: true`   | `cookieless_mode: 'on_reject'`                    | posthog-js 2025      | Better GDPR: still counts declined users via privacy-preserving hash   |
| `has_opted_in_capturing()` for banners | `get_explicit_consent_status()`                   | posthog-js PR #1176  | Returns `'pending'`/`'granted'`/`'denied'` -- unambiguous consent state |
| Provider-based init                    | `instrumentation-client.ts` init                  | Next.js 15.3         | Simpler, runs once at app boot, coexists with Sentry                   |

**Deprecated/outdated:**

- `capture_pageview: false` + manual pageview component: No longer recommended.
  Use `'history_change'` or `defaults` date.
- `opt_out_capturing_by_default`: Superseded by `cookieless_mode: 'on_reject'`.
- `has_opted_in_capturing()` / `has_opted_out_capturing()`: Ambiguous after PR
  #1176. Use `get_explicit_consent_status()`.

## Open Questions

1. **PostHog API host region**
   - What we know: PostHog offers US (`us.i.posthog.com`) and EU
     (`eu.i.posthog.com`) cloud regions. EU is recommended for GDPR if users
     are primarily European.
   - What's unclear: Which region the PostHog project will use. This affects
     the rewrite destinations in `next.config.ts`.
   - Recommendation: Default to US cloud. Switch to EU if project is created
     on EU cloud. The rewrite config is the only place this matters.

2. **Cookie consent re-prompt strategy**
   - What we know: CONTEXT.md says "declined choice stays dismissed until cookie
     expires." `posthog.opt_out_capturing()` persists the declined state in
     localStorage.
   - What's unclear: Exact expiry behavior of PostHog's consent persistence.
     localStorage does not expire naturally (unlike cookies).
   - Recommendation: The footer "Cookie Settings" link handles re-consent. No
     auto-re-prompt needed. PostHog's localStorage persistence means the choice
     persists indefinitely unless the user clears storage or clicks "Cookie
     Settings."

3. **`signup_completed` on server-rendered verify page**
   - What we know: The verify page (`/verify`) is a server component. PostHog
     captures happen client-side only.
   - What's unclear: How to fire `signup_completed` from a server-rendered page
     where the success state is determined server-side.
   - Recommendation: Add a small client component (`VerifyAnalytics`) that
     receives the verification status as a prop and fires the event on mount
     when status is `"success"`. This keeps the page server-rendered while
     allowing client-side event capture.

## Sources

### Primary (HIGH confidence)

- PostHog Next.js docs - https://posthog.com/docs/libraries/next-js - Setup
  patterns, provider, instrumentation-client
- PostHog JS config docs - https://posthog.com/docs/libraries/js/config -
  `defaults`, `capture_pageview`, `cookieless_mode` options
- PostHog Next.js cookie banner tutorial (GitHub source) -
  https://github.com/PostHog/posthog.com/blob/master/contents/tutorials/nextjs-cookie-banner.md
  - Complete consent banner implementation with `cookieless_mode: 'on_reject'`
  and `get_explicit_consent_status()`
- PostHog GDPR compliance docs - https://posthog.com/docs/privacy/gdpr-compliance
  - GDPR requirements, consent methods
- PostHog data collection docs -
  https://posthog.com/docs/privacy/data-collection - `opt_in_capturing`,
  `opt_out_capturing`, `get_explicit_consent_status` API
- PostHog Next.js rewrites proxy docs -
  https://posthog.com/docs/advanced/proxy/nextjs - Reverse proxy configuration,
  `skipTrailingSlashRedirect`
- PostHog custom events docs -
  https://posthog.com/docs/product-analytics/capture-events - `posthog.capture()`
  API
- PostHog autocapture docs -
  https://posthog.com/docs/product-analytics/autocapture - What autocapture
  captures, UTM handling
- posthog-js GitHub releases -
  https://github.com/PostHog/posthog-js/releases - Version 1.335.5 confirmed
  (2026-01-27)
- posthog-js source code (defaults) -
  https://github.com/PostHog/posthog-js/blob/main/packages/browser/src/posthog-core.ts
  - `defaults` date-gated config values verified

### Secondary (MEDIUM confidence)

- PostHog + Sentry coexistence in instrumentation-client.ts - Multiple sources
  confirm both SDKs can be initialized in the same file without conflict
  (https://posthog.com/docs/libraries/next-js,
  https://docs.sentry.io/platforms/javascript/guides/nextjs/)
- PostHog SPA pageview tracking tutorial -
  https://posthog.com/tutorials/single-page-app-pageviews - Confirms
  `history_change` is the modern approach

### Tertiary (LOW confidence)

- None. All findings verified against official PostHog documentation.

## Metadata

**Confidence breakdown:**

- Standard stack: HIGH - Single library (`posthog-js`), well-documented, version
  confirmed on npm
- Architecture: HIGH - Patterns verified against official PostHog docs and
  existing codebase structure
- Pitfalls: HIGH - Consent method gotcha (PR #1176) verified against GitHub
  issue, proxy requirements verified against official docs

**Research date:** 2026-01-28
**Valid until:** 2026-02-28 (stable SDK, major patterns unlikely to change)
