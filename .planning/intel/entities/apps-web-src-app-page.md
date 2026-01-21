---
path: /home/lima/repo/apps/web/src/app/page.tsx
type: component
updated: 2025-01-21
status: active
---

# page.tsx

## Purpose

Home page component displaying the application landing page. Shows an ASCII art banner and an API health check status indicator that reflects whether the backend server is reachable. Serves as the entry point for users and a quick diagnostic view of system connectivity.

## Exports

- `default Home(): JSX.Element` - Home page component with health check display

## Dependencies

- [[apps-web-src-utils-trpc]] - tRPC client for API health check queries
- @tanstack/react-query - Data fetching and caching via useQuery

## Used By

TBD
