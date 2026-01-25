import * as Sentry from "@sentry/nextjs";

// Server runtime: use process.env directly to avoid env validation
// during instrumentation loading (env package validates all vars,
// but SENTRY_DSN is the only one we need here)
const dsn = process.env.SENTRY_DSN;

// DSN is optional - skip Sentry if not configured (local dev)
if (!dsn) {
  if (process.env.NODE_ENV === "development") {
    console.info("Sentry DSN not configured, skipping server initialization");
  }
} else {
  Sentry.init({
    dsn,
    environment: process.env.NODE_ENV,

    // Server-side sampling - lower in production
    tracesSampleRate: process.env.NODE_ENV === "development" ? 1.0 : 0.1,

    // Server-specific ignores
    ignoreErrors: [
      // Expected server errors that don't need alerting
      /ECONNREFUSED/,
      /ENOTFOUND/,
    ],
  });
}
