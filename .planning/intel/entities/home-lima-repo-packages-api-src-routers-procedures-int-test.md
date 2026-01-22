---
path: /home/lima/repo/packages/api/src/routers/procedures.int.test.ts
type: test
updated: 2026-01-22
status: active
---

# procedures.int.test.ts

## Purpose

Integration tests for tRPC router procedures verifying both public (healthCheck) and protected (privateData) endpoint behavior. Validates authentication enforcement using the modern tRPC v11 caller factory pattern.

## Exports

None

## Dependencies

- [[home-lima-repo-packages-api-src-index]] (t - tRPC instance)
- [[home-lima-repo-packages-api-src-routers-index]] (appRouter)
- @trpc/server (TRPCError)
- vitest (describe, expect, it)

## Used By

TBD

## Notes

- Uses `t.createCallerFactory(appRouter)` pattern for tRPC v11 server-side testing
- Mock session structure matches better-auth response shape with nested `user` and `session` objects
- Tests verify UNAUTHORIZED error code is thrown when accessing protected procedures without session