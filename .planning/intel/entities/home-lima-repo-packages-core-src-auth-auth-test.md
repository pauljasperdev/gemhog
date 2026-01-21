---
path: /home/lima/repo/packages/core/src/auth/auth.test.ts
type: test
updated: 2026-01-21
status: active
---

# auth.test.ts

## Purpose

Unit tests for the auth service module that verify the structure and exports of the authentication system. These are structural tests confirming that `getAuth`, `auth`, and `getSession` are properly exported with correct types.

## Exports

None

## Dependencies

- [[home-lima-repo-packages-core-src-auth-auth-service|auth.service]] - The auth service being tested
- vitest - Test framework (beforeAll, describe, expect, it, vi)

## Used By

TBD

## Notes

- Uses `vi.mock` to mock `@gemhog/env/server` before importing the auth service, avoiding real environment variable dependencies during testing
- These are structural/smoke tests only; full integration tests require an actual database connection
- The mock must be defined before importing the auth service to ensure the mock is in place when the module loads