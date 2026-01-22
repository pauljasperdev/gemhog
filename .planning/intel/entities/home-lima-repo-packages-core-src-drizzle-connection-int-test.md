---
path: /home/lima/repo/packages/core/src/drizzle/connection.int.test.ts
type: test
updated: 2026-01-22
status: active
---

# connection.int.test.ts

## Purpose

Integration tests for PostgreSQL database connection using Effect-based SQL client. Verifies that the PgClient layer can successfully connect to the database and execute basic queries.

## Exports

None

## Dependencies

- @effect/sql (SqlClient)
- @effect/sql-pg (PgClient)
- @effect/vitest (expect, layer)
- effect (Effect, Redacted)
- vitest (describe)

## Used By

TBD

## Notes

- Uses `PgClient.layer()` instead of `PgClient.layerConfig()` for test isolation with explicit URL configuration
- Falls back to default local PostgreSQL connection string if `DATABASE_URL` environment variable is not set
- Tests verify both basic query execution (`SELECT 1`) and timestamp parsing behavior (`NOW()` returns JavaScript Date)