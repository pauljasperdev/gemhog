# Gemhog

## What This Is

A research app that bridges two gaps for part-time investors:

1. **Expert insight extraction** — Digs through financial podcasts to surface the recommendations and assumptions experts make, so users don't have to listen to hours of content
2. **Financial data accessibility** — Simplifies access to the relevant financial data users need to form their own data-driven opinions

By combining discovered insights with accessible data, Gemhog reduces the knowledge gap that typically requires expensive financial consulting.

## Core Value

Find expert ideas you'd miss. Access the data to evaluate them yourself. Skip the consultant.

## Requirements

### Validated

- ✓ Monorepo structure with pnpm workspaces — existing
- ✓ Type-safe API via tRPC — existing
- ✓ User authentication via Better-Auth — existing
- ✓ PostgreSQL database with Drizzle ORM — existing
- ✓ Payment integration via Polar — existing
- ✓ Next.js frontend with shadcn/ui — existing
- ✓ Hono backend server — existing

### Active

- [ ] Testing infrastructure for agent verification workflow:
  - Static analysis: Biome lint + TypeScript strict type checking
  - Unit tests: Vitest for pure logic, mocked externals
  - Integration tests: Local Postgres Docker + Test stage AWS resources
  - E2E verification: Playwright MCP against localhost dev server
  - Verification order: static → unit → integration → Playwright MCP (fail fast, expensive last)
- [ ] SST v3 migration for AWS deployment
- [ ] Local development without SST SDK dependency (use deployed stage resources via env vars)
- [ ] Domain-driven package structure (schemas live with their domain, e.g., user.ts + user.sql.ts)
- [ ] Effect TS integration for backend (testability, DI)
- [ ] Stock pages with dynamic routes based on available data
- [ ] Thesis extraction from podcast transcripts (via podscan.fm API)
- [ ] Thesis analysis against financial data (reports, metrics)
- [ ] Cron job for transcript analysis pipeline
- [ ] Twitter/X automation for new analysis posts (free tier)
- [ ] Bluesky automation for new analysis posts (free API)
- [ ] Discovery feed of stock picks by category/strategy

### Out of Scope

- Buy/sell recommendations — regulatory and liability concerns; app provides research, user decides
- Real-time trading features — not a trading platform
- Full-time investor tools — targeting the "10% high-risk allocation" use case
- User-generated content/community — editorial curation only for MVP

## Context

**Target User:** Part-time investors who don't want boring ETFs for their entire portfolio. Looking for curated ideas for the ~10% higher-risk allocation. They lack two things: (1) time to listen to podcasts where experts share insights, and (2) easy access to the financial data needed to evaluate those insights themselves.

**The Problem We Solve:**
- Financial podcasts contain valuable expert assumptions and recommendations, but require hours to consume
- Relevant financial data exists but is scattered, complex, or locked behind expensive terminals
- Financial consultants bridge this gap, but at a cost most part-time investors can't justify
- Gemhog democratizes access to both expert insights AND the data to evaluate them

**Content Model:**
- Page per stock (not per thesis)
- Multiple theses can exist for one stock
- Analysis sits alongside theses with pros/cons/unknowns
- Financial data presented in context of the thesis being evaluated
- Time horizon considerations (12 months vs 12 years)

**What is a "Thesis":**
A thesis is an investment narrative — a reasoning chain explaining WHY a stock might perform well based on market dynamics, industry trends, or company-specific factors. Examples:
- "Global insecurities and semiconductor industry will make silver very desirable"
- "Growing data center demand benefits companies like Datadog or Snowflake"
- "Memory companies continue to benefit from sustained demand growth"

Theses are NOT financial targets or price predictions. They are market perspectives that help investors understand the reasoning behind a potential investment.

**MVP Approach:**
- Manually pick "gems" from podcast transcripts
- Minimal analysis structure (thesis + evaluation)
- Auto-post to Twitter to drive traffic
- Free discovery, paid detailed analysis comes later

**Data Source:** Podscan.fm API for podcast transcripts

**Existing Codebase:** Better-T-Stack scaffold with auth, db, api, web packages. Needs migration to SST v3 and domain-driven refactoring.

## Constraints

- **Deployment**: SST v3 on AWS — chosen for infrastructure-as-code and TypeScript-native deployment
- **Local Dev**: Apps must run locally with env vars only, no SST SDK dependency — enables fast iteration without cloud context
- **Backend Architecture**: Effect TS — required for testability and dependency injection without infrastructure hassle
- **Data Source**: Podscan.fm API — podcast transcript provider
- **Regulatory**: No investment advice — research summaries only, user makes own decisions
- **SST-agnostic application code**: App reads env vars only, no SST SDK imports — enables local dev with `pnpm dev` and agent verification without SST multiplexer
- **Test stage for external resources**: AWS resources that can't run locally (S3, etc.) use deployed Test stage via env vars in `.env` files

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| SST v3 for deployment | TypeScript-native IaC, good DX, AWS flexibility | — Pending |
| Effect TS for backend | Testability, DI, composable error handling | — Pending |
| Domain-driven packages | Colocation of schema + logic reduces cognitive load | — Pending |
| Testing infrastructure early | Fail-fast with cheap tests (static, unit, integration), Playwright MCP as final verification gate | — Pending |
| SST-agnostic app code | App reads env vars only; SST injects at deploy, `.env` files for local/test; agents verify without SST | — Pending |
| Page per stock (not per thesis) | Multiple theses aggregate on same stock over time | — Pending |
| Podscan.fm for transcripts | Existing API, reasonable coverage | — Pending |
| Twitter/X for distribution | Quick reach, free tier available, fits MVP | — Pending |
| Bluesky for distribution | Free API, growing platform, complements Twitter | — Pending |

---
*Last updated: 2026-01-19 added testing infrastructure and SST-agnostic architecture details*
