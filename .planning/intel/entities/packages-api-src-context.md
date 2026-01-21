---
path: /home/lima/repo/packages/api/src/context.ts
type: api
updated: 2025-01-21
status: active
---

# context.ts

## Purpose

tRPC context factory that creates request context with user session information. Extracts the session from incoming requests using the auth service and makes it available to all tRPC procedures. Provides type exports for context consumption throughout the API layer.

## Exports

- `createContext({ context }): Promise<Context>` - Factory function creating tRPC context
- `CreateContextOptions` - Type for context creation options
- `Context` - Type representing the created context

## Dependencies

- [[packages-core-src-auth-index]] - Auth service for session retrieval
- hono - Context type for request handling

## Used By

TBD
