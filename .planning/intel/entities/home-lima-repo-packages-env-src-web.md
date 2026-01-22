---
path: /home/lima/repo/packages/env/src/web.ts
type: config
updated: 2026-01-22
status: active
---

# web.ts

## Purpose

Defines and validates client-side environment variables for the Next.js web application using t3-env. Provides type-safe access to public environment variables that are exposed to the browser.

## Exports

- `env`: The validated environment object containing client-side environment variables (currently `NEXT_PUBLIC_SERVER_URL`)
- `WebEnv`: TypeScript type representing the shape of the validated environment object

## Dependencies

- `@t3-oss/env-nextjs`: Framework for creating type-safe environment variable schemas in Next.js
- `zod`: Schema validation library used to define environment variable types

## Used By

TBD

## Notes

- Only includes `NEXT_PUBLIC_*` prefixed variables which are safe to expose to the client bundle
- Uses `emptyStringAsUndefined: true` to treat empty strings as missing values for validation
- The `NEXT_PUBLIC_SERVER_URL` is validated as a URL format using Zod's `z.url()` validator