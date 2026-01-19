# Stack Research

**Project:** Gemhog
**Researched:** 2026-01-19
**Overall Confidence:** HIGH

## Executive Summary

The financial research app with AI-powered content extraction benefits from a
mature 2025/2026 ecosystem. The recommended additions leverage the **Vercel AI
SDK 6** for LLM integration (provider-agnostic, TypeScript-first, structured
outputs), **Financial Modeling Prep** for stock data (best price/feature ratio,
comprehensive fundamentals), **Podscan.fm** (already decided), **SST v3 Cron**
for job scheduling (native to existing infra), and **twitter-api-v2** +
**@atproto/api** for social automation. The already-decided stack is solid and
requires no changes.

---

## Already Decided (Validated)

These technologies are confirmed appropriate for the use case.

| Technology       | Purpose                 | Validation Notes                                     |
| ---------------- | ----------------------- | ---------------------------------------------------- |
| Next.js          | Frontend framework      | Industry standard for React apps, SSR/SSG support    |
| shadcn/ui        | UI components           | Accessible, customizable, pairs well with Tailwind   |
| Hono             | Backend server          | Lightweight, fast, good TypeScript support           |
| tRPC             | Type-safe API           | Excellent DX, pairs well with Zod schemas            |
| PostgreSQL       | Database                | Reliable, feature-rich, good for financial data      |
| Drizzle ORM      | Database toolkit        | Type-safe, lightweight, good migrations              |
| Better-Auth      | Authentication          | Modern, self-hosted auth solution                    |
| Polar            | Payments                | Developer-friendly, subscription support             |
| SST v3           | AWS deployment          | TypeScript IaC, Pulumi-based, serverless-native      |
| Effect TS        | Backend patterns        | Testability, DI, composable error handling (pending) |
| pnpm workspaces  | Monorepo management     | Fast, efficient, mature                              |
| Podscan.fm       | Podcast transcripts     | Already decided, comprehensive transcript API        |
| Biome            | Linting/formatting      | Fast, unified tooling                                |
| Vitest           | Testing                 | Fast, Vite-native, good TypeScript support           |
| Playwright       | E2E testing             | Reliable, cross-browser                              |

---

## Recommended Additions

### LLM/AI Integration

#### Provider: Claude API (Anthropic) - PRIMARY

**Recommendation:** Use Claude Sonnet 4.5 as primary model for thesis extraction.

| Attribute         | Value                                                         |
| ----------------- | ------------------------------------------------------------- |
| Model             | claude-sonnet-4.5 (claude-sonnet-4-5-20250514)                |
| Pricing           | $3/MTok input, $15/MTok output                                |
| Structured Output | Yes (beta) - json_schema + strict tool use                    |
| Batch API         | 50% discount for async processing                             |

**Why Claude over GPT-4o:**

1. **Better at long-form analysis** - Podcast transcripts are lengthy; Claude
   handles context well
2. **Structured outputs available** - Released Nov 2025, guarantees JSON schema
   conformance
3. **Competitive pricing** - $3/MTok input vs GPT-4o's $2.50/MTok, but better at
   nuanced extraction
4. **Prompt caching** - 90% discount on cached tokens for repeated schema
   patterns

**Fallback:** GPT-4o-mini ($0.15/MTok input) for cost-sensitive operations or
high-volume initial filtering.

#### Framework: Vercel AI SDK 6

**Recommendation:** Use `ai` package version ^6.0.0 for all LLM interactions.

```bash
pnpm add ai @ai-sdk/anthropic zod
```

**Why Vercel AI SDK:**

1. **Provider-agnostic** - Switch between Claude, GPT-4o, local models without
   code changes
2. **Structured outputs built-in** - `Output.object()` with Zod schema
   validation
3. **TypeScript-first** - Full type safety end-to-end
4. **Streaming support** - `streamText` for real-time UI updates
5. **20M+ monthly downloads** - Battle-tested, active development
6. **Next.js integration** - Seamless with existing stack

**Key Features for Gemhog:**

```typescript
import { generateText, Output } from "ai";
import { anthropic } from "@ai-sdk/anthropic";
import { z } from "zod";

const ThesisSchema = z.object({
  ticker: z.string().describe("Stock ticker symbol"),
  thesis: z.string().describe("Investment thesis narrative"),
  assumptions: z.array(z.string()).describe("Key assumptions"),
  timeHorizon: z.enum(["short", "medium", "long"]),
  confidence: z.number().min(0).max(1),
});

const result = await generateText({
  model: anthropic("claude-sonnet-4-5-20250514"),
  prompt: transcriptContent,
  output: Output.object({ schema: ThesisSchema }),
});
```

