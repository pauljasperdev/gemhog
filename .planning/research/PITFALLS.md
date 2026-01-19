# Pitfalls Research: Gemhog Financial Research App

**Domain:** Financial research platform with free data APIs (SEC EDGAR + Stooq)
**Researched:** 2026-01-19
**Overall Confidence:** MEDIUM-HIGH

---

## Executive Summary

Gemhog faces pitfalls across eight critical domains: regulatory compliance, free API
data sourcing, data quality/parsing, AI/LLM accuracy, content aggregation, security,
social media automation, and UX. The **highest-risk areas** unique to this project are:

1. **SEC EDGAR XBRL parsing complexity** — Data inconsistencies, duplicate amounts,
   custom taxonomies require significant engineering effort
2. **Stooq rate limiting without official API** — IP-based blocking, no formal API,
   requires careful request pacing
3. **Free API redistribution licensing** — Even "free" APIs often prohibit public
   redistribution; SEC EDGAR is safe, but Stooq ToS is unclear
4. **Regulatory classification** — Accidentally becoming an "investment adviser"
   triggers SEC registration requirements
5. **AI hallucination in financial contexts** — Up to 41% hallucination rate in
   finance queries; critical for thesis extraction accuracy
6. **Better-Auth CVE-2025-61928** — Critical account takeover vulnerability in
   versions prior to 1.3.26

Each pitfall includes detection signals, prevention strategies, and phase mapping.

---

## Critical Pitfalls (Must Prevent)

### C1: Inadvertent Investment Adviser Classification

**What goes wrong:** The app crosses the line from "financial information tool" to
"investment adviser" under SEC rules, triggering registration requirements, fiduciary
duties, and enforcement risk.

**Why it happens:**

- Personalized recommendations based on user data
- Language suggesting users "should" buy/sell specific securities
- Algorithm-driven suggestions that constitute "advice"
- SEC scrutinizes substance over disclaimers (hedge clause enforcement in January 2025)
- SEC's 2025 guidelines mandate specific disclaimers for AI-generated investment
  insights

**Consequences:**

- SEC enforcement action and fines (86% of non-compliant fintechs pay fines exceeding
  $50K)
- Required RIA registration ($10K-$50K+ annually plus ongoing compliance)
- Potential shutdown or forced pivot

**Warning signs:**

- User feedback asking "should I buy this?"
- Features that filter/rank stocks for individual users
- Any user personalization beyond display preferences
- Marketing language implying recommendations

**Prevention:**

1. **Firm editorial model:** Present theses as discovered content, not recommendations
2. **No user-specific filtering:** Same content visible to all users (no "stocks for
   you")
3. **Prominent disclaimers:** But understand disclaimers alone do NOT protect if
   substance is advisory
4. **Legal review of all copy:** Marketing, UI text, social posts reviewed for
   advisory language
5. **Specific disclaimer language:** Include "Past performance is not indicative of
   future results" and "For informational purposes only"
6. **Documentation:** Keep records showing editorial (not advisory) nature of content
   selection

**Phase to address:** Phase 1 (Foundation) - Establish disclaimer framework and
editorial policy before any content goes live.

**Severity:** CRITICAL - Can kill the product entirely

**Sources:**

- [Fintech Compliance Pitfalls - AppInventiv](https://appinventiv.com/blog/fintech-app-development-compliance-challenges/)
- [SEC 2026 Exam Priorities](https://www.goodwinlaw.com/en/insights/publications/2025/12/alerts-privateequity-pif-2026-sec-exam-priorities-for-registered-investment-advisers)
- [Financial Advice Disclaimer Requirements](https://financeninvestments.com/financial-advice-disclaimer/)

---

### C2: AI Hallucination in Financial Data Extraction

**What goes wrong:** LLM extracts incorrect investment theses, fabricates financial
figures, or misattributes statements to podcast guests.

**Why it happens:**

- LLMs hallucinate in up to 41% of finance-related queries (2024 study)
- Financial language is domain-specific with jargon that confuses general models
- Numerical data (stock prices, percentages, dates) particularly prone to fabrication
- "Confident incorrectness" - model states false information authoritatively

**Consequences:**

- Users make investment decisions based on fabricated data
- Reputational damage when errors discovered
- Potential legal liability if hallucinated content causes financial harm
- Loss of user trust

**Warning signs:**

- Extracted theses that don't match podcast context when spot-checked
- Financial figures that don't align with verified data sources
- Attribution of statements to wrong speakers
- Users reporting factual errors

**Prevention:**

1. **Human-in-the-loop validation:** All extracted theses require human review before
   publication
2. **RAG with verified sources:** Ground extractions in transcript text, require
   citations
3. **Confidence thresholds:** Reject extractions below confidence threshold, flag for
   manual review
4. **Structured extraction:** Use Zod schema-constrained outputs for financial
   entities
5. **Multi-model consensus:** Compare results from multiple prompts to reduce
   hallucination risk
6. **Spot-check pipeline:** Randomly sample 10% of extractions for accuracy audit
7. **No financial figures from LLM:** Pull prices, metrics from verified data APIs
   only (SEC EDGAR, Stooq)
8. **Attribution verification:** Cross-check speaker identification against
   transcript metadata
9. **Deterministic validation:** Pair LLM outputs with numeric validation checks for
   any financial figures

**Phase to address:** Phase 3 (Thesis Extraction) - Build validation pipeline
alongside extraction, not as afterthought.

**Severity:** CRITICAL - Incorrect financial information is both dangerous and
trust-destroying

**Sources:**

- [LLM Hallucinations in Financial Institutions - BizTech](https://biztechmagazine.com/article/2025/08/llm-hallucinations-what-are-implications-financial-institutions)
- [FAITH Framework for Financial LLM Hallucinations](https://arxiv.org/html/2508.05201v1)
- [FailSafeQA Financial LLM Benchmark](https://ajithp.com/2025/02/15/failsafeqa-evaluating-ai-hallucinations-robustness-and-compliance-in-financial-llms/)

---

### C3: Copyright Infringement via Podcast Summarization

**What goes wrong:** AI-generated summaries of podcast content constitute copyright
infringement, triggering DMCA takedowns or lawsuits.

**Why it happens:**

- 2025 rulings establish "substitutive summaries" can infringe even without verbatim
  copying
- Summaries that mirror "expressive structure and journalistic storytelling choices"
  are problematic
- No safe harbor for "transformative" AI summarization has been established
- Podcast content is scripted/fixed (copyrightable), not improvised

**Consequences:**

- DMCA takedowns removing core content
- Lawsuits from podcast networks (deep-pocketed plaintiffs)
- Injunctions preventing continued operation
- Damages awards (copyright statutory damages up to $150K per work for willful
  infringement)

**Warning signs:**

- Cease-and-desist letters from podcast producers
- DMCA notices
- Summaries that could "substitute" for listening to original

**Prevention:**

1. **Extraction, not summarization:** Extract discrete claims/theses, not narrative
   summaries
2. **Factual focus:** Extract factual assertions (which are not copyrightable) rather
   than expressive content
3. **Attribution with links:** Always link to original podcast, drive traffic back
4. **Limit scope:** Brief thesis statements, not comprehensive episode summaries
5. **Partnership outreach:** Contact major podcast networks about acceptable use
6. **Podscan.fm ToS review:** Check ToS for derivative work restrictions
7. **Legal counsel:** Get IP attorney opinion on extraction methodology

**Phase to address:** Phase 3 (Thesis Extraction) - Establish extraction methodology
with legal review before building pipeline.

**Severity:** CRITICAL - Could require complete product pivot

**Sources:**

- [AI News Summaries Copyright Ruling - Copyright Lately](https://copyrightlately.com/court-rules-ai-news-summaries-may-infringe-copyright/)
- [Thomson Reuters v. Ross - Fair Use Ruling](https://www.carltonfields.com/insights/publications/2025/use-of-copyrighted-works-in-ai-training-is-not-fair-use)
- [Fair Use for Podcasters - Podnews](https://podnews.net/article/fair-use-for-podcasters)

---

### C4: SEC EDGAR XBRL Data Quality and Parsing Complexity

**What goes wrong:** Financial data extracted from SEC EDGAR XBRL filings is
inconsistent, duplicated, or incorrectly structured, leading to wrong metrics
displayed to users.

**Why it happens:**

- XBRL encodes hierarchical, multi-dimensional data with custom taxonomies and
  context references
- Many companies use "quick & dirty tagging" as an afterthought
- 15,000+ predefined concepts in US-GAAP taxonomy; wrong concept selection degrades
  quality
- Duplicate amounts appear because filings contain period comparisons and tables
  reusing prior period data
- HTML and XBRL versions of same filing may be out of sync
- Company fiscal calendars vary (different start/end dates, quarter lengths)
- Custom taxonomy extensions require separate handling from standard taxonomies

**Consequences:**

- Display incorrect P/E ratios, debt ratios, or growth rates
- User decisions based on wrong data
- Reputational damage from "basic math errors"
- Support burden from users reporting discrepancies

**Warning signs:**

- Metrics don't match Yahoo Finance, Google Finance, or Bloomberg
- Duplicate values appearing in data extractions
- Missing data for some companies but not others
- Date/period misalignment in financial comparisons

**Prevention:**

1. **Use Financial Statement Data Sets API:** SEC's pre-processed data reduces
   parsing burden (data.sec.gov)
2. **Handle duplicates explicitly:** Build deduplication logic expecting duplicate
   amounts in XBRL
3. **CIK padding:** Pad CIK numbers to 10 characters with leading zeros for API URLs
4. **Fiscal calendar awareness:** Be mindful of different reporting start/end dates
   for facts
5. **Custom taxonomy detection:** Identify when companies use custom vs. standard
   taxonomies
6. **Inline XBRL preference:** When available, prefer iXBRL which keeps HTML and XBRL
   in sync
7. **Validation against known sources:** Spot-check extracted metrics against Yahoo
   Finance, Bloomberg
8. **Consider third-party services:** sec-api.io provides pre-parsed JSON if parsing
   burden too high
9. **Frame data alignment:** Use SEC's frame data which aligns facts to calendar
   quarters/years

**Phase to address:** Phase 4 (Financial Data Integration) - Build robust XBRL
parsing with validation.

**Severity:** CRITICAL - Core product value depends on accurate financial data

**Sources:**

- [SEC EDGAR XBRL Guide November 2025](https://www.sec.gov/files/edgar/filer-information/specifications/xbrl-guide.pdf)
- [XBRL Data Quality of SEC Filings - Altova](https://www.altova.com/blog/xbrl-data-quality-of-sec-filings/)
- [Extracting Financial Statements - XBRL-To-JSON](https://medium.com/@jan_5421/extracting-financial-statements-from-sec-filings-xbrl-to-json-f83542ade90)
- [GreenFlux Blog: SEC API Integration](https://blog.greenflux.us/so-you-want-to-integrate-with-the-sec-api/)

---

### C5: Better-Auth Critical Security Vulnerability (CVE-2025-61928)

**What goes wrong:** Account takeover via unauthenticated API key creation allows
attackers to gain unauthorized access to any user's account.

**Why it happens:**

- Better-Auth versions prior to 1.3.26 incorrectly handle cases where session doesn't
  exist but userId is provided
- Attackers can craft requests with chosen userId to create/modify API keys for
  arbitrary users
- CVSS v4.0 score: 9.3 (Critical)

**Consequences:**

- Complete account takeover
- Unauthorized access to user financial research
- Payment/subscription manipulation
- Regulatory breach notification requirements
- Existential threat to user trust

**Warning signs:**

- Suspicious API key creation in logs
- Users reporting unauthorized access
- Unusual account activity patterns

**Prevention:**

1. **Immediate upgrade:** Ensure Better-Auth >= 1.3.26
2. **Audit existing API keys:** Review all API keys created via the plugin
3. **Rotate compromised keys:** Invalidate any keys created before patch
4. **Log monitoring:** Watch for unauthenticated requests to create/update endpoints
5. **Don't disable CSRF:** Never disable CSRF checks (another common mistake)
6. **Don't disable origin checks:** Keeps redirects secure

**Phase to address:** Phase 1 (Foundation) - Verify Better-Auth version immediately.

**Severity:** CRITICAL - Direct account compromise possible

**Sources:**

- [CVE-2025-61928 - Wiz](https://www.wiz.io/vulnerability-database/cve/cve-2025-61928)
- [ZeroPath Blog - Better-Auth CVE](https://zeropath.com/blog/breaking-authentication-unauthenticated-api-key-creation-in-better-auth-cve-2025-61928)
- [Better-Auth Security Docs](https://www.better-auth.com/docs/reference/security)

---

## High-Severity Pitfalls

### H1: SEC EDGAR Rate Limiting and IP Blocking

**What goes wrong:** Automated requests exceed SEC's rate limits, resulting in IP
blocks that prevent data fetching.

**Why it happens:**

- SEC limits requests to 10 per second across all machines from same IP
- Exceeding threshold triggers 403 response with "Request Rate Threshold Exceeded"
- IP blocked for 10 minutes after exceeding limit
- SEC reserves right to block IPs permanently for excessive requests
- Unclassified bots/automated tools explicitly prohibited

**Consequences:**

- Data pipeline goes offline
- No new financial data for users
- May need to change infrastructure (new IPs)
- Could be permanently blocked

**Warning signs:**

- 403 responses from data.sec.gov
- "Request Rate Threshold Exceeded" messages
- Intermittent data availability

**Prevention:**

1. **Rate limit to 8 req/sec:** Stay well under 10/sec limit with safety margin
2. **User-Agent header:** Required format: "CompanyName AdminContact@domain.com"
3. **Exponential backoff:** On any error, back off before retry
4. **Request queuing:** Serialize requests to enforce rate limit
5. **Caching layer:** Cache responses to reduce repeated requests (Upstash Redis)
6. **Monitor response codes:** Alert on any 403 responses
7. **Consider EDGAR Next APIs:** New 2025 APIs may have better rate handling with
   authentication

**Phase to address:** Phase 4 (Financial Data Integration)

**Severity:** HIGH - Blocks core data source

**Sources:**

- [SEC Rate Control Limits Announcement](https://www.sec.gov/filergroup/announcements-old/new-rate-control-limits)
- [SEC EDGAR API Overview](https://www.sec.gov/files/edgar/filer-information/api-overview.pdf)

---

### H2: Stooq Rate Limiting and IP Blocking (No Official API)

**What goes wrong:** Stooq blocks IP address after detecting automated bulk
downloads, returning "Exceeded the daily hits limit" or empty responses.

**Why it happens:**

- Stooq has no official API — only CSV download endpoints
- Undocumented daily request quota
- IP-based blocking (not account-based)
- Repeating single file downloads triggers blocking
- No formal documentation of limits or ToS

**Consequences:**

- Price data unavailable
- Charts can't render
- P/E and other price-based metrics can't calculate
- May need to find alternative data source

**Warning signs:**

- Empty responses from Stooq URLs
- "Exceeded the daily hits limit" messages
- OSError: StooqDailyReader request returned no data

**Prevention:**

1. **Aggressive caching:** Cache all price data, minimize repeat requests
2. **Request pacing:** Add delays between requests (pandas-datareader `pause`
   parameter)
3. **Daily refresh only:** EOD data doesn't need intraday updates
4. **Batch downloads:** Use historical data bulk downloads where possible
5. **Alternative source ready:** Have backup (Alpha Vantage, Yahoo Finance via
   yfinance) if blocked
6. **IP rotation consideration:** If blocked, router restart may get new IP
7. **Monitor for blocks:** Alert when Stooq returns empty responses

**Phase to address:** Phase 4 (Financial Data Integration)

**Severity:** HIGH - Blocks price data source

**Sources:**

- [QuantStart: Stooq Pricing Data](https://www.quantstart.com/articles/an-introduction-to-stooq-pricing-data/)
- [Wealth-Lab Wiki: Stooq Provider](http://www2.wealth-lab.com/wl5wiki/StooqProvider.ashx)
- [pandas-datareader Stooq Issues](https://github.com/pydata/pandas-datareader/issues/847)

---

### H3: Stooq Data Quality Issues (Splits/Dividends)

**What goes wrong:** Historical price data from Stooq is not adjusted for stock
splits and dividends, causing incorrect chart rendering and metric calculations.

**Why it happens:**

- Stooq does not automatically adjust for splits and dividends
- No built-in mechanism for adjustment
- Historical data may show artificial price jumps/drops
- 20+ years of history means many split events to handle

**Consequences:**

- Charts show false price movements at split dates
- P/E ratios calculated incorrectly
- Historical returns appear wrong
- Users lose trust in data accuracy

**Warning signs:**

- Sudden 50%, 2x, 3x price changes on specific dates
- Historical P/E ratios that look absurd
- User reports of "obvious errors" in charts

**Prevention:**

1. **Track split events:** Maintain database of stock splits from SEC filings
2. **Apply adjustments:** Multiply historical prices by split factors
3. **Use adjusted close when available:** Some sources provide pre-adjusted data
4. **Validation checks:** Flag prices that change >20% in single day for review
5. **Display raw vs adjusted:** Let users see both, with explanation
6. **Periodic full refresh:** Reload datasets from scratch to catch corrections

**Phase to address:** Phase 4 (Financial Data Integration)

**Severity:** HIGH - Incorrect data is worse than no data

**Sources:**

- [Wealth-Lab Wiki: Stooq Provider - Split/Dividend Note](http://www2.wealth-lab.com/wl5wiki/StooqProvider.ashx)

---

### H4: Free API Data Redistribution Licensing Risk

**What goes wrong:** Using "free" APIs for a public-facing app violates terms of
service, resulting in API access revocation or legal action.

**Why it happens:**

- "Free for personal use" doesn't mean "free for commercial redistribution"
- Exchange data (real-time/delayed) requires licenses ($32-$20K+/month)
- Even displaying data publicly may violate ToS
- FMP explicitly flagged as requiring paid license for public redistribution

**Consequences:**

- API access terminated
- Legal action from data providers
- Need to scramble for alternative source
- Feature disabled mid-operation

**Warning signs:**

- ToS violation notices from providers
- API access warnings
- Competitors flagging violations

**Prevention (Why SEC EDGAR + Stooq is safer):**

1. **SEC EDGAR:** Government data, no redistribution restrictions, explicitly public
2. **Stooq ToS review:** Document ToS limitations (currently unclear — flag for legal
   review)
3. **No real-time data:** Avoid intraday data which requires exchange licenses
4. **Attribution compliance:** Display any required attributions prominently
5. **Provider abstraction layer:** Easy swap if source becomes unavailable
6. **Legal review:** Have attorney review ToS for chosen sources

**Phase to address:** Phase 2 (Data Ingestion) - Verify ToS before building
integration

**Severity:** HIGH - Could lose data access

**Sources:**

- [Databento: Market Data Licensing](https://databento.com/blog/introduction-market-data-licensing)
- [API License Agreement Best Practices](https://terms.law/Trading-Legal/guides/api-license-trading-data.html)

---

### H5: Third-Party Vendor Security Breach

**What goes wrong:** Security breach originates from third-party service (Polar,
Podscan.fm, Better-Auth) exposing user data.

**Why it happens:**

- 41.8% of fintech breaches originate from third-party vendors
- Fourth-party (vendor's vendors) add another 11.9% breach vector
- API integrations create attack surface
- Vendor security practices outside your control

**Consequences:**

- User data exposure (financial app = high sensitivity)
- Breach notification requirements (state laws)
- Reputational damage
- Average fintech breach cost: $5.56M

**Warning signs:**

- Vendor security incident announcements
- Unusual API behavior or errors
- User reports of suspicious activity
- Security news about your vendors

**Prevention:**

1. **Vendor security assessment:** Review security practices of Polar, Podscan.fm
2. **Minimize data sharing:** Only send vendors what they absolutely need
3. **Contract requirements:** Incident notification clauses, security standards
4. **Monitor vendor announcements:** Subscribe to security bulletins
5. **Segmentation:** Isolate vendor integrations, limit blast radius
6. **Incident response plan:** Know what to do if vendor breached

**Phase to address:** Phase 1 (Foundation) - Vendor assessment before integration.

**Severity:** HIGH - Data breach is existential for fintech

**Sources:**

- [SecurityScorecard Fintech Breach Report](https://securityscorecard.com/company/press/securityscorecard-report-links-41-8-of-breaches-impacting-leading-fintech-companies-to-third-party-vendors/)
- [Fintech Breach Statistics 2025 - DeepStrike](https://deepstrike.io/blog/fintech-breach-statistics-2025)

---

### H6: Twitter/X API Rate Limits and Account Bans

**What goes wrong:** Automated posting triggers rate limits, Error 226
anti-automation detection, or account suspension.

**Why it happens:**

- X's anti-automation system detects patterns algorithmically
- Free tier extremely restrictive (1,500 posts/month, post-only)
- Behavioral profiling catches even well-rotated automation
- "Error 226" blocks accounts flagged as automated

**Consequences:**

- Distribution channel goes dark
- Account permanently banned (difficult to recover)
- API access revoked
- Traffic source eliminated

**Warning signs:**

- Rate limit (429) responses increasing
- Error 226 responses
- Engagement dropping (shadowban)
- Account locked for verification

**Prevention:**

1. **Conservative posting frequency:** 2-3 posts/day max, not bulk posting
2. **Human-like patterns:** Vary posting times, don't post at exact intervals
3. **Unique content:** Each post should be meaningfully different
4. **Monitor rate limit headers:** Track usage in real-time
5. **Fallback to Bluesky:** Primary distribution if X becomes problematic

**Phase to address:** Phase 6 (Social Distribution)

**Severity:** HIGH - Loses primary traffic source

**Sources:**

- [X API Rate Limits - Developer Platform](https://developer.x.com/en/docs/x-api/v1/rate-limits)

---

### H7: AWS SES Deliverability and Account Suspension

**What goes wrong:** Newsletter emails land in spam, or AWS suspends SES account due
to high bounce/complaint rates.

**Why it happens:**

- Account goes under review at 0.1% complaint rate
- Suspension possible above 0.5% complaint rate
- Poor list hygiene causes bounces
- Missing email authentication (DKIM, SPF, DMARC)
- New accounts start in sandbox with severe restrictions

**Consequences:**

- Newsletters don't reach subscribers
- Account suspension blocks all email
- Lost communication channel
- Manual intervention required to restore

**Warning signs:**

- Bounce rate increasing
- Complaint rate above 0.1%
- Emails landing in spam (user reports)
- AWS warning notifications

**Prevention:**

1. **Double opt-in:** Require email confirmation before adding to list
2. **Remove inactive subscribers:** Prune after 6 months of no engagement
3. **Email authentication:** Configure DKIM, SPF, DMARC properly
4. **Exit sandbox early:** Request production access with clear use case
5. **Monitor CloudWatch:** Set up alerts for bounce/complaint metrics
6. **Warm up sending:** Gradually increase volume, don't blast immediately
7. **Easy unsubscribe:** Prominent unsubscribe link reduces complaints

**Phase to address:** Phase 5 (Landing Page & Newsletter)

**Severity:** HIGH - Blocks audience communication

**Sources:**

- [AWS SES Deliverability Best Practices](https://docs.aws.amazon.com/ses/latest/dg/send-email-concepts-deliverability.html)
- [AWS SES Best Practices - ElasticScale](https://elasticscale.com/blog/aws-ses-best-practices-increase-sending-limits-improve-deliverability/)

---

## Medium-Severity Pitfalls

### M1: Polar.sh Webhook Edge Cases

**What goes wrong:** Subscription state becomes inconsistent due to missed or
mishandled webhook events.

**Why it happens:**

- Subscription renewal uses `order.created` event (not intuitive
  `subscription.renewed`)
- Webhook secret requires base64 encoding (SDK handles, but manual implementation
  may miss)
- IP allowlist changes (October 2025 update)
- Platform is relatively new, still evolving

**Prevention:**

1. **Handle all events:** subscription.created, subscription.payment_failed,
   subscription.updated, order.created
2. **Use SDK:** Polar SDK handles webhook signature verification correctly
3. **Idempotent handlers:** Same event processed twice should be safe
4. **Firewall allowlist:** Keep IP allowlist updated per Polar changelog
5. **Test edge cases:** Cancellation, reactivation, payment failure recovery

**Phase to address:** Phase 1 (Foundation) - Verify existing Polar integration

**Severity:** MEDIUM - Causes revenue friction

**Sources:**

- [Polar Webhook Documentation](https://polar.sh/docs/llms-full.txt)
- [Polar GitHub Issues - Renewal Events](https://github.com/polarsource/polar/issues/4782)

---

### M2: Podscan.fm Entity Recognition Errors

**What goes wrong:** Stock symbols or company names are incorrectly identified in
podcast transcripts.

**Why it happens:**

- Entity recognition is "surprisingly complicated" with many false positives
- Podcast founder acknowledged this challenge publicly
- Ambiguous mentions (e.g., "Apple" the company vs fruit)
- Ticker symbols that are also words (e.g., "CAT", "F", "A")

**Prevention:**

1. **Verification layer:** Cross-check extracted symbols against known stock list
2. **Context scoring:** Require financial context around entity mentions
3. **Human review:** Flag uncertain entity matches for manual verification
4. **Disambiguation rules:** Require additional context for common-word tickers

**Phase to address:** Phase 3 (Thesis Extraction)

**Severity:** MEDIUM - Reduces extraction quality

**Sources:**

- [Repositioning Podscan - Bootstrapped Founder](https://thebootstrappedfounder.com/repositioning-podscan-from-monitoring-to-data-platform/)

---

### M3: Bluesky API Rate Limits

**What goes wrong:** Automation exceeds Bluesky's rate limits, disrupting posting or
getting flagged as spam.

**Why it happens:**

- 3,000 API calls per IP per 5 minutes (global limit)
- 5,000 points/hour, 35,000 points/day for record creation
- Limits designed to constrain "abusive or spammy bots"

**Prevention:**

1. **Implement rate limit tracking:** Monitor against documented limits
2. **Exponential backoff:** Handle 429 responses gracefully
3. **Conservative posting:** Stay well under limits
4. **Handle rate limit headers:** Use response headers to pace requests

**Phase to address:** Phase 6 (Social Distribution)

**Severity:** MEDIUM - Backup channel, recoverable

**Sources:**

- [Bluesky Rate Limits Documentation](https://docs.bsky.app/docs/advanced-guides/rate-limits)

---

### M4: UX Feature Overload

**What goes wrong:** Adding too many features creates cognitive overload, hurting
retention.

**Why it happens:**

- Financial apps average only 4.5% 30-day retention
- 88% of users abandon apps after experiencing friction
- Complex financial data tempts feature creep
- Desire to match full-featured competitors

**Prevention:**

1. **MVP discipline:** Thesis discovery + basic data only for v1
2. **Progressive disclosure:** Advanced features hidden until needed
3. **User testing:** Validate UX with target users before building
4. **Simple terminology:** Avoid jargon that alienates part-time investors

**Phase to address:** All phases - Constant discipline required

**Severity:** MEDIUM - Recoverable with iteration

**Sources:**

- [Fintech UX Design Challenges - Artkai](https://artkai.io/blog/ux-design-for-fintech-products)

---

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Skip XBRL parser testing | Faster initial build | Data errors in production | Never - financial data must be verified |
| Hardcoded rate limits | Quick implementation | Failures when limits change | MVP only, with alerts |
| No split adjustment | Simpler price storage | Wrong historical metrics | Only if displaying raw prices with disclaimer |
| Single data source | Less code | Service outage = full outage | MVP, but abstract interface |
| Skip double opt-in | Faster signup | SES suspension risk | Never for newsletter |
| Cache indefinitely | Fewer API calls | Stale data displayed | Only for truly static data |
| Skip human review | Faster thesis publishing | Hallucinated content published | Never |

---

## Integration Gotchas

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| **SEC EDGAR** | Not padding CIK to 10 chars | `cik.padStart(10, '0')` |
| **SEC EDGAR** | Ignoring duplicate amounts | Deduplicate by fact context |
| **SEC EDGAR** | Assuming standard taxonomy | Check for custom extensions |
| **SEC EDGAR** | Exceeding 10 req/sec | Rate limit with queue, cache aggressively |
| **Stooq** | Bulk requests without delay | Add pause between requests |
| **Stooq** | Assuming adjusted prices | Track and apply split adjustments |
| **Stooq** | No fallback source | Have Alpha Vantage or yfinance ready |
| **Podscan.fm** | Trusting entity recognition | Verify extracted symbols against stock list |
| **AWS SES** | Skipping sandbox exit | Request production access early |
| **AWS SES** | Single opt-in | Always use double opt-in |
| **AWS SES** | No DKIM/SPF | Configure full email authentication |
| **Polar** | Missing webhook events | Handle all subscription lifecycle events |
| **Polar** | Old IP allowlist | Check Polar changelog for IP updates |
| **Better-Auth** | Version < 1.3.26 | Upgrade immediately (CVE-2025-61928) |
| **Better-Auth** | Disabling CSRF | Never disable CSRF protection |
| **Twitter/X** | Posting at fixed intervals | Randomize posting times |
| **Bluesky** | Using main password | Always use app password |

---

## Performance Traps

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| XBRL parsing on request | Slow stock page loads | Pre-process and cache | >100 users |
| No Redis caching | API rate limits hit | Cache with Upstash | >50 requests/day |
| Full filing fetch | Memory exhaustion | Stream/paginate large files | Any 10-K filing |
| Sync LLM extraction | Request timeouts | Background jobs with SST Cron | >10 transcripts |
| No image optimization | Slow page loads | Next.js Image component | Any traffic |
| Client-side data fetch | Waterfall requests | Server components + prefetch | Mobile users |

---

## Security Mistakes

| Mistake | Risk | Prevention |
|---------|------|------------|
| Better-Auth < 1.3.26 | Account takeover | Upgrade to 1.3.26+ immediately |
| Disabling CSRF in Better-Auth | Cross-site request forgery | Never disable CSRF |
| Storing API keys in code | Credential exposure | Use env vars, validate at startup |
| Logging user data | Data leakage | Sanitize logs, no PII |
| Missing input validation | Injection attacks | Zod schemas on all inputs |
| CORS `*` in production | Cross-origin attacks | Restrict to specific origins |
| No rate limiting on auth | Brute force | Better-Auth has built-in, verify enabled |
| Trusting client-side auth | Auth bypass | Always validate server-side |

---

## UX Pitfalls

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| Financial jargon everywhere | Confusion, abandonment | Plain language with tooltips for terms |
| No loading states | Perceived broken app | Skeleton loaders for data fetches |
| Error messages expose internals | Security risk, confusion | User-friendly error messages |
| Thesis without context | Can't evaluate validity | Show source quote, timestamp, speaker |
| Charts without split adjustment | Misleading visuals | Display adjusted prices or warn |
| No disclaimer visibility | Regulatory risk | Prominent, not just footer |

---

## "Looks Done But Isn't" Checklist

- [ ] **SEC EDGAR integration**: Often missing duplicate deduplication — verify unique
  facts
- [ ] **Stooq integration**: Often missing split adjustment — verify historical prices
- [ ] **Thesis extraction**: Often missing validation — verify human review workflow
- [ ] **Rate limiting**: Often missing monitoring — verify alerts exist
- [ ] **SES setup**: Often missing authentication — verify DKIM/SPF/DMARC
- [ ] **Better-Auth version**: Often outdated — verify >= 1.3.26
- [ ] **Polar webhooks**: Often missing events — verify full lifecycle handled
- [ ] **Disclaimers**: Often only on one page — verify on every stock page
- [ ] **Caching**: Often missing TTL — verify cache invalidation strategy
- [ ] **Error handling**: Often happy path only — verify graceful degradation

---

## Pitfall-to-Phase Mapping

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| C1: Investment Adviser | Phase 1 (Foundation) | Legal review of disclaimer framework |
| C2: AI Hallucination | Phase 3 (Thesis Extraction) | Human review workflow exists |
| C3: Copyright | Phase 3 (Thesis Extraction) | Legal review of extraction methodology |
| C4: XBRL Data Quality | Phase 4 (Financial Data) | Validation against external source |
| C5: Better-Auth CVE | Phase 1 (Foundation) | Version check in CI |
| H1: SEC Rate Limiting | Phase 4 (Financial Data) | Rate limiter + cache tests |
| H2: Stooq Rate Limiting | Phase 4 (Financial Data) | Request pacer + fallback configured |
| H3: Stooq Splits | Phase 4 (Financial Data) | Split adjustment logic + tests |
| H4: Data Licensing | Phase 2 (Data Ingestion) | Legal ToS review documented |
| H5: Vendor Security | Phase 1 (Foundation) | Vendor assessment checklist |
| H6: Twitter Limits | Phase 6 (Social Distribution) | Conservative automation + monitoring |
| H7: SES Deliverability | Phase 5 (Newsletter) | Authentication + double opt-in |
| M1: Polar Webhooks | Phase 1 (Foundation) | Full event handler tests |
| M2: Entity Recognition | Phase 3 (Thesis Extraction) | Symbol verification layer |
| M3: Bluesky Limits | Phase 6 (Social Distribution) | Rate tracking implementation |
| M4: UX Overload | All phases | User testing gates |

---

## Monitoring and Detection

### Financial Data Quality Monitoring

| Signal | Detection Method | Response |
|--------|------------------|----------|
| SEC EDGAR 403 responses | Error rate dashboard | Back off, check rate limiter |
| Stooq empty responses | Data pipeline alerts | Activate fallback source |
| Metric mismatch vs Yahoo | Weekly validation job | Investigate parsing logic |
| Split not applied | Price jump detection | Apply adjustment, refresh cache |

### API Health Monitoring

| Signal | Detection Method | Response |
|--------|------------------|----------|
| Rate limit errors (429) | Error logging | Reduce request frequency |
| Vendor deprecation notice | Changelog monitoring | Plan migration timeline |
| Authentication failures | Failed request alerts | Rotate/refresh credentials |

### Security Monitoring

| Signal | Detection Method | Response |
|--------|------------------|----------|
| Better-Auth CVE announced | Security advisories | Immediate upgrade |
| Unusual auth patterns | Access logging | Investigate, possibly rotate tokens |
| Vendor breach news | News alerts | Assess exposure, notify users if needed |

---

## Confidence Assessment

| Area | Confidence | Reason |
|------|------------|--------|
| Regulatory Pitfalls | HIGH | SEC documentation, legal publications |
| SEC EDGAR Issues | HIGH | Official SEC docs, developer community reports |
| Stooq Issues | MEDIUM | No official docs, community reports only |
| AI/LLM Pitfalls | HIGH | Recent studies with specific statistics |
| Better-Auth Security | HIGH | CVE database, official security advisories |
| Social Media Limits | MEDIUM | API docs authoritative, enforcement unpredictable |
| AWS SES Issues | HIGH | Official AWS documentation |
| Polar Issues | MEDIUM | Limited community feedback, platform still maturing |

---

## Open Questions Requiring Phase-Specific Research

1. **Stooq ToS:** What are the actual terms for commercial use? Legal review needed.
2. **SEC EDGAR Next APIs:** Do new 2025 authenticated APIs have better rate limits?
3. **Split data source:** Where to get reliable stock split history for adjustment?
4. **Podscan.fm ToS:** Does ToS permit derivative works from transcripts?
5. **Polar production reliability:** Long-term webhook reliability in production?

---

## Sources

### Regulatory

- [SEC 2026 Exam Priorities](https://www.goodwinlaw.com/en/insights/publications/2025/12/alerts-privateequity-pif-2026-sec-exam-priorities-for-registered-investment-advisers)
- [Financial Advice Disclaimer Requirements](https://financeninvestments.com/financial-advice-disclaimer/)
- [Fintech Compliance Pitfalls](https://appinventiv.com/blog/fintech-app-development-compliance-challenges/)

### SEC EDGAR

- [SEC EDGAR APIs](https://www.sec.gov/search-filings/edgar-application-programming-interfaces)
- [SEC XBRL Guide November 2025](https://www.sec.gov/files/edgar/filer-information/specifications/xbrl-guide.pdf)
- [SEC Rate Control Limits](https://www.sec.gov/filergroup/announcements-old/new-rate-control-limits)
- [XBRL Data Quality Issues - Altova](https://www.altova.com/blog/xbrl-data-quality-of-sec-filings/)

### Stooq

- [QuantStart: Stooq Introduction](https://www.quantstart.com/articles/an-introduction-to-stooq-pricing-data/)
- [pandas-datareader Stooq Issues](https://github.com/pydata/pandas-datareader/issues/847)

### AI/LLM

- [LLM Hallucinations in Finance - BizTech](https://biztechmagazine.com/article/2025/08/llm-hallucinations-what-are-implications-financial-institutions)
- [FAITH Framework](https://arxiv.org/html/2508.05201v1)
- [FailSafeQA Benchmark](https://ajithp.com/2025/02/15/failsafeqa-evaluating-ai-hallucinations-robustness-and-compliance-in-financial-llms/)

### Security

- [CVE-2025-61928 Better-Auth](https://www.wiz.io/vulnerability-database/cve/cve-2025-61928)
- [Better-Auth Security Reference](https://www.better-auth.com/docs/reference/security)
- [SecurityScorecard Fintech Breach Report](https://securityscorecard.com/company/press/securityscorecard-report-links-41-8-of-breaches-impacting-leading-fintech-companies-to-third-party-vendors/)

### Email Deliverability

- [AWS SES Best Practices](https://docs.aws.amazon.com/ses/latest/dg/best-practices.html)
- [AWS SES Deliverability Guide](https://elasticscale.com/blog/aws-ses-best-practices-increase-sending-limits-improve-deliverability/)

### Data Licensing

- [Databento: Market Data Licensing](https://databento.com/blog/introduction-market-data-licensing)
- [API License Best Practices](https://terms.law/Trading-Legal/guides/api-license-trading-data.html)

---

_Last updated: 2026-01-19_
