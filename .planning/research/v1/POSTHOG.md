# Posthog Research

**Researched:** 2026-01-24
**Overall Confidence:** HIGH (verified via official documentation and search)

## Summary

PostHog is the recommended analytics solution for Gemhog V1. It provides a
generous free tier (1M events/month), native Next.js App Router support with
automatic pageview tracking, and built-in GDPR compliance via `cookieless_mode:
'on_reject'`. For a serverless SST deployment on AWS, PostHog Cloud is strongly
preferred over self-hosting due to zero infrastructure burden and access to all
features. The key integration points are: client-side provider for the landing
page, cookie consent banner with delayed tracking, and event capture for email
signup conversion funnel.

## Next.js App Router Setup

### Installation

```bash
pnpm add posthog-js
```

For server-side usage (optional, for API routes):

```bash
pnpm add posthog-node
```

### Environment Variables

Add to `.env.local` (and SST secrets):

```bash
NEXT_PUBLIC_POSTHOG_KEY=phc_XXX
NEXT_PUBLIC_POSTHOG_HOST=https://eu.i.posthog.com  # EU for GDPR
```

Note: These values must start with `NEXT_PUBLIC_` for client-side access.

### Option A: Modern Setup (Next.js 15.3+, Recommended)

Next.js 15.3+ supports `instrumentation-client.ts` for lightweight initialization:

```typescript
// instrumentation-client.ts (root of app)
import posthog from "posthog-js";

posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
  api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST,
  defaults: "2025-11-30", // Use latest defaults
  cookieless_mode: "on_reject", // GDPR: no cookies until consent
  person_profiles: "identified_only", // Cost optimization
});
```

The `defaults: '2025-11-30'` setting enables:

- `capture_pageview: 'history_change'` - Automatic SPA pageview tracking
- `capture_pageleave: 'if_capture_pageview'` - Automatic pageleave events
- `rageclick: { content_ignorelist: true }` - Filtered rage click detection

### Option B: Provider Pattern (Works with all Next.js versions)

```typescript
// app/providers/posthog.tsx
"use client";
import posthog from "posthog-js";
import { PostHogProvider as PHProvider } from "posthog-js/react";
import { useEffect } from "react";

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
      api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST,
      defaults: "2025-11-30",
      cookieless_mode: "on_reject",
      person_profiles: "identified_only",
    });
  }, []);

  return <PHProvider client={posthog}>{children}</PHProvider>;
}
```

```typescript
// app/layout.tsx
import { PostHogProvider } from "./providers/posthog";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <PostHogProvider>{children}</PostHogProvider>
      </body>
    </html>
  );
}
```

The provider approach is recommended for Gemhog because:

1. Gives access to `usePostHog()` hook in components
2. Server components inside the provider tree remain server components
3. Easier to conditionally enable/disable based on environment

### Important: No Manual Pageview Capture Needed

With `defaults: '2025-11-30'`, PostHog automatically tracks:

- `$pageview` events on route changes (SPA navigation)
- `$pageleave` events when users leave pages

The old pattern of creating a `PostHogPageView` component with
`usePathname`/`useSearchParams` is **no longer recommended**.

## Cookie Consent Integration

### The Challenge

GDPR requires explicit consent before storing cookies or tracking personal data.
PostHog's `cookieless_mode: 'on_reject'` solves this:

- No cookies or localStorage until user consents
- No events captured until consent decision is made
- If consent denied, PostHog still counts users via privacy-preserving hash

### Cookie Consent Banner Component

```typescript
// components/cookie-banner.tsx
"use client";
import { useEffect, useState } from "react";
import posthog from "posthog-js";

export function CookieBanner() {
  const [consentStatus, setConsentStatus] = useState<
    "pending" | "granted" | "denied" | null
  >(null);

  useEffect(() => {
    // Check consent status after PostHog initializes
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

  // Don't render until we know the status
  if (consentStatus !== "pending") {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 bg-background border rounded-lg shadow-lg p-4 z-50">
      <p className="text-sm text-muted-foreground mb-4">
        We use analytics cookies to understand how you use our site and improve
        your experience.
      </p>
      <div className="flex gap-2">
        <button
          onClick={handleDecline}
          className="flex-1 px-4 py-2 text-sm border rounded-md hover:bg-muted"
        >
          Decline
        </button>
        <button
          onClick={handleAccept}
          className="flex-1 px-4 py-2 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
        >
          Accept
        </button>
      </div>
    </div>
  );
}
```

### Consent API Methods

