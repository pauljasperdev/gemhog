---
path: /home/lima/repo/packages/env/src/web.ts
type: config
updated: 2026-01-21
status: active
---

# web.ts

## Purpose

Defines and validates web/client-side environment variables using Effect's Config system. Ensures required environment variables are present at import time, failing fast if configuration is missing.

## Exports

- `env` - The validated environment configuration object containing `NEXT_PUBLIC_SERVER_URL`
- `WebEnv` - TypeScript type representing the shape of the validated environment object

## Dependencies

- effect (external) - Used for Config validation and Effect runtime

## Used By

TBD

## Notes

- Configuration is validated synchronously at import time via `Effect.runSync`, meaning the application will fail immediately if `NEXT_PUBLIC_SERVER_URL` is not set
- Only exposes `NEXT_PUBLIC_*` prefixed variables, following Next.js convention for client-safe environment variables