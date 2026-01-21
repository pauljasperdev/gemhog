---
path: /home/lima/repo/packages/api/src/routers/index.ts
type: api
updated: 2025-01-21
status: active
---

# index.ts

## Purpose

Main tRPC router definition combining all API endpoints. Defines a healthCheck endpoint for connectivity testing and a privateData endpoint requiring authentication that returns user-specific data. Exports the router and its type for client-side type inference.

## Exports

- `appRouter` - Main tRPC router with all endpoints
- `AppRouter` - TypeScript type of the router for client type safety

## Dependencies

- [[packages-api-src-index]] - Router factory and procedure definitions

## Used By

TBD