| Method                              | Purpose                          |
| ----------------------------------- | -------------------------------- |
| `posthog.get_explicit_consent_status()` | Returns 'pending', 'granted', or 'denied' |
| `posthog.opt_in_capturing()`        | Enable tracking, set cookies     |
| `posthog.opt_out_capturing()`       | Disable tracking, cookieless mode |
| `posthog.has_opted_out_capturing()` | Check if user opted out          |
| `posthog.has_opted_in_capturing()`  | Check if user opted in           |

### How Consent Affects Tracking

| Consent Status | Cookies | Events Captured | User Counting |
| -------------- | ------- | --------------- | ------------- |
| Pending        | No      | No              | No            |
| Granted        | Yes     | Yes (identified) | Full tracking |
| Denied         | No      | Yes (anonymous)  | Privacy-preserving hash |

**Note:** With consent denied, PostHog uses a daily hash
`hash(team_id, daily_salt, ip_address, user_agent, hostname)` to count unique
users. This means:

- Users appear as different people each day
- Weekly/monthly unique user counts are inflated
- Session replay is disabled
- But event counts remain accurate

## Event Tracking Strategy

### Landing Page Events for Gemhog V1

| Event Name | Properties | Purpose |
| ---------- | ---------- | ------- |
| `$pageview` | (auto) | Landing page visits |
| `$pageleave` | (auto) | Exit tracking |
| `email_signup_started` | `{ source: 'hero' \| 'footer' }` | Form interaction |
| `email_signup_completed` | `{ source: 'hero' \| 'footer' }` | Successful submission |
| `email_signup_failed` | `{ error: string }` | Failed submission |
| `cta_clicked` | `{ cta: string, location: string }` | CTA engagement |

### Event Naming Convention

Follow the **object_action** pattern:

- Object: What was interacted with (email_signup, cta, page)
- Action: What happened (started, completed, failed, clicked)

Properties carry the context (source, error, location).

### Example: Email Signup Tracking

```typescript
// In your email signup form component
import { usePostHog } from "posthog-js/react";

export function EmailSignupForm({ source }: { source: "hero" | "footer" }) {
  const posthog = usePostHog();

  const handleFocus = () => {
    posthog?.capture("email_signup_started", { source });
  };

  const handleSubmit = async (email: string) => {
    try {
      await submitEmail(email);
      posthog?.capture("email_signup_completed", { source });
    } catch (error) {
      posthog?.capture("email_signup_failed", {
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  };

  return (
    <form onFocus={handleFocus} onSubmit={/* ... */}>
      {/* ... */}
    </form>
  );
}
```

### Conversion Funnel Setup

In PostHog, create a funnel with these steps:

1. `$pageview` (filtered by path = '/')
2. `email_signup_started`
3. `email_signup_completed`

This measures: Landing visits -> Form engagement -> Successful signups

### UTM Tracking

PostHog automatically captures UTM parameters from URLs as event properties:

- `utm_source`
- `utm_medium`
- `utm_campaign`
- `utm_content`
- `utm_term`

No additional code needed. Use these in funnel breakdowns to see which channels
convert best.

## User Identification

### Anonymous vs Identified Events

PostHog has two event types with different costs:

| Event Type | Cost | Creates Profile | Session Replay |
| ---------- | ---- | --------------- | -------------- |
| Anonymous  | 1x   | No              | Limited        |
| Identified | ~4x  | Yes             | Full           |

For a landing page with email signup, the recommended approach:

1. **Before signup:** Anonymous events (pageviews, CTA clicks)
2. **After signup:** Identify user, then events are identified

### Identification Flow

```typescript
// When user submits email (becomes a known lead)
import posthog from "posthog-js";

async function handleEmailSignup(email: string) {
  // 1. Submit to your backend
  const result = await submitEmail(email);

  // 2. Identify the user with their email as distinct_id
  posthog.identify(email, {
    email: email,
    signup_date: new Date().toISOString(),
  });

  // 3. All future events are now linked to this person
  posthog.capture("email_signup_completed", { source: "hero" });
}
```

### Key Identification Methods

```typescript
// Identify a user (call once when you know who they are)
posthog.identify("user-123", {
  email: "user@example.com",
  name: "John Doe",
});

// Get current distinct ID (works for anonymous users too)
const distinctId = posthog.get_distinct_id();

// Reset on logout (important for shared computers)
posthog.reset();

// Check if already identified (avoid duplicate calls)
if (!posthog._isIdentified()) {
  posthog.identify(userId);
}
```

### Cost Optimization with `person_profiles: 'identified_only'`

This setting (recommended, now default) means:

- Anonymous events don't create person profiles (cheaper)
- Only events after `identify()` create profiles
- Past anonymous events are attributed to the person but remain billed as
  anonymous

