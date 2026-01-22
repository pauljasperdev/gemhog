---
path: /home/lima/repo/apps/web/src/startup.int.test.ts
type: test
updated: 2026-01-22
status: active
---

# startup.int.test.ts

## Purpose

Integration test that verifies the Next.js build fails appropriately when required environment variables are missing. Uses a temporary directory with symlinks to isolate the build from the project's `.env` file.

## Exports

None

## Dependencies

- node:child_process (exec)
- node:fs
- node:os
- node:path
- node:util (promisify)
- vitest (test framework)

## Used By

TBD

## Notes

- Creates a temporary directory with symlinks to essential files (src, node_modules, configs) while excluding `.env`
- Uses 60-second timeout due to Next.js build duration
- Tests that `NEXT_PUBLIC_SERVER_URL` is validated at build time
- Cleanup happens in `afterEach` to remove temp directories