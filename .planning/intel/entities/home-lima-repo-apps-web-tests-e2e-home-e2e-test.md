---
path: /home/lima/repo/apps/web/tests/e2e/home.e2e.test.ts
type: test
updated: 2026-01-21
status: active
---

# home.e2e.test.ts

## Purpose

End-to-end tests for the homepage using Playwright. Verifies basic page loading
and content rendering with error-detecting fixtures that capture console errors
and page exceptions.

## Exports

None

## Dependencies

- [[home-lima-repo-apps-web-tests-e2e-fixtures]] (test fixtures with error
  detection)
- @playwright/test (external - via fixtures re-export)

## Used By

TBD

## Notes

- Uses custom fixtures from `./fixtures` that extend Playwright's default test
  setup with automatic error detection
- Tests are minimal smoke tests verifying the homepage renders without errors
