# Features Research

**Project:** Gemhog - Financial Research App
**Domain:** Investment research and thesis tracking for part-time investors
**Researched:** 2026-01-19
**Overall Confidence:** MEDIUM (based on WebSearch verification with multiple sources)

## Executive Summary

The investment research app market in 2025 has matured significantly, with clear expectations from retail investors. Users expect visual data presentation (Simply Wall St's snowflake model sets the standard), powerful screening tools (Finviz's sub-second filtering), and AI-assisted analysis (becoming table stakes). However, Gemhog's unique value proposition - extracting expert theses from podcasts and presenting accessible evaluation data - has limited direct competition.

The market rewards apps that excel at 2-3 core functions rather than feature-complete platforms. Given Gemhog's target user (part-time investors seeking curated high-risk allocation ideas), the MVP should focus ruthlessly on: (1) discoverable thesis content, (2) accessible financial context, and (3) social distribution. Everything else is distraction.

Regulatory considerations are significant but manageable. As a research/education platform (not providing personalized investment advice), Gemhog operates outside Regulation Best Interest requirements. However, disclaimers, factual reporting, and "no recommendation" language are essential for social media distribution.

## Competitive Landscape

### Direct Competitors (Research/Analysis Platforms)

| Platform | Core Proposition | Relevant Features | Gemhog Differentiation |
|----------|-----------------|-------------------|------------------------|
| **Seeking Alpha** | Community-driven stock analysis | Quant ratings, analyst articles, stock screener | Gemhog curates from expert podcasts, not crowdsourced articles |
| **Simply Wall St** | Visual fundamental analysis | Snowflake visualization, 1000+ data points, global coverage | Gemhog focuses on thesis evaluation, not comprehensive fundamentals |
| **Finviz** | Speed-focused screening | 98 columns, sub-second filtering, heat maps | Gemhog is thesis-first, not screener-first |
| **Stock Analysis** | Free comprehensive data | 5,500+ stocks, instant financial updates | Gemhog adds thesis narrative layer on top of data |
| **Koyfin** | Professional-grade charts | Advanced charting, portfolio analytics | Gemhog targets part-time investors, not professionals |

### Adjacent Competitors (Podcast/Content Platforms)

| Platform | Core Proposition | Gap Gemhog Fills |
|----------|-----------------|------------------|
| **Gainify** | "AI for stocks from podcasts" | Closest competitor - but focuses on "ask AI anything" rather than curated thesis extraction |
| **Seeking Alpha Podcasts** | In-house investment podcasts | Own content, not extraction from broader podcast ecosystem |
| **Podcast apps** | General listening | No thesis extraction, no financial data integration |

### Key Insight from Competitive Analysis

No platform currently combines:
1. Expert thesis extraction from third-party podcasts
2. Accessible financial data contextualized to specific theses
3. Social distribution automation

This is Gemhog's blue ocean. The risk is that incumbents (especially Gainify or Seeking Alpha) could add podcast thesis extraction. Speed to market and content quality are the moats.

## Table Stakes Features

Features users expect from any serious financial research app. Missing these = product feels incomplete or untrustworthy.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| **Stock page with basic data** | Users expect to see P/E, market cap, price, sector when looking at a stock | Medium | Core to the product; can start with limited metrics |
| **Search/browse stocks** | "Can I find the stock I'm looking for?" | Low | Essential navigation; simple autocomplete sufficient for MVP |
| **Mobile-responsive design** | 40%+ of retail investors use mobile | Medium | Not native app, but responsive web is table stakes |
| **Clean data visualization** | Simply Wall St set the visual bar; raw tables feel dated | Medium | One clear visualization per thesis > comprehensive dashboard |
| **Clear source attribution** | "Where did this thesis come from?" | Low | Podcast name, episode, timestamp, expert name |
| **Publication date** | Financial analysis decays fast; users need recency signals | Low | Show when thesis was published, when data was updated |
| **Disclaimer/disclosure** | Regulatory expectation; builds trust | Low | "Not financial advice" prominent on every page |
| **Basic authentication** | Gated premium content needs accounts | Low | Already exists in codebase via Better-Auth |
| **Loading states/error handling** | Professional apps don't break visibly | Low | Skeleton loaders, graceful degradation |

**Confidence:** HIGH - Multiple sources confirm these expectations from retail investors in 2025.

## Differentiating Features

