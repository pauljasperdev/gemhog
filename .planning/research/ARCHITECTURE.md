# Architecture Research

**Domain:** Financial content aggregation with AI analysis pipeline
**Researched:** 2026-01-19 **Confidence:** MEDIUM (patterns verified against
official docs; domain-specific integration is hypothesis)

## Executive Summary

Financial content aggregation systems with AI analysis pipelines typically
follow a layered architecture with distinct components: ingestion layer (fetches
external data), processing layer (transforms and analyzes content), storage
layer (persists structured data), API layer (serves processed data), and
distribution layer (pushes to external platforms). The key architectural
decision for Gemhog is whether to use SST Cron + Lambda for quick analysis jobs
or SST Task (Fargate) for longer-running transcript processing. Given the
existing Hono/tRPC stack and the nature of transcript analysis (likely under 15
minutes per batch), Lambda-based cron jobs are recommended for MVP, with Fargate
Tasks available for scaling.

## System Components

### 1. Content Ingestion Service

**Responsibility:** Fetch podcast transcripts from Podscan.fm API

**Boundaries:**

- Input: Cron trigger (scheduled intervals)
- Output: Raw transcript data to processing queue/storage
- Dependencies: Podscan.fm API credentials, rate limit management

**Key Decisions:**

- **Batch vs Stream:** Batch ingestion via cron (not real-time firehose) because
  Podscan.fm charges significantly more for firehose access ($100/mo for 2K
  daily requests vs $2,500/mo for real-time)
- **Frequency:** Daily or hourly depending on content freshness needs
- **Error handling:** Retry with exponential backoff, dead-letter queue for
  failed fetches

**Implementation Pattern:**

```typescript
// packages/core/ingestion/podscan.ts
interface TranscriptFetcher {
  fetchNewTranscripts(since: Date): Promise<RawTranscript[]>;
  fetchTranscript(episodeId: string): Promise<RawTranscript>;
}
```

### 2. Thesis Extraction Service

**Responsibility:** Analyze transcripts using LLM to extract investment theses

**Boundaries:**

- Input: Raw transcript text
- Output: Structured thesis objects (stock mentioned, thesis statement,
  supporting quotes, confidence)
- Dependencies: LLM provider (Gemini via AI SDK already in use)

**Key Decisions:**

- **Model selection:** Use existing Google Gemini integration (already
  configured in `apps/server`)
- **Prompt engineering:** Schema-guided extraction with JSON output format
- **Chunking strategy:** Split long transcripts into semantic chunks, process in
  parallel
- **Validation:** Zod schema for thesis output structure

**Implementation Pattern:**

```typescript
// packages/core/thesis/extractor.ts
interface ThesisExtractor {
  extractTheses(transcript: RawTranscript): Promise<ExtractedThesis[]>;
}

interface ExtractedThesis {
  stockSymbol: string | null; // May need resolution
  stockName: string;
  thesisStatement: string;
  supportingQuotes: string[];
  timeHorizon: "short" | "medium" | "long" | "unknown";
  confidence: number;
  sourceEpisodeId: string;
  sourceTimestamp?: string;
}
```

### 3. Stock Resolution Service

**Responsibility:** Map mentioned company names to stock symbols

**Boundaries:**

- Input: Company name from extracted thesis
- Output: Stock symbol, exchange, basic company metadata
- Dependencies: Financial data API (to be determined - Alpha Vantage, Polygon,
  or similar)

**Key Decisions:**

- **Caching:** Cache symbol lookups (company names rarely change)
- **Fuzzy matching:** Handle variations ("Apple", "Apple Inc", "AAPL")
- **Manual override:** Allow editorial correction of mismatched symbols

### 4. Thesis Evaluation Service

**Responsibility:** Fetch financial data to evaluate extracted theses

**Boundaries:**

- Input: Stock symbol + thesis context
- Output: Evaluation with supporting/contradicting data points
- Dependencies: Financial data APIs

**Key Decisions:**

- **Data freshness:** Daily refresh for most metrics, intraday not needed
- **Metrics selection:** Based on thesis type (growth thesis needs revenue
  growth, value thesis needs P/E ratios)
- **LLM for synthesis:** Use Gemini to generate human-readable evaluation from
  structured data

**Implementation Pattern:**

```typescript
// packages/core/thesis/evaluator.ts
interface ThesisEvaluator {
  evaluate(
    thesis: ExtractedThesis,
    stockData: StockData,
  ): Promise<ThesisEvaluation>;
}

interface ThesisEvaluation {
  supportingPoints: DataPoint[];
  contradictingPoints: DataPoint[];
  unknowns: string[];
  overallAssessment: "strong" | "moderate" | "weak" | "mixed";
  generatedAnalysis: string;
}
```

