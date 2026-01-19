# Research Summary: Gemhog

**Domain:** Financial research app / Investment thesis discovery
**Researched:** 2026-01-19
**Overall Confidence:** MEDIUM-HIGH

## Executive Summary

Gemhog operates in a maturing fintech research space where users expect visual data
presentation and AI-assisted analysis. The project's unique value proposition —
extracting expert investment theses from podcasts and pairing them with accessible
financial data — has limited direct competition, creating a genuine blue ocean
opportunity.

**Key strategic finding:** No current platform combines podcast thesis extraction +
evaluation data + social distribution. The closest competitor (Gainify) focuses on
"ask AI anything" rather than curated thesis presentation.

**Critical risks identified:**

1. **Regulatory classification** — Accidentally becoming an "investment adviser"
   triggers SEC registration requirements. Must maintain strict editorial (not
   advisory) model.
2. **AI hallucination** — LLMs hallucinate up to 41% in financial contexts.
   Human-in-the-loop validation is non-negotiable.
3. **Copyright liability** — 2025 rulings establish "substitutive summaries" can
   infringe. Thesis extraction methodology needs legal review.

**Stack is solid:** The already-decided stack (Next.js, Hono, tRPC, Drizzle,
Better-Auth, SST v3) is appropriate. Recommended additions: Vercel AI SDK 6 with
Claude for extraction, Financial Modeling Prep for stock data ($19/mo unlimited),
twitter-api-v2 + @atproto/api for social, SST Cron for scheduling.

---

## Key Findings by Dimension

### Stack

| Finding                           | Recommendation             | Confidence |
| --------------------------------- | -------------------------- | ---------- |
| LLM Integration                   | Vercel AI SDK 6 + Claude   | HIGH       |
| Financial Data                    | Financial Modeling Prep    | HIGH       |
| Social Automation                 | twitter-api-v2 + @atproto  | HIGH       |
| Job Scheduling                    | SST v3 Cron (native)       | HIGH       |
| Caching                           | Upstash Redis (serverless) | HIGH       |
| Anti-recommendation: LangChain    | Too complex for this use   | HIGH       |
| Anti-recommendation: Alpha Vant.  | Inferior free tier         | HIGH       |

### Features

| Category        | Key Items                                                         |
| --------------- | ----------------------------------------------------------------- |
| Table Stakes    | Stock pages, search, mobile-responsive, disclaimers, attribution  |
| Differentiators | Podcast thesis extraction, thesis+evaluation pairing, auto-social |
| Anti-Features   | Buy/sell recs, real-time data, screener, portfolio tracking       |
| MVP Must-Have   | Stock page, thesis display, search, disclaimers, Twitter posting  |

### Architecture

| Component          | Approach                                               |
| ------------------ | ------------------------------------------------------ |
| Ingestion          | SST Cron → Lambda → Podscan.fm API                     |
| Thesis Extraction  | Vercel AI SDK + Claude structured outputs              |
| Stock Resolution   | Financial data API lookup with caching                 |
| Stock Pages        | tRPC aggregator → Next.js dynamic routes               |
| Distribution       | Bluesky preferred (free), Twitter as backup            |
| Package Structure  | core/ with domain folders: auth/, stock/, thesis/, etc |

### Pitfalls

| Severity | Pitfall                   | Prevention                          |
| -------- | ------------------------- | ----------------------------------- |
| CRITICAL | Regulatory classification | Editorial model, no personalization |
| CRITICAL | AI hallucination          | Human-in-the-loop validation        |
| CRITICAL | Copyright infringement    | Extract facts, not summaries        |
| HIGH     | Twitter API restrictions  | Budget for Basic tier, conservative |
| HIGH     | Vendor security breach    | Security assessment, segmentation   |
| HIGH     | Data attribution          | Document all ToS requirements       |

---

## Implications for Roadmap

Based on research, suggested phase structure:

### Phase 1: Foundation & Infrastructure

- **Focus:** Core package consolidation, testing setup, security baseline
- **Addresses:** Foundation for all subsequent work
- **Avoids:** M4 (Payment issues), M5 (Cross-platform), L3 (Accessibility)
- **Actions:**
  - Merge db+auth into packages/core with domain folders
  - Establish disclaimer framework (C1 prevention)
  - Vendor security assessment for Polar, Podscan.fm (H2)
  - Design system with mobile-first approach

### Phase 2: Data Ingestion & Storage

- **Focus:** Podscan.fm integration, transcript storage
- **Addresses:** FEATURES table stakes (content foundation)
- **Avoids:** M3 (API dependency) via abstraction layer
- **Uses:** SST Cron for scheduling, core/transcript domain
- **Actions:**
  - Build Podscan.fm client with rate limiting
  - Store transcripts to PostgreSQL
  - Manual trigger for testing

