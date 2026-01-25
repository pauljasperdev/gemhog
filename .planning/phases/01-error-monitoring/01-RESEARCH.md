# Phase 1: Error Monitoring - Research

**Researched:** 2026-01-25
**Domain:** Sentry integration for Next.js App Router with SST deployment
**Confidence:** HIGH

## Summary

Sentry provides a mature, well-documented SDK (`@sentry/nextjs`) specifically designed for Next.js applications. The latest version (10.36.0) fully supports Next.js 16, React 19, and the App Router architecture. The SDK handles both client-side and server-side error capture through a unified configuration approach using `instrumentation.ts` and `instrumentation-client.ts` files.

The standard approach is to use the Sentry wizard for initial setup, which creates all necessary configuration files. Source maps are uploaded automatically during `next build` when the auth token is configured. For SST deployments, source maps upload happens during the build phase via the `withSentryConfig` wrapper in `next.config.ts`.

**Primary recommendation:** Use `@sentry/nextjs` v10.36+ with the official wizard setup, configure session ID tagging via `setTag`, and implement section-level error boundaries using `Sentry.ErrorBoundary` component with custom fallback UIs.

## Standard Stack

The established libraries/tools for this domain:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| @sentry/nextjs | ^10.36.0 | Full Sentry integration for Next.js | Official SDK, supports App Router, RSC, Next.js 16, React 19 |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| (included) | - | Source map upload | Bundled with @sentry/nextjs via withSentryConfig |
| (included) | - | Error boundaries | Sentry.ErrorBoundary component in SDK |
| (included) | - | Third-party filter | thirdPartyErrorFilterIntegration in SDK |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| @sentry/nextjs | Manual @sentry/browser + @sentry/node | More control but significant setup complexity; not recommended |
| Sentry | LogRocket, Bugsnag | Different feature sets; Sentry is industry standard for error monitoring |

**Installation:**
```bash
npx @sentry/wizard@latest -i nextjs
```

Or manual installation:
```bash
pnpm add @sentry/nextjs
```

## Architecture Patterns

### Recommended Project Structure
```
apps/web/
├── instrumentation.ts           # Server/edge SDK registration
├── instrumentation-client.ts    # Client SDK initialization
├── sentry.server.config.ts      # Server-side Sentry config
├── sentry.edge.config.ts        # Edge runtime Sentry config
├── next.config.ts               # Wrapped with withSentryConfig
└── src/app/
    ├── global-error.tsx         # Root layout error boundary
    ├── error.tsx                # App-level error boundary
    ├── layout.tsx               # Root layout
    └── (routes)/
        └── error.tsx            # Route-specific error boundaries
```

### Pattern 1: Client Configuration with Session ID
**What:** Initialize Sentry on client with session ID tagging (not user ID for privacy)
**When to use:** Always on client-side initialization
**Example:**
```typescript
// instrumentation-client.ts
// Source: https://docs.sentry.io/platforms/javascript/guides/nextjs/
import * as Sentry from "@sentry/nextjs";

// Generate or retrieve session ID (e.g., from localStorage)
const getSessionId = () => {
  if (typeof window === "undefined") return undefined;
  let sessionId = sessionStorage.getItem("sentry_session_id");
  if (!sessionId) {
    sessionId = crypto.randomUUID();
    sessionStorage.setItem("sentry_session_id", sessionId);
  }
  return sessionId;
};

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,

  // Error sampling - capture all errors
  sampleRate: 1.0,

  // Performance sampling - lower in production
  tracesSampleRate: process.env.NODE_ENV === "development" ? 1.0 : 0.1,

  // Replay sampling (optional, can be 0 for free tier)
  replaysSessionSampleRate: 0,
  replaysOnErrorSampleRate: 0,

  // Filtering configuration
  ignoreErrors: [
    // Browser extension and third-party noise
    "ResizeObserver loop limit exceeded",
    "ResizeObserver loop completed with undelivered notifications",
    /^Non-Error exception captured/,
    /^Non-Error promise rejection captured/,
    // Network errors that are expected
    "Failed to fetch",
    "Load failed",
    "NetworkError",
    // Chunk loading (code splitting)
    /Loading chunk \d+ failed/,
    /ChunkLoadError/,
  ],

  denyUrls: [
    // Browser extensions
    /extensions\//i,
    /^chrome:\/\//i,
    /^chrome-extension:\/\//i,
    /^moz-extension:\/\//i,
    /^safari-extension:\/\//i,
    /^safari-web-extension:\/\//i,
  ],

  // Enable breadcrumbs for debugging
  integrations: [
    Sentry.breadcrumbsIntegration({
      console: true,
      dom: true,
      fetch: true,
      history: true,
    }),
  ],

  beforeSend(event) {
    // Add session ID as tag (not user ID for privacy)
    const sessionId = getSessionId();
    if (sessionId) {
      event.tags = { ...event.tags, session_id: sessionId };
    }
    return event;
  },
});
```

