export const clientEnv = {
  NEXT_PUBLIC_SERVER_URL: process.env.NEXT_PUBLIC_SERVER_URL ?? "",
  NEXT_PUBLIC_SENTRY_DSN: process.env.NEXT_PUBLIC_SENTRY_DSN ?? "",
  NEXT_PUBLIC_POSTHOG_KEY: process.env.NEXT_PUBLIC_POSTHOG_KEY ?? "",
  NEXT_PUBLIC_POSTHOG_HOST: process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "",
  NEXT_PUBLIC_CHATWOOT_BASE_URL:
    process.env.NEXT_PUBLIC_CHATWOOT_BASE_URL ?? "",
  NEXT_PUBLIC_CHATWOOT_WEBSITE_TOKEN:
    process.env.NEXT_PUBLIC_CHATWOOT_WEBSITE_TOKEN ?? "",
} as const;

export type ClientRuntimeEnv = typeof clientEnv;
