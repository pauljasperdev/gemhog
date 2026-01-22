---
path: /home/lima/repo/packages/core/src/auth/schema.int.test.ts
type: test
updated: 2026-01-22
status: active
---

# schema.int.test.ts

## Purpose

Integration tests for the Drizzle auth schema definitions via typed CRUD operations. Verifies that schema tables (user, session, account, verification) work correctly with direct database operations, independent of better-auth.

## Exports

None

## Dependencies

- [[auth.sql]] - Auth schema table definitions (user, session, account, verification)
- [[test-fixtures]] - Test utilities including truncateAuthTables helper
- drizzle-orm - ORM query builder and operators
- drizzle-orm/node-postgres - PostgreSQL adapter for Drizzle
- pg - PostgreSQL client (Pool)
- vitest - Test framework

## Used By

TBD

## Notes

- Uses direct Drizzle API instead of Effect layer since it's testing schema definitions themselves
- Requires running PostgreSQL database (uses DATABASE_URL env var or localhost default)
- Truncates auth tables before each test for isolation
- Tests CRUD operations, unique constraints, and foreign key relationships across auth tables