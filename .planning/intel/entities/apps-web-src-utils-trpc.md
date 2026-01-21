---
path: /home/lima/repo/apps/web/src/utils/trpc.ts
type: service
updated: 2025-01-21
status: active
---

# trpc.ts

## Purpose

tRPC client configuration and React Query integration for the web app. Creates a type-safe tRPC client with HTTP batching, configures React Query with error handling and toast notifications, and exports the query client for provider setup. Enables end-to-end type safety with the backend API.

## Exports

- `queryClient` - React Query client instance with error toast handling
- `trpc` - Type-safe tRPC options proxy for React Query integration

## Dependencies

- [[packages-api-src-routers-index]] - AppRouter type for type-safe client
- [[packages-env-src-web]] - Environment config for server URL
- @tanstack/react-query - Query client and cache management
- @trpc/client - tRPC client with HTTP batch link
- @trpc/tanstack-react-query - React Query adapter
- sonner - Toast notifications for query errors

## Used By

TBD

## Notes

Credentials are included in fetch requests for cross-origin cookie handling.
