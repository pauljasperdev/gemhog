---
path: /home/lima/repo/apps/web/src/startup.int.test.ts
type: test
updated: 2026-01-21
status: active
---

# startup.int.test.ts

## Purpose

Integration tests for web app startup failure scenarios. Tests that the Next.js build process fails fast with clear error messages when required environment variables are missing.

## Exports

None

## Dependencies

- node:child_process (spawn)
- node:fs
- node:os
- node:path
- vitest (describe, expect, it, beforeEach, afterEach)

## Used By

TBD

## Notes

- Tests build process rather than dev server because build validates env at startup via next.config.ts importing @gemhog/env/web
- Creates a temp directory with symlinks to all web app files EXCEPT .env to test missing env var scenarios
- Next.js automatically reads .env files from the project directory, so the symlink approach isolates the test from existing env files
- Uses `next build` spawned as a child process with controlled environment variables