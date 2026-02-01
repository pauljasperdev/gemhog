import { localClientEnv, localServerEnv } from "@gemhog/env/local-dev";
import { defineConfig, devices } from "@playwright/test";

const isCi = !!process.env.CI;

const envDefaults = { ...localServerEnv, ...localClientEnv };

export default defineConfig({
  testDir: "./apps/web/tests/e2e",
  testMatch: "**/*.e2e.test.ts",
  fullyParallel: true,
  forbidOnly: isCi,
  retries: isCi ? 2 : 0,
  workers: isCi ? 1 : undefined,
  timeout: 60_000,
  reporter: "list",
  outputDir: ".playwright-results",

  expect: {
    timeout: 15_000,
  },

  use: {
    baseURL: "http://localhost:3001",
    trace: "on-first-retry",
    navigationTimeout: 30_000,
  },

  webServer: {
    command: "pnpm dev:web",
    url: "http://localhost:3001",
    reuseExistingServer: !isCi,
    timeout: 120 * 1000,
    stdout: "ignore",
    stderr: "pipe",
    env: {
      ...process.env,
      DATABASE_URL: process.env.DATABASE_URL ?? envDefaults.DATABASE_URL,
      DATABASE_URL_POOLER:
        process.env.DATABASE_URL_POOLER ?? envDefaults.DATABASE_URL_POOLER,
      BETTER_AUTH_SECRET:
        process.env.BETTER_AUTH_SECRET ?? envDefaults.BETTER_AUTH_SECRET,
      BETTER_AUTH_URL:
        process.env.BETTER_AUTH_URL ?? envDefaults.BETTER_AUTH_URL,
      APP_URL: process.env.APP_URL ?? envDefaults.APP_URL,
      GOOGLE_GENERATIVE_AI_API_KEY:
        process.env.GOOGLE_GENERATIVE_AI_API_KEY ??
        envDefaults.GOOGLE_GENERATIVE_AI_API_KEY,
      RESEND_API_KEY: process.env.RESEND_API_KEY ?? envDefaults.RESEND_API_KEY,
      SENTRY_DSN: process.env.SENTRY_DSN ?? envDefaults.SENTRY_DSN,
      NEXT_PUBLIC_SERVER_URL:
        process.env.NEXT_PUBLIC_SERVER_URL ??
        envDefaults.NEXT_PUBLIC_SERVER_URL,
      NEXT_PUBLIC_SENTRY_DSN:
        process.env.NEXT_PUBLIC_SENTRY_DSN ??
        envDefaults.NEXT_PUBLIC_SENTRY_DSN,
      NEXT_PUBLIC_POSTHOG_KEY:
        process.env.NEXT_PUBLIC_POSTHOG_KEY ??
        envDefaults.NEXT_PUBLIC_POSTHOG_KEY,
      NEXT_PUBLIC_POSTHOG_HOST:
        process.env.NEXT_PUBLIC_POSTHOG_HOST ??
        envDefaults.NEXT_PUBLIC_POSTHOG_HOST,
    },
  },

  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