Features that set Gemhog apart. Not expected, but create competitive advantage.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| **Thesis extraction from podcasts** | Core differentiator - "ideas you'd miss without hours of listening" | High | Requires NLP/LLM pipeline; manual curation for MVP |
| **Thesis + evaluation pairing** | Shows both the "what" (thesis) and "how to evaluate" (data) | Medium | Unique to Gemhog; competitors do one or the other |
| **Multiple theses per stock** | Shows consensus/disagreement across experts | Low | Data model design; valuable for repeat visitors |
| **Thesis time horizon clarity** | "Is this a 12-month or 12-year play?" | Low | Critical context often missing from other platforms |
| **Social auto-posting** | Distribution channel, traffic driver | Medium | Twitter/Bluesky automation; growth lever |
| **Pros/cons/unknowns structure** | Balanced analysis format vs. bullish/bearish binary | Low | Editorial discipline, not technical complexity |
| **Expert attribution with credibility signals** | "Who said this and why should I trust them?" | Medium | Track record, role, fund affiliation where available |
| **Free discovery, paid depth** | Freemium that works (SEO + social drives free traffic) | Low | Business model, not feature complexity |

**Confidence:** MEDIUM - Based on gap analysis vs. competitors; actual user demand to be validated.

## Anti-Features (Do NOT Build)

Features to deliberately avoid, especially for MVP. Common mistakes in this domain.

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| **Buy/sell recommendations** | Regulatory nightmare (Reg BI, fiduciary duty); out of scope | "Research summaries only, user decides" |
| **Price targets or predictions** | Liability, accuracy problems, not the value prop | Present thesis + evaluation data; let user form opinion |
| **Real-time data** | Expensive, unnecessary for thesis evaluation (15-min delay fine) | Daily or near-real-time updates sufficient |
| **Comprehensive screener** | Finviz does this better; feature creep | Simple browse/search; let power users use Finviz |
| **Technical analysis/charting** | TradingView dominates; not thesis-relevant | Link out to TradingView if users want charts |
| **User-generated content/community** | Moderation burden, quality control, regulatory risk | Editorial curation only for MVP |
| **Portfolio tracking** | Many free options exist; tangential to thesis discovery | Maybe post-MVP if users demand |
| **Alerts/notifications** | Complex infrastructure; distraction from core loop | Social posts ARE the notification mechanism |
| **Options/derivatives data** | Complexity explosion; different user segment | Equities only for MVP |
| **International markets** | Data source complexity; US market large enough | US-listed stocks only for MVP |
| **Personalization/recommendations** | Regulatory risk if "personalized investment advice"; AI complexity | Curated editorial selection for all users |
| **News aggregation** | Seeking Alpha, Yahoo Finance do this; not differentiated | Link to source podcast only |
| **Earnings calendars** | Table stakes elsewhere, but not core to thesis evaluation | Can add later if valuable |
| **Compare stocks side-by-side** | Nice feature, but scope creep for MVP | Single stock pages first |

**Confidence:** HIGH - Based on regulatory research, competitive positioning, and MVP discipline principles.

## Feature Dependencies

```
                    [Authentication]
                          |
                          v
    [Stock Data Model] <------ [Thesis Data Model]
           |                          |
           v                          v
    [Stock Page UI] <-------- [Thesis Display UI]
           |                          |
           v                          v
    [Financial Data]          [Podcast Source Info]
    [Integration]             [Expert Attribution]
           |                          |
           +-----------+--------------+
                       |
                       v
              [Social Posting]
              [Automation]
                       |
                       v
              [Analytics/Traffic]
              [Tracking]
                       |
                       v
              [Freemium Paywall]
              [Premium Features]
```

### Critical Path for MVP

1. **Stock pages** require stock data model
2. **Thesis display** requires thesis data model + stock pages to live on
3. **Financial data integration** enhances stock pages (can be progressive)
4. **Social posting** requires publishable stock+thesis content
5. **Paywall** requires content worth paying for

### Parallelizable Work

- Stock data model + Thesis data model (can develop in parallel)
- UI components (can build while data models stabilize)
- Social posting automation (independent infrastructure)

## Regulatory Considerations

### What Gemhog Is (Low Regulatory Burden)

- **Educational/research content**: Presenting third-party expert opinions with financial data
- **No personalized advice**: Same content for all users; no account-specific recommendations
- **No broker-dealer activity**: Not facilitating trades
- **Self-directed user decisions**: User evaluates and decides; Gemhog provides inputs

### What Triggers Regulatory Requirements

| Activity | Regulation | Gemhog Status |
|----------|------------|---------------|
| Personalized investment recommendations | Reg BI (SEC) | NOT DOING - editorial curation, not personalized |
| Operating as broker-dealer | FINRA registration | NOT DOING - no trade facilitation |
| Managing money | RIA registration (SEC) | NOT DOING - research only |
| Testimonials/endorsements | SEC Marketing Rule | CAUTION - if featuring user testimonials, needs disclosure |
| Social media investment content | FINRA/SEC guidelines | APPLICABLE - disclaimers required |

