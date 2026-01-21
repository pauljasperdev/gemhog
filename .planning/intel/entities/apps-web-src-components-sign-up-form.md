---
path: /home/lima/repo/apps/web/src/components/sign-up-form.tsx
type: component
updated: 2025-01-21
status: active
---

# sign-up-form.tsx

## Purpose

User registration form with name, email, and password fields. Uses TanStack Form with Zod validation for input constraints (name length, email format, password requirements). Handles submission with success/error toasts and redirects to dashboard on successful registration.

## Exports

- `default SignUpForm({ onSwitchToSignIn }): JSX.Element` - Registration form with validation

## Dependencies

- [[apps-web-src-components-ui-button]] - Submit button and switch-to-signin link
- [[apps-web-src-lib-auth-client]] - Auth client for email sign-up
- @tanstack/react-form - Form state management
- next/navigation - Router for post-signup redirect
- sonner - Toast notifications
- zod - Schema validation

## Used By

TBD
