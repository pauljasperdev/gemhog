---
path: /home/lima/repo/packages/core/src/auth/auth.errors.ts
type: model
updated: 2025-01-21
status: active
---

# auth.errors.ts

## Purpose

Typed error definitions for the authentication domain using Effect's tagged error pattern. Defines structured errors for general auth failures, missing sessions, expired sessions, and unauthorized access. Enables pattern matching on error types in Effect pipelines.

## Exports

- `AuthError` - General authentication error with message and optional cause
- `SessionNotFoundError` - Error when session token is invalid or missing
- `SessionExpiredError` - Error when session has expired, includes sessionId and expiredAt
- `UnauthorizedError` - Error for insufficient permissions

## Dependencies

- effect - Data.TaggedError for typed error construction

## Used By

TBD