### Required Disclaimers (MVP)

Based on SEC/FINRA guidance for social media financial content:

**On every stock page:**
```
This content is for educational purposes only and does not constitute
investment advice. Past performance does not guarantee future results.
Always do your own research and consider consulting a financial advisor
before making investment decisions.
```

**On social media posts:**
```
Educational content only. Not investment advice. DYOR.
```

**Confidence:** MEDIUM - Based on SEC/FINRA guidance; specific legal review recommended before launch.

## MVP Feature Set Recommendation

Based on research, prioritized features for Gemhog v1.0:

### Must Have (MVP Blockers)

| Feature | Rationale | Complexity |
|---------|-----------|------------|
| Stock page with basic data | Core navigation unit | Medium |
| Thesis display on stock page | Core value proposition | Medium |
| Search/browse stocks | Basic discoverability | Low |
| Disclaimer on all pages | Regulatory requirement | Low |
| Mobile-responsive design | 40%+ mobile users | Medium |
| Source attribution (podcast, expert) | Credibility and trust | Low |
| Twitter auto-posting | Primary distribution channel | Medium |

### Should Have (First Iteration After MVP)

| Feature | Rationale | Complexity |
|---------|-----------|------------|
| Bluesky auto-posting | Secondary distribution; free API | Low |
| Pros/cons/unknowns structure | Editorial quality | Low |
| Multiple theses per stock | Depth of content | Low |
| Time horizon indication | Critical investment context | Low |
| Expert credibility signals | Trust building | Medium |

### Could Have (Post-MVP If Validated)

| Feature | Rationale | Complexity |
|---------|-----------|------------|
| Freemium paywall | Monetization | Medium |
| More financial metrics | Enhanced evaluation | Medium |
| Thesis categorization (growth/value/etc.) | Discovery improvement | Low |
| Email capture for updates | Owned audience | Low |

### Won't Have (Explicit Scope Exclusion)

- User-generated content
- Portfolio tracking
- Real-time data
- Screener tools
- International markets
- Options/derivatives
- Price targets
- Buy/sell recommendations

## Sources

### Investment Research Platforms
- [Seeking Alpha Premium Review](https://ryanoconnellfinance.com/seeking-alpha-premium-review/) - HIGH confidence for feature analysis
- [Simply Wall St App Store](https://apps.apple.com/us/app/simply-wall-st-stock-analysis/id1075614972) - HIGH confidence for feature list
- [Finviz Review](https://daytradingz.com/finviz-review/) - HIGH confidence for screener features
- [Stock Analysis Best Websites](https://stockanalysis.com/article/stock-research-websites/) - MEDIUM confidence

### User Expectations
- [Best Stock Analysis Apps 2025](https://www.levelfields.ai/news/best-stock-analysis-app) - MEDIUM confidence
- [Best Investing Apps 2026](https://www.finance-monthly.com/the-7-stock-market-apps-empowering-diy-investors-in-2026-and-the-data-behind-their-edge/) - MEDIUM confidence
- [Stock Research App Guide](https://www.bitget.com/wiki/a-good-stock-app) - LOW confidence

### Regulatory Compliance
- [FINRA Social Media](https://www.finra.org/rules-guidance/key-topics/social-media) - HIGH confidence
- [SEC Marketing Rule](https://www.klgates.com/The-SECs-Modernized-Marketing-Rule-for-Investment-Advisers-1-20-2021) - HIGH confidence
- [SEC Reg BI FAQ](https://www.sec.gov/rules-regulations/staff-guidance/trading-markets-frequently-asked-questions/faq-regulation-best) - HIGH confidence

### MVP and Feature Prioritization
- [Fintech App MVP Guide](https://www.netguru.com/blog/fintech-app-mvp-in-5-weeks) - MEDIUM confidence
- [Feature Creep Prevention](https://www.pragmaticcoders.com/blog/feature-creep-is-costing-you-thousands-heres-the-fix) - MEDIUM confidence
- [Feature Bloat Avoidance](https://userpilot.com/blog/feature-bloat/) - MEDIUM confidence

### Social Distribution
- [Twitter vs Bluesky 2025](https://onlysocial.io/twitter-vs-bluesky-where-should-you-focus/) - MEDIUM confidence
- [Cross-posting Tools](https://circleboom.com/blog/how-to-cross-post-from-twitter-to-bluesky-automatically/) - LOW confidence

### Investment Thesis Documentation
- [Investment Thesis Guide](https://carta.com/learn/private-funds/management/portfolio-management/investment-thesis/) - MEDIUM confidence (VC-focused but applicable concepts)