### 5. Stock Page Aggregator

**Responsibility:** Combine multiple theses and data for a single stock

**Boundaries:**

- Input: Stock symbol
- Output: Aggregated view with all theses, evaluations, and financial data
- Dependencies: Database queries

**Key Decisions:**

- **Caching strategy:** Compute aggregation on-demand with short TTL, or
  precompute on thesis change
- **Sorting/filtering:** By date, source credibility, thesis strength
- **Pagination:** For stocks with many theses

### 6. Social Media Distribution Service

**Responsibility:** Post new analyses to Twitter/X and Bluesky

**Boundaries:**

- Input: New thesis evaluation (trigger on creation)
- Output: Posted content with links back to stock page
- Dependencies: Twitter API, Bluesky API (AT Protocol)

**Key Decisions:**

- **Bluesky preferred for MVP:** Free API, no rate limit concerns, growing
  platform
- **Twitter as secondary:** API changes have made third-party posting more
  restrictive (Make.com discontinued integration May 2025)
- **Content generation:** LLM-generated summaries optimized for social media
  length
- **Scheduling:** Queue-based to avoid rate limits, spread posts throughout day

**Implementation Pattern:**

```typescript
// packages/core/distribution/social.ts
interface SocialPoster {
  postToBluesky(analysis: ThesisEvaluation): Promise<PostResult>;
  postToTwitter(analysis: ThesisEvaluation): Promise<PostResult>;
}
```

## Data Flows

### Primary Flow: Transcript to Stock Page

```
[Podscan.fm API]
       |
       v (Cron trigger - daily/hourly)
[Ingestion Service]
       |
       v (Raw transcripts)
[Thesis Extraction Service] <-- [Gemini LLM]
       |
       v (Extracted theses)
[Stock Resolution Service]
       |
       v (Theses with symbols)
[Database: transcripts, theses]
       |
       v (On new thesis)
[Thesis Evaluation Service] <-- [Financial Data APIs] <-- [Gemini LLM]
       |
       v (Thesis evaluations)
[Database: evaluations]
       |
       v (On new evaluation)
[Social Distribution Service] --> [Twitter/X, Bluesky]
```

### Secondary Flow: Stock Page Request

```
[User Request: /stock/AAPL]
       |
       v
[tRPC Router: stock.getBySymbol]
       |
       v
[Stock Page Aggregator]
       |
       v (Query)
[Database: theses, evaluations, financial_data]
       |
       v
[Aggregated Response]
       |
       v
[Next.js Page Render]
```

### Background Processing Flow (SST Cron)

```
[SST Cron Component] -- rate(1 hour) --> [Lambda: processNewTranscripts]
                                                |
                                                v
                                         [Ingestion + Extraction]
                                                |
                                                v
                                         [Write to Database]
                                                |
                                                v (if new thesis)
                                         [Trigger Evaluation]
                                                |
                                                v (if new evaluation)
                                         [Trigger Distribution]
```

## Component Boundaries

### Package Structure (Aligned with Core Consolidation Plan)

```
packages/
  core/
    src/
      drizzle/
        index.ts              # DB connection, schema aggregation
      auth/
        auth.sql.ts           # Auth tables
        index.ts              # Better-auth config
      transcript/
        transcript.sql.ts     # podcast, episode, transcript tables
        podscan.ts           # Podscan.fm API client
        index.ts             # Barrel export
      thesis/
        thesis.sql.ts        # thesis, evaluation tables
        extractor.ts         # LLM-based thesis extraction
        evaluator.ts         # LLM-based thesis evaluation
        index.ts             # Barrel export
      stock/
        stock.sql.ts         # stock, financial_data tables
        resolver.ts          # Symbol resolution
        aggregator.ts        # Stock page aggregation
        index.ts             # Barrel export
      distribution/
        distribution.sql.ts  # post_log table
        bluesky.ts          # Bluesky AT Protocol client
        twitter.ts          # Twitter/X API client
        index.ts            # Barrel export
```

### API Contracts (tRPC Routers)

```
packages/api/src/routers/
  stock.ts      # Stock page queries
  thesis.ts     # Thesis CRUD (admin)
  feed.ts       # Discovery feed queries

// stock.ts
stockRouter = router({
  getBySymbol: publicProcedure
    .input(z.object({ symbol: z.string() }))
    .query(async ({ input, ctx }) => { ... }),

  list: publicProcedure
    .input(z.object({ cursor: z.string().optional(), limit: z.number().default(20) }))
    .query(async ({ input, ctx }) => { ... }),
})

// thesis.ts (protected - admin only)
thesisRouter = router({
  triggerExtraction: protectedProcedure
    .input(z.object({ transcriptId: z.string() }))
    .mutation(async ({ input, ctx }) => { ... }),

  approve: protectedProcedure
    .input(z.object({ thesisId: z.string() }))
    .mutation(async ({ input, ctx }) => { ... }),
})

// feed.ts
feedRouter = router({
  latest: publicProcedure
    .input(z.object({ cursor: z.string().optional(), limit: z.number().default(20) }))
    .query(async ({ input, ctx }) => { ... }),

  byCategory: publicProcedure
    .input(z.object({ category: z.string(), cursor: z.string().optional() }))
    .query(async ({ input, ctx }) => { ... }),
})
```

### SST Cron Configuration (sst.config.ts)

```typescript
// Transcript ingestion - runs hourly
const ingestCron = new sst.aws.Cron("IngestTranscripts", {
  schedule: "rate(1 hour)",
  function: {
    handler: "packages/core/src/transcript/cron-handler.handler",
    timeout: "10 minutes",
    environment: {
      DATABASE_URL: database.url,
      PODSCAN_API_KEY: secrets.podscanApiKey.value,
    },
  },
});

// Thesis evaluation - runs every 15 minutes (processes pending theses)
const evaluateCron = new sst.aws.Cron("EvaluateTheses", {
  schedule: "rate(15 minutes)",
  function: {
    handler: "packages/core/src/thesis/evaluate-cron.handler",
    timeout: "10 minutes",
    environment: {
      DATABASE_URL: database.url,
      GOOGLE_AI_API_KEY: secrets.googleAiApiKey.value,
    },
  },
});

// Social posting - runs every 30 minutes (spreads posts)
const distributeCron = new sst.aws.Cron("DistributeToSocial", {
  schedule: "rate(30 minutes)",
  function: {
    handler: "packages/core/src/distribution/cron-handler.handler",
    timeout: "5 minutes",
    environment: {
      DATABASE_URL: database.url,
      BLUESKY_HANDLE: secrets.blueskyHandle.value,
      BLUESKY_APP_PASSWORD: secrets.blueskyAppPassword.value,
    },
  },
});
```

## Build Order Recommendation

Based on component dependencies, here is the recommended build order:

### Phase 1: Foundation (Prerequisites)

1. **Core package consolidation** - Merge db + auth into packages/core
2. **Domain schemas** - Add stock, transcript, thesis, evaluation tables
3. **Testing infrastructure** - Vitest setup for unit tests

**Rationale:** Everything else depends on database schema and package structure.

### Phase 2: Data Ingestion

4. **Podscan.fm client** - API wrapper with rate limiting
5. **Transcript storage** - Save raw transcripts to database
6. **Manual trigger** - Admin endpoint to fetch specific podcasts (for testing)

**Rationale:** Need data before you can process it. Manual trigger enables
testing without cron.

### Phase 3: Thesis Extraction

7. **Thesis extraction service** - LLM-based extraction from transcripts
8. **Stock resolution** - Map company names to symbols
9. **Admin review UI** - Approve/reject extracted theses

**Rationale:** Core value proposition. Admin review ensures quality before
public display.

### Phase 4: Stock Pages

10. **Stock page aggregator** - Combine theses for a symbol
11. **Stock page UI** - Next.js dynamic route `/stock/[symbol]`
12. **Discovery feed** - List recent analyses

**Rationale:** Public-facing features that display processed data.

### Phase 5: Evaluation

13. **Financial data fetching** - Integrate data API
14. **Thesis evaluation service** - Generate pros/cons/unknowns
15. **Evaluation display** - Add to stock page UI

**Rationale:** Enhances core feature but not required for MVP launch.

### Phase 6: Distribution

16. **Bluesky integration** - AT Protocol posting
17. **Twitter integration** - API posting (if feasible)
18. **Automated posting cron** - Schedule new analysis posts

**Rationale:** Growth feature, best added after core product works.

### Phase 7: Automation

19. **SST Cron jobs** - Automated ingestion, evaluation, distribution
20. **Monitoring** - CloudWatch alarms for cron failures
21. **Dead letter queues** - Handle failed processing

**Rationale:** Reduces manual effort once product is validated.

## Integration with Existing Architecture

### Alignment with Current Stack

