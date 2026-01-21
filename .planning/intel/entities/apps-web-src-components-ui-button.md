---
path: /home/lima/repo/apps/web/src/components/ui/button.tsx
type: component
updated: 2025-01-21
status: active
---

# button.tsx

## Purpose

Reusable button component built on Base UI with extensive variant and size options. Supports default, outline, secondary, ghost, destructive, and link variants along with multiple size presets including icon-specific sizes. Uses class-variance-authority for variant management and Tailwind for styling.

## Exports

- `Button({ className, variant, size, ...props }): JSX.Element` - Styled button component
- `buttonVariants` - CVA variant configuration for external use

## Dependencies

- [[apps-web-src-lib-utils]] - cn utility for class merging
- @base-ui/react/button - Base UI button primitive
- class-variance-authority - Variant management

## Used By

TBD
