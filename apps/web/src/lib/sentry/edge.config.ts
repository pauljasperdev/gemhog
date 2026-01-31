import { serverEnv } from "@gemhog/env/server";
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: serverEnv.SENTRY_DSN,
  environment: process.env.NODE_ENV,

  // Edge-side sampling - lower in production
  tracesSampleRate: process.env.NODE_ENV === "development" ? 1.0 : 0.1,
});
