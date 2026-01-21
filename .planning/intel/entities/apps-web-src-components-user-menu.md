---
path: /home/lima/repo/apps/web/src/components/user-menu.tsx
type: component
updated: 2025-01-21
status: active
---

# user-menu.tsx

## Purpose

User account dropdown menu component with session-aware rendering. Shows a loading skeleton while session loads, a sign-in button when logged out, or a dropdown menu with user name, email, and sign-out action when authenticated. Handles the sign-out flow with redirect to home.

## Exports

- `default UserMenu(): JSX.Element` - User menu with session state handling

## Dependencies

- [[apps-web-src-components-ui-dropdown-menu]] - Dropdown menu primitives
- [[apps-web-src-components-ui-button]] - Button for sign-in and dropdown trigger
- [[apps-web-src-lib-auth-client]] - Auth client for session state and sign-out
- next/link - Link to login page
- next/navigation - Router for post-sign-out redirect

## Used By

TBD
