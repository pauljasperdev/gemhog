---
path: /home/lima/repo/packages/core/src/auth/test-fixtures.ts
type: test
updated: 2026-01-22
status: active
---

# test-fixtures.ts

## Purpose

Provides test fixtures and utilities for auth integration tests. Contains helpers to truncate auth tables between tests and create test user data for signup operations.

## Exports

- `truncateAuthTables` - Async function that truncates all auth-related tables with CASCADE, preserving __drizzle_migrations table
- `createTestUser` - Factory function that creates test user input data (does not insert into database)
- `TestUserInput` - Interface defining the shape of test user data (email, password, name)

## Dependencies

- `drizzle-orm` - ORM for database operations (sql template tag)
- `drizzle-orm/node-postgres` - NodePgDatabase type for Postgres connections

## Used By

TBD

## Notes

- `truncateAuthTables` uses CASCADE to handle foreign key dependencies automatically
- `createTestUser` generates deterministic test data with sensible defaults that can be overridden
- These fixtures are designed for integration tests, not unit tests