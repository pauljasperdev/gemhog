---
path: /home/lima/repo/packages/env/src/server.test.ts
type: test
updated: 2026-01-22
status: active
---

# server.test.ts

## Purpose

Tests the server environment variable validation logic in `server.ts`. Verifies that required environment variables (DATABASE_URL, BETTER_AUTH_SECRET, BETTER_AUTH_URL, CORS_ORIGIN) cause failures when missing and that valid configurations are properly parsed with correct defaults.

## Exports

None

## Dependencies

- vitest (testing framework)
- [[home-lima-repo-packages-env-src-server]] (module under test)

## Used By

TBD

## Notes

- Uses dynamic imports (`import("./server.js")`) to test module-level validation that runs on import
- Requires `vi.resetModules()` between tests to ensure fresh module evaluation
- Saves and restores `process.env` to prevent test pollution
- Tests NODE_ENV defaulting to 'development' when not specified