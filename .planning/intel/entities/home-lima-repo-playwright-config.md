---
path: /home/lima/repo/playwright.config.ts
type: config
updated: 2026-01-21
status: active
---

# playwright.config.ts

## Purpose

Configures Playwright end-to-end testing framework for the monorepo. Defines test execution settings, browser projects, and orchestrates both the API server and web app dev servers for integration testing.

## Exports

- `default` - Playwright configuration object created via `defineConfig()`
- `defineConfig` - Re-exported from @playwright/test (implicit through import)

## Dependencies

- @playwright/test - Playwright testing framework

## Used By

TBD

## Notes

- Tests located in `./apps/web/tests/e2e` matching `**/*.e2e.test.ts`
- Runs two web servers: API server on port 3000, web app on port 3001
- CI mode uses single worker with 2 retries; local development allows parallel workers
- Provides fallback environment variables for local testing including `DATABASE_URL`, `BETTER_AUTH_SECRET`, and `POLAR_ACCESS_TOKEN`
- Only Chromium browser configured for testing