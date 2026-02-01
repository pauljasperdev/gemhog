import * as Sentry from "@sentry/nextjs";
import { initPostHog } from "./lib/instrumentation/posthog";
import { initSentryClient } from "./lib/instrumentation/sentry.client";

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;

if (process.env.NEXT_PUBLIC_DISABLE_ANALYTICS !== "1") {
  initSentryClient();
  initPostHog();
}
