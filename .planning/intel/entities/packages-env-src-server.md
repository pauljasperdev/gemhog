---
path: /home/lima/repo/packages/env/src/server.ts
type: config
updated: 2025-01-21
status: active
---

# server.ts

## Purpose

Server-side environment variable configuration with runtime validation. Uses t3-env with Zod schemas to validate required environment variables including DATABASE_URL, Better Auth secrets, Polar tokens, and CORS settings. Loads dotenv config and provides typed access to server environment.

## Exports

- `env` - Validated and typed environment object with server variables

## Dependencies

- @t3-oss/env-core - Type-safe environment variable handling
- dotenv/config - Loads .env file at import time
- zod - Schema validation for env vars

## Used By

TBD

## Notes

Required vars: DATABASE_URL, BETTER_AUTH_SECRET (min 32 chars), BETTER_AUTH_URL, POLAR_ACCESS_TOKEN, POLAR_SUCCESS_URL, CORS_ORIGIN. NODE_ENV defaults to "development".
