// playwright.config.ts
import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./apps/web/tests/e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: "list",

  use: {
    baseURL: "http://localhost:3001",
    trace: "on-first-retry",
  },

  webServer: [
    {
      command: "pnpm dev:server",
      url: "http://localhost:3000",
      reuseExistingServer: !process.env.CI,
      timeout: 120 * 1000,
      stdout: "ignore",
      stderr: "pipe",
      env: {
        ...process.env,
        DATABASE_URL:
          process.env.DATABASE_URL ||
          "postgresql://postgres:postgres@localhost:5432/gemhog_test",
        BETTER_AUTH_SECRET:
          process.env.BETTER_AUTH_SECRET ||
          "test-secret-key-for-e2e-minimum-32-chars",
        BETTER_AUTH_URL: process.env.BETTER_AUTH_URL || "http://localhost:3000",
        POLAR_ACCESS_TOKEN: process.env.POLAR_ACCESS_TOKEN || "test-polar-token",
        POLAR_SUCCESS_URL:
          process.env.POLAR_SUCCESS_URL || "http://localhost:3001/success",
        CORS_ORIGIN: process.env.CORS_ORIGIN || "http://localhost:3001",
      },
    },
    {
      command: "pnpm dev:web",
      url: "http://localhost:3001",
      reuseExistingServer: !process.env.CI,
      timeout: 120 * 1000,
      stdout: "ignore",
      stderr: "pipe",
    },
  ],

  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
