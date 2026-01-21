# Feature Research

**Domain:** Financial research platform for part-time investors **Researched:**
2026-01-19 **Confidence:** HIGH (multiple verified sources, competitive
analysis, regulatory research)

## Executive Summary

The investment research app market in 2025-2026 has matured significantly, with
clear expectations from retail investors. Users expect visual data presentation
(Simply Wall St's snowflake model sets the standard), powerful screening tools
(Finviz's sub-second filtering), and AI-assisted analysis (becoming table
stakes). However, Gemhog's unique value proposition - extracting expert theses
from podcasts and presenting accessible evaluation data - has limited direct
competition.

The market rewards apps that excel at 2-3 core functions rather than
feature-complete platforms. Given Gemhog's target user (part-time investors
seeking curated high-risk allocation ideas), the MVP should focus ruthlessly on:
(1) discoverable thesis content, (2) accessible financial context, and (3)
social distribution. Everything else is distraction.

Regulatory considerations are significant but manageable. As a
research/education platform (not providing personalized investment advice),
Gemhog operates outside Regulation Best Interest requirements. However,
disclaimers, factual reporting, and "no recommendation" language are essential
for social media distribution.

---

## Competitive Landscape

### Direct Competitors (Research/Analysis Platforms)

| Platform           | Core Proposition                | Key Features                                                  | Gemhog Differentiation                                        |
| ------------------ | ------------------------------- | ------------------------------------------------------------- | ------------------------------------------------------------- |
| **Seeking Alpha**  | Community-driven stock analysis | Quant ratings (5 factors), 7000+ contributors, earnings calls | Gemhog curates from expert podcasts, not crowdsourced         |
| **Simply Wall St** | Visual fundamental analysis     | Snowflake visualization, 5-criteria scoring, portfolio view   | Gemhog focuses on thesis evaluation, not comprehensive scores |
| **Finviz**         | Speed-focused screening         | 500+ filters, sub-second filtering, heat maps, free tier      | Gemhog is thesis-first, not screener-first                    |
| **Yahoo Finance**  | General finance destination     | Bronze/Silver/Gold tiers, compare mode, 150M+ monthly users   | Gemhog provides curated depth, not breadth                    |
| **Motley Fool**    | Stock picks with track record   | 2 picks/month, 67% win rate, 5-year hold philosophy           | Gemhog shows evaluation data, not just picks                  |
| **Gainify**        | AI-powered stock research       | AI queries, earnings call summaries, 500+ screener filters    | Closest competitor - but generic AI, not podcast thesis focus |
| **Stock Analysis** | Free comprehensive data         | 5,500+ stocks, instant financial updates                      | Gemhog adds thesis narrative layer                            |
| **Koyfin**         | Professional-grade analytics    | Advanced charting, portfolio analytics                        | Gemhog targets part-time, not professionals                   |
| **Stockopedia**    | Rules-based investing           | StockRanks (quality/value/momentum), UK-focused               | Gemhog targets US market, thesis-driven                       |

### Competitor Pricing Landscape

| Platform       | Free Tier              | Paid Tier                | Key Paid Features                         |
| -------------- | ---------------------- | ------------------------ | ----------------------------------------- |
| Seeking Alpha  | Limited articles, ads  | $299/year ($269 w/ deal) | Unlimited articles, quant ratings, alerts |
| Simply Wall St | Limited stocks         | ~$120/year               | Unlimited snowflakes, portfolio tracking  |
| Finviz         | Delayed data, ads      | $299.50/year             | Real-time data, exports, alerts           |
| Yahoo Finance  | Basic features         | $35-70/month             | Premium screeners, charts, 40yr history   |
| Motley Fool    | Editorial content only | $99/year (intro)         | 2 stock picks/month, portfolio guidance   |
| Gainify        | 10 AI queries/month    | $8-37/month              | More AI queries, extended valuation data  |

### Key Insight from Competitive Analysis

No platform currently combines:

1. Expert thesis extraction from third-party podcasts
2. Accessible financial data contextualized to specific theses
3. Social distribution automation

This is Gemhog's blue ocean. The risk is that incumbents (especially Gainify or
Seeking Alpha) could add podcast thesis extraction. Speed to market and content
quality are the moats.

