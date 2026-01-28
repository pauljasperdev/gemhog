"use client";

import { useEffect } from "react";

import { AnalyticsEvents, trackEvent } from "@/lib/analytics";

export function VerifyAnalytics({ status }: { status: string }) {
  useEffect(() => {
    if (status === "success") {
      trackEvent(AnalyticsEvents.SIGNUP_COMPLETED);
    }
  }, [status]);

  return null;
}
