---
path: /home/lima/repo/packages/core/src/drizzle/errors.ts
type: model
updated: 2025-01-21
status: active
---

# errors.ts

## Purpose

Typed error definitions for database operations using Effect's tagged error pattern. Defines structured errors for general database failures and connection-specific issues. Enables pattern matching on database errors in Effect pipelines.

## Exports

- `DatabaseError` - General database operation error with message and optional cause
- `ConnectionError` - Database connection failure with message and optional cause

## Dependencies

- effect - Data.TaggedError for typed error construction

## Used By

TBD
