export const localDevServerEnv = {
  DATABASE_URL: "postgresql://postgres:password@localhost:5432/gemhog",
  DATABASE_URL_POOLER: "postgresql://postgres:password@localhost:5432/gemhog",
  BETTER_AUTH_SECRET: "ZpgIiuzmFRdZ6OSFTJQ1PHqgRLyhnzIe",
  BETTER_AUTH_URL: "http://localhost:3000",
  APP_URL: "http://localhost:3001",
  GOOGLE_GENERATIVE_AI_API_KEY: "XXXXXXXXXXXXXXXXXXXXX",
  RESEND_API_KEY: "re_local_dev_placeholder",
  SENTRY_DSN:
    "https://b0e726cbc64e580010757cb06aa83a72@o4510769605115904.ingest.de.sentry.io/4510769606295632",
} as const;

export const localDevWebEnv = {
  NEXT_PUBLIC_SERVER_URL: "http://localhost:3001",
  NEXT_PUBLIC_SENTRY_DSN:
    "https://b0e726cbc64e580010757cb06aa83a72@o4510769605115904.ingest.de.sentry.io/4510769606295632",
  NEXT_PUBLIC_POSTHOG_KEY: "phc_KHm7rTBstZVB3AEtPp8w08yEQgKcPw1c2lEvVbOmzjm",
  NEXT_PUBLIC_POSTHOG_HOST: "https://eu.i.posthog.com",
} as const;
