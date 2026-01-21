---
path: /home/lima/repo/apps/web/src/app/dashboard/dashboard.tsx
type: component
updated: 2026-01-21
status: active
---

# dashboard.tsx

## Purpose

Client-side dashboard component that displays private API data fetched via tRPC. Serves as the main dashboard view after user authentication.

## Exports

- `default` / `Dashboard` - React component that renders private data message from the API, accepts a session prop for authentication context

## Dependencies

- `@tanstack/react-query` - useQuery hook for data fetching
- [[home-lima-repo-apps-web-src-utils-trpc]] - tRPC client utilities
- [[home-lima-repo-apps-web-src-lib-auth-client]] - authClient type for session typing

## Used By

TBD

## Notes

- Uses `"use client"` directive for client-side rendering
- Session prop is currently unused (prefixed with underscore) but typed for future use
- Relies on tRPC's `privateData` procedure with React Query integration