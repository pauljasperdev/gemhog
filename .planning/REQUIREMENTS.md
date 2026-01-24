# Requirements: Gemhog V1

**Defined:** 2026-01-24
**Core Value:** Find expert ideas you'd miss. Access the data to evaluate them yourself. Skip the consultant.

## V1 Requirements

Requirements for launch readiness. Landing page with email capture, monitoring, and legal compliance.

### Landing Page

- [ ] **LAND-01**: Visitor sees marketing page explaining Gemhog value proposition
- [ ] **LAND-02**: Visitor can enter email address to subscribe to newsletter
- [ ] **LAND-03**: Visitor receives confirmation that signup was successful
- [ ] **LAND-04**: Page is mobile-responsive
- [ ] **LAND-05**: Landing page has compelling copy (headline, value prop, CTA)

### Email Infrastructure

- [ ] **EMAIL-01**: Subscriber email is stored in Postgres with status tracking
- [ ] **EMAIL-02**: Subscriber receives verification email after signup (double opt-in)
- [ ] **EMAIL-03**: Subscriber can click verification link to confirm subscription
- [ ] **EMAIL-04**: Subscriber can unsubscribe via link in any email
- [ ] **EMAIL-05**: AWS SES is configured with DKIM/SPF for deliverability
- [ ] **EMAIL-06**: Test email can be sent to verify setup works
- [ ] **EMAIL-07**: Emails include List-Unsubscribe header for one-click unsubscribe

### Branding

- [ ] **BRAND-01**: Favicon is displayed in browser tab
- [ ] **BRAND-02**: Open Graph image shows when page is shared on social media
- [ ] **BRAND-03**: Logo is displayed on landing page
- [ ] **BRAND-04**: Meta title and description are set for SEO

### Legal/Compliance

- [ ] **LEGAL-01**: Privacy policy page exists and is linked from signup form
- [ ] **LEGAL-02**: Cookie consent is handled (via Posthog or custom banner)
- [ ] **LEGAL-03**: Email signup includes consent checkbox
- [ ] **LEGAL-04**: robots.txt is configured

### Analytics

- [ ] **ANLY-01**: Posthog tracks page views after cookie consent
- [ ] **ANLY-02**: Email signup events are tracked (started, completed)
- [ ] **ANLY-03**: Posthog respects cookie consent (no tracking until accepted)

### Monitoring

- [ ] **MNTR-01**: Sentry captures frontend errors
- [ ] **MNTR-02**: Sentry captures backend/API errors
- [ ] **MNTR-03**: Source maps are uploaded for readable stack traces

### Auth Changes

- [ ] **AUTH-01**: Public signup page is hidden (not accessible)
- [ ] **AUTH-02**: Existing auth routes still work for future beta users

## V2 Requirements

Deferred to next milestone. Tracked but not in current roadmap.

### Admin & Management

- **ADMIN-01**: Admin UI for viewing subscriber list
- **ADMIN-02**: Admin can send test emails from UI
- **ADMIN-03**: Admin can create user segments (power users, beta testers)

### Newsletter Content

- **NEWS-01**: Admin can compose newsletter content
- **NEWS-02**: Admin can send newsletter to all subscribers
- **NEWS-03**: Admin can schedule newsletter sends

### Product Features

- **PROD-01**: Stock pages with thesis display
- **PROD-02**: Thesis extraction from podcast transcripts
- **PROD-03**: Social automation (Twitter/X, Bluesky)

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| Full email marketing platform | Complexity; only need basic newsletter |
| A/B testing for emails | Overkill for initial launch |
| Self-hosted Posthog | Infrastructure burden; Cloud free tier sufficient |
| Complex user segmentation | Basic groups sufficient for V1 |
| Real-time analytics dashboard | Posthog Cloud dashboard is enough |
| Multiple email templates | One verification + one newsletter template sufficient |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| LAND-01 | TBD | Pending |
| LAND-02 | TBD | Pending |
| LAND-03 | TBD | Pending |
| LAND-04 | TBD | Pending |
| LAND-05 | TBD | Pending |
| EMAIL-01 | TBD | Pending |
| EMAIL-02 | TBD | Pending |
| EMAIL-03 | TBD | Pending |
| EMAIL-04 | TBD | Pending |
| EMAIL-05 | TBD | Pending |
| EMAIL-06 | TBD | Pending |
| EMAIL-07 | TBD | Pending |
| BRAND-01 | TBD | Pending |
| BRAND-02 | TBD | Pending |
| BRAND-03 | TBD | Pending |
| BRAND-04 | TBD | Pending |
| LEGAL-01 | TBD | Pending |
| LEGAL-02 | TBD | Pending |
| LEGAL-03 | TBD | Pending |
| LEGAL-04 | TBD | Pending |
| ANLY-01 | TBD | Pending |
| ANLY-02 | TBD | Pending |
| ANLY-03 | TBD | Pending |
| MNTR-01 | TBD | Pending |
| MNTR-02 | TBD | Pending |
| MNTR-03 | TBD | Pending |
| AUTH-01 | TBD | Pending |
| AUTH-02 | TBD | Pending |

**Coverage:**
- V1 requirements: 28 total
- Mapped to phases: 0 (pending roadmap)
- Unmapped: 28

---
*Requirements defined: 2026-01-24*
*Last updated: 2026-01-24 after initial definition*
