# Phase 2: Email Infrastructure - Context

**Gathered:** 2026-01-27
**Status:** Ready for planning

<domain>
## Phase Boundary

SES setup, subscriber database schema, double opt-in verification flow, and unsubscribe handling. Subscribers can sign up, verify their email, and unsubscribe. This phase builds the infrastructure that Phase 4 (Landing Page) connects a signup form to.

Does NOT include: landing page UI, marketing copy, cookie consent, analytics events, or scheduled email campaigns.

</domain>

<decisions>
## Implementation Decisions

### Verification emails
- Sender: `Gemhog <hello@gemhog.com>`
- Tone: Warm and on-brand — brief welcome message + confirm button, not just a bare link
- Format: Simple HTML email with styled confirm button (no plain text fallback needed)
- Confirmation link expiry: 7 days
- After confirming: Simple success page ("You're confirmed!") with link back to site
- Expired link: Show "This link has expired" with an inline email input to request a new one
- Duplicate signup (already confirmed): Silent success — show same "check your email" message, don't reveal whether the email exists (privacy-safe)
- Re-signup (unconfirmed): Resend verification email with fresh token, no rate limiting

### Subscriber data model
- Capture email only — no name or other fields at signup
- Store UTM params (utm_source, utm_medium, utm_campaign) from signup URL for attribution
- Consent records: Timestamps only (signup date + confirmation date) — double opt-in is sufficient proof, skip IP/consent text
- Status tracking: pending, active, unsubscribed

### Unsubscribe experience
- One-click instant unsubscribe — click link, immediately unsubscribed, see confirmation page
- Confirmation page: Clean goodbye ("You've been unsubscribed") with link back to site. No re-subscribe option on this page.
- RFC 8058 List-Unsubscribe-Post header: Yes — enables native unsubscribe button in Gmail/Apple Mail
- Re-subscribe allowed: If an unsubscribed person signs up again, treat as fresh opt-in (full double opt-in flow again)

### Email service architecture
- Production: SST `Email` component handles SES setup (domain from `infra/router.ts`)
- Local dev: Console log emails instead of sending — print email content to terminal for easy debugging
- Abstraction: Effect TS dependency injection — `EmailService` interface with SES implementation (live) and console implementation (dev)
- SST-agnostic: Application code reads env vars only, no SST SDK imports (per project constraint)
- Testing: Effect mock layers for unit tests, console implementation for integration tests

### Deliverability & compliance
- Send from: gemhog.com (main domain, not subdomain)
- CAN-SPAM physical address: Deferred — just leave a template slot in email footer, populate when actually sending marketing emails (Phase 4+)
- Bounce/complaint handling: Claude's discretion — handle sensibly for pre-launch volume (likely log bounces, mark subscribers inactive)

### Claude's Discretion
- Bounce and complaint notification handling strategy
- Email HTML template design details
- Database schema specifics (column types, indexes)
- Token generation approach for verification links
- Exact error handling patterns
- CAN-SPAM footer placeholder format

</decisions>

<specifics>
## Specific Ideas

- Keep implementation simple over perfectly compliant — this is pre-launch, a lot will change. Flexible system that doesn't break is more important than 100% compliance edge cases.
- Effect TS is the core pattern for dependency injection — EmailService must follow the same Effect service/layer pattern as AuthService (see `packages/core/src/auth/`)
- All new code must follow TDD (see `.planning/codebase/TESTING.md`) — tests are mandatory, not optional
- Follow existing conventions: `*.sql.ts` for schemas, `*.service.ts` for Effect services, `*.errors.ts` for tagged errors, `*.test.ts` / `*.int.test.ts` for tests
- New domain goes in `packages/core/src/email/` as sibling to `auth/` (per ARCHITECTURE.md: "Future domains added as sibling folders")
- Reference codebase docs for patterns: CONVENTIONS.md (Effect-TS patterns, error handling), TESTING.md (TDD workflow, mandatory coverage), ARCHITECTURE.md (layer structure)

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 02-email-infrastructure*
*Context gathered: 2026-01-27*