---

## Table Stakes Features

Features users expect from any serious financial research app. Missing these =
product feels incomplete or untrustworthy.

| Feature                        | Why Expected                                             | Complexity | Notes                                                |
| ------------------------------ | -------------------------------------------------------- | ---------- | ---------------------------------------------------- |
| **Stock page with basic data** | Users expect to see P/E, market cap, price, sector       | Medium     | Core navigation unit; can start with limited metrics |
| **Search/browse stocks**       | "Can I find the stock I'm looking for?"                  | Low        | Essential navigation; autocomplete sufficient        |
| **Mobile-responsive design**   | 40%+ of retail investors use mobile                      | Medium     | Not native app, but responsive web is table stakes   |
| **Clean data visualization**   | Simply Wall St set the visual bar; raw tables feel dated | Medium     | One clear viz per thesis > comprehensive dashboard   |
| **Clear source attribution**   | "Where did this thesis come from?"                       | Low        | Podcast name, episode, timestamp, expert name        |
| **Publication date**           | Financial analysis decays fast; recency signals required | Low        | Show when thesis published, when data updated        |
| **Disclaimer/disclosure**      | Regulatory expectation; builds trust                     | Low        | "Not financial advice" prominent on every page       |
| **Basic authentication**       | Gated premium content needs accounts                     | Low        | Already exists via Better-Auth                       |
| **Loading states**             | Professional apps don't break visibly                    | Low        | Skeleton loaders, graceful degradation               |
| **HTTPS/security basics**      | Financial data = trust requirement                       | Low        | SSL, secure cookies, standard web security           |

**Confidence:** HIGH - Multiple sources confirm these expectations from retail
investors.

---

## Differentiating Features

Features that set Gemhog apart. Not expected, but create competitive advantage.

| Feature                              | Value Proposition                                       | Complexity | Notes                                           |
| ------------------------------------ | ------------------------------------------------------- | ---------- | ----------------------------------------------- |
| **Thesis extraction from podcasts**  | Core differentiator - "ideas you'd miss"                | High       | NLP/LLM pipeline; manual curation for MVP       |
| **Thesis + evaluation pairing**      | Shows both "what" (thesis) and "how to evaluate" (data) | Medium     | Unique; competitors do one or the other         |
| **Multiple theses per stock**        | Shows consensus/disagreement across experts             | Low        | Data model design; valuable for repeat visitors |
| **Thesis time horizon clarity**      | "Is this a 12-month or 12-year play?"                   | Low        | Critical context often missing elsewhere        |
| **Pros/cons/unknowns structure**     | Balanced analysis vs. bullish/bearish binary            | Low        | Editorial discipline, not technical complexity  |
| **Expert attribution + credibility** | "Who said this and why trust them?"                     | Medium     | Track record, role, fund affiliation            |
| **Social auto-posting**              | Distribution channel, traffic driver                    | Medium     | Twitter/Bluesky automation; growth lever        |
| **Free discovery, paid depth**       | Freemium that works (SEO + social drives traffic)       | Low        | Business model, not feature complexity          |
| **Newsletter for owned audience**    | Build audience before full product                      | Low        | AWS SES; capture interest early                 |

**Confidence:** MEDIUM - Based on gap analysis; actual user demand to be
validated.

---

## Anti-Features (Do NOT Build)

Features to deliberately avoid, especially for MVP. Common mistakes in this
domain.

