---
path: /home/lima/repo/packages/env/src/web.ts
type: config
updated: 2025-01-21
status: active
---

# web.ts

## Purpose

Client-side environment variable configuration for Next.js web application. Uses t3-env-nextjs to validate NEXT_PUBLIC prefixed variables that are safe for browser exposure. Currently exposes the server URL for API communication.

## Exports

- `env` - Validated and typed environment object with client variables

## Dependencies

- @t3-oss/env-nextjs - Next.js-specific type-safe environment handling
- zod - Schema validation for env vars

## Used By

TBD

## Notes

Only exposes NEXT_PUBLIC_SERVER_URL, validated as a URL format.