For Gemhog V1: Most visitors won't sign up, so this saves significant cost.

## Cloud vs Self-Hosted

### Recommendation: PostHog Cloud EU

For a serverless SST deployment, **PostHog Cloud** is the clear choice:

| Factor | Cloud | Self-Hosted |
| ------ | ----- | ----------- |
| Setup time | Minutes | Days |
| Infrastructure | None | PostgreSQL, ClickHouse, Redis, Kafka |
| Maintenance | None | Ongoing |
| Cost at low volume | Free | $100+/mo (compute) |
| GDPR compliance | EU region available | Your responsibility |
| All features | Yes | No (paid features cloud-only) |
| Support | Yes (paid plans) | Community only |

### Why Not Self-Host

PostHog's official position: "We've literally never seen this math work out" in
favor of self-hosting when considering DevOps time.

Self-hosting requires:

- 4 vCPU, 16GB RAM minimum
- PostgreSQL, ClickHouse, Redis, Kafka
- Ongoing security patches and upgrades
- No access to paid features (even if you pay)

### Using PostHog Cloud EU

For GDPR compliance, use the EU region:

```typescript
posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
  api_host: "https://eu.i.posthog.com", // EU region
});
```

Data is stored in Frankfurt, Germany.

## Free Tier Analysis

### What's Included (Free Forever)

| Product | Free Allowance | After Free Tier |
| ------- | -------------- | --------------- |
| Product Analytics | 1M events/month | $0.00005/event |
| Session Replay | 5,000 recordings | $0.005/recording |
| Feature Flags | 1M requests | $0.0001/request |
| Error Tracking | 100K errors | $0.00037/error |
| Surveys | 1,500 responses | $0.10/response |
| LLM Analytics | 100K events | Varies |

### Gemhog V1 Estimation

For a landing page with email signup:

| Metric | Estimate | Monthly Events |
| ------ | -------- | -------------- |
| Page visits | 10,000/month | 10,000 pageviews |
| Page leaves | 10,000/month | 10,000 pageleaves |
| Email signups | 500/month | 1,500 events (started + completed) |
| **Total** | | **~21,500 events** |

This is well within the 1M free tier. Even at 50x growth, you'd stay free.

### Cost Control Features

PostHog allows setting hard monthly spend limits per product. When you hit the
cap, PostHog stops processing that product's usage until the next cycle.

```
Settings > Billing > Set spend limit per product
```

### When You'd Need to Pay

- More than 1M events/month (unlikely for a landing page)
- Session replay (>5,000 recordings)
- Enterprise features (HIPAA compliance, advanced permissions)

## Privacy Configuration

### GDPR-Friendly Settings

```typescript
posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
  api_host: "https://eu.i.posthog.com", // EU data residency
  cookieless_mode: "on_reject", // No cookies until consent
  person_profiles: "identified_only", // Minimize personal data
  defaults: "2025-11-30",
});
```

### Privacy Options Reference

| Option | Value | Effect |
| ------ | ----- | ------ |
| `cookieless_mode` | `'always'` | Never use cookies (limited tracking) |
| `cookieless_mode` | `'on_reject'` | Cookies only after consent |
| `person_profiles` | `'identified_only'` | No profiles for anonymous users |
| `person_profiles` | `'always'` | Profiles for all users |
| `disable_session_recording` | `true` | No session recordings |
| `mask_all_text` | `true` | Mask all text in recordings |
| `mask_all_element_attributes` | `true` | Mask all attributes |

### Data Retention

Configurable in PostHog settings:

- Events: Default varies by plan
- Session Replays: 30 days (free), longer on paid plans
- Person data: Until deleted

### User Data Deletion (GDPR Right to Erasure)

In PostHog UI:

1. Search for person by email or distinct_id
2. Click "View" next to the person
3. Click "Delete person"

Note: Event data deletion happens asynchronously during off-peak times.

## SST Integration Notes

### Environment Variables in SST

```typescript
// infra/secrets.ts
export const posthogKey = new sst.Secret("PosthogKey");

// infra/web.ts
new sst.aws.Nextjs("Web", {
  environment: {
    NEXT_PUBLIC_POSTHOG_KEY: posthogKey.value,
    NEXT_PUBLIC_POSTHOG_HOST: "https://eu.i.posthog.com",
  },
});
```

### Server-Side Tracking (API Routes / tRPC)

For server-side event capture (e.g., in tRPC procedures), use `posthog-node`:

