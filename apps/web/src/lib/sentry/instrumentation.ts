import { nextRuntime } from "@gemhog/env/runtime";
import * as Sentry from "@sentry/nextjs";

export async function register() {
  if (nextRuntime === "nodejs") {
    await import("./server.config");
  }

  if (nextRuntime === "edge") {
    await import("./edge.config");
  }
}

export const onRequestError = Sentry.captureRequestError;
