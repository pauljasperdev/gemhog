---
path: /home/lima/repo/apps/web/src/app/dashboard/page.tsx
type: component
updated: 2025-01-21
status: active
---

# page.tsx

## Purpose

Server-side rendered dashboard page that enforces authentication. Fetches the user session and customer subscription state on the server before rendering. Redirects unauthenticated users to the login page, ensuring protected content is only accessible to logged-in users.

## Exports

- `default async DashboardPage(): Promise<JSX.Element>` - Server component that validates session and renders dashboard

## Dependencies

- [[apps-web-src-lib-auth-client]] - Auth client for session and customer state retrieval
- [[apps-web-src-app-dashboard-dashboard]] - Client-side dashboard content component
- next/headers - Access to request headers for server-side auth
- next/navigation - Redirect functionality for unauthorized access

## Used By

TBD