```typescript
// packages/core/analytics/posthog.ts
import { PostHog } from "posthog-node";

// Singleton for reuse across Lambda invocations
let posthogClient: PostHog | null = null;

export function getPostHog(): PostHog {
  if (!posthogClient) {
    posthogClient = new PostHog(process.env.POSTHOG_KEY!, {
      host: "https://eu.i.posthog.com",
      flushAt: 1, // Flush immediately (serverless)
      flushInterval: 0, // No batching delay
    });
  }
  return posthogClient;
}

// Usage in tRPC procedure
export async function trackServerEvent(
  distinctId: string,
  event: string,
  properties?: Record<string, unknown>
) {
  const posthog = getPostHog();
  posthog.capture({
    distinctId,
    event,
    properties,
  });
  await posthog.shutdown(); // Ensure event is sent before Lambda terminates
}
```

### Lambda Considerations

For AWS Lambda (SST's deployment target):

1. **Use `flushAt: 1` and `flushInterval: 0`** - Sends events immediately
2. **Always call `await posthog.shutdown()`** - Ensures HTTP request completes
3. **Or use `captureImmediate()`** - Guarantees event capture before function
   terminates

```typescript
// Alternative: captureImmediate (recommended for serverless)
posthog.captureImmediate({
  distinctId: "user-123",
  event: "server_event",
  properties: { foo: "bar" },
});
```

### What NOT to Do with SST

Following Gemhog's SST-agnostic constraint:

- Do NOT import PostHog from SST resources
- Do NOT use SST SDK in application code
- Read `NEXT_PUBLIC_POSTHOG_KEY` from environment variables
- Same code works locally (`.env`) and deployed (SST injects)

## Recommendations

### For Gemhog V1

1. **Use PostHog Cloud EU** - Free tier is sufficient, EU region for GDPR,
   zero infrastructure burden

2. **Initialize with these settings:**

   ```typescript
   posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
     api_host: "https://eu.i.posthog.com",
     defaults: "2025-11-30",
     cookieless_mode: "on_reject",
     person_profiles: "identified_only",
   });
   ```

3. **Implement cookie consent banner** - Required for GDPR compliance. The
   `cookieless_mode: 'on_reject'` setting makes this straightforward.

4. **Track these events minimum:**
   - `email_signup_started` (form focus)
   - `email_signup_completed` (successful submission)
   - Let PostHog handle pageviews automatically

5. **Identify users on email signup** - Call `posthog.identify(email)` after
   successful signup to link their journey

6. **Set a spending cap** - Even with the free tier, set a $0 spend limit as a
   safety net

7. **No server-side tracking needed for V1** - Landing page is client-only.
   Consider posthog-node later for backend events in V2.

### Future Considerations (V2)

- Session replay for user research (beta user onboarding)
- Feature flags for gradual rollout
- Server-side tracking for API events (thesis analysis, newsletter sends)
- Funnel analysis for conversion optimization

## Sources

### Official Documentation

- [PostHog Next.js Integration](https://posthog.com/docs/libraries/next-js) -
  Official Next.js setup guide
- [PostHog JavaScript SDK Config](https://posthog.com/docs/libraries/js/config) -
  All initialization options
- [PostHog GDPR Compliance](https://posthog.com/docs/privacy/gdpr-compliance) -
  Privacy and compliance guide
- [PostHog Pricing](https://posthog.com/pricing) - Free tier limits and costs
- [PostHog Node.js SDK](https://posthog.com/docs/libraries/node) - Server-side
  tracking

### Tutorials

- [Next.js Cookie Banner](https://posthog.com/tutorials/nextjs-cookie-banner) -
  Cookie consent implementation
- [Cookieless Tracking](https://posthog.com/tutorials/cookieless-tracking) -
  GDPR-friendly tracking modes
- [Event Tracking Guide](https://posthog.com/tutorials/event-tracking-guide) -
  Best practices for events
- [Next.js App Router Analytics](https://posthog.com/tutorials/nextjs-app-directory-analytics) -
  App Router specific setup

### Data & Identification

- [Anonymous vs Identified Events](https://posthog.com/docs/data/anonymous-vs-identified-events) -
  Cost implications
- [Identifying Users](https://posthog.com/docs/product-analytics/identify) -
  User linking guide
- [Controlling Data Collection](https://posthog.com/docs/privacy/data-collection) -
  Privacy controls

### Community & Third Party

- [PostHog Integration Guide (Reetesh Kumar)](https://reetesh.in/blog/posthog-integration-in-next.js-app-router) -
  App Router walkthrough
- [PostHog + Vercel Guide](https://vercel.com/kb/guide/posthog-nextjs-vercel-feature-flags-analytics) -
  Vercel-specific integration
