---
path: /home/lima/repo/vitest.config.ts
type: config
updated: 2026-01-22
status: active
---

# vitest.config.ts

## Purpose

Root Vitest configuration for the monorepo test runner. Configures test discovery across workspace projects, excludes integration/e2e tests from unit runs, and sets up V8 coverage reporting.

## Exports

- `default` - Vitest configuration object with test settings, exclusions, and coverage options
- `defineConfig` - Re-exported from vitest/config for type-safe configuration

## Dependencies

- vitest/config (external)

## Used By

TBD

## Notes

- File parallelism is disabled (`fileParallelism: false`) to prevent database race conditions in integration tests
- Integration tests (`*.int.test.ts`) and E2E tests (`*.e2e.test.ts`) are explicitly excluded - they have separate configurations
- Projects are discovered from `apps/*` and `packages/*` workspace directories