### Pattern 2: Server Configuration
**What:** Server-side Sentry initialization for API routes and Server Components
**When to use:** Always on server-side
**Example:**
```typescript
// sentry.server.config.ts
// Source: https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,

  // Server-side sampling
  tracesSampleRate: process.env.NODE_ENV === "development" ? 1.0 : 0.1,

  // Server-specific ignores
  ignoreErrors: [
    // Expected errors that don't need alerting
    /ECONNREFUSED/,
    /ENOTFOUND/,
  ],
});
```

### Pattern 3: Next.js Config Wrapper
**What:** Wrap Next.js config with Sentry for source map upload
**When to use:** Always in next.config.ts
**Example:**
```typescript
// next.config.ts
// Source: https://docs.sentry.io/platforms/javascript/guides/nextjs/sourcemaps/
import { withSentryConfig } from "@sentry/nextjs";
import "@gemhog/env/web";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typedRoutes: true,
  reactCompiler: true,
  transpilePackages: ["shiki"],
};

export default withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: process.env.SENTRY_AUTH_TOKEN,

  // Tunnel route to avoid ad blockers (optional)
  tunnelRoute: "/monitoring",

  // Silent unless in CI
  silent: !process.env.CI,

  // Delete source maps after upload for security
  sourcemaps: {
    deleteSourcemapsAfterUpload: true,
  },
});
```

### Pattern 4: Error Boundary Component
**What:** Section-level error boundaries with Sentry integration
**When to use:** Wrap major UI sections to prevent cascade failures
**Example:**
```typescript
// src/components/error-boundary.tsx
// Source: https://docs.sentry.io/platforms/javascript/guides/react/features/error-boundary/
"use client";

import * as Sentry from "@sentry/nextjs";
import type { ReactNode } from "react";

interface Props {
  children: ReactNode;
  section?: string;
  fallback?: ReactNode;
}

export function SectionErrorBoundary({ children, section, fallback }: Props) {
  return (
    <Sentry.ErrorBoundary
      beforeCapture={(scope) => {
        if (section) {
          scope.setTag("section", section);
        }
      }}
      fallback={({ error, resetError }) => (
        fallback || (
          <div className="p-4 text-center">
            <h2 className="text-lg font-semibold">Something went wrong</h2>
            <button
              onClick={resetError}
              className="mt-2 rounded bg-primary px-4 py-2 text-white"
            >
              Try again
            </button>
            {process.env.NODE_ENV === "development" && (
              <pre className="mt-4 text-left text-xs text-red-500">
                {error.message}
                {error.stack}
              </pre>
            )}
          </div>
        )
      )}
    >
      {children}
    </Sentry.ErrorBoundary>
  );
}
```

### Pattern 5: Global Error Handler (App Router)
**What:** Catch errors in root layout
**When to use:** Required file in app directory
**Example:**
```typescript
// src/app/global-error.tsx
// Source: https://docs.sentry.io/platforms/javascript/guides/nextjs/capturing-errors/
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
    <html lang="en">
      <body>
        <div className="flex h-screen items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold">Something went wrong</h1>
            <p className="mt-2 text-gray-600">
              We've been notified and are working on a fix.
            </p>
            <button
              onClick={reset}
              className="mt-4 rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
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

### Anti-Patterns to Avoid
- **Initializing Sentry in multiple places:** Use only instrumentation files, not in layout.tsx or page.tsx
- **Setting user email/ID in Sentry:** Use session ID instead to avoid PII in error logs
- **Including source maps in Lambda bundles:** Upload to Sentry separately, delete after upload
- **Using `sendDefaultPii: true` without consideration:** This enables IP collection which may violate privacy policies
- **Filtering too aggressively:** Start with standard ignoreErrors, add more based on actual noise

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Error boundary component | Custom React ErrorBoundary | Sentry.ErrorBoundary | Automatic error capture, reset functionality, scope management |
| Source map upload | Manual CLI scripts | withSentryConfig | Automatic during build, handles debug IDs |
| Third-party error filtering | Custom regex matching | thirdPartyErrorFilterIntegration | Build-time marking, more reliable |
| Session tracking | Custom session management | Sentry's automatic session tracking | Built into SDK, handles edge cases |
| Request context capture | Manual req/res logging | Sentry's automatic instrumentation | Automatic breadcrumbs, headers capture |

**Key insight:** Sentry's SDK has evolved significantly. Features that required manual implementation in older versions (pre-v8) are now built-in. Trust the SDK's defaults and configuration options rather than building custom solutions.

## Common Pitfalls

### Pitfall 1: Errors Not Appearing in Sentry
**What goes wrong:** Errors are caught by Next.js error boundaries but never reach Sentry
**Why it happens:** error.tsx and global-error.tsx catch errors for UX but prevent propagation
**How to avoid:** Always call `Sentry.captureException(error)` in useEffect of error boundary components
**Warning signs:** Clean Sentry dashboard despite known production errors

### Pitfall 2: Source Maps Not Working
**What goes wrong:** Stack traces show minified code in Sentry
**Why it happens:** Auth token not set in CI, or source maps deleted before upload
**How to avoid:**
1. Set `SENTRY_AUTH_TOKEN` in CI environment
2. Verify with `silent: false` during first deploy
3. Check Sentry release artifacts after deploy
**Warning signs:** Stack traces showing `e.jsx:1:2345` instead of readable paths

### Pitfall 3: Browser Extension Noise
**What goes wrong:** Sentry filled with errors from LastPass, Grammarly, ad blockers
**Why it happens:** Extensions inject code that throws errors in your error handlers
**How to avoid:** Configure `denyUrls` and `ignoreErrors` patterns, use `thirdPartyErrorFilterIntegration`
**Warning signs:** Errors with stack traces pointing to chrome-extension://, moz-extension://

### Pitfall 4: Too Many Events on Free Tier
**What goes wrong:** Quota exhausted within days
**Why it happens:** High `tracesSampleRate`, capturing all network errors, no filtering
**How to avoid:**
1. Set `tracesSampleRate: 0.1` or lower in production
2. Filter expected errors (404s, network timeouts)
3. Use inbound filters in Sentry dashboard
**Warning signs:** Sentry quota warnings, similar errors flooding dashboard

### Pitfall 5: PII in Error Logs
**What goes wrong:** User emails, IPs, or sensitive data appear in Sentry
**Why it happens:** Using `sendDefaultPii: true` or setting user context with email
**How to avoid:**
1. Never set `sendDefaultPii: true` unless required
2. Use session ID instead of user ID
3. Enable "Prevent Storing of IP Addresses" in Sentry project settings
**Warning signs:** User emails visible in Sentry events, GDPR compliance concerns

### Pitfall 6: Development Noise
**What goes wrong:** Dev errors flood production Sentry project
**Why it happens:** Same DSN used for dev and prod, or `environment` not set
**How to avoid:**
1. Always set `environment: process.env.NODE_ENV`
2. Configure alerts for production only
3. Use separate projects if needed (free tier allows this)
**Warning signs:** "development" environment errors in Sentry, expected dev errors triggering alerts

## Code Examples

Verified patterns from official sources:

### Instrumentation Registration
```typescript
// instrumentation.ts
// Source: https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/
import * as Sentry from "@sentry/nextjs";

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("./sentry.server.config");
  }

  if (process.env.NEXT_RUNTIME === "edge") {
    await import("./sentry.edge.config");
  }
}

export const onRequestError = Sentry.captureRequestError;
```

### Manual Error Capture in API Routes
```typescript
// src/app/api/example/route.ts
// Source: https://docs.sentry.io/platforms/javascript/guides/nextjs/capturing-errors/
import * as Sentry from "@sentry/nextjs";

export async function POST(request: Request) {
  try {
    const data = await request.json();
    // ... process data
    return Response.json({ success: true });
  } catch (error) {
    Sentry.captureException(error, {
      tags: { endpoint: "/api/example" },
      extra: { method: "POST" },
    });
    return Response.json({ error: "Internal error" }, { status: 500 });
  }
}
```

### Route-Level Error Boundary
```typescript
// src/app/dashboard/error.tsx
// Source: https://nextjs.org/docs/app/getting-started/error-handling
"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error, {
      tags: { route: "dashboard" },
    });
  }, [error]);

  return (
    <div className="p-8 text-center">
      <h2 className="text-xl font-semibold">Dashboard Error</h2>
      <p className="mt-2 text-gray-600">
        Something went wrong loading the dashboard.
      </p>
      <button
        onClick={reset}
        className="mt-4 rounded bg-blue-500 px-4 py-2 text-white"
      >
        Retry
      </button>
    </div>
  );
}
```

### Environment Variables Configuration
```bash
# .env.local (development)
NEXT_PUBLIC_SENTRY_DSN=https://xxx@xxx.ingest.sentry.io/xxx

