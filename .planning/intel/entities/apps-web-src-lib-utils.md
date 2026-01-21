---
path: /home/lima/repo/apps/web/src/lib/utils.ts
type: util
updated: 2025-01-21
status: active
---

# utils.ts

## Purpose

Utility function for merging Tailwind CSS classes safely. Combines clsx for conditional class handling with tailwind-merge for intelligent deduplication of conflicting Tailwind utilities. Essential for building composable UI components that accept className props.

## Exports

- `cn(...inputs: ClassValue[]): string` - Merges class names with Tailwind conflict resolution

## Dependencies

- clsx - Conditional class name construction
- tailwind-merge - Tailwind-aware class deduplication

## Used By

TBD
