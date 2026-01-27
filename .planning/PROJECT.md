# Gemhog

## What This Is

A research app that bridges two gaps for part-time investors:

1. **Expert insight extraction** — Digs through financial podcasts to surface
   the recommendations and assumptions experts make, so users don't have to
   listen to hours of content
2. **Financial data accessibility** — Simplifies access to the relevant
   financial data users need to form their own data-driven opinions

By combining discovered insights with accessible data, Gemhog reduces the
knowledge gap that typically requires expensive financial consulting.

## Core Value

Find expert ideas you'd miss. Access the data to evaluate them yourself. Skip
the consultant.

## Target User & Problem

**Target user:** Part-time investors who want curated ideas for the ~10%
higher-risk allocation of their portfolio.

**Problem:**

- Financial podcasts contain valuable expert assumptions and recommendations,
  but require hours to consume
- Relevant financial data exists but is scattered, complex, or locked behind
  expensive terminals
- Financial consultants bridge this gap, but at a cost most part-time investors
  can't justify

## Scope & Phases

### V0 (Validated) — Foundation

Completed. Established testable, deployable codebase with security gates.

- ✓ Testing infrastructure (Biome, Vitest, Playwright MCP)
- ✓ Security review docs (`SECURITY-REVIEW.md`)
- ✓ SST v3 deployment
- ✓ Core package consolidation (`packages/core`)
- ✓ Effect TS integration for backend

### V1 (Active) — Launch Readiness

Goal: Make Gemhog shareable. Landing page with email capture, monitoring, and
legal compliance. No product features yet — infrastructure for launch.

- Landing page transformation
  - Convert Next.js scaffold into marketing page
  - Email signup form for newsletter subscribers
  - Value prop: "We listen to 20 hours of investment podcasts so you don't have
    to"
- Email infrastructure
  - Subscriber storage in Postgres
  - AWS SES integration for sending
  - Unsubscribe endpoint (CAN-SPAM/GDPR compliance)
  - Double opt-in flow
- Branding & shareable assets
  - Favicon
  - Open Graph image (social preview card)
  - Logo integration (assets provided separately)
  - Meta tags (title, description)
- Legal compliance
  - Privacy policy page
  - Cookie consent (for analytics)
  - Email consent checkbox
- Analytics & monitoring
  - Posthog integration
  - Sentry error tracking
- SEO basics
  - robots.txt
  - Proper meta tags
- Auth changes
  - Hide public signup (invite-only for future beta)
  - Keep existing auth for later beta users

### V2 (Deferred) — Product Features

Blocked until V1 launch readiness is complete.

- Stock pages with dynamic routes based on available data
- Thesis extraction from podcast transcripts (Podscan.fm API)
- Thesis analysis against financial data (reports, metrics)
- Cron job for transcript analysis pipeline
- Newsletter content creation and sending
- Twitter/X automation for new analysis posts
- Bluesky automation for new analysis posts
- Discovery feed of stock picks by category/strategy
- Admin UI for subscriber management

## Constraints (Non-Negotiable)

### Foundation Constraints (from V0)

- **SST-agnostic application code**: App code reads env vars only; no SST SDK
  imports. SST injects env vars at deploy time; local/test use `.env` files.
- **Test stage for external resources**: AWS resources that can't run locally
  (S3, SES, etc.) use a deployed Test stage via env vars.
- **Security-first development**: Validate all user input at boundaries (Zod
  schemas), enforce auth checks on protected routes, keep secrets out of code,
  audit dependencies.

### V1 Constraints

- **Serverless email**: Use AWS SES directly, no hosted email services
  (Listmonk, Resend). Keep costs at $0 for low volume.
- **Free-tier monitoring**: Sentry free tier for errors, CloudWatch for logs. No
  paid observability tools.
- **No admin UI**: Subscriber management via direct database access or scripts.
  Admin dashboard deferred to V2.
- **GDPR/CAN-SPAM compliance**: Double opt-in, clear unsubscribe, privacy policy
  required before collecting emails.

### V2 Constraints

- **No investment advice**: Research summaries only; user decides.
- **US stocks only**: Scope limited to US equities for simpler sourcing and
  regulatory clarity.
- **$0 stock data APIs**: Use only free-tier data sources that allow
  public-facing display. Avoid providers requiring redistribution/display
  licensing agreements.

## Domain Notes

### Content Model

- Page per stock (not per thesis)
- Multiple theses can exist for one stock
- Analysis sits alongside theses with pros/cons/unknowns
- Financial data is presented in the context of the thesis being evaluated
- Time horizon matters (12 months vs 12 years)

### What Is a "Thesis"

A thesis is an investment narrative — a reasoning chain explaining why a stock
might perform well based on market dynamics, industry trends, or
company-specific factors.

Examples:

- "Global insecurities and semiconductor industry will make silver very
  desirable"
- "Growing data center demand benefits companies like Datadog or Snowflake"
- "Memory companies continue to benefit from sustained demand growth"

Theses are not financial targets or price predictions.

### Data Sources (V2)

- **Transcripts**: Podscan.fm API
- **Fundamentals**: SEC EDGAR (XBRL from 10-K/10-Q filings) — free,
  authoritative, no redistribution concerns
- **Price context**: EODHD (or another automated-friendly EOD provider). Avoid
  Stooq for automation due to CAPTCHA.
- **Architecture**: Provider abstraction layer so sources can be swapped later
  without major refactors

## Out of Scope

- Buy/sell recommendations — regulatory and liability concerns; app provides
  research, user decides
- Real-time trading features — not a trading platform
- Full-time investor tools — targeting the "10% high-risk allocation" use case
- User-generated content/community — editorial curation only for MVP

---

_Last updated: 2026-01-24 — V0 validated; V1 (launch readiness) now active;
product features moved to V2._