### Phase 3: Thesis Extraction Pipeline

- **Focus:** LLM-based thesis extraction with validation
- **Addresses:** Core differentiator (FEATURES)
- **Avoids:** C2 (Hallucination), C3 (Copyright), H4 (Quality)
- **Uses:** Vercel AI SDK 6 + Claude, Zod schemas
- **Actions:**
  - Build extraction service with confidence scoring
  - Human-in-the-loop review workflow
  - Legal review of extraction methodology (C3)
  - Stock symbol resolution service

### Phase 4: Financial Data Integration

- **Focus:** Stock data for thesis evaluation
- **Addresses:** Thesis+evaluation pairing (FEATURES)
- **Avoids:** H3 (Attribution violations)
- **Uses:** Financial Modeling Prep API
- **Actions:**
  - FMP integration with attribution compliance
  - Upstash caching for API cost reduction
  - Evaluation service (pros/cons/unknowns)

### Phase 5: Stock Pages & Discovery

- **Focus:** Public-facing UI
- **Addresses:** Table stakes (FEATURES)
- **Uses:** Next.js dynamic routes, tRPC
- **Actions:**
  - Stock page aggregator
  - /stock/[symbol] dynamic route
  - Discovery feed
  - Mobile-responsive design

### Phase 6: Social Distribution

- **Focus:** Twitter/X and Bluesky automation
- **Addresses:** Distribution differentiator (FEATURES)
- **Avoids:** H1 (Twitter limits), M1 (Bluesky limits)
- **Uses:** twitter-api-v2, @atproto/api
- **Actions:**
  - Bluesky posting (primary - free API)
  - Twitter posting (secondary - budget Basic tier)
  - Conservative automation with rate monitoring

### Phase 7: Full Automation

- **Focus:** End-to-end pipeline without manual triggers
- **Addresses:** Operational efficiency
- **Uses:** SST Cron jobs, CloudWatch monitoring
- **Actions:**
  - Automated ingestion → extraction → evaluation → distribution
  - Monitoring and alerting
  - Dead letter queues for failures

---

## Phase Ordering Rationale

1. **Foundation first** — Everything depends on package structure and security
   baseline. Regulatory framework (disclaimers) must exist before any content.

2. **Ingestion before extraction** — Can't extract theses without transcripts.

3. **Extraction before stock pages** — Stock pages need content to display.

4. **Financial data before full stock pages** — Thesis+evaluation pairing is the
   differentiator; bare theses are less valuable.

5. **Stock pages before distribution** — Need destination URLs for social posts.

6. **Distribution before full automation** — Validate distribution works manually
   before automating.

---

## Research Flags for Phases

| Phase | Research Needs                                   |
| ----- | ------------------------------------------------ |
| 1     | Standard patterns, unlikely to need research     |
| 2     | Podscan.fm ToS review (derivative works allowed) |
| 3     | Legal review of extraction methodology           |
| 4     | FMP ToS for attribution requirements             |
| 5     | Standard patterns, unlikely to need research     |
| 6     | Twitter Basic tier capabilities verification     |
| 7     | Standard patterns, unlikely to need research     |

---

## Open Questions

1. **Podscan.fm ToS:** Does ToS permit derivative works from transcripts?
2. **Twitter Basic tier:** What are exact capabilities vs. higher tiers?
3. **Thesis extraction accuracy:** What's the actual accuracy with Claude + prompts?
4. **Financial metrics selection:** Which metrics most valuable for thesis evaluation?
5. **Disclaimer language:** What exact language satisfies SEC/FINRA guidance?

---

## Confidence Assessment

| Dimension    | Confidence  | Reason                                         |
| ------------ | ----------- | ---------------------------------------------- |
| Stack        | HIGH        | Official docs verified for all recommendations |
| Features     | MEDIUM      | Competitive analysis solid; user validation    |
| Architecture | MEDIUM-HIGH | Patterns verified; domain-specific is hypothe  |
| Pitfalls     | HIGH        | Authoritative legal/regulatory sources         |

---

## Files Created

| File             | Purpose                                                |
| ---------------- | ------------------------------------------------------ |
| STACK.md         | Technology recommendations with versions and rationale |
| FEATURES.md      | Feature landscape with categorization and regulatory   |
| ARCHITECTURE.md  | System components, data flows, build order             |
| PITFALLS.md      | Risk catalog with prevention strategies                |
| SUMMARY.md       | This synthesis with roadmap implications               |

---

_Last updated: 2026-01-19_
