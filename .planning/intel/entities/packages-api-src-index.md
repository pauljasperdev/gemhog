---
path: /home/lima/repo/packages/api/src/index.ts
type: api
updated: 2025-01-21
status: active
---

# index.ts

## Purpose

tRPC initialization and procedure definitions for the API package. Sets up the tRPC instance with context typing, exports the router factory, and defines public and protected procedure middlewares. Protected procedures enforce authentication by checking for a session in context.

## Exports

- `t` - Initialized tRPC instance
- `router` - tRPC router factory
- `publicProcedure` - Procedure without auth requirement
- `protectedProcedure` - Procedure requiring authenticated session

## Dependencies

- [[packages-api-src-context]] - Context type for tRPC
- @trpc/server - tRPC core with TRPCError

## Used By

TBD

## Notes

Protected procedures throw UNAUTHORIZED error if no session exists in context.
