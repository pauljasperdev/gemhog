import { env } from "@gemhog/env/web";
import * as Sentry from "@sentry/nextjs";

// Export hook for Next.js router transition instrumentation
export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;

// Generate or retrieve session ID for error correlation (not user ID for privacy)
const getSessionId = () => {
  if (typeof window === "undefined") return undefined;
  let sessionId = sessionStorage.getItem("sentry_session_id");
  if (!sessionId) {
    sessionId = crypto.randomUUID();
    sessionStorage.setItem("sentry_session_id", sessionId);
  }
  return sessionId;
};

// DSN is optional in env schema - skip Sentry if not configured (local dev)
if (!env.NEXT_PUBLIC_SENTRY_DSN) {
  if (process.env.NODE_ENV === "development") {
    console.info("Sentry DSN not configured, skipping client initialization");
  }
} else {
  Sentry.init({
    dsn: env.NEXT_PUBLIC_SENTRY_DSN,
    environment: process.env.NODE_ENV,

    // Error sampling - capture all errors
    sampleRate: 1.0,

    // Performance sampling - lower in production to stay within free tier
    tracesSampleRate: process.env.NODE_ENV === "development" ? 1.0 : 0.1,

    // Replay sampling (disabled for free tier)
    replaysSessionSampleRate: 0,
    replaysOnErrorSampleRate: 0,

    // Filter out known noisy errors from browser extensions and third parties
    ignoreErrors: [
      // Browser resize observer noise
      "ResizeObserver loop limit exceeded",
      "ResizeObserver loop completed with undelivered notifications",
      // Non-error captures (usually browser extension issues)
      /^Non-Error exception captured/,
      /^Non-Error promise rejection captured/,
      // Network errors that are expected
      "Failed to fetch",
      "Load failed",
      "NetworkError",
      // Code splitting chunk loading failures (usually network issues)
      /Loading chunk \d+ failed/,
      /ChunkLoadError/,
    ],

    // Block errors from browser extensions
    denyUrls: [
      /extensions\//i,
      /^chrome:\/\//i,
      /^chrome-extension:\/\//i,
      /^moz-extension:\/\//i,
      /^safari-extension:\/\//i,
      /^safari-web-extension:\/\//i,
    ],

    // Enable breadcrumbs for debugging context
    integrations: [
      Sentry.breadcrumbsIntegration({
        console: true,
        dom: true,
        fetch: true,
        history: true,
      }),
    ],

    // Add session ID as tag for correlation
    beforeSend(event) {
      const sessionId = getSessionId();
      if (sessionId) {
        event.tags = { ...event.tags, session_id: sessionId };
      }
      return event;
    },
  });
}
