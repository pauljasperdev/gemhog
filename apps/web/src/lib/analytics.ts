import posthog from "posthog-js";

export const AnalyticsEvents = {
  LANDING_PAGE_VIEWED: "landing_page_viewed",
  SIGNUP_STARTED: "signup_started",
  SIGNUP_COMPLETED: "signup_completed",
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
