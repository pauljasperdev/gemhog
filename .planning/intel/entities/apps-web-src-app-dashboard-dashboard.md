---
path: /home/lima/repo/apps/web/src/app/dashboard/dashboard.tsx
type: component
updated: 2025-01-21
status: active
---

# dashboard.tsx

## Purpose

Client-side dashboard component displaying user-specific data and subscription management. Shows private API data, subscription status (Pro vs Free), and provides buttons to either upgrade to Pro or manage existing subscriptions through the Polar customer portal. Handles the payment flow UI.

## Exports

- `default Dashboard({ customerState, session }): JSX.Element` - Dashboard content with subscription controls

## Dependencies

- [[apps-web-src-components-ui-button]] - Button component for upgrade/manage actions
- [[apps-web-src-lib-auth-client]] - Auth client for checkout and portal navigation
- [[apps-web-src-utils-trpc]] - tRPC client for private data queries
- @tanstack/react-query - Data fetching via useQuery

## Used By

TBD
