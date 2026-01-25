# Phase 1: Error Monitoring - Context

**Gathered:** 2026-01-25
**Status:** Ready for planning

<domain>
## Phase Boundary

Sentry integration for frontend and backend error visibility. Errors anywhere in the stack are captured and visible before building more features. Source maps uploaded during deploy so stack traces show original code.

</domain>

<decisions>
## Implementation Decisions

### Error Boundaries UI
- Dev mode: show full stack trace + React component tree for debugging
- Production: minimal "Something went wrong" message with retry button only
- No feedback form — Sentry captures everything automatically
- Section-level boundaries: wrap key UI sections separately so one crashing component doesn't take down the whole page

### Alert Configuration
- Email notifications only (no Slack integration for now)
- Alert on every new error type (first occurrence of each issue)
- Individual alerts, not digests
- Production environment only — dev errors are expected and don't need alerts

### Error Context
- Session ID included (not user ID) — enables session correlation without PII in Sentry
- Standard Sentry device context: browser, OS, device type (auto-captured)
- Full URL and route params included — know exactly where errors happen
- Breadcrumbs enabled: track clicks and navigation leading to error

### Filtering Rules
- Filter browser extension errors (standard patterns for ad blockers, password managers, etc.)
- Capture all network errors (API failures, timeouts) — useful for debugging
- Filter errors from old browsers (reasonable baseline support)
- Apply standard ignore patterns for known noisy errors (ResizeObserver, ChunkLoadError, etc.)

### Claude's Discretion
- Exact error boundary placement based on UI structure
- Specific browser version thresholds for filtering
- Specific extension error patterns to filter
- Which noisy errors to add to ignore list

</decisions>

<specifics>
## Specific Ideas

- Keep it practical: manual verification (trigger test error, see it in Sentry) rather than automated Sentry integration tests
- Don't overengineer — standard Sentry config patterns, not custom solutions
- Session ID over user ID follows privacy-conscious best practice

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 01-error-monitoring*
*Context gathered: 2026-01-25*
