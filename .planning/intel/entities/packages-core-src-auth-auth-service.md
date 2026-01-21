---
path: /home/lima/repo/packages/core/src/auth/auth.service.ts
type: service
updated: 2025-01-21
status: active
---

# auth.service.ts

## Purpose

Core authentication service using Better Auth with Polar payment integration. Defines the Effect-based AuthService interface, creates the Better Auth instance with Drizzle adapter, configures email/password auth and subscription checkout. Provides both Effect layers and backward-compatible proxy exports.

## Exports

- `AuthService` - Effect Context tag for dependency injection
- `AuthLive` - Effect Layer providing live implementation
- `getAuth()` - Lazy getter for Better Auth instance
- `auth` - Proxy for backward compatibility with direct auth access

## Dependencies

- [[packages-core-src-auth-auth-errors]] - AuthError type
- [[packages-core-src-auth-auth-sql]] - Database schema for auth tables
- [[packages-env-src-server]] - Environment configuration (dynamic import)
- @polar-sh/better-auth - Polar checkout and portal plugins
- @polar-sh/sdk - Polar SDK client
- better-auth - Core auth library
- better-auth/adapters/drizzle - Drizzle ORM adapter
- drizzle-orm/node-postgres - PostgreSQL driver
- effect - Context, Effect, Layer for DI

## Used By

TBD

## Notes

Uses dynamic require to defer env validation until runtime, preventing import-time failures during testing.
