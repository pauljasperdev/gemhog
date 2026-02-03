import "@gemhog/env/server";
import * as Sentry from "@sentry/node";
import type { Context } from "hono";

/**
 * Initialize Sentry for the Hono server.
 * Call this at app startup, before routes are registered.
 */
export function initSentry() {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV,
    tracesSampleRate: process.env.NODE_ENV === "development" ? 1.0 : 0.1,
  });
}

/**
 * Capture an exception to Sentry with request context.
 * Use in Hono's onError handler.
 */
export function captureError(err: Error, c: Context) {
  Sentry.captureException(err, {
    extra: {
      url: c.req.url,
      method: c.req.method,
      path: c.req.path,
    },
  });
}

export { Sentry };
