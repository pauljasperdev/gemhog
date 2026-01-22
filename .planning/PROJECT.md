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

### V0 (Active) — Foundation

Goal: Make the repo restructure-ready, testable, security-checkable, and
deployable. No external product integrations yet.

- Testing infrastructure for agent verification workflow
  - Static: Biome lint + TypeScript strict type checking
  - Unit: Vitest for pure logic, mocked externals
  - Integration: Local Postgres Docker + Test-stage AWS resources (via env vars)
  - Security verification: Checklist-based review producing `SECURITY-REVIEW.md`
  - E2E verification: Playwright MCP against localhost dev server
  - Verification order: static → unit → integration → security → Playwright MCP
- Security verification as a blocking workflow gate
  - Critical/high findings block merge
  - Findings recorded in `SECURITY-REVIEW.md`; ongoing items tracked in
    `.planning/codebase/CONCERNS.md`
- SST v3 migration for AWS deployment
- Core package consolidation
  - Merge db + auth into `packages/core` with domain-driven structure
- Effect TS integration for backend (testability, dependency injection)
  - **Effect boundary:** All backend code uses Effect except auth. better-auth
    has no Effect wrapper and is HTTP-boundary code where Effect adds no value.
    Auth remains plain; revisit if Effect wrapper emerges.

### V1 (Deferred) — Features

Blocked until V0 foundation is complete.

- Stock pages with dynamic routes based on available data
- Thesis extraction from podcast transcripts (Podscan.fm API)
- Thesis analysis against financial data (reports, metrics)
- Cron job for transcript analysis pipeline
- Landing page with newsletter signup (AWS SES for delivery)
- Twitter/X automation for new analysis posts
- Bluesky automation for new analysis posts
- Discovery feed of stock picks by category/strategy

## Constraints (Non-Negotiable)

### V0 Constraints

- **SST-agnostic application code**: App code reads env vars only; no SST SDK
  imports. SST injects env vars at deploy time; local/test use `.env` files.
- **Test stage for external resources**: AWS resources that can't run locally
  (S3, SES, etc.) use a deployed Test stage via env vars.
- **Security-first development**: Validate all user input at boundaries (Zod
  schemas), enforce auth checks on protected routes, keep secrets out of code,
  audit dependencies. Security review required before merge; critical/high
  findings block deployment. See `.planning/codebase/SECURITY-CHECKLIST.md`.

### V1 Constraints

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

### Data Sources (V1)

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

_Last updated: 2026-01-19 — streamlined scope/constraints, V0 foundation active;
V1 product features deferred; replaced Stooq with EODHD (or alternative) for EOD
price data._
