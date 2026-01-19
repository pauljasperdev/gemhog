# Requirements: Gemhog V0 (Foundation)

**Defined:** 2026-01-19
**Core Value:** Make the repo restructure-ready, testable, security-checkable, and deployable

## V0 Requirements

Requirements for V0 foundation release. Each maps to roadmap phases.

### Testing Infrastructure

- [x] **TEST-01**: Static analysis (Biome + TSC) can be run via single command
- [x] **TEST-02**: Unit tests (Vitest) can be run via single command with mocked externals
- [x] **TEST-03**: Integration tests can run against local Postgres Docker container
- [x] **TEST-04**: Integration tests can run against Test-stage AWS resources via env vars
- [x] **TEST-05**: E2E tests can run via Playwright MCP against localhost dev server
- [x] **TEST-06**: All test commands have clear pass/fail exit codes for automation

### Agent Verification Workflow

- [ ] **AGENT-01**: Agent runs static analysis after every code change
- [ ] **AGENT-02**: Agent runs unit tests after every code change
- [ ] **AGENT-03**: Agent runs integration tests after structural changes (package reorganization, schema changes)
- [ ] **AGENT-04**: Agent runs security review before completing any task with code changes
- [ ] **AGENT-05**: Agent runs E2E tests (Playwright MCP) as final verification before completing a feature
- [ ] **AGENT-06**: Agent verification follows defined order: static → unit → integration → security → E2E
- [ ] **AGENT-07**: Agent workflow is documented so Claude Code/other agents know when to run which tests

### Security

- [x] **SEC-01**: Security checklist review produces `SECURITY-REVIEW.md`
- [x] **SEC-02**: Critical or high security findings block merge/deployment
- [x] **SEC-03**: Ongoing security concerns are tracked in `.planning/codebase/CONCERNS.md`

### Infrastructure

- [ ] **INFRA-01**: Application deploys to AWS via SST v3
- [ ] **INFRA-02**: Application code is SST-agnostic (reads env vars only, no SST SDK imports)
- [ ] **INFRA-03**: `packages/db` and `packages/auth` are consolidated into `packages/core` with domain-driven structure
- [ ] **INFRA-04**: Backend services use Effect TS for dependency injection and testability

## V1 Requirements (Deferred)

Deferred to V1 release after foundation is complete. Not in V0 roadmap.

### Stock Pages

- **STOCK-01**: User can view stock page with basic financial data
- **STOCK-02**: User can search/browse stocks
- **STOCK-03**: Stock pages display required disclaimers

### Thesis

- **THESIS-01**: User can view thesis extracted from podcast transcript
- **THESIS-02**: Thesis displays source attribution (podcast, episode, expert)
- **THESIS-03**: Thesis displays time horizon indication
- **THESIS-04**: Multiple theses can exist per stock

### Pipeline

- **PIPE-01**: Cron job fetches new podcast transcripts from Podscan.fm
- **PIPE-02**: LLM extracts thesis from transcript
- **PIPE-03**: Extracted thesis is linked to stock ticker
- **PIPE-04**: Human review workflow validates extracted thesis

### Distribution

- **DIST-01**: New thesis auto-posts to Twitter/X
- **DIST-02**: New thesis auto-posts to Bluesky
- **DIST-03**: Landing page captures newsletter signups
- **DIST-04**: Newsletter sends via AWS SES

### Discovery

- **DISC-01**: User can browse discovery feed of stock picks

## Out of Scope

Explicitly excluded from V0 and V1. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| Buy/sell recommendations | Regulatory nightmare (Reg BI, fiduciary duty) |
| Price targets/predictions | Liability, accuracy issues, not value prop |
| Real-time data | Expensive, unnecessary for thesis evaluation |
| Comprehensive screener | Finviz does this better; feature creep |
| Technical analysis/charting | TradingView dominates; not thesis-relevant |
| User-generated content | Moderation burden, quality control, regulatory |
| Portfolio tracking | Many free options exist; tangential to discovery |
| Alerts/notifications | Complex infrastructure; distraction |
| Options/derivatives data | Complexity explosion; different user segment |
| International markets | Data source complexity; US large enough |
| Personalization/recommendations | Regulatory risk if "personalized advice" |
| AI chat interface | Generic AI; not differentiated |
| CI/CD pipeline (GitHub Actions) | Agent workflow handles verification; CI can be added later |

## Traceability

Which phases cover which requirements. Updated by create-roadmap.

| Requirement | Phase | Status |
|-------------|-------|--------|
| TEST-01 | Phase 1 | Complete |
| TEST-02 | Phase 1 | Complete |
| TEST-03 | Phase 1 | Complete |
| TEST-04 | Phase 1 | Complete |
| TEST-05 | Phase 1 | Complete |
| TEST-06 | Phase 1 | Complete |
| SEC-01 | Phase 2 | Complete |
| SEC-02 | Phase 2 | Complete |
| SEC-03 | Phase 2 | Complete |
| INFRA-03 | Phase 3 | Pending |
| INFRA-04 | Phase 3 | Pending |
| INFRA-01 | Phase 4 | Pending |
| INFRA-02 | Phase 4 | Pending |
| AGENT-01 | Phase 5 | Pending |
| AGENT-02 | Phase 5 | Pending |
| AGENT-03 | Phase 5 | Pending |
| AGENT-04 | Phase 5 | Pending |
| AGENT-05 | Phase 5 | Pending |
| AGENT-06 | Phase 5 | Pending |
| AGENT-07 | Phase 5 | Pending |

**Coverage:**
- V0 requirements: 20 total
- Mapped to phases: 20
- Unmapped: 0 ✓

---
*Requirements defined: 2026-01-19*
*Last updated: 2026-01-19 — Phase 2 complete, SEC-01 through SEC-03 verified*