| Anti-Feature                        | Why Requested                | Why Problematic                                  | Alternative                                 |
| ----------------------------------- | ---------------------------- | ------------------------------------------------ | ------------------------------------------- |
| **Buy/sell recommendations**        | Users want actionable advice | Regulatory nightmare (Reg BI, fiduciary duty)    | "Research summaries only, user decides"     |
| **Price targets/predictions**       | Feels like "real" analysis   | Liability, accuracy issues, not value prop       | Present thesis + evaluation data            |
| **Real-time data**                  | Seems professional           | Expensive, unnecessary for thesis eval           | Daily or near-real-time (15-min delay fine) |
| **Comprehensive screener**          | Power users want filtering   | Finviz does this better; feature creep           | Simple browse/search; link to Finviz        |
| **Technical analysis/charting**     | Traders expect charts        | TradingView dominates; not thesis-relevant       | Link out to TradingView                     |
| **User-generated content**          | Community engagement         | Moderation burden, quality control, regulatory   | Editorial curation only for MVP             |
| **Portfolio tracking**              | Users want convenience       | Many free options exist; tangential to discovery | Maybe post-MVP if users demand              |
| **Alerts/notifications**            | Engagement mechanism         | Complex infrastructure; distraction              | Social posts ARE the notification           |
| **Options/derivatives data**        | Sophisticated users want it  | Complexity explosion; different user segment     | Equities only for MVP                       |
| **International markets**           | Global reach                 | Data source complexity; US large enough          | US-listed stocks only for MVP               |
| **Personalization/recommendations** | Netflix-style "for you"      | Regulatory risk if "personalized advice"         | Curated editorial for all users             |
| **News aggregation**                | Seems comprehensive          | Seeking Alpha, Yahoo do this; not differentiated | Link to source podcast only                 |
| **Earnings calendars**              | Useful for active investors  | Table stakes elsewhere; not core to thesis       | Add later if valuable                       |
| **Compare stocks side-by-side**     | Evaluation tool              | Nice but scope creep for MVP                     | Single stock pages first                    |
| **Watchlists with alerts**          | Personal organization        | Requires accounts, notification infra            | Defer to v1.x                               |
| **AI chat interface**               | Gainify has this             | Generic AI; not differentiated                   | Curated thesis extraction instead           |

**Confidence:** HIGH - Based on regulatory research, competitive positioning,
and MVP discipline.

---

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
              [Landing Page +]
              [Newsletter]
                       |
                       v
              [Freemium Paywall]
              [Premium Features]
