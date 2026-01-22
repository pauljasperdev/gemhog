---
path: /home/lima/repo/apps/server/src/startup.int.test.ts
type: test
updated: 2026-01-22
status: active
---

# startup.int.test.ts

## Purpose

Integration tests that verify the server fails to start with appropriate error messages when required environment variables are missing. Uses subprocess execution with a non-existent DOTENV_CONFIG_PATH to ensure clean environment isolation.

## Exports

None

## Dependencies

- node:child_process (exec for subprocess spawning)
- node:path (path resolution)
- node:util (promisify)
- vitest (test framework)

## Used By

TBD

## Notes

- Tests run with 10-second timeouts due to subprocess startup overhead
- Uses `DOTENV_CONFIG_PATH=/nonexistent/.env` to prevent automatic .env file loading
- Tests verify error messages contain the missing variable name (DATABASE_URL, BETTER_AUTH_SECRET, BETTER_AUTH_URL, CORS_ORIGIN)
- Each test progressively adds more env vars to test the validation order