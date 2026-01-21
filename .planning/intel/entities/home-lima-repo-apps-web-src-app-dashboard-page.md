---
path: /home/lima/repo/apps/web/src/app/dashboard/page.tsx
type: component
updated: 2026-01-21
status: active
---

# page.tsx

## Purpose

Server-side rendered dashboard page that handles authentication gating. Fetches the user session server-side and redirects unauthenticated users to login, otherwise renders the dashboard with session data.

## Exports

- `default` (async function `DashboardPage`): Next.js page component that performs server-side auth check and renders the dashboard

## Dependencies

- `next/headers`: For forwarding request headers to auth client
- `next/navigation`: For redirect on unauthenticated access
- [[auth-client]]: Authentication client for session retrieval
- [[dashboard]]: Client-side dashboard component

## Used By

TBD

## Notes

- Uses Next.js App Router async server component pattern
- Session fetch uses `throw: true` option which will throw on auth errors
- Headers are forwarded to preserve cookies/auth tokens for server-side session validation