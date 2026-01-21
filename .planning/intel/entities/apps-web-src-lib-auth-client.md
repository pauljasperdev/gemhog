---
path: /home/lima/repo/apps/web/src/lib/auth-client.ts
type: service
updated: 2025-01-21
status: active
---

# auth-client.ts

## Purpose

Client-side authentication service configured with Better Auth and Polar payment integration. Creates a singleton auth client that connects to the backend auth API for session management, sign-in/sign-up, and subscription handling. Used throughout the web app for all auth-related operations.

## Exports

- `authClient` - Configured Better Auth client instance with Polar plugin

## Dependencies

- [[packages-env-src-web]] - Environment config for server URL
- @polar-sh/better-auth - Polar payment integration plugin
- better-auth/react - Better Auth React client factory

## Used By

TBD
