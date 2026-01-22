---
path: /home/lima/repo/packages/env/src/server.ts
type: config
updated: 2026-01-22
status: active
---

# server.ts

## Purpose

Defines and validates server-side environment variables using t3-env with Zod schemas. Ensures all required environment variables are present and correctly typed at runtime.

## Exports

- `env` - Validated environment object containing DATABASE_URL, BETTER_AUTH_SECRET, BETTER_AUTH_URL, CORS_ORIGIN, and NODE_ENV
- `ServerEnv` - TypeScript type representing the validated environment object

## Dependencies

- `@t3-oss/env-core` - Environment validation library
- `zod` - Schema validation
- `dotenv/config` - Loads .env files into process.env

## Used By

TBD

## Notes

- Automatically loads dotenv on import via side-effect import
- `emptyStringAsUndefined: true` treats empty strings as missing values
- NODE_ENV defaults to "development" if not specified
- BETTER_AUTH_SECRET requires minimum 32 characters for security