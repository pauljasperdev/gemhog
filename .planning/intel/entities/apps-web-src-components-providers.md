---
path: /home/lima/repo/apps/web/src/components/providers.tsx
type: component
updated: 2025-01-21
status: active
---

# providers.tsx

## Purpose

Client-side providers wrapper that establishes global context for the application. Composes ThemeProvider for dark/light mode support, QueryClientProvider for React Query data fetching, ReactQueryDevtools for debugging, and Toaster for notifications. Must wrap all client components that need these contexts.

## Exports

- `default Providers({ children }): JSX.Element` - Provider composition component

## Dependencies

- [[apps-web-src-utils-trpc]] - Exports queryClient for React Query provider
- @tanstack/react-query - QueryClientProvider for data caching
- @tanstack/react-query-devtools - Development tools panel

## Used By

TBD

## Notes

ThemeProvider and Toaster components not in file list but are imported from local components.
