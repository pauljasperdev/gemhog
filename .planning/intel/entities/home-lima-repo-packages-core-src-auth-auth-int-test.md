---
path: /home/lima/repo/packages/core/src/auth/auth.int.test.ts
type: test
updated: 2026-01-22
status: active
---

# auth.int.test.ts

## Purpose

Integration tests for authentication flows against a real PostgreSQL database via better-auth API. Validates signup, signin, and session management with fresh database state per test.

## Exports

None

## Dependencies

- drizzle-orm/node-postgres
- pg
- vitest
- [[home-lima-repo-packages-core-src-auth-test-fixtures]]
- [[home-lima-repo-packages-core-src-auth-auth-service]] (dynamic import)

## Used By

TBD

## Notes

- Mocks `@gemhog/env/server` to provide test environment values
- Uses dynamic import of auth.service after mock setup to ensure mocks apply
- Password hashing adds ~100-150ms per signup (expected for integration tests)
- Truncates auth tables before each test for isolation
- Tests cover: email/password signup, duplicate email rejection, signin flows