**Note:** `generateObject` and `streamObject` are deprecated in SDK 6. Use
`generateText`/`streamText` with `output` property instead.

| Package           | Version | Purpose                  |
| ----------------- | ------- | ------------------------ |
| ai                | ^6.0.0  | Core AI SDK              |
| @ai-sdk/anthropic | ^1.0.0  | Claude provider          |
| @ai-sdk/openai    | ^1.0.0  | OpenAI provider (backup) |

**Confidence:** HIGH (verified via
[AI SDK docs](https://ai-sdk.dev/docs/ai-sdk-core/generating-structured-data))

---

### Financial Data APIs

#### Primary: Financial Modeling Prep (FMP)

**Recommendation:** Use FMP Starter plan ($99/year or $19/month unlimited).

```bash
# No SDK needed - use fetch with typed responses
```

| Attribute        | Value                                             |
| ---------------- | ------------------------------------------------- |
| Free Tier        | 250 requests/day, 500MB/30-day bandwidth          |
| Starter Plan     | $19/month unlimited, 20GB bandwidth               |
| Coverage         | 70,000+ stocks globally, 30+ years history        |
| Endpoints        | 150+ (quotes, financials, ratios, metrics)        |
| Authentication   | API key as query parameter                        |

**Why FMP over alternatives:**

| Provider       | Free Tier      | Paid Starting | Fundamentals | Notes                      |
| -------------- | -------------- | ------------- | ------------ | -------------------------- |
| **FMP**        | 250 req/day    | $19/mo        | Excellent    | Best value, comprehensive  |
| Alpha Vantage  | 25 req/day     | $49/mo        | Good         | Limited free tier          |
| Polygon.io     | 5 req/min      | $199/mo       | Limited      | Better for real-time       |
| Finnhub        | 60 req/min     | $50/mo        | Good         | Best free tier             |

**Key FMP Endpoints for Gemhog:**

```
GET /stable/profile?symbol=AAPL          # Company overview
GET /stable/quote?symbol=AAPL            # Current price
GET /stable/income-statement?symbol=AAPL # Income statements
GET /stable/balance-sheet?symbol=AAPL    # Balance sheet
GET /stable/key-metrics?symbol=AAPL      # P/E, P/B, etc.
GET /stable/ratios?symbol=AAPL           # Financial ratios
```

**Implementation Pattern:**

```typescript
// packages/core/src/services/financial-data.ts
const FMP_BASE = "https://financialmodelingprep.com/stable";

export const getStockProfile = async (symbol: string) => {
  const res = await fetch(
    `${FMP_BASE}/profile?symbol=${symbol}&apikey=${process.env.FMP_API_KEY}`
  );
  return res.json();
};
```

**Confidence:** HIGH (verified via
[FMP docs](https://site.financialmodelingprep.com/developer/docs))

---

### Social Media Automation

#### Twitter/X: twitter-api-v2

**Recommendation:** Use `twitter-api-v2` package with Free tier initially.

```bash
pnpm add twitter-api-v2
```

| Attribute     | Value                                        |
| ------------- | -------------------------------------------- |
| Package       | twitter-api-v2                               |
| Version       | ^1.29.0                                      |
| Free Tier     | 1,500 tweets/month (post only)               |
| Basic Tier    | $200/month (if more needed)                  |
| Auth          | OAuth 1.0a for server-side posting           |

**Why this package:**

1. **Strongly typed** - Full TypeScript support
2. **Full API coverage** - v1.1 and v2 endpoints
3. **227 dependents** - Well-maintained, active
4. **Handles rate limits** - Built-in retry logic

**Implementation Pattern:**

```typescript
import { TwitterApi } from "twitter-api-v2";

const client = new TwitterApi({
  appKey: process.env.TWITTER_API_KEY!,
  appSecret: process.env.TWITTER_API_SECRET!,
  accessToken: process.env.TWITTER_ACCESS_TOKEN!,
  accessSecret: process.env.TWITTER_ACCESS_SECRET!,
});

await client.v2.tweet({
  text: `New thesis discovered: ${thesis.ticker}\n\n${thesis.summary}\n\nRead more: ${url}`,
});
```

**Free Tier Limitations:**

- Post only (no reading tweets)
- 1,500 tweets/month cap
- No engagement automation (likes, follows)
- Sufficient for MVP auto-posting use case

**Confidence:** HIGH (verified via
[npm](https://www.npmjs.com/package/twitter-api-v2))

---

#### Bluesky: @atproto/api

**Recommendation:** Use official `@atproto/api` package.

```bash
pnpm add @atproto/api
```

| Attribute     | Value                               |
| ------------- | ----------------------------------- |
| Package       | @atproto/api                        |
| Version       | ^0.18.0                             |
| Pricing       | Free (no rate limits for posting)   |
| Auth          | App password (not OAuth yet)        |
| Node Version  | Requires Node.js 18+                |

**Why Bluesky:**

1. **Free API** - No cost for posting
2. **Growing platform** - Good reach for tech/finance audience
3. **Official SDK** - Maintained by Bluesky team
4. **Complements Twitter** - Diversifies distribution

**Implementation Pattern:**

```typescript
import Atproto from "@atproto/api";
const { BskyAgent } = Atproto;

const agent = new BskyAgent({ service: "https://bsky.social" });

await agent.login({
  identifier: process.env.BLUESKY_HANDLE!,
  password: process.env.BLUESKY_APP_PASSWORD!,
});

await agent.post({
  text: `New thesis discovered: ${thesis.ticker}\n\n${thesis.summary}`,
  createdAt: new Date().toISOString(),
});
```

**Important Notes:**

- Use app password, not main account password
- CommonJS import fix: `import Atproto from '@atproto/api'; const { BskyAgent } = Atproto;`
- Rich text with links/mentions requires `RichText` helper for utf8 handling
- OAuth with granular permissions coming in 2025

**Confidence:** HIGH (verified via
[Bluesky docs](https://docs.bsky.app/docs/get-started))

---

### Job Scheduling

#### SST v3 Cron Component

**Recommendation:** Use SST v3's built-in `sst.aws.Cron` component.

```typescript
// sst.config.ts
new sst.aws.Cron("TranscriptPipeline", {
  job: "packages/functions/src/pipelines/transcript.handler",
  schedule: "rate(1 hour)",
});

new sst.aws.Cron("SocialPoster", {
  job: "packages/functions/src/pipelines/social.handler",
  schedule: "cron(0 9,17 * * ? *)", // 9 AM and 5 PM UTC
});
```

**Why SST Cron:**

1. **Already using SST v3** - No additional dependencies
2. **Serverless** - Pay only when functions run
3. **EventBridge-backed** - Reliable, managed by AWS
4. **TypeScript config** - Type-safe schedule definitions

**Schedule Syntax Options:**

| Pattern                      | Description                |
| ---------------------------- | -------------------------- |
| `rate(1 minute)`             | Every minute               |
| `rate(1 hour)`               | Every hour                 |
| `rate(1 day)`                | Daily                      |
| `cron(0 9 * * ? *)`          | 9 AM UTC daily             |
| `cron(0 */4 * * ? *)`        | Every 4 hours              |
| `cron(0 9,17 * * ? *)`       | 9 AM and 5 PM UTC          |

**Recommended Pipeline Schedule:**

| Job                | Schedule          | Rationale                        |
| ------------------ | ----------------- | -------------------------------- |
| Transcript fetch   | `rate(1 hour)`    | Check for new episodes hourly    |
| Thesis extraction  | `rate(2 hours)`   | Process pending transcripts      |
| Social posting     | `rate(4 hours)`   | Spread posts throughout day      |
| Data refresh       | `rate(1 day)`     | Update stock metrics daily       |

**Confidence:** HIGH (verified via
[SST docs](https://sst.dev/docs/component/aws/cron))

---

### Caching and Performance

#### Upstash Redis

**Recommendation:** Use Upstash for serverless Redis caching.

```bash
pnpm add @upstash/redis
```

| Attribute    | Value                                      |
| ------------ | ------------------------------------------ |
| Package      | @upstash/redis                             |
| Pricing      | $0.20 per 100k requests + $0.25/GB storage |
| Free Tier    | 10k requests/day                           |
| Access       | HTTP/REST (works in serverless/edge)       |

**Why Upstash over ElastiCache:**

1. **Serverless-native** - No VPC configuration needed
2. **Pay-per-request** - Cost-effective for variable traffic
3. **REST API** - Works in Lambda, edge functions, anywhere
4. **Global replication** - Low latency worldwide
5. **SST integration** - First-class support

**When to use caching:**

| Data Type           | TTL          | Rationale                        |
| ------------------- | ------------ | -------------------------------- |
| Stock quotes        | 15 minutes   | Balance freshness vs API calls   |
| Company profiles    | 24 hours     | Rarely changes                   |
| Financial metrics   | 1 hour       | Updated intraday                 |
| Extracted theses    | Indefinite   | Computed once, stored in DB      |
| API rate limit      | 1 minute     | Track request counts             |

**Implementation Pattern:**

```typescript
import { Redis } from "@upstash/redis";

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

// Cache stock quote
const cacheKey = `stock:${symbol}:quote`;
let quote = await redis.get(cacheKey);
if (!quote) {
  quote = await fetchFromFMP(symbol);
  await redis.set(cacheKey, quote, { ex: 900 }); // 15 min TTL
}
```

**Alternative: AWS ElastiCache Serverless**

If you need VPC-only access and higher throughput, ElastiCache Serverless is an
option. However, it requires VPC configuration and is better suited for
high-volume, consistent traffic patterns.

**Confidence:** HIGH (verified via
[Upstash docs](https://upstash.com/docs/redis/overall/compare))

---

### Other Recommendations

#### Podscan.fm API (Already Decided)

**Recommendation:** Essential plan minimum for production.

| Plan      | Requests/Day | Requests/Min | Price    |
| --------- | ------------ | ------------ | -------- |
| Trial     | 100          | 10           | Free     |
| Essential | 1,000        | 60           | ~$50/mo  |
| Premium   | 2,000        | 120          | ~$100/mo |
| Advanced  | 5,000        | 120          | ~$200/mo |

**Key Endpoints:**

```
GET /episodes/search?query=investing   # Search transcripts
GET /episodes/recent                   # Latest transcribed
GET /teams/{team}/alerts/mentions      # Keyword alerts
```

**Confidence:** HIGH (verified via [Podscan docs](https://podscan.fm/docs/api))

---

#### Zod (Schema Validation)

**Already implicit in stack** - Required for tRPC and AI SDK structured outputs.

```bash
pnpm add zod
```

Zod schemas serve triple duty:

1. **tRPC input validation**
2. **AI SDK structured output schemas**
3. **Database type inference with Drizzle**

---

## What NOT to Use

### LangChain

**Do not use LangChain** for this project.

**Why:**

1. **Overkill** - Gemhog needs simple extraction, not complex agent chains
2. **More boilerplate** - Vercel AI SDK is simpler for structured outputs
3. **Abstraction overhead** - Direct provider APIs + AI SDK are cleaner
4. **Dependency bloat** - Large package with many transitive dependencies

**Use Vercel AI SDK instead.**

---

### LlamaIndex

**Do not use LlamaIndex** for this project.

**Why:**

1. **RAG-focused** - Gemhog doesn't need vector search/retrieval
2. **Wrong paradigm** - We're extracting from known transcripts, not searching
3. **Python-first** - TypeScript support is secondary

**Use direct transcript processing with AI SDK instead.**

---

### node-cron or agenda.js

**Do not use in-process schedulers.**

**Why:**

1. **Serverless architecture** - Lambda functions don't persist
2. **SST provides Cron** - Native solution already available
3. **Reliability** - EventBridge is more reliable than in-process timers

**Use SST v3 Cron component instead.**

---

### Alpha Vantage

**Do not use as primary financial data source.**

**Why:**

1. **Severely limited free tier** - 25 requests/day vs FMP's 250
2. **Higher paid pricing** - $49/mo vs FMP's $19/mo
3. **Less comprehensive** - Fewer endpoints, less historical data

**Use Financial Modeling Prep instead.**

---

### Self-hosted Redis (ElastiCache node-based)

**Do not use traditional ElastiCache** unless traffic is consistently high.

**Why:**

1. **Always-on cost** - Pay even when idle
2. **VPC complexity** - Requires networking configuration
3. **Overkill for MVP** - Upstash scales from $0

**Use Upstash for serverless Redis instead.**

---

## Confidence Assessment

| Category             | Confidence | Reasoning                                        |
| -------------------- | ---------- | ------------------------------------------------ |
| LLM Integration      | HIGH       | AI SDK 6 docs verified, Claude pricing confirmed |
| Financial Data APIs  | HIGH       | FMP docs verified, pricing confirmed             |
| Twitter Automation   | HIGH       | npm package verified, free tier limits confirmed |
| Bluesky Automation   | HIGH       | Official docs verified, SDK active               |
| Job Scheduling       | HIGH       | SST v3 docs verified, native to stack            |
| Caching              | HIGH       | Upstash docs verified, serverless fit confirmed  |
| Anti-recommendations | HIGH       | Based on architecture fit analysis               |

---

## Integration Summary

```
                    +------------------+
                    |   Next.js Web    |
                    |   (shadcn/ui)    |
                    +--------+---------+
                             |
                             | tRPC
                             v
                    +------------------+
                    |   Hono Backend   |
                    |   (Effect TS)    |
                    +--------+---------+
                             |
         +-------------------+-------------------+
         |                   |                   |
         v                   v                   v
+----------------+  +----------------+  +----------------+
|  AI SDK 6 +    |  |   Upstash      |  |  PostgreSQL    |
|  Claude API    |  |   Redis        |  |  (Drizzle)     |
+----------------+  +----------------+  +----------------+
         |
         v
+----------------+
| Podscan.fm API |
+----------------+

+------------------+     +------------------+
| SST v3 Cron      |---->| Lambda Functions |
| (EventBridge)    |     | - Transcript     |
+------------------+     | - Social Post    |
                         +------------------+
                                  |
                    +-------------+-------------+
                    |                           |
                    v                           v
           +----------------+         +----------------+
           | Twitter API    |         | Bluesky API    |
           | (twitter-api-v2)|        | (@atproto/api) |
           +----------------+         +----------------+

           +----------------+
           | FMP API        |
           | (Stock Data)   |
           +----------------+
```

---

## Installation Commands

```bash
# LLM Integration
pnpm add ai @ai-sdk/anthropic @ai-sdk/openai

# Social Media
pnpm add twitter-api-v2 @atproto/api

# Caching
pnpm add @upstash/redis

# Already included (validation)
pnpm add zod
```

---

## Environment Variables Required

```bash
# LLM
ANTHROPIC_API_KEY=sk-ant-...
OPENAI_API_KEY=sk-...  # backup

# Financial Data
FMP_API_KEY=...

# Podcast Transcripts
PODSCAN_API_KEY=...

# Social Media
TWITTER_API_KEY=...
TWITTER_API_SECRET=...
TWITTER_ACCESS_TOKEN=...
TWITTER_ACCESS_SECRET=...
BLUESKY_HANDLE=...
BLUESKY_APP_PASSWORD=...

# Caching
UPSTASH_REDIS_REST_URL=...
UPSTASH_REDIS_REST_TOKEN=...
```

---

## Sources

### LLM/AI Integration

- [AI SDK Structured Data](https://ai-sdk.dev/docs/ai-sdk-core/generating-structured-data)
- [AI SDK 6 Announcement](https://vercel.com/blog/ai-sdk-6)
- [Claude Structured Outputs](https://platform.claude.com/docs/en/build-with-claude/structured-outputs)
- [Anthropic Pricing](https://platform.claude.com/docs/en/about-claude/pricing)

### Financial Data

- [FMP API Documentation](https://site.financialmodelingprep.com/developer/docs)
- [FMP Pricing](https://site.financialmodelingprep.com/pricing-plans)
- [Financial APIs Comparison](https://medium.com/coinmonks/the-7-best-financial-apis-for-investors-and-developers-in-2025-in-depth-analysis-and-comparison-adbc22024f68)

### Social Media

- [twitter-api-v2 npm](https://www.npmjs.com/package/twitter-api-v2)
- [X API Pricing](https://twitterapi.io/blog/twitter-api-pricing-2025)
- [@atproto/api npm](https://www.npmjs.com/package/@atproto/api)
- [Bluesky API Docs](https://docs.bsky.app/docs/get-started)

### Job Scheduling

- [SST v3 Cron](https://sst.dev/docs/component/aws/cron)
- [SST v3 Announcement](https://sst.dev/blog/sst-v3/)

### Caching

- [Upstash vs ElastiCache](https://upstash.com/docs/redis/overall/compare)
- [Upstash Redis Docs](https://upstash.com/docs/redis/overall/getstarted)

### Podcast Data

- [Podscan API Docs](https://podscan.fm/docs/api)

---

_Last updated: 2026-01-19_