# .env.sentry-build-plugin (build time, gitignored)
SENTRY_AUTH_TOKEN=sntrys_xxx
SENTRY_ORG=your-org
SENTRY_PROJECT=your-project
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Separate @sentry/browser + @sentry/node | Unified @sentry/nextjs | SDK v7 | Single package handles all runtimes |
| sentry.client.config.js | instrumentation-client.ts | SDK v8/Next.js 15 | Native instrumentation hook |
| Manual source map CLI upload | withSentryConfig automatic | SDK v7+ | Zero-config source maps |
| allowUrls/denyUrls filtering | thirdPartyErrorFilterIntegration | SDK v8.10 | Build-time marking, more accurate |
| Custom error boundary HOCs | Sentry.ErrorBoundary component | SDK v5.20+ | Built-in beforeCapture, reset |

**Deprecated/outdated:**
- `@sentry/browser` and `@sentry/node` separately for Next.js: Use `@sentry/nextjs` instead
- `sentry.client.config.js`: Use `instrumentation-client.ts` for Next.js 15+
- `wrapApiHandlerWithSentry`: Automatic instrumentation handles this now
- Manual `Sentry.flush()` in serverless: SDK handles this automatically for Next.js

## Open Questions

Things that couldn't be fully resolved:

1. **SST-specific source map upload timing**
   - What we know: SST deploys Next.js via OpenNext, source maps upload during `next build`
   - What's unclear: Whether SST Console autodeploy handles SENTRY_AUTH_TOKEN injection correctly
   - Recommendation: Set SENTRY_AUTH_TOKEN as SST secret and link to web component environment

2. **Alert configuration via SDK vs Dashboard**
   - What we know: Alerts are configured in Sentry dashboard, not SDK
   - What's unclear: Best practice for initial alert setup (API vs manual)
   - Recommendation: Configure manually in dashboard initially, can automate later if needed

3. **thirdPartyErrorFilterIntegration with Turbopack**
   - What we know: Integration requires bundler plugin for build-time marking
   - What's unclear: Full Turbopack support status (Next.js 16 default)
   - Recommendation: Start with ignoreErrors/denyUrls, add thirdPartyErrorFilterIntegration if noise persists

## Sources

### Primary (HIGH confidence)
- [Sentry Next.js SDK Documentation](https://docs.sentry.io/platforms/javascript/guides/nextjs/) - Setup, configuration, features
- [Sentry Manual Setup Guide](https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/) - Configuration files
- [Sentry Filtering Documentation](https://docs.sentry.io/platforms/javascript/configuration/filtering/) - ignoreErrors, denyUrls
- [Sentry Source Maps](https://docs.sentry.io/platforms/javascript/guides/nextjs/sourcemaps/) - Automatic upload
- [Next.js Error Handling](https://nextjs.org/docs/app/getting-started/error-handling) - error.tsx, global-error.tsx
- [Sentry React Error Boundary](https://docs.sentry.io/platforms/javascript/guides/react/features/error-boundary/) - ErrorBoundary component

### Secondary (MEDIUM confidence)
- [Sentry JavaScript Releases](https://github.com/getsentry/sentry-javascript/releases) - Version 10.36.0, Next.js 16 support verified
- [Sentry Blog: Reducing Noise](https://blog.sentry.io/making-your-javascript-projects-less-noisy/) - ignoreErrors patterns
- [Sentry Changelog: Third Party Filter](https://sentry.io/changelog/ignore-errors-that-dont-come-from-your-code/) - thirdPartyErrorFilterIntegration
- [Sentry User Identification](https://docs.sentry.io/platforms/javascript/enriching-events/identify-user/) - setUser, setTag APIs

### Tertiary (LOW confidence)
- [SST Source Maps Guide](https://docs.sst.dev/advanced/source-maps) - SST v2 docs, may differ for v3
- [GitHub Issue: SST + Sentry Source Maps](https://github.com/getsentry/sentry-javascript/issues/9298) - Community discussion

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Official Sentry documentation, verified version compatibility
- Architecture: HIGH - Official patterns from Sentry and Next.js docs
- Pitfalls: HIGH - Well-documented in Sentry blog and help center
- SST integration: MEDIUM - SST v3 with OpenNext less documented than v2

**Research date:** 2026-01-25
**Valid until:** 2026-02-25 (30 days - Sentry SDK stable, Next.js 16 recently released)
