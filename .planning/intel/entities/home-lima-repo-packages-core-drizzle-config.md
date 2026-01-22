---
path: /home/lima/repo/packages/core/drizzle.config.ts
type: config
updated: 2026-01-22
status: active
---

# drizzle.config.ts

## Purpose

Configures Drizzle Kit for database migrations and schema management. Defines schema file locations, migration output directory, and PostgreSQL connection settings.

## Exports

- **default**: Drizzle Kit configuration object with schema glob, migrations output path, dialect, and database credentials
- **defineConfig**: Re-exported from drizzle-kit (used internally)

## Dependencies

- drizzle-kit: Configuration helper and CLI tool
- dotenv/config: Environment variable loading

## Used By

TBD

## Notes

- Uses dotenv directly instead of `@gemhog/env/server` to avoid validating all env vars (only DATABASE_URL is needed for migrations)
- Schema files are discovered via glob pattern `./src/*/*.sql.ts`
- Migrations output to `./src/migrations`