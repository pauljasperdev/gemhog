# Roadmap: Gemhog V1

**Created:** 2026-01-24 **Milestone:** V1 - Launch Readiness **Total Phases:** 5

## Overview

V1 transforms Gemhog from a development scaffold into a shareable landing page
with email capture. The work flows infrastructure-first: error monitoring
(Sentry) provides visibility, then email infrastructure (SES + database) enables
signups, then analytics (Posthog) enables consent-aware tracking, then the
landing page brings it together, and finally branding/legal/auth complete launch
readiness.

## Phases

**Phase Numbering:**

- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (4.1, etc.): Inserted phases between planned phases

- [x] **Phase 1: Error Monitoring** - Sentry integration for frontend and
      backend error visibility
- [x] **Phase 2: Email Infrastructure** - SES setup, subscriber database, double
      opt-in flow
- [x] **Phase 3: Analytics** - Posthog integration with consent-aware tracking
- [x] **Phase 4: Landing Page** - Marketing page with email signup, copy, and
      cookie consent
- [x] **Phase 4.1: Resend Email Provider** - Switch email provider from AWS SES
      to Resend
- [x] **Phase 4.2: Code Review Fixes** - Address code review issues (required
      env vars, test skips, email layer cleanup)
- [ ] **Phase 5: Launch Readiness** - Branding, legal pages, SEO, and auth
      lockdown

## Phase Details

### Phase 1: Error Monitoring

**Goal:** Errors anywhere in the stack are captured and visible before we build
more features **Depends on:** Nothing (first phase) **Requirements:** MNTR-01,
MNTR-02, MNTR-03 **Success Criteria** (what must be TRUE):

1. Frontend errors appear in Sentry dashboard with readable stack traces
2. Backend/API errors appear in Sentry dashboard with request context
3. Source maps are uploaded during deploy (stack traces show original code)
4. Error boundaries display user-friendly fallback UI **Plans:** 1 plan

Plans:

- [x] 01-01-PLAN.md - Sentry SDK integration with error boundaries and SST
      secrets

### Phase 2: Email Infrastructure

**Goal:** Subscribers can sign up and verify their email, with proper
deliverability and compliance **Depends on:** Phase 1 (want error visibility for
email issues) **Requirements:** EMAIL-01, EMAIL-02, EMAIL-03, EMAIL-04,
EMAIL-05, EMAIL-06, EMAIL-07 **Success Criteria** (what must be TRUE):

1. Subscriber email is stored in database with status tracking
   (pending/active/unsubscribed)
2. Verification email arrives in inbox (not spam) with working confirmation link
3. Unsubscribe link in email successfully changes subscriber status
4. Test email can be sent via CLI/script to verify SES is working
5. Email headers include List-Unsubscribe for one-click unsubscribe **Plans:** 9
   plans

Plans:

- [x] 02-01-PLAN.md — Rename CORS_ORIGIN to APP_URL across codebase
- [x] 02-02-PLAN.md — Email domain foundation (schema, errors, token module, env
      vars)
- [x] 02-03-PLAN.md — Subscriber and email services (Effect DI, templates,
      mocks, tests)
- [x] 02-04-PLAN.md — API endpoints and status pages (subscribe, verify,
      unsubscribe flows)
- [x] 02-05-PLAN.md — SST Email infrastructure (SES, secrets, deploy)
- [x] 02-06-PLAN.md — Core package Effect-TS fixes (token, subscriber, email
      service patterns)
- [x] 02-07-PLAN.md — App layer refactor (tRPC subscriber router, server
      component pages, infra cleanup)
- [x] 02-08-PLAN.md — Gap closure: tRPC subscriber router unit tests
- [x] 02-09-PLAN.md — Gap closure: verify/unsubscribe page logic extraction and
      tests

### Phase 3: Analytics

**Goal:** User behavior is tracked (with consent) to understand landing page
performance **Depends on:** Phase 1 (error tracking for analytics issues)
**Requirements:** ANLY-01, ANLY-02, ANLY-03 **Success Criteria** (what must be
TRUE):

1. Posthog tracks page views after user accepts cookies
2. Email signup events (started, completed) appear in Posthog
3. No tracking occurs before user makes consent choice
4. Posthog dashboard shows conversion funnel (visit -> signup started ->
   completed) _(requires manual PostHog dashboard setup after project is
   provisioned; `signup_started` event wiring deferred to Phase 4)_ **Plans:** 3
   plans

Plans:

- [x] 03-01-PLAN.md -- PostHog SDK setup, cookie consent banner, and signup
      funnel events
- [x] 03-02-PLAN.md -- Gap closure: PostHogProvider race condition fix +
      person_profiles config
- [x] 03-03-PLAN.md -- Gap closure: Cookie consent + PostHog conditional
      rendering tests

### Phase 4: Landing Page

**Goal:** Visitors see a compelling marketing page and can subscribe to the
newsletter **Depends on:** Phase 2 (email infrastructure), Phase 3 (analytics
for tracking) **Requirements:** LAND-01, LAND-02, LAND-03, LAND-04, LAND-05,
LEGAL-02, LEGAL-03 **Success Criteria** (what must be TRUE):

1. Visitor sees marketing page explaining Gemhog value proposition
2. Visitor can enter email and submit signup form
3. Visitor sees confirmation message after successful signup
4. Page displays correctly on mobile devices
5. Cookie consent banner appears and controls Posthog tracking
6. Email signup form includes consent checkbox linked to privacy policy
   **Plans:** 2 plans

Plans:

- [x] 04-01-PLAN.md — Route group restructuring and DM Serif Display font setup
- [x] 04-02-PLAN.md — Landing page UI, signup form, footer, and tests

### Phase 4.1: Resend Email Provider

**Goal:** Replace AWS SES email sending with Resend SDK while preserving the
existing Effect-based email service interface **Depends on:** Phase 4
**Requirements:** EMAIL-01 (updated provider) **Success Criteria** (what must be
TRUE):

1. EmailService implementation uses Resend SDK instead of AWS SES
2. All existing email functionality (verification, unsubscribe) works with
   Resend
3. SST infrastructure updated to use Resend API key instead of SES configuration
4. Existing tests pass with updated email provider **Plans:** 2 plans

Plans:

- [x] 04.1-01-PLAN.md — Replace SES with Resend SDK in core email service,
      update env schema and callsites
- [x] 04.1-02-PLAN.md — Remove SES infrastructure, add ResendApiKey secret to
      SST config

### Phase 4.2: Code Review Fixes

**Goal:** Address all code review issues from CODE_REVIEW.md: make
RESEND_API_KEY required, remove test skips, consolidate email layer
construction, and refactor SendEmailParams **Depends on:** Phase 4.1
**Requirements:** Code review Issues 8, 9, 10, 11, 12, 13, 14 **Success
Criteria** (what must be TRUE):

1. RESEND_API_KEY is required in env schema (not optional)
2. No conditional test skips based on Node.js version in any test file
3. Email layer construction exists in exactly one shared factory
4. SendEmailParams uses content: { html, text? } for dual-format support
5. All tests (unit, integration, E2E) run and pass on Node.js 25 **Plans:** 2
   plans

Plans:

- [x] 04.2-01-PLAN.md -- Email infrastructure cleanup (required API key, layer
      consolidation, SendEmailParams refactor)
- [x] 04.2-02-PLAN.md -- Remove all Node.js 25+ test skips (integration + E2E)

### Phase 5: Launch Readiness

**Goal:** All branding, legal, and security requirements are complete for public
launch **Depends on:** Phase 4 (landing page complete) **Requirements:**
BRAND-01, BRAND-02, BRAND-03, BRAND-04, LEGAL-01, LEGAL-04, AUTH-01, AUTH-02
**Success Criteria** (what must be TRUE):

1. Browser tab shows Gemhog favicon
2. Sharing page on social media shows Open Graph preview card
3. Logo appears on landing page
4. Meta title and description appear in search results preview
5. Privacy policy page exists and is linked from signup form
6. robots.txt is accessible and configured
7. Public signup page returns 404 or redirect (not accessible)
8. Existing auth routes work for future beta users (login still functions)
   **Plans:** TBD

Plans:

- [ ] 05-01: Branding assets (favicon, OG image, logo, meta tags)
- [ ] 05-02: Legal pages and auth lockdown

## Progress

**Execution Order:** Phases execute in numeric order: 1 -> 2 -> 3 -> 4 -> 5

| Phase                     | Plans Complete | Status      | Completed  |
| ------------------------- | -------------- | ----------- | ---------- |
| 1. Error Monitoring       | 1/1            | Complete    | 2026-01-26 |
| 2. Email Infrastructure   | 9/9            | Complete    | 2026-01-28 |
| 3. Analytics              | 3/3            | Complete    | 2026-01-29 |
| 4. Landing Page           | 2/2            | Complete    | 2026-01-31 |
| 4.1 Resend Email Provider | 2/2            | Complete    | 2026-01-30 |
| 4.2 Code Review Fixes     | 2/2            | Complete    | 2026-01-31 |
| 5. Launch Readiness       | 0/2            | Not started | -          |
