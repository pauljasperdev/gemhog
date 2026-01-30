import { isDev, nodeEnv } from "@gemhog/env/runtime";
import { env as sentryEnv } from "@gemhog/env/sentry";
import * as Sentry from "@sentry/nextjs";

const dsn = sentryEnv.SENTRY_DSN;

// DSN is optional - skip Sentry if not configured (local dev)
if (!dsn) {
  if (isDev) {
    console.info("Sentry DSN not configured, skipping server initialization");
  }
} else {
  Sentry.init({
    dsn,
    environment: nodeEnv,

    // Server-side sampling - lower in production
    tracesSampleRate: isDev ? 1.0 : 0.1,

    // Server-specific ignores
    ignoreErrors: [
      // Expected server errors that don't need alerting
      /ECONNREFUSED/,
      /ENOTFOUND/,
    ],
  });
}
