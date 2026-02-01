import * as Sentry from "@sentry/nextjs";

export async function register() {
  if (process.env.NEXT_PUBLIC_DISABLE_ANALYTICS === "1") return;

  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("./lib/instrumentation/sentry.server");
  }

  if (process.env.NEXT_RUNTIME === "edge") {
    await import("./lib/instrumentation/sentry.edge");
  }
}

export const onRequestError = Sentry.captureRequestError;
