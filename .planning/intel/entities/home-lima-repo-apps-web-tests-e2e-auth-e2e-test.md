---
path: /home/lima/repo/apps/web/tests/e2e/auth.e2e.test.ts
type: test
updated: 2026-01-22
status: active
---

# auth.e2e.test.ts

## Purpose

End-to-end tests for authentication flows including signup and signin. Uses Playwright with custom error-detecting fixtures to verify the complete user authentication experience from form submission through dashboard redirect.

## Exports

None

## Dependencies

- [[apps-web-tests-e2e-fixtures]] (test fixtures with error detection)
- @playwright/test (external - test framework)

## Used By

TBD

## Notes

- Uses `uniqueEmail()` helper to generate isolated test emails for each run, preventing cross-test conflicts
- Tests cover both happy paths (successful signup/signin) and validation errors (short password)
- Signup flow verifies redirect to `/dashboard` and welcome message display
- Signin flow creates account first, then tests sign-in with "Already have an account?" form toggle
- 10-second timeout configured for dashboard redirect expectations