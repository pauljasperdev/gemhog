---
path: /home/lima/repo/packages/core/src/drizzle/client.ts
type: service
updated: 2025-01-21
status: active
---

# client.ts

## Purpose

PostgreSQL client configuration using Effect SQL. Creates an Effect Layer that establishes a database connection using the DATABASE_URL environment variable. Uses Effect's Config.redacted to safely handle the connection string as sensitive data.

## Exports

- `PgLive` - Effect Layer providing PostgreSQL client connection

## Dependencies

- @effect/sql-pg - Effect PostgreSQL client
- effect - Config for environment variable reading

## Used By

TBD

## Notes

URL is read at layer construction time via Config, not at import time.
