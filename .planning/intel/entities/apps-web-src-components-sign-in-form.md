---
path: /home/lima/repo/apps/web/src/components/sign-in-form.tsx
type: component
updated: 2025-01-21
status: active
---

# sign-in-form.tsx

## Purpose

Email/password sign-in form with validation and error handling. Uses TanStack Form for form state management and Zod for validation (email format, minimum password length). Displays field-level errors, handles submission loading states, and shows toast notifications for success/failure.

## Exports

- `default SignInForm({ onSwitchToSignUp }): JSX.Element` - Sign-in form with validation

## Dependencies

- [[apps-web-src-components-ui-button]] - Submit button and switch-to-signup link
- [[apps-web-src-lib-auth-client]] - Auth client for email sign-in
- @tanstack/react-form - Form state management
- next/navigation - Router for post-login redirect
- sonner - Toast notifications
- zod - Schema validation

## Used By

TBD
