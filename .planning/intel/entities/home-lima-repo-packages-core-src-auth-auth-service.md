---
path: /home/lima/repo/packages/core/src/auth/auth.service.ts
type: service
updated: 2026-01-21
status: active
---

# auth.service.ts

## Purpose

Configures and exposes the better-auth authentication instance with PostgreSQL/Drizzle integration. Provides a lazy singleton pattern with deferred environment loading to support unit testing without requiring environment variables.

## Exports

- `getAuth()` - Returns the lazy-initialized better-auth instance singleton
- `auth` - Proxy object providing backward-compatible access to the auth instance
- `getSession(headers: Headers)` - Async helper to retrieve session from request headers

## Dependencies

- [[auth-sql]] - Database schema for authentication tables
- better-auth - Authentication library
- better-auth/adapters/drizzle - Drizzle ORM adapter for better-auth
- drizzle-orm/node-postgres - PostgreSQL driver for Drizzle
- effect (Redacted) - Used to safely unwrap redacted DATABASE_URL
- @gemhog/env/server - Environment configuration (dynamically imported)

## Used By

TBD

## Notes

- Uses deferred `require()` for env import to enable unit tests to import this module without environment variables being set (per 03.1-03 decision)
- Cookie configuration uses `sameSite: "none"`, `secure: true`, `httpOnly: true` for cross-origin authentication
- The `auth` proxy allows direct property access while maintaining lazy initialization