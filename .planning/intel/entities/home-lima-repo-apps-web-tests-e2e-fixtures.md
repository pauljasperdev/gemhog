---
path: /home/lima/repo/apps/web/tests/e2e/fixtures.ts
type: test
updated: 2026-01-21
status: active
---

# fixtures.ts

## Purpose

Extends Playwright's base test fixture with automatic error detection
capabilities. Captures console errors and unhandled page exceptions during E2E
tests, failing tests when runtime errors occur that URL/visibility checks would
miss.

## Exports

- `test` - Extended Playwright test fixture that automatically tracks console
  errors and page exceptions, asserting no errors occurred after each test
- `expect` - Re-exported Playwright expect function for assertions

## Dependencies

- `@playwright/test` (external)

## Used By

TBD

## Notes

- The fixture collects errors in an array during test execution and asserts it's
  empty after `use(page)` completes
- Catches two error types: `console.error` calls and uncaught JavaScript
  exceptions (`pageerror` event)
- Error messages are pushed to the array but the current implementation has
  empty `push()` calls - this appears to be a bug where `msg.text()` and
  `error.message` should be passed
