---
path: /home/lima/repo/apps/server/src/startup.int.test.ts
type: test
updated: 2026-01-21
status: active
---

# startup.int.test.ts

## Purpose

Integration tests that validate the server fails fast with clear error messages when required environment variables are missing. These tests spawn actual server processes with incomplete env configurations to verify Effect Config validation in @gemhog/env/server works correctly.

## Exports

None

## Dependencies

- node:child_process (spawn for process execution)
- node:path (path resolution)
- vitest (test framework)
- [[home-lima-repo-apps-server-src-index]] (server entry point being tested)
- [[home-lima-repo-packages-env-src-server]] (Effect Config validation being verified)

## Used By

TBD

## Notes

- Tests use 10-second timeouts due to process spawning overhead
- Spawns tsx directly from node_modules/.bin to execute TypeScript
- Validates cumulative env var requirements: DATABASE_URL → BETTER_AUTH_SECRET → BETTER_AUTH_URL → CORS_ORIGIN
- Intentionally provides minimal PATH/HOME env to isolate test conditions