import "@gemhog/env/server";
import * as Sentry from "@sentry/nextjs";

const dsn = process.env.SENTRY_DSN ?? "";

if (/^https?:\/\/.+@.+/.test(dsn)) {
  Sentry.init({
    dsn,
    environment: process.env.NODE_ENV,

    // Edge-side sampling - lower in production
    tracesSampleRate: process.env.NODE_ENV === "development" ? 1.0 : 0.1,
  });
}