```

### Critical Path for MVP

1. **Stock pages** require stock data model
2. **Thesis display** requires thesis data model + stock pages to exist
3. **Financial data integration** enhances stock pages (can be progressive)
4. **Social posting** requires publishable stock+thesis content
5. **Newsletter** requires landing page
6. **Paywall** requires content worth paying for

### Parallelizable Work

- Stock data model + Thesis data model (parallel development)
- UI components (build while data models stabilize)
- Social posting automation (independent infrastructure)
- Newsletter/landing page (independent of core product)

---

## Regulatory Considerations

### What Gemhog Is (Low Regulatory Burden)

- **Educational/research content**: Presenting third-party expert opinions with
  financial data
- **No personalized advice**: Same content for all users; no account-specific
  recommendations
- **No broker-dealer activity**: Not facilitating trades
- **Self-directed user decisions**: User evaluates and decides; Gemhog provides
  inputs

### What Triggers Regulatory Requirements

| Activity                                | Regulation             | Gemhog Status                                    |
| --------------------------------------- | ---------------------- | ------------------------------------------------ |
| Personalized investment recommendations | Reg BI (SEC)           | NOT DOING - editorial curation, not personalized |
| Operating as broker-dealer              | FINRA registration     | NOT DOING - no trade facilitation                |
| Managing money                          | RIA registration (SEC) | NOT DOING - research only                        |
| Testimonials/endorsements               | SEC Marketing Rule     | CAUTION - if featuring user testimonials         |
| Social media investment content         | FINRA/SEC guidelines   | APPLICABLE - disclaimers required                |
| AI providing financial advice           | FINRA RN 24-09         | NOT DOING - AI extracts, doesn't advise          |

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

**Confidence:** MEDIUM - Based on SEC/FINRA guidance; specific legal review
recommended.

---

## Part-Time Investor Specific Needs

Research indicates Gemhog's target users have these specific characteristics:

### Time Constraints

- 41% of investors willing to trust AI tools to assist decisions
- Demand for tools that "simplify research workflows"
- Smart watchlists that "reduce friction of monitoring"
- Podcast listeners who lack time to consume full episodes

### Risk Profile

- Looking for "~10% higher-risk allocation" ideas
- Want curated ideas, not overwhelming options
- Need confidence to act (thesis + supporting data)

### Information Sources

- 75% use brokerage firm research/tools
- 67% rely on business/finance articles
- Growing podcast consumption for investment ideas
- Social media increasingly influencing decisions (FINRA 2025 forum topic)

### What They DON'T Need

- Institutional-grade analytics (Koyfin territory)
- Day trading tools (not the target segment)
- Complex screeners (Finviz exists)
- Portfolio optimization (advisors/robos handle this)

---

## MVP Feature Set Recommendation

Based on research, prioritized features for Gemhog v1.0:

### Must Have (MVP Blockers)

| Feature                              | Rationale                    | Complexity |
| ------------------------------------ | ---------------------------- | ---------- |
| Stock page with basic data           | Core navigation unit         | Medium     |
| Thesis display on stock page         | Core value proposition       | Medium     |
| Search/browse stocks                 | Basic discoverability        | Low        |
| Disclaimer on all pages              | Regulatory requirement       | Low        |
| Mobile-responsive design             | 40%+ mobile users            | Medium     |
| Source attribution (podcast, expert) | Credibility and trust        | Low        |
| Twitter auto-posting                 | Primary distribution channel | Medium     |
| Landing page                         | Entry point for traffic      | Low        |

### Should Have (First Iteration After MVP)

| Feature                      | Rationale                        | Complexity |
| ---------------------------- | -------------------------------- | ---------- |
| Bluesky auto-posting         | Secondary distribution; free API | Low        |
| Newsletter signup (AWS SES)  | Build owned audience             | Low        |
| Pros/cons/unknowns structure | Editorial quality                | Low        |
| Multiple theses per stock    | Depth of content                 | Low        |
| Time horizon indication      | Critical investment context      | Low        |
| Expert credibility signals   | Trust building                   | Medium     |

### Could Have (Post-MVP If Validated)

| Feature                                     | Rationale                | Complexity |
| ------------------------------------------- | ------------------------ | ---------- |
| Freemium paywall                            | Monetization             | Medium     |
| More financial metrics                      | Enhanced evaluation      | Medium     |
| Thesis categorization (growth/value)        | Discovery improvement    | Low        |
| Basic visualization (inspired by snowflake) | Visual differentiation   | Medium     |
| RSS feed                                    | Alternative distribution | Low        |

### Won't Have (Explicit Scope Exclusion)

- User-generated content
- Portfolio tracking
- Real-time data
- Screener tools
- International markets
- Options/derivatives
- Price targets
- Buy/sell recommendations
- AI chat interface
- Technical analysis charts
- Personalized recommendations
- Alerts/notifications infrastructure

---

## Feature Prioritization Matrix

| Feature                | User Value | Implementation Cost | Priority | Phase |
| ---------------------- | ---------- | ------------------- | -------- | ----- |
| Stock pages with data  | High       | Medium              | P0       | MVP   |
| Thesis display         | High       | Medium              | P0       | MVP   |
| Search functionality   | High       | Low                 | P0       | MVP   |
| Disclaimers            | Medium     | Low                 | P0       | MVP   |
| Mobile responsive      | High       | Medium              | P0       | MVP   |
| Source attribution     | High       | Low                 | P0       | MVP   |
| Twitter automation     | High       | Medium              | P0       | MVP   |
| Landing page           | Medium     | Low                 | P0       | MVP   |
| Bluesky automation     | Medium     | Low                 | P1       | v1.1  |
| Newsletter             | Medium     | Low                 | P1       | v1.1  |
| Pros/cons structure    | Medium     | Low                 | P1       | v1.1  |
| Multiple theses/stock  | Medium     | Low                 | P1       | v1.1  |
| Time horizon           | Medium     | Low                 | P1       | v1.1  |
| Expert credibility     | Medium     | Medium              | P1       | v1.1  |
| Freemium paywall       | High       | Medium              | P2       | v1.2  |
| Enhanced metrics       | Medium     | Medium              | P2       | v1.2  |
| Visual snowflake-style | Low        | Medium              | P3       | v2    |

---

## Detailed Competitor Feature Analysis

### Seeking Alpha Premium ($299/year)

**What they do well:**

- Quant ratings across 5 factors (Value, Growth, Profitability, Momentum, EPS
  Revisions)
- Academic validation from University of Kentucky researchers
- 7,000+ contributors producing 10,000+ articles/month
- Dividend grades (safety, growth, yield, consistency)
- Full earnings call transcripts and recordings
- Virtual Analyst Reports (AI-powered summaries)
- Brokerage account linking for portfolio tracking

**What Gemhog can learn:**

- Quant ratings provide at-a-glance evaluation (but not thesis-specific)
- AI summaries are becoming table stakes
- Academic/data validation builds trust

**Where Gemhog differs:**

- SA is crowdsourced (quality varies); Gemhog is editorially curated
- SA covers everything; Gemhog focuses on thesis-driven evaluation
- SA requires sifting through content; Gemhog surfaces pre-selected gems

### Simply Wall St (Snowflake Model)

**What they do well:**

- Visual 5-criteria scoring (Valuation, Growth, Performance, Health, Dividends)
- 6 checks per criterion = 30 total data points visualized simply
- Portfolio-level snowflake aggregation
- Designed to "help investors become less emotional"
- Clear, memorable visual language

**What Gemhog can learn:**

- Visual simplicity beats data density for retail investors
- Aggregating complex data into simple scores works
- Focus on fundamentals, ignore short-term price noise

**Where Gemhog differs:**

- Snowflake is comprehensive; Gemhog is thesis-specific
- SWS scores all stocks; Gemhog curates specific opportunities
- SWS is passive screening; Gemhog is active discovery

### Motley Fool Stock Advisor ($99/year intro)

**What they do well:**

- Clear value prop: 2 picks/month with conviction
- Long track record: 982% vs 188% S&P 500 since 2002
- 67% win rate across 501 picks
- "5-year hold" philosophy reduces churn anxiety
- Pre-built portfolio strategies mixing stocks and ETFs
- "Fool's Favorites" alert system

**What Gemhog can learn:**

- Selectivity and conviction matter (don't overwhelm)
- Long-term orientation reduces noise
- Track record builds credibility
- Simple pick count (2/month) sets expectations

**Where Gemhog differs:**

- MF gives picks; Gemhog gives thesis + evaluation data
- MF is their analysts; Gemhog surfaces external experts
- MF is subscription-first; Gemhog is discovery-first

### Finviz (Free + $299.50/year Elite)

**What they do well:**

- 500+ screening filters
- Sub-second filtering speed
- Heat maps for visual market overview
- Clean, functional UI (no bloat)
- Strong free tier (with limitations)

**What Gemhog can learn:**

- Speed and simplicity matter
- Visual heat maps communicate quickly
- Free tier with clear upgrade path works

**Where Gemhog differs:**

- Finviz is screener-first; Gemhog is thesis-first
- Finviz requires user to filter; Gemhog pre-curates
- Finviz is quantitative; Gemhog adds qualitative narrative

### Gainify (Free + $8-37/month)

**What they do well:**

- AI-powered research assistant
- Earnings call summarization
- S&P Global Intelligence data
- 500+ screener filters
- Proprietary 100-point scoring (Outlook, Valuation, Health, Performance,
  Momentum)
- Track hedge fund/Congress/insider moves

**What Gemhog can learn:**

- AI summarization is valuable
- Proprietary scoring systems differentiate
- Tracking notable investors adds interest

**Where Gemhog differs:**

- Gainify is general AI Q&A; Gemhog is thesis extraction
- Gainify covers all stocks; Gemhog focuses on podcast-mentioned
- Gainify is tool-first; Gemhog is content-first

---

## Data Visualization Best Practices for Retail Investors

Based on 2025 research on financial data visualization:

### Principles

1. **Clarity over comprehensiveness** - "If a chart needs a long explanation,
   it's too complicated"
2. **Visual learners dominate** - Most people process sight-based information
   best
3. **Focus on actionable** - Data visualization becomes valuable when "easy to
   interpret and act on"
4. **Reduce emotional reactions** - Design to "help investors become less
   emotional by ignoring minor fluctuations"

### Recommended Visualization Types for Gemhog

| Visualization | Use Case                             | Why                                |
| ------------- | ------------------------------------ | ---------------------------------- |
| Line charts   | Price history, performance over time | Shows trends and turning points    |
| Treemaps      | Sector/category breakdowns           | Quick comparison of relative sizes |
| Simple scores | Thesis evaluation (pros/cons count)  | At-a-glance assessment             |
| Progress bars | Key metrics vs benchmarks            | Intuitive comparison               |
| Color coding  | Positive/negative/neutral signals    | Reduces cognitive load             |

### Anti-patterns

- Dense tables with many columns
- Multiple Y-axes on same chart
- Overly decorated charts (chartjunk)
- Requiring zooming/scrolling to understand

---

## Sources

### Competitor Analysis

- [Seeking Alpha Subscriptions](https://seekingalpha.com/subscriptions) - HIGH
  confidence
- [Seeking Alpha Premium Review 2026](https://www.matchmybroker.com/tools/seeking-alpha-premium-review) -
  HIGH confidence
- [Simply Wall St Snowflake Help](https://support.simplywall.st/hc/en-us/articles/360001740916-How-does-the-Snowflake-work) -
  HIGH confidence
- [Simply Wall St App Store](https://apps.apple.com/us/app/simply-wall-st-stock-analysis/id1075614972) -
  HIGH confidence
- [Finviz Review 2026](https://www.stockbrokers.com/review/tools/finviz) - HIGH
  confidence
- [Finviz Elite vs Free](https://mavericktrading.com/finviz-review-stock-screener-elite-vs-free/) -
  MEDIUM confidence
- [Motley Fool Stock Advisor Review 2026](https://tickernerd.com/resources/the-motley-fool-stock-advisor/) -
  HIGH confidence
- [Motley Fool 501 Picks Analysis](https://traderhq.com/motley-fool-stock-advisor-review-worth-it-best-investment-advice-stock-analysis/) -
  MEDIUM confidence
- [Gainify Platform](https://www.gainify.io/) - HIGH confidence
- [Gainify AI Tools](https://www.gainify.io/blog/ai-tools-for-investing) -
  MEDIUM confidence
- [Yahoo Finance Plans](https://finance.yahoo.com/about/plans/) - HIGH
  confidence

### Retail Investor Research

- [World Economic Forum Retail Investor Outlook 2024](https://www.weforum.org/publications/global-retail-investor-outlook-2025/key-insights-global-retail-investor-outlook-2025/) -
  HIGH confidence
- [FINRA Investor Behavior Research 2025](https://www.finra.org/media-center/newsreleases/2025/new-finra-foundation-research-examines-shifting-investor-behaviors) -
  HIGH confidence
- [Retail Investing Statistics 2025](https://coinlaw.io/retail-investing-statistics/) -
  MEDIUM confidence
- [Best Stock Research Apps 2026](https://www.gainify.io/blog/best-stock-research-apps) -
  MEDIUM confidence

### Regulatory Compliance

- [FINRA 2025 Regulatory Oversight Report](https://www.finra.org/rules-guidance/guidance/reports/2025-finra-annual-regulatory-oversight-report) -
  HIGH confidence
- [FINRA FinTech Key Challenges](https://www.finra.org/rules-guidance/key-topics/fintech/report/artificial-intelligence-in-the-securities-industry/key-challenges) -
  HIGH confidence
- [FINRA Social Media Guidance](https://www.finra.org/rules-guidance/key-topics/social-media) -
  HIGH confidence
- [SEC Reg BI FAQ](https://www.sec.gov/rules-regulations/staff-guidance/trading-markets-frequently-asked-questions/faq-regulation-best) -
  HIGH confidence

### Data Visualization

- [Financial Data Visualization 2025](https://chartswatcher.com/pages/blog/top-financial-data-visualization-techniques-for-2025) -
  MEDIUM confidence
- [Data Visualization Finance Principles](https://julius.ai/articles/data-visualization-finance-industry) -
  MEDIUM confidence
- [Flourish Financial Visualization](https://flourish.studio/blog/visualizing-financial-data/) -
  MEDIUM confidence

### Investment Thesis Format

- [Carta Investment Thesis Guide](https://carta.com/learn/private-funds/management/portfolio-management/investment-thesis/) -
  MEDIUM confidence
- [Wall Street Oasis Thesis Template](https://www.wallstreetoasis.com/resources/templates/presentations/investment-thesis-template) -
  MEDIUM confidence
