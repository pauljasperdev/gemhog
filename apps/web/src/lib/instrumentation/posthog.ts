import { clientEnv } from "@gemhog/env/client";
import posthog from "posthog-js";

export function initPostHog() {
  posthog.init(clientEnv.NEXT_PUBLIC_POSTHOG_KEY, {
    api_host: "/ph",
    ui_host: "https://eu.posthog.com",
    defaults: "2025-11-30",
    cookieless_mode: "on_reject",
    disable_session_recording: true,
    advanced_disable_flags: true,
    person_profiles: "identified_only",
  });
}
