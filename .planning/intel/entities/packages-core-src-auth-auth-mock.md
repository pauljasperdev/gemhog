---
path: /home/lima/repo/packages/core/src/auth/auth.mock.ts
type: test
updated: 2025-01-21
status: active
---

# auth.mock.ts

## Purpose

Test mock implementations of the AuthService for unit testing. Provides two layers: AuthServiceTest returns a mock authenticated session with test user data, and AuthServiceTestUnauthenticated returns null for testing unauthenticated flows. Enables isolated testing without real auth infrastructure.

## Exports

- `AuthServiceTest` - Effect Layer with mock authenticated session
- `AuthServiceTestUnauthenticated` - Effect Layer returning null session

## Dependencies

- [[packages-core-src-auth-auth-service]] - AuthService tag for layer creation
- effect - Effect and Layer for mock construction

## Used By

TBD

## Notes

Mock user has id "test-user-id", email "test@example.com", name "Test User".
