# Gemhog

## What This Is

A podcast-to-research app that helps part-time investors discover stock theses discussed by credible voices on podcasts, then evaluates them with structured, source-backed analysis. Instead of listening to hours of podcasts, users get a discovery feed of picks and a research library with balanced briefings (pros/cons/unknowns) so they can decide for themselves.

## Core Value

Turn expert podcast discussions into actionable research summaries — find ideas you would have missed, evaluate them fast.

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

- [ ] SST v3 migration for AWS deployment
- [ ] Local development without SST SDK dependency (use deployed stage resources via env vars)
- [ ] Domain-driven package structure (schemas live with their domain, e.g., user.ts + user.sql.ts)
- [ ] Effect TS integration for backend (testability, DI)
- [ ] Stock pages with dynamic routes based on available data
- [ ] Thesis extraction from podcast transcripts (via podscan.fm API)
- [ ] Thesis analysis against financial data (reports, metrics)
- [ ] Cron job for transcript analysis pipeline
- [ ] Twitter automation for new analysis posts
- [ ] Discovery feed of stock picks by category/strategy

### Out of Scope

- Buy/sell recommendations — regulatory and liability concerns; app provides research, user decides
- Real-time trading features — not a trading platform
- Full-time investor tools — targeting the "10% high-risk allocation" use case
- User-generated content/community — editorial curation only for MVP

## Context

**Target User:** Part-time investors who don't want boring ETFs for their entire portfolio. Looking for curated ideas for the ~10% higher-risk allocation. Want to find ideas they'd miss and evaluate them quickly without hours of podcast listening.

**Content Model:**
- Page per stock (not per thesis)
- Multiple theses can exist for one stock
- Analysis sits alongside theses with pros/cons/unknowns
- Time horizon considerations (12 months vs 12 years)

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

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| SST v3 for deployment | TypeScript-native IaC, good DX, AWS flexibility | — Pending |
| Effect TS for backend | Testability, DI, composable error handling | — Pending |
| Domain-driven packages | Colocation of schema + logic reduces cognitive load | — Pending |
| Page per stock (not per thesis) | Multiple theses aggregate on same stock over time | — Pending |
| Podscan.fm for transcripts | Existing API, reasonable coverage | — Pending |
| Twitter for distribution | Quick reach, low effort, fits MVP | — Pending |

---
*Last updated: 2026-01-15 after initialization*
