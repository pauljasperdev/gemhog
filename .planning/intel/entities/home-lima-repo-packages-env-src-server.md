---
path: /home/lima/repo/packages/env/src/server.ts
type: config
updated: 2026-01-21
status: active
---

# server.ts

## Purpose

Server-side environment configuration using Effect's Config system. Validates required environment variables at import time, failing fast if any are missing.

## Exports

- `env` - Validated server environment configuration object containing DATABASE_URL, BETTER_AUTH_SECRET, BETTER_AUTH_URL, CORS_ORIGIN, and NODE_ENV
- `ServerEnv` - TypeScript type representing the validated environment object

## Dependencies

- `effect` - Effect library for typed configuration validation
- `dotenv/config` - Loads environment variables from .env files

## Used By

TBD

## Notes

- Uses `Config.redacted()` for sensitive values (DATABASE_URL, BETTER_AUTH_SECRET) to prevent accidental logging
- NODE_ENV defaults to "development" if not specified
- Validation runs synchronously at import time via `Effect.runSync()` - any missing required env vars will throw immediately