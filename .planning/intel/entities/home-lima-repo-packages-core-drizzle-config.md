---
path: /home/lima/repo/packages/core/drizzle.config.ts
type: config
updated: 2026-01-22
status: active
---

# drizzle.config.ts

## Purpose

Configuration file for Drizzle Kit, defining database schema location, migration output directory, and PostgreSQL connection settings. Enables database migrations and schema management for the core package.

## Exports

- `default` - The Drizzle Kit configuration object
- `defineConfig` - Re-exported from drizzle-kit (used internally)

## Dependencies

- [[home-lima-repo-packages-env-src-server]] - Provides `env.DATABASE_URL` for database connection
- drizzle-kit - Drizzle ORM toolkit for migrations and schema management

## Used By

TBD

## Notes

- Schema files follow the pattern `./src/*/*.sql.ts` (all `.sql.ts` files one level deep in src subdirectories)
- Migrations are output to `./src/migrations`
- Uses PostgreSQL dialect