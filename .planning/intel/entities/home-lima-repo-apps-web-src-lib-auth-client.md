---
path: /home/lima/repo/apps/web/src/lib/auth-client.ts
type: util
updated: 2026-01-21
status: active
---

# auth-client.ts

## Purpose

Creates and exports a configured Better Auth client for the web application. This client handles authentication operations (login, logout, session management) by communicating with the backend auth server.

## Exports

- `authClient` - Configured Better Auth client instance initialized with the server URL from environment variables

## Dependencies

- [[home-lima-repo-packages-env-src-web]] - Provides `env.NEXT_PUBLIC_SERVER_URL` for configuring the auth client's base URL
- `better-auth/react` - External library providing `createAuthClient` for React-based authentication

## Used By

TBD

## Notes

- The client is configured with a single option (`baseURL`) pointing to the backend server
- This is the sole auth client instance for the web app - all components should import from here rather than creating their own clients
- Environment variable `NEXT_PUBLIC_SERVER_URL` must be set for the client to function correctly