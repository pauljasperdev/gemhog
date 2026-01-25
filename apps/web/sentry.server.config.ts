import { env } from "@gemhog/env/server";
import * as Sentry from "@sentry/nextjs";

// DSN is optional - skip Sentry if not configured (local dev)
if (!env.SENTRY_DSN) {
  if (process.env.NODE_ENV === "development") {
    console.info("Sentry DSN not configured, skipping server initialization");
  }
} else {
  Sentry.init({
    dsn: env.SENTRY_DSN,
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
