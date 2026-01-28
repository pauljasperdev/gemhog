# Phase 3: Analytics - Context

**Gathered:** 2026-01-28
**Status:** Ready for planning

<domain>
## Phase Boundary

Posthog integration with consent-aware tracking for the landing page. Users can accept or decline analytics cookies. When accepted, Posthog tracks page views (auto-capture) and custom signup funnel events. No session replays, no server-side tracking, no PII in analytics.

</domain>

<decisions>
## Implementation Decisions

### Consent flow
- Banner appears on first page load (no delay)
- Binary accept/decline — no category granularity (single analytics tool, not worth the complexity)
- Bottom-left floating card style — less intrusive, modern feel
- Consent stored in cookie only
- Declined choice stays dismissed until cookie expires (no re-prompting)
- Footer link ("Cookie Settings") to change consent after initial choice
- Playful banner copy tone — "Would you like a cookie?" style, not formal legal language

### Event taxonomy
- Auto-capture enabled (clicks, page views) PLUS custom events for signup funnel
- Two custom signup events: `signup_started` (form submission) and `signup_completed` (verification page load)
- `signup_completed` fires when the email verification success page loads
- snake_case naming convention for all custom events
- UTM parameters captured via Posthog auto-capture (reads from URL automatically)
- Include `document.referrer` and UTM source as properties on signup events
- Errors tracked in Sentry only — no error events in Posthog
- Events only, no session replays
- Frontend-only SDK — no server-side Posthog Node SDK

### Identity & attribution
- All visitors anonymous — no `posthog.identify()` calls, no PII in analytics
- Cross-session tracking via Posthog's persistent anonymous distinct_id cookie (when consent given)
- UTM parameters auto-captured by Posthog SDK from URL
- Referrer attached to signup events for channel attribution

### Funnel design
- Three-step funnel: `landing_page_viewed` -> `signup_started` -> `signup_completed`
- Landing page views distinguished from other page views via custom event
- Dashboard created manually in Posthog UI — code only ensures events fire correctly
- No web vitals or performance tracking in Posthog

### Claude's Discretion
- Accept/decline button copy (playful tone matching "Would you like a cookie?")
- Cookie expiry duration
- Posthog initialization approach (Next.js provider pattern vs manual init)
- Consent state management implementation
- Analytics wrapper module structure (if any)

</decisions>

<specifics>
## Specific Ideas

- Banner copy should be playful: "Would you like a cookie?" — not corporate/legal language
- Keep it simple — this is a single-tool (Posthog) consent, not a multi-vendor cookie manager
- Privacy-first: no PII in analytics, anonymous tracking only, GDPR-conscious approach consistent with the double opt-in email flow

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 03-analytics*
*Context gathered: 2026-01-28*
