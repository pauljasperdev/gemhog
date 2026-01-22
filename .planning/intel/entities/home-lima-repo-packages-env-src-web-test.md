---
path: /home/lima/repo/packages/env/src/web.test.ts
type: test
updated: 2026-01-22
status: active
---

# web.test.ts

## Purpose

Tests the web environment validation module to ensure NEXT_PUBLIC_SERVER_URL is properly validated. Verifies that the env module rejects missing, empty, or invalid URLs while accepting valid ones.

## Exports

None

## Dependencies

- vitest (testing framework)
- [[home-lima-repo-packages-env-src-web]] (module under test)

## Used By

TBD

## Notes

- Uses dynamic imports to test module-level validation that runs at import time
- Resets modules between tests to ensure fresh validation on each import
- Preserves and restores original process.env to avoid test pollution