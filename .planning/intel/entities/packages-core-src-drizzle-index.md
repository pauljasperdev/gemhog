---
path: /home/lima/repo/packages/core/src/drizzle/index.ts
type: module
updated: 2025-01-21
status: active
---

# index.ts

## Purpose

Public API barrel file for the Drizzle database layer. Exports composed Effect layers for database access including PgLive for PostgreSQL connections and DrizzleLive for the Drizzle ORM layer. Also re-exports error types for database error handling.

## Exports

- `DrizzleLive` - Effect Layer for Drizzle ORM (composed on PgLive)
- `DatabaseLive` - Combined layer merging PgLive and DrizzleLive
- `PgLive` - Effect Layer for PostgreSQL client connection

## Dependencies

- [[packages-core-src-drizzle-client]] - PgLive layer for database connection
- [[packages-core-src-drizzle-errors]] - Database error types
- @effect/sql-drizzle/Pg - Effect SQL Drizzle integration
- effect - Layer for composition

## Used By

TBD
