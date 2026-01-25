# Sentry Research

**Researched:** 2026-01-24 **Overall Confidence:** HIGH (official Sentry
documentation verified)

## Summary

Sentry provides comprehensive error monitoring for Next.js 16+ and Hono on AWS
Lambda via SST v3. The SDK v8+ is powered by OpenTelemetry under the hood,
providing automatic instrumentation for HTTP, database queries, and more. For
this project's constraint (5K errors/month free tier), the recommended approach
is: (1) Install `@sentry/nextjs` for the web app with low performance sampling,
(2) Use `@sentry/node` for the Hono Lambda handler, and (3) Upload source maps
via Sentry CLI in the SST autodeploy workflow.

## Next.js Setup

### Installation

```bash
# Automated wizard (recommended)
npx @sentry/wizard@latest -i nextjs

# Or manual install
pnpm add @sentry/nextjs
```

### Configuration Files

The wizard creates these files. For manual setup:

**`src/instrumentation-client.ts`** (client-side entry):

```typescript
export { onRouterTransitionStart } from "./lib/sentry/instrumentation.client";
```

**`src/lib/sentry/instrumentation.client.ts`** (client-side implementation):

```typescript
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Capture 10% of traces in production to conserve quota
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,

  // Session Replay - captures 100% of sessions with errors
  replaysSessionSampleRate: 0, // Disable background sampling (quota)
  replaysOnErrorSampleRate: 1.0, // Always capture error sessions

  integrations: [
    Sentry.replayIntegration({
      maskAllText: true,
      blockAllMedia: true,
    }),
  ],

  // Filter out noisy errors
  ignoreErrors: [
    "ResizeObserver loop",
    "Network request failed",
    /^Loading chunk .* failed/,
  ],
});

// Required for App Router page transitions
export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
```

**`src/instrumentation.ts`** (server-side entry):

```typescript
export { onRequestError, register } from "./lib/sentry/instrumentation";
```

**`src/lib/sentry/instrumentation.ts`** (server-side registration):

```typescript
import * as Sentry from "@sentry/nextjs";

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("./server.config");
  }

  if (process.env.NEXT_RUNTIME === "edge") {
    await import("./edge.config");
  }
}

// Capture server-side errors in App Router (Next.js 15+)
export const onRequestError = Sentry.captureRequestError;
```

**`src/lib/sentry/server.config.ts`**:

```typescript
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,

  // Enable sending PII (headers, IP) - adjust based on privacy requirements
  sendDefaultPii: false,
});
```

**`src/lib/sentry/edge.config.ts`**:

```typescript
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,
});
```

**`next.config.ts`**:

```typescript
import { withSentryConfig } from "@sentry/nextjs";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Your existing config
};

export default withSentryConfig(nextConfig, {
  org: "your-org",
  project: "gemhog-web",

  // Suppress logs except in CI
  silent: !process.env.CI,

  // Upload source maps (requires SENTRY_AUTH_TOKEN)
  sourcemaps: {
    deleteSourcemapsAfterUpload: true,
  },

  // Tunnel requests to avoid ad blockers
  tunnelRoute: "/monitoring",

  // Disable Vercel Cron instrumentation (not using Vercel)
  automaticVercelMonitors: false,
});
```

### Error Boundaries

**`app/global-error.tsx`** (root error boundary):

```tsx
"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html>
      <body>
        <div className="flex min-h-screen items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold">Something went wrong</h1>
            <p className="mt-2 text-gray-600">
              We've been notified and are working on a fix.
            </p>
            <button
              onClick={() => reset()}
              className="mt-4 rounded bg-blue-600 px-4 py-2 text-white"
            >
              Try again
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
```

**Route-level `error.tsx`** (per-route boundaries):

```tsx
"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <div>
      <h2>Something went wrong</h2>
      <button onClick={() => reset()}>Try again</button>
    </div>
  );
}
```

### Server Actions

Server Actions require manual wrapping:

```typescript
"use server";

import * as Sentry from "@sentry/nextjs";

export async function createProject(formData: FormData) {
  return Sentry.withServerActionInstrumentation(
    "createProject",
    { recordResponse: true },
    async () => {
      // Your server action logic
    },
  );
}
```

## Lambda/Hono Instrumentation

### Package

For Hono running on AWS Lambda via SST, use `@sentry/node` (not
`@sentry/aws-serverless` which is for direct Lambda handlers).

```bash
pnpm add @sentry/node
```

### Initialization

**`apps/server/src/instrument.ts`**:

```typescript
import * as Sentry from "@sentry/node";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.SST_STAGE || "development",

  // Low sample rate to conserve quota
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.05 : 1.0,

  // Capture errors with full context
  sendDefaultPii: false,

  // Filter common noise
  ignoreErrors: [
    // Add patterns for expected errors
  ],

  beforeSend(event) {
    // Don't send 4xx client errors (reduce quota usage)
    if (event.exception?.values?.[0]?.value?.includes("400")) {
      return null;
    }
    return event;
  },
});
```

### Hono Integration

**`apps/server/src/index.ts`**:

```typescript
// IMPORTANT: Import instrument FIRST
import "./instrument";

import { Hono } from "hono";
import * as Sentry from "@sentry/node";

const app = new Hono();

// Global error handler that reports to Sentry
app.onError((err, c) => {
  // Skip 4xx errors
  const status = "status" in err ? (err as any).status : 500;
  if (status < 400 || status >= 500) {
    Sentry.captureException(err, {
      extra: {
        path: c.req.path,
        method: c.req.method,
      },
    });
  }

  console.error(err);
  return c.json({ error: "Internal Server Error" }, 500);
});

// Add user context middleware
app.use("*", async (c, next) => {
  const user = c.get("user"); // From your auth middleware
  if (user) {
    Sentry.setUser({
      id: user.id,
      email: user.email,
    });
  }
  await next();
  Sentry.setUser(null);
});

export { app };
```

### Lambda Handler

**`apps/server/src/lambda.ts`**:

```typescript
// CRITICAL: Import instrument before anything else
import "./instrument";

import { handle, streamHandle } from "hono/aws-lambda";
import { app } from "./index";
import * as Sentry from "@sentry/node";

// Wrap the handler to ensure Sentry flushes before Lambda terminates
const handler = process.env.AWS_LAMBDA_FUNCTION_NAME
  ? async (event: any, context: any) => {
      try {
        const result = await handle(app)(event, context);
        return result;
      } catch (error) {
        Sentry.captureException(error);
        throw error;
      } finally {
        await Sentry.flush(2000);
      }
    }
  : handle(app);

export { handler };
```

## Source Maps

### Overview

Source maps are essential for readable stack traces. For serverless, upload them
to Sentry during CI/CD rather than bundling with the Lambda (affects cold
start).

### SST v3 Autodeploy Integration

Modify `sst.config.ts` autodeploy workflow:

```typescript
console: {
  autodeploy: {
    async workflow({ $, event }) {
      await $`npm install -g pnpm`;
      await $`pnpm install`;

      if (event.action === "removed") {
        await $`pnpm sst remove`;
      } else {
        // Set Sentry release to git SHA
        const release = process.env.GITHUB_SHA ||
                       (await $`git rev-parse HEAD`.text()).trim();

        await $`SENTRY_RELEASE=${release} pnpm sst deploy`;
        await $`pnpm db:migrate`;

        // Upload source maps after deploy
        await $`npx @sentry/cli releases --org your-org set-commits ${release} --auto`;

        // Upload web source maps
        await $`npx @sentry/cli sourcemaps upload \
          --org your-org \
          --project gemhog-web \
          --release ${release} \
          apps/web/.next`;

        // Upload server source maps (if generated)
        await $`npx @sentry/cli sourcemaps upload \
          --org your-org \
          --project gemhog-api \
          --release ${release} \
          apps/server/.sst/artifacts || true`;
      }
    },
  },
},
```

### Environment Variables for CI

Add to SST Console secrets or GitHub Actions:

```
SENTRY_AUTH_TOKEN=sntrys_xxx
SENTRY_ORG=your-org
```

### Alternative: withSentryConfig Auto-Upload

For Next.js, `withSentryConfig` handles source map upload automatically if
`SENTRY_AUTH_TOKEN` is set. This is the recommended approach for the web app.

## Automatic vs Manual Capture

### Automatically Captured (Next.js)

| Event Type                   | Details                     |
| ---------------------------- | --------------------------- |
| Unhandled exceptions         | Client and server JS errors |
| Unhandled promise rejections | Async errors without catch  |
| React render errors          | Via error boundaries        |
| API route errors             | Server-side exceptions      |
| Server component errors      | Via `onRequestError` hook   |
| HTTP spans                   | Incoming/outgoing requests  |
| Database queries             | Via OpenTelemetry           |
| Page transitions             | App Router navigation       |

### Automatically Captured (Hono/Lambda)

| Event Type           | Details                           |
| -------------------- | --------------------------------- |
| Unhandled exceptions | Via Sentry.init + onError         |
| HTTP requests        | Via OpenTelemetry httpIntegration |
| Fetch requests       | Via nativeNodeFetchIntegration    |

### Requires Manual Instrumentation

| Event Type            | How to Capture                             |
| --------------------- | ------------------------------------------ |
| Server Actions        | `Sentry.withServerActionInstrumentation()` |
| Caught/handled errors | `Sentry.captureException(error)`           |
| User context          | `Sentry.setUser({ id, email })`            |
| Custom spans          | `Sentry.startSpan()`                       |
| Business events       | `Sentry.captureMessage()`                  |
| Custom tags           | `Sentry.setTag()`                          |

### Manual Capture Examples

```typescript
// Capture handled errors with context
try {
  await riskyOperation();
} catch (error) {
  Sentry.captureException(error, {
    tags: { operation: "payment" },
    extra: { userId: user.id, amount },
  });
  // Handle gracefully
}

// Capture business events
Sentry.captureMessage("High-value transaction processed", {
  level: "info",
  tags: { type: "business" },
  extra: { amount: 10000 },
});

// Custom span for performance tracking
await Sentry.startSpan({ name: "ai.generate", op: "ai" }, async () => {
  await generateAIResponse(prompt);
});
```

## Performance Monitoring

### Recommendation: Enable with Low Sample Rate

Performance monitoring is worth enabling even on the free tier, but with
aggressive sampling to conserve quota.

### What It Captures

- Page load times and Web Vitals (LCP, FID, CLS)
- API response times
- Database query performance
- HTTP request durations
- Custom spans

### Configuration

```typescript
// Client: 10% sampling in production
tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,

// Server/Lambda: 5% sampling (more traffic)
tracesSampleRate: process.env.NODE_ENV === "production" ? 0.05 : 1.0,
```

### Quota Impact

Performance transactions count toward quota. With 5K errors/month:

- At 0.1 sample rate with 1000 daily requests: ~100 transactions/day = 3K/month
- Leaves 2K for actual errors
- Adjust sample rate based on traffic patterns

### Alternative: Traces Only on Errors

```typescript
Sentry.init({
  tracesSampler: ({ name, parentSampled }) => {
    // Always inherit parent sampling decision
    if (parentSampled !== undefined) return parentSampled;
    // Only sample if there's an error
    return 0;
  },
});
```

## Alert Configuration

### Recommended Initial Alerts

**1. First Error (Critical)**

- Trigger: When a new issue is first seen
- Action: Email immediately
- Purpose: Catch new bugs immediately

**2. Error Spike (High Priority)**

- Trigger: Error count > 10 in 1 hour
- Action: Slack notification
- Purpose: Detect outages/regressions

**3. High-Impact Errors**

- Trigger: Users affected > 5 in 1 hour
- Action: Slack + Email
- Purpose: Prioritize user-facing issues

**4. Production Only**

- Filter: Environment = "prod"
- Purpose: Reduce noise from dev/staging

### Configuration Steps

1. Navigate to **Alerts** > **Create Alert**
2. Select **Issue Alert**
3. Configure conditions:

```
When: A new issue is created
If: The issue is unhandled
Then: Send an email to the team
Frequency: At most once per issue
Environment: prod
```

### Slack Integration

1. Install Sentry Slack app
2. Link workspace: `/sentry link team` in desired channel
3. Add "Send Slack notification" action to alerts

### Reducing Noise

```typescript
// In Sentry.init
beforeSend(event, hint) {
  // Ignore canceled requests
  if (event.exception?.values?.[0]?.type === "AbortError") {
    return null;
  }

  // Ignore browser extension errors
  if (event.exception?.values?.[0]?.stacktrace?.frames?.some(
    frame => frame.filename?.includes("extension://")
  )) {
    return null;
  }

  return event;
}
```

## SST Integration

### Environment Variables

Add to `infra/secrets.ts`:

```typescript
export const secrets = {
  // ... existing secrets
  SentryDsn: new sst.Secret("SentryDsn"),
  SentryAuthToken: new sst.Secret("SentryAuthToken"),
};
```

Add to `infra/api.ts`:

```typescript
environment: {
  // ... existing vars
  SENTRY_DSN: secrets.SentryDsn.value,
  SST_STAGE: $app.stage,
},
```

Add to `infra/web.ts`:

```typescript
environment: {
  NEXT_PUBLIC_SENTRY_DSN: secrets.SentryDsn.value,
  SENTRY_DSN: secrets.SentryDsn.value,
  SENTRY_AUTH_TOKEN: secrets.SentryAuthToken.value,
},
```

### Set Secrets

```bash
# Development
pnpm sst secret set SentryDsn "https://xxx@xxx.ingest.sentry.io/xxx" --stage dev

# Production
pnpm sst secret set SentryDsn "https://xxx@xxx.ingest.sentry.io/xxx" --stage prod
pnpm sst secret set SentryAuthToken "sntrys_xxx" --stage prod
```

### Release Tracking

Add release info to distinguish deploys:

```typescript
Sentry.init({
  dsn: process.env.SENTRY_DSN,
  release: process.env.SENTRY_RELEASE || process.env.VERCEL_GIT_COMMIT_SHA,
  environment: process.env.SST_STAGE || "development",
});
```

## Free Tier Analysis

### What 5K Errors/Month Covers

| Scenario                     | Errors/Month | Coverage         |
| ---------------------------- | ------------ | ---------------- |
| Small app, few users         | 100-500      | Comfortable      |
| Medium app, moderate traffic | 500-2000     | OK with sampling |
| Launch/spike events          | 2000+        | May hit limit    |

### Staying Within Limits

**1. Aggressive Client-Side Filtering**

```typescript
ignoreErrors: [
  "ResizeObserver loop",
  "Network request failed",
  "Load failed",
  "ChunkLoadError",
  /^Abort/,
],
```

**2. Sample Rates**

- Errors: 100% (don't miss bugs)
- Transactions: 5-10% in production
- Replays: 0% background, 100% on error

**3. Rate Limiting in SDK**

```typescript
Sentry.init({
  maxBreadcrumbs: 50, // Reduce from default 100
  attachStacktrace: false, // Only for exceptions
});
```

**4. Inbound Filters (Sentry Dashboard)**

- Filter browser extensions
- Filter localhost errors
- Filter legacy browsers

### When You'll Hit Limits

- Major bug affecting all users: Could burn through quota in hours
- Spike protection auto-enables (drops events when baseline exceeded)
- Events are rejected with 429, not charged

### Upgrade Path

Team plan starts at $26/month for 50K errors. Consider upgrading when:

- Regularly hitting quota
- Need more than 1 user
- Want longer data retention (90 days vs 30)

## Recommendations

### Immediate Setup (Phase 1)

1. **Install Next.js SDK**: Run wizard, configure error boundaries
2. **Add to Lambda handler**: Import instrument.ts first
3. **Set low sample rates**: 10% client, 5% server
4. **Configure 2-3 alerts**: New issue, error spike, high impact

### Source Maps (Phase 2)

1. **Use withSentryConfig**: Auto-uploads for Next.js
2. **Add CLI to workflow**: For Lambda source maps
3. **Verify in dashboard**: Check stack traces are readable

### Optimization (Phase 3)

1. **Monitor quota usage**: Check weekly
2. **Tune ignoreErrors**: Add patterns for noise
3. **Adjust sample rates**: Based on traffic

### Code Checklist

- [ ] `@sentry/nextjs` installed
- [ ] `@sentry/node` in server package
- [ ] `src/instrumentation-client.ts` created
- [ ] `src/instrumentation.ts` created
- [ ] `src/lib/sentry/instrumentation.client.ts` created
- [ ] `src/lib/sentry/instrumentation.ts` created
- [ ] `src/lib/sentry/server.config.ts` created
- [ ] `src/lib/sentry/edge.config.ts` created
- [ ] `global-error.tsx` created
- [ ] Sentry DSN in SST secrets
- [ ] Source map upload in CI/CD
- [ ] Error boundaries in critical routes
- [ ] User context set in auth middleware
- [ ] Alerts configured for prod

## Sources

### Official Sentry Documentation (HIGH confidence)

- [Next.js Setup](https://docs.sentry.io/platforms/javascript/guides/nextjs/)
- [Next.js Manual Setup](https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/)
- [Hono Setup](https://docs.sentry.io/platforms/javascript/guides/hono/)
- [AWS Lambda Setup](https://docs.sentry.io/platforms/javascript/guides/aws-lambda/)
- [Source Maps](https://docs.sentry.io/platforms/javascript/sourcemaps/)
- [Quota Management](https://docs.sentry.io/pricing/quotas/)
- [Alerts Best Practices](https://docs.sentry.io/product/alerts/best-practices/)
- [React Error Boundary](https://docs.sentry.io/platforms/javascript/guides/react/features/error-boundary/)

### npm Packages

- [@sentry/nextjs](https://www.npmjs.com/package/@sentry/nextjs)
- [@sentry/node](https://www.npmjs.com/package/@sentry/node)
- [@sentry/aws-serverless](https://www.npmjs.com/package/@sentry/aws-serverless)

### SST Documentation (MEDIUM confidence)

- [SST v2 Source Maps](https://docs.sst.dev/advanced/source-maps) - v2 docs,
  patterns apply to v3

### Community Resources

- [Sentry JavaScript SDK GitHub](https://github.com/getsentry/sentry-javascript)
- [Sentry Pricing](https://sentry.io/pricing/)
