import * as Sentry from "@sentry/nextjs";

// Edge runtime: use process.env directly (env package may have import issues in edge)
// DSN is optional - skip Sentry if not configured (local dev)
const dsn = process.env.SENTRY_DSN;

if (!dsn) {
  if (process.env.NODE_ENV === "development") {
    console.info("Sentry DSN not configured, skipping edge initialization");
  }
} else {
  Sentry.init({
    dsn,
    environment: process.env.NODE_ENV,

    // Edge-side sampling - lower in production
    tracesSampleRate: process.env.NODE_ENV === "development" ? 1.0 : 0.1,
  });
}
