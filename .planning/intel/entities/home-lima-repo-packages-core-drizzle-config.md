---
path: /home/lima/repo/packages/core/drizzle.config.ts
type: config
updated: 2026-01-21
status: active
---

# drizzle.config.ts

## Purpose

Configures Drizzle Kit for database schema management and migrations. Defines the schema file locations, migration output directory, PostgreSQL dialect, and database connection using environment variables.

## Exports

- `default`: The Drizzle Kit configuration object created via `defineConfig`
- `defineConfig`: Re-exported from drizzle-kit (implicit via usage)

## Dependencies

- [[home-lima-repo-packages-env-src-server]]: Provides `env.DATABASE_URL` for database connection
- drizzle-kit: Schema migration tooling and `defineConfig` helper
- effect: `Redacted` type for safely unwrapping sensitive values

## Used By

TBD

## Notes

- Schema files are discovered via glob pattern `./src/*/*.sql.ts`
- Migrations output to `./src/migrations`
- Uses Effect's `Redacted.value()` to safely extract the database URL, ensuring sensitive credentials are handled properly throughout the application