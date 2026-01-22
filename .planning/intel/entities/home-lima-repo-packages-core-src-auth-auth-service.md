---
path: /home/lima/repo/packages/core/src/auth/auth.service.ts
type: service
updated: 2026-01-22
status: active
---

# auth.service.ts

## Purpose

Provides authentication services using better-auth with PostgreSQL/Drizzle ORM. Implements a lazy singleton pattern for the auth instance to defer initialization until first use.

## Exports

- `getAuth` — Returns the singleton better-auth instance, creating it on first call
- `auth` — Proxy object providing backward-compatible access to the auth instance properties
- `getSession` — Async helper function to retrieve session from request headers

## Dependencies

- [[home-lima-repo-packages-env-src-server]] — Environment variables (DATABASE_URL, CORS_ORIGIN)
- [[home-lima-repo-packages-core-src-auth-auth-sql]] — Database schema for auth tables
- better-auth — Authentication framework
- better-auth/adapters/drizzle — Drizzle ORM adapter for better-auth
- drizzle-orm/node-postgres — PostgreSQL driver for Drizzle

## Used By

TBD

## Notes

- Uses lazy singleton pattern to avoid initialization at module load time (important for environments where DATABASE_URL may not be available immediately)
- Proxy pattern on `auth` export allows transparent access to auth methods while maintaining lazy initialization
- Cookie configuration uses `sameSite: "none"` with `secure: true` for cross-origin auth support