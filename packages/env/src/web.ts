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
};

export const env = createEnv({
  client: {
    NEXT_PUBLIC_SERVER_URL: z.url(),
    NEXT_PUBLIC_SENTRY_DSN: z.string().optional(),
  },
  runtimeEnv,
  emptyStringAsUndefined: true,
});

export type WebEnv = typeof env;
