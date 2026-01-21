---
path: /home/lima/repo/packages/core/src/auth/index.ts
type: module
updated: 2026-01-21
status: active
---

# index.ts

## Purpose

Barrel file that serves as the public API for the auth domain. Consolidates and re-exports authentication-related errors, services, and schema from internal modules.

## Exports

- `auth` - Main auth service instance (from auth.service)
- `getAuth` - Function to retrieve auth context (from auth.service)
- `getSession` - Function to retrieve current session (from auth.service)
- `*` from auth.errors - All authentication error types
- `schema` - Database schema namespace for auth tables (from auth.sql)

## Dependencies

- [[home-lima-repo-packages-core-src-auth-auth-errors]]
- [[home-lima-repo-packages-core-src-auth-auth-service]]
- [[home-lima-repo-packages-core-src-auth-auth-sql]]

## Used By

TBD

## Notes

This is a standard barrel/index file pattern used to control the public surface area of the auth module. Consumers should import from this file rather than directly from internal modules.