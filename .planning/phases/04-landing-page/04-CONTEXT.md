# Phase 4: Landing Page - Context

**Gathered:** 2026-01-29 **Status:** Ready for planning

<domain>
## Phase Boundary

Marketing landing page with email signup form that converts visitors to
newsletter subscribers. Replaces the current home page (/). Includes minimal
footer with privacy/cookie links. Cookie consent banner and email infrastructure
already exist from Phases 2-3.

</domain>

<decisions>
## Implementation Decisions

### Page structure

- Hero-only page — no sections below the hero, ultra minimal
- No header/nav bar — content only
- Centered column layout (max ~600px), vertically centered on screen
- Dark background with light text
- Minimal footer: copyright + privacy policy link + cookie settings button (one
  line)
- Replaces current `/` route (home page)

### Signup form

- Inline layout — email input + submit button on one line
- On success: form replaced with "Check your inbox" confirmation message in
  place
- Errors display inline below the input field (red text)
- Small privacy consent text below form (no checkbox) — friendly tone, mentions
  privacy policy link
- Form uses existing tRPC `subscriber.subscribe` mutation from Phase 2

### Visual tone

- Between premium-minimal and warm-approachable — Linear's clarity but with more
  personality, avoiding sterile AI-generated aesthetic
- Dark background, emerald/green accent color for buttons and interactive
  elements
- Reference site: polar.sh

### Copy

- H1: "We listen to financial podcasts so you don't have to"
- Subheadline: "Investment ideas, trends, and expert takes — delivered to your
  inbox."
- CTA button: "Get the free newsletter"
- Confirmation: "Check your inbox to confirm your subscription."
- Tone: casual & direct, conversational, no jargon

### Claude's Discretion

- Typography selection (use `/web-design-guidelines` and `/frontend-design`
  skills)
- Exact font pairing and sizing
- Loading/submitting state design
- Privacy consent text wording (friendly tone, not the exact "No spam,
  unsubscribe anytime" example — write something that fits)
- Footer styling details
- Dark background shade and gradient/texture treatment
- Exact spacing, padding, and responsive breakpoints
- Form validation UX details (debounce, focus states)

</decisions>

<specifics>
## Specific Ideas

- Reference: polar.sh — like the overall feel of their landing page
- The visual direction should split the difference between Linear/Vercel
  minimalism and warmer approachable design — clean but not cold
- Emerald/green accent evokes growth and investment themes
- The h1/subheadline/CTA copy is locked — use exactly as specified

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

_Phase: 04-landing-page_ _Context gathered: 2026-01-29_
