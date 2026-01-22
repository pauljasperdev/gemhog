---
path: /home/lima/repo/packages/core/src/drizzle/migrations.int.test.ts
type: test
updated: 2026-01-22
status: active
---

# migrations.int.test.ts

## Purpose

Integration tests that verify Drizzle ORM database migrations are correctly applied. Ensures that auth-related tables (user, session, account, verification) are created and that the migrations tracking table is properly populated.

## Exports

None

## Dependencies

- drizzle-orm (SQL template literals)
- drizzle-orm/node-postgres (PostgreSQL adapter)
- drizzle-orm/node-postgres/migrator (migration runner)
- node:path (path resolution)
- pg (PostgreSQL client pool)
- vitest (test framework)

## Used By

TBD

## Notes

- Requires `DATABASE_URL` environment variable or falls back to local PostgreSQL connection
- Migrations folder is resolved relative to the test file at `../migrations`
- Tests run against a real PostgreSQL database (integration tests, not unit tests)
- Pool connection is properly cleaned up in `afterAll` hook