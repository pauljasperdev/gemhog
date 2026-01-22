---
path: /home/lima/repo/apps/web/startup.int.test.ts
type: test
updated: 2026-01-21
status: active
---

# startup.int.test.ts

## Purpose

Integration tests for web app startup failure scenarios. Verifies that the Next.js build process fails fast with clear error messages when required environment variables are missing.

## Exports

None

## Dependencies

- node:child_process (spawn)
- node:path
- vitest (describe, expect, it)

## Used By

TBD

## Notes

- Tests build process (not dev server) because build validates env at startup via next.config.ts importing @gemhog/env/web
- Build is deterministic and faster to fail than dev server startup
- Uses 30-second timeout due to Next.js build duration
- Spawns actual Next.js build with minimal env (PATH, HOME only) to test missing NEXT_PUBLIC_SERVER_URL validation