import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./apps/web/tests/e2e",
  testMatch: "**/*.e2e.test.ts",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: "list",
  outputDir: ".playwright-results",

  use: {
    baseURL: "http://localhost:3001",
    trace: "on-first-retry",
  },

  webServer: {
    command: "pnpm dev:web",
    url: "http://localhost:3001",
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
    stdout: "ignore",
    stderr: "pipe",
    env: {
      ...process.env,
      DATABASE_URL:
        process.env.DATABASE_URL ||
        "postgresql://postgres:password@localhost:5432/gemhog",
      DATABASE_URL_POOLER:
        process.env.DATABASE_URL_POOLER ||
        "postgresql://postgres:password@localhost:5432/gemhog",
      BETTER_AUTH_SECRET:
        process.env.BETTER_AUTH_SECRET ||
        "test-secret-key-for-e2e-minimum-32-chars",
      BETTER_AUTH_URL: process.env.BETTER_AUTH_URL || "http://localhost:3001",
      CORS_ORIGIN: process.env.CORS_ORIGIN || "http://localhost:3001",
      GOOGLE_GENERATIVE_AI_API_KEY:
        process.env.GOOGLE_GENERATIVE_AI_API_KEY || "test-google-api-key",
      NEXT_PUBLIC_SERVER_URL:
        process.env.NEXT_PUBLIC_SERVER_URL || "http://localhost:3000",
      NEXT_PUBLIC_SENTRY_DSN: "",
      SENTRY_DSN: "",
    },
  },

  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
