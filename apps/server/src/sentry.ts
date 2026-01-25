import { env } from "@gemhog/env/server";
import * as Sentry from "@sentry/node";
import type { Context } from "hono";

/**
 * Initialize Sentry for the Hono server.
 * Call this at app startup, before routes are registered.
 * Gracefully skips if SENTRY_DSN is not configured (local dev).
 */
export function initSentry() {
  if (!env.SENTRY_DSN) {
    if (env.NODE_ENV === "development") {
      console.info("Sentry DSN not configured, skipping server initialization");
    }
    return;
  }

  Sentry.init({
    dsn: env.SENTRY_DSN,
    environment: env.NODE_ENV,
    tracesSampleRate: env.NODE_ENV === "development" ? 1.0 : 0.1,
  });
}

/**
 * Capture an exception to Sentry with request context.
 * Use in Hono's onError handler.
 */
export function captureError(err: Error, c: Context) {
  if (!env.SENTRY_DSN) return;

  Sentry.captureException(err, {
    extra: {
      url: c.req.url,
      method: c.req.method,
      path: c.req.path,
    },
  });
}

export { Sentry };
