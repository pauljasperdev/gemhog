import { env } from "@gemhog/env";
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: env.server.SENTRY_DSN,
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
