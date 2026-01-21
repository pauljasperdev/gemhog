---
path: /home/lima/repo/packages/core/src/auth/index.ts
type: module
updated: 2025-01-21
status: active
---

# index.ts

## Purpose

Public API barrel file for the auth domain. Re-exports all authentication-related types, errors, services, mocks, and database schema from the auth module. Provides a clean import path for consumers while encapsulating internal implementation details.

## Exports

- `AuthError`, `SessionNotFoundError`, `SessionExpiredError`, `UnauthorizedError` - Auth error types
- `AuthServiceTest`, `AuthServiceTestUnauthenticated` - Test mocks
- `AuthLive`, `AuthService`, `auth` - Service implementation and Effect layers
- `schema` - Database schema namespace

## Dependencies

- [[packages-core-src-auth-auth-errors]] - Error type definitions
- [[packages-core-src-auth-auth-mock]] - Test layer implementations
- [[packages-core-src-auth-auth-service]] - Service implementation
- [[packages-core-src-auth-auth-sql]] - Database schema

## Used By

TBD
