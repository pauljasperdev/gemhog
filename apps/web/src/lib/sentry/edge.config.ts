import { isDev, nodeEnv } from "@gemhog/env/runtime";
import { env as sentryEnv } from "@gemhog/env/sentry";
import * as Sentry from "@sentry/nextjs";

// DSN is optional - skip Sentry if not configured (local dev)
const dsn = sentryEnv.SENTRY_DSN;

if (!dsn) {
  if (isDev) {
    console.info("Sentry DSN not configured, skipping edge initialization");
  }
} else {
  Sentry.init({
    dsn,
    environment: nodeEnv,

    // Edge-side sampling - lower in production
    tracesSampleRate: isDev ? 1.0 : 0.1,
  });
}