| Current Component                     | New Components Integration                                 |
| ------------------------------------- | ---------------------------------------------------------- |
| Hono backend (apps/server)            | Add cron handlers as Lambda functions (separate from Hono) |
| tRPC routers (packages/api)           | Add stock, thesis, feed routers                            |
| Drizzle schemas (packages/db -> core) | Add domain schemas in core package                         |
| AI SDK + Gemini                       | Reuse for thesis extraction and evaluation                 |
| Better-Auth                           | Admin role for thesis approval endpoints                   |
| Next.js pages                         | Add /stock/[symbol], /feed routes                          |

### SST-Agnostic Pattern Compliance

All new code reads environment variables, not SST SDK:

```typescript
// packages/core/src/transcript/podscan.ts
import { env } from "@gemhog/env/server";

export class PodscanClient {
  private apiKey = env.PODSCAN_API_KEY;
  // ...
}
```

SST injects env vars at deploy; `.env` files provide them locally.

### Effect TS Integration Points

When Effect TS is added, key services become Effect services:

```typescript
// Future pattern with Effect
const ThesisExtractor = Context.Tag<ThesisExtractor>();

const extractTheses = Effect.gen(function* () {
  const extractor = yield* ThesisExtractor;
  const llm = yield* LLMService;
  const db = yield* Database;
  // ...
});
```

For now, build services as plain TypeScript classes/functions. Effect can wrap
them later.

## Scaling Considerations

### At MVP (100 users)

| Concern        | Approach                                   |
| -------------- | ------------------------------------------ |
| Ingestion      | Single Lambda cron, sequential processing  |
| LLM calls      | Direct API calls, no queuing               |
| Database       | Single Postgres instance, no read replicas |
| Social posting | Direct posting, no queue                   |

### At 10K users

| Concern        | Approach                                |
| -------------- | --------------------------------------- |
| Ingestion      | Parallel Lambda invocations per podcast |
| LLM calls      | SQS queue with Lambda workers           |
| Database       | RDS with read replica for stock pages   |
| Social posting | SQS queue to spread rate limits         |

### At 1M users

| Concern        | Approach                                               |
| -------------- | ------------------------------------------------------ |
| Ingestion      | SST Task (Fargate) for bulk processing                 |
| LLM calls      | Multiple provider fallback, caching of similar queries |
| Database       | Aurora Serverless, Redis cache for hot stock pages     |
| Social posting | Multi-region distribution, scheduling service          |

### Bottleneck Predictions

1. **LLM API costs** - Most likely first bottleneck. Mitigate with caching,
   prompt optimization, and batch processing.
2. **Podscan.fm rate limits** - 2K-5K daily requests. Mitigate with smart
   caching and priority queue.
3. **Database writes during evaluation** - Mitigate with batch inserts and
   eventual consistency.

## Sources

### Official Documentation (HIGH confidence)

- [SST v3 Cron Component](https://sst.dev/docs/component/aws/cron/) - Cron
  configuration, Lambda/Task integration
- [SST v3 Tasks Blog](https://sst.dev/blog/tasks-in-v3/) - Fargate-based
  background jobs, cost comparison
- Podscan.fm API (fetched) - API tiers, rate limits, data available

### WebSearch Findings (MEDIUM confidence, verified patterns)

- [Netflix Data Ingestion Pipeline](https://netflixtechblog.com/data-ingestion-pipeline-with-operation-management-3c5c638740a8) -
  Operation management patterns
- [XenonStack Data Pipeline Architecture](https://www.xenonstack.com/blog/data-ingestion-pipeline-architecture) -
  Five-stage pipeline model
- [DZone LLM Pipeline Architecture](https://dzone.com/articles/architecting-intelligence-llm-powered-pipeline) -
  Enrichment and chunking patterns
- [Bluesky Posting API Guide](https://getlate.dev/blog/bluesky-posting-api) - AT
  Protocol authentication and posting
- [Ayrshare Bluesky Guide](https://www.ayrshare.com/complete-guide-to-bluesky-api-integration-authorization-posting-analytics-comments/) -
  Full integration patterns
- [BridgeFT Financial Data Aggregation](https://www.bridgeft.com/financial-data-aggregation/) -
  Multi-source aggregation patterns
- [AlphaSense NLP Applications](https://www.alpha-sense.com/blog/product/natural-language-processing-financial-research/) -
  Theme extraction in finance
- [Building Production-Ready Hono APIs](https://medium.com/@yannick.burkard/building-production-ready-hono-apis-a-modern-architecture-guide-fed8a415ca96) -
  Hono architecture patterns including crons folder

### Lower Confidence (patterns, not verified)

- Financial thesis extraction specific patterns - Hypothesis based on general
  NLP extraction research
- Twitter/X API stability - Recent changes (May 2025) make this uncertain
