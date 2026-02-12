import posthog from "posthog-js";

export const AnalyticsEvents = {
  LANDING_PAGE_VIEWED: "landing_page_viewed",
  SUBSCRIBE_STARTED: "subscribe_started",
  SUBSCRIBE_COMPLETED: "subscribe_completed",
} as const;

export function trackEvent(
  event: (typeof AnalyticsEvents)[keyof typeof AnalyticsEvents],
  properties?: Record<string, unknown>,
) {
  posthog.capture(event, {
    referrer: typeof document !== "undefined" ? document.referrer : undefined,
    ...properties,
  });
}
