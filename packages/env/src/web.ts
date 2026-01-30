import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";
import { localDevWebEnv } from "./local-dev";

const isLocalDefaultsEnabled = process.env.LOCAL_ENV === "1";
const runtimeEnv = {
  NEXT_PUBLIC_SERVER_URL:
    process.env.NEXT_PUBLIC_SERVER_URL ??
    (isLocalDefaultsEnabled
      ? localDevWebEnv.NEXT_PUBLIC_SERVER_URL
      : undefined),
  NEXT_PUBLIC_SENTRY_DSN:
    process.env.NEXT_PUBLIC_SENTRY_DSN ??
    (isLocalDefaultsEnabled
      ? localDevWebEnv.NEXT_PUBLIC_SENTRY_DSN
      : undefined),
  NEXT_PUBLIC_POSTHOG_KEY:
    process.env.NEXT_PUBLIC_POSTHOG_KEY ??
    (isLocalDefaultsEnabled
      ? localDevWebEnv.NEXT_PUBLIC_POSTHOG_KEY
      : undefined),
  NEXT_PUBLIC_POSTHOG_HOST:
    process.env.NEXT_PUBLIC_POSTHOG_HOST ??
    (isLocalDefaultsEnabled
      ? localDevWebEnv.NEXT_PUBLIC_POSTHOG_HOST
      : undefined),
};

export const env = createEnv({
  client: {
    NEXT_PUBLIC_SERVER_URL: z.url(),
    NEXT_PUBLIC_SENTRY_DSN: z.string(),
    NEXT_PUBLIC_POSTHOG_KEY: z.string(),
    NEXT_PUBLIC_POSTHOG_HOST: z.url(),
  },
  runtimeEnv,
  emptyStringAsUndefined: true,
});

export type WebEnv = typeof env;
