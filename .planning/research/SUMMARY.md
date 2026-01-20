# Project Research Summary

**Project:** Gemhog **Domain:** Financial research platform / Podcast insight
extraction for part-time investors **Researched:** 2026-01-19 **Confidence:**
HIGH

> **Scope Note (2026-01-19):** This research was conducted for the full product
> scope. The project has been rescoped to V0 (foundation) first:
>
> - **V0 (Active):** Phases 1-2 (testing infrastructure, core package
>   consolidation, Effect TS, SST deployment)
> - **V1 (Deferred):** Phases 3-7 (financial data, thesis extraction, stock
>   pages, newsletter, social distribution)
>
> See PROJECT.md for the updated scope.

## Executive Summary

Gemhog occupies a blue ocean opportunity: no competitor currently combines
podcast thesis extraction with contextualized financial data and social
distribution automation. The recommended technical approach is a **layered
architecture** with Effect TS for testable backend services, tRPC for type-safe
API boundaries, and SST v3 for AWS deployment. The critical constraint is
keeping application code SST-agnostic (env vars only) to enable local
development and agent verification.

**Critical discovery:** Stooq now requires CAPTCHA (since December 2020), making
it unsuitable for automated price fetching. Use an automated-friendly EOD price
provider (e.g., EODHD) instead, and keep the provider swappable.

**Key strategic finding:** No current platform combines podcast thesis
extraction + evaluation data + social distribution. The closest competitor
(Gainify) focuses on "ask AI anything" rather than curated thesis presentation.

**Critical risks identified:**

1. **Stooq CAPTCHA requirement** — Cannot use for automated fetching; requires
   alternative
2. **Better-Auth CVE-2025-61928** — Critical account takeover vulnerability in
   versions < 1.3.26
3. **Regulatory classification** — Accidentally becoming an "investment adviser"
   triggers SEC registration
4. **AI hallucination (41% in finance)** — Human-in-the-loop validation required
5. **SEC EDGAR XBRL complexity** — Duplicates, custom taxonomies require robust
   parsing

---

## Key Findings by Dimension

### Stack

**Critical integration finding:** tRPC and Effect Schema have a fundamental type
inference incompatibility. The solution is a pragmatic coexistence strategy.

| Technology     | Version  | Purpose                    | Key Finding                                           |
| -------------- | -------- | -------------------------- | ----------------------------------------------------- |
| Effect TS      | ^3.19.14 | Backend DI, error handling | API stable since 3.0, superior testability via Layers |
| Hono           | ^4.11.4  | HTTP framework             | Lightweight, Web Standards, native SST support        |
| tRPC           | ^11.8.1  | Type-safe API              | Requires TypeScript >=5.7.2                           |
| SST v3         | latest   | AWS deployment             | Use `environment` property for SST-agnostic app code  |
| Zod            | ^4.3.5   | tRPC validation            | Use at API boundaries                                 |
| @effect/schema | ^0.77.x  | Effect validation          | Use internally in services only                       |

**Critical rule:** Always use Zod at tRPC input/output boundaries; use Effect
Schema only internally within Effect services.

| Anti-Recommendation              | Reason                                             |
| -------------------------------- | -------------------------------------------------- |
| Stooq                            | Requires CAPTCHA since Dec 2020; use EODHD instead |
| Effect Schema at tRPC boundaries | Type inference incompatibility                     |
| SST SDK in app code              | Breaks local dev and agent verification            |
| Jest                             | Vitest is faster with native ESM support           |
| LangChain                        | Too complex for this use case                      |

### Features

| Category        | Key Items                                                                        |
| --------------- | -------------------------------------------------------------------------------- |
| Table Stakes    | Stock pages with basic data, search, mobile-responsive, disclaimers, attribution |
| Differentiators | Podcast thesis extraction, thesis+evaluation pairing, social auto-posting        |
| Anti-Features   | Buy/sell recs, real-time data, screener, portfolio tracking, personalization     |
| MVP Must-Have   | Stock page, thesis display, search, disclaimers, Twitter posting, landing page   |

**Competitive landscape:** Seeking Alpha (crowdsourced analysis), Simply Wall St
(visual snowflake), Motley Fool (stock picks), Finviz (screening), Gainify (AI
Q&A). None combine podcast thesis extraction + evaluation data.

### Architecture

Three-tier architecture with Effect TS service layer:

```
Next.js Web (tRPC Client)
         |
    Hono Server (tRPC Adapter)
         |
    Effect Service Layer
         |
    +----+----+----+
    |    |    |    |
Podscan SEC  Price LLM
  .fm  EDGAR  API  Provider
```

| Component         | Approach                                                              |
| ----------------- | --------------------------------------------------------------------- |
| Service Layer     | Effect TS with Context.Tag and Layer for DI                           |
| Provider Pattern  | Abstract SEC EDGAR + price sources behind interfaces                  |
| Pipeline          | Cron → Fetch transcripts → LLM extraction → Ticker linking → Storage  |
| tRPC Integration  | Thin routers delegating to Effect services via `runtime.runPromise()` |
| Package Structure | packages/core with domains: auth/, stock/, thesis/, transcript/       |

### Pitfalls

| Severity | Pitfall                           | Prevention                                 | Phase   |
| -------- | --------------------------------- | ------------------------------------------ | ------- |
| CRITICAL | Better-Auth CVE-2025-61928        | Verify >= 1.3.26 immediately               | Phase 1 |
| CRITICAL | Stooq CAPTCHA                     | Use EODHD or alternative                   | Phase 3 |
| CRITICAL | Investment adviser classification | Editorial model, no personalization        | Phase 1 |
| CRITICAL | AI hallucination (41%)            | Human-in-the-loop validation               | Phase 4 |
| CRITICAL | Copyright infringement            | Extract facts, not summaries; legal review | Phase 4 |
| CRITICAL | SEC EDGAR XBRL parsing            | Handle duplicates, custom taxonomies       | Phase 3 |
| HIGH     | SEC EDGAR rate limiting           | Max 8 req/sec, cache aggressively          | Phase 3 |
| HIGH     | Twitter API restrictions          | Conservative posting, 2-3/day max          | Phase 7 |
| HIGH     | AWS SES deliverability            | Double opt-in, DKIM/SPF/DMARC              | Phase 6 |

---

## Action Items Before Roadmap

1. **Update PROJECT.md:** Ensure price provider is not Stooq (use EODHD or
   alternative)
2. **Verify Better-Auth version:** Check package.json for >= 1.3.26
   (CVE-2025-61928)
3. **Legal review scope:** Identify phases needing legal input (extraction,
   disclaimers)

---

## Confidence Assessment

| Dimension    | Confidence  | Reason                                                               |
| ------------ | ----------- | -------------------------------------------------------------------- |
| Stack        | HIGH        | Verified via npm, official docs, community patterns                  |
| Features     | HIGH        | Competitive analysis, regulatory research, multiple sources          |
| Architecture | HIGH        | Effect TS patterns verified, SEC EDGAR APIs confirmed                |
| Pitfalls     | MEDIUM-HIGH | Most verified via official sources; Stooq based on community reports |

**Overall confidence:** HIGH

### Gaps to Address

- **Price provider decision:** Avoid Stooq (CAPTCHA); pick an automated-friendly
  provider (e.g., EODHD)
- **Legal review:** Extraction methodology for copyright, disclaimer language
  for regulatory
- **Better-Auth version:** Verify >= 1.3.26 before any other work

---

## Files Created

| File            | Purpose                                                                                               |
| --------------- | ----------------------------------------------------------------------------------------------------- |
| STACK.md        | Effect TS + Hono + tRPC integration patterns, versions, SST-agnostic deployment                       |
| FEATURES.md     | Feature landscape with competitive analysis, MVP definition, regulatory considerations                |
| ARCHITECTURE.md | System components with Effect service patterns, data flows, provider abstractions                     |
| PITFALLS.md     | Risk catalog with SEC EDGAR, EOD price providers, regulatory, security, and AI hallucination pitfalls |
| SUMMARY.md      | This synthesis with roadmap implications                                                              |

---

## Sources

### Primary (HIGH confidence)

- [Effect Documentation](https://effect.website/docs) — Service patterns, Layer
  composition
- [SEC EDGAR APIs](https://www.sec.gov/search-filings/edgar-application-programming-interfaces)
  — Fundamentals data
- [tRPC v11 Migration](https://trpc.io/docs/migrate-from-v10-to-v11) —
  TypeScript requirements
- [SST v3 Documentation](https://sst.dev/docs) — Deployment patterns
- [CVE-2025-61928](https://www.wiz.io/vulnerability-database/cve/cve-2025-61928)
  — Better-Auth vulnerability

### Secondary (MEDIUM confidence)

- [QuantStart Stooq Analysis](https://www.quantstart.com/articles/an-introduction-to-stooq-pricing-data/)
  — CAPTCHA requirement
- [FAITH Framework](https://arxiv.org/html/2508.05201v1) — LLM hallucination in
  finance (41%)
- Competitor platform documentation — Feature landscape analysis

---

_Last updated: 2026-01-19_ _Ready for roadmap: yes (pending EOD price provider
selection and ToS review)_
