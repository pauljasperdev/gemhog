---
path: /home/lima/repo/apps/web/src/app/layout.tsx
type: component
updated: 2025-01-21
status: active
---

# layout.tsx

## Purpose

Root layout component for the Next.js web application. Configures global fonts (Geist Sans and Mono), wraps the app in required providers (theme, query client), and establishes the base page structure with a fixed header and content area. Sets up HTML metadata and hydration suppression for theme handling.

## Exports

- `default RootLayout({ children }): JSX.Element` - Root layout component that wraps all pages

## Dependencies

- [[apps-web-src-components-header]] - Application header with navigation
- [[apps-web-src-components-providers]] - Client-side providers wrapper
- next/font/google - Geist font loading

## Used By

TBD
