---
path: /home/lima/repo/packages/core/src/auth/schema.int.test.ts
type: test
updated: 2026-01-22
status: active
---

# schema.int.test.ts

## Purpose

Integration tests for auth schema CRUD operations using Drizzle ORM with Effect layers. Verifies that the drizzle schema definitions work correctly independent of better-auth by testing typed CRUD operations directly against PostgreSQL.

## Exports

None

## Dependencies

- [[auth.sql]] (user, account, session, verification tables)
- @effect/sql-drizzle/Pg (PgDrizzle database access)
- @effect/sql-pg (PgClient layer)
- @effect/vitest (Effect-aware test utilities)
- drizzle-orm (eq query builder)
- effect (Effect, Layer, Redacted)
- vitest (describe)

## Used By

TBD

## Notes

- Uses explicit DATABASE_URL environment variable with fallback to local postgres connection
- Creates test-specific Effect layers (TestPgLive, TestDrizzleLive) to bypass Config.redacted
- Includes truncateAuthTables helper that clears tables in correct order respecting foreign key constraints (session → account → verification → user)
- Tests cover: user insert/query, unique email constraint enforcement, and related table operations