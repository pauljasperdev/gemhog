---
path: /home/lima/repo/packages/core/src/drizzle/index.ts
type: service
updated: 2026-01-21
status: active
---

# index.ts

## Purpose

Provides Effect layers for database access using Drizzle ORM with PostgreSQL.
This is the main entry point for database functionality, composing the Pg client
with Drizzle's query builder layer.

## Exports

- `PgLive` - Re-exported PostgreSQL client layer from ./client for direct
  database access
- `DrizzleLive` - Drizzle ORM layer composed on top of PgClient for type-safe
  queries
- `DatabaseLive` - Combined layer merging both PgLive and DrizzleLive for
  complete database functionality

## Dependencies

- `@effect/sql-drizzle/Pg` - Effect SQL Drizzle PostgreSQL integration
- `effect` - Effect library for Layer composition
- [[home-lima-repo-packages-core-src-drizzle-client]] - Internal PgLive client
  layer

## Used By

TBD

## Notes

- Uses Effect's Layer pattern for dependency injection and composition
- `DatabaseLive` is the recommended layer for application composition as it
  provides both raw Pg access and Drizzle ORM capabilities
- Follows SST-agnostic pattern: no cloud SDK imports, only Effect layers
