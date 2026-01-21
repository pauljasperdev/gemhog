---
path: /home/lima/repo/packages/env/src/native.ts
type: config
updated: 2025-01-21
status: active
---

# native.ts

## Purpose

Environment variable configuration for Expo/React Native applications. Uses t3-env with EXPO_PUBLIC_ prefix convention to validate client-safe environment variables. Currently exposes the server URL for API communication in mobile apps.

## Exports

- `env` - Validated and typed environment object with Expo client variables

## Dependencies

- @t3-oss/env-core - Type-safe environment variable handling
- zod - Schema validation for env vars

## Used By

TBD

## Notes

Only exposes EXPO_PUBLIC_SERVER_URL, validated as a URL format.
