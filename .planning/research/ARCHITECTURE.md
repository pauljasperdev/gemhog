# Architecture Research

**Domain:** Financial research platform with content extraction pipeline
**Researched:** 2026-01-19 **Confidence:** HIGH (Effect TS patterns), MEDIUM
(pipeline architecture), HIGH (financial data integration)

## Executive Summary

Gemhog requires a three-tier architecture: (1) **content ingestion pipeline**
for extracting theses from podcast transcripts, (2) **financial data integration
layer** with provider abstraction for SEC EDGAR and price data sources, and (3)
**presentation layer** serving stock pages with combined analysis. The
architecture leverages Effect TS for testable service composition, tRPC for
type-safe API boundaries, and SST Cron for scheduled pipeline execution.

**Critical Finding:** Stooq now requires CAPTCHA (since December 2020), making
it unsuitable for automated price fetching. Alternative price data sources
(EODHD, Alpha Vantage, Marketstack) should be used instead.

---

## System Overview

```
                                    +--------------------+
                                    |    Next.js Web     |
                                    |    (shadcn/ui)     |
                                    +--------+-----------+
                                             |
                                             | tRPC Client
                                             v
+----------------+               +------------------------+
| SST Cron Jobs  |               |      Hono Server       |
| (EventBridge)  |               |    (tRPC Adapter)      |
+-------+--------+               +----------+-------------+
        |                                   |
        | Lambda invoke                     | Effect.provide
        v                                   v
+-------+-----------------------------------+-------------+
|                    Effect Service Layer                 |
|                                                         |
|  +-------------+  +-------------+  +----------------+   |
|  | Transcript  |  |   Stock     |  |    Thesis      |   |
|  |   Service   |  |   Service   |  |    Service     |   |
|  +------+------+  +------+------+  +-------+--------+   |
|         |                |                 |            |
+---------+----------------+-----------------+------------+
          |                |                 |
          v                v                 v
+----------------+  +-------------+  +----------------+
| Podscan.fm API |  | Financial   |  | LLM Provider   |
|                |  | Data Layer  |  | (AI SDK)       |
+----------------+  +------+------+  +----------------+
                           |
         +-----------------+-----------------+
         |                                   |
         v                                   v
+----------------+                 +------------------+
| SEC EDGAR API  |                 | Price Data API   |
| (Fundamentals) |                 | (EOD History)    |
+----------------+                 +------------------+
```

---

## Component Responsibilities

| Component                | Responsibility                                 | Implementation                  |
| ------------------------ | ---------------------------------------------- | ------------------------------- |
| **Next.js Web**          | Stock pages, discovery feed, newsletter signup | `packages/web`                  |
| **Hono Server**          | HTTP routing, tRPC adapter, auth middleware    | `packages/api`                  |
| **Effect Service Layer** | Business logic, DI, testability                | `packages/core/src/services/`   |
| **Transcript Service**   | Fetch transcripts from Podscan.fm              | Effect service with HTTP client |
| **Thesis Service**       | Extract theses using LLM, link to tickers      | Effect service with AI SDK      |
| **Stock Service**        | Aggregate stock data, serve to frontend        | Effect service with caching     |
| **Financial Data Layer** | Abstract SEC EDGAR + price sources             | Provider pattern in Effect      |
| **Cron Lambdas**         | Scheduled pipeline execution                   | `packages/functions/`           |

---

## Recommended Project Structure

```
packages/
├── core/                           # Domain logic (consolidates db + auth)
│   ├── src/
│   │   ├── domains/
│   │   │   ├── auth/
│   │   │   │   ├── auth.service.ts       # Effect service
│   │   │   │   ├── auth.repository.ts    # DB operations
│   │   │   │   └── auth.sql.ts           # Drizzle schema
│   │   │   ├── stock/
│   │   │   │   ├── stock.service.ts
│   │   │   │   ├── stock.repository.ts
│   │   │   │   └── stock.sql.ts
│   │   │   ├── thesis/
│   │   │   │   ├── thesis.service.ts
│   │   │   │   ├── thesis.repository.ts
│   │   │   │   ├── thesis.sql.ts
│   │   │   │   └── extraction/
│   │   │   │       ├── extractor.service.ts
│   │   │   │       └── schemas.ts        # Zod schemas for LLM output
│   │   │   └── transcript/
│   │   │       ├── transcript.service.ts
│   │   │       ├── transcript.repository.ts
│   │   │       └── transcript.sql.ts
│   │   ├── providers/
│   │   │   ├── financial-data/
│   │   │   │   ├── financial-data.provider.ts   # Interface
│   │   │   │   ├── sec-edgar.provider.ts        # SEC EDGAR impl
│   │   │   │   ├── price-data.provider.ts       # Price data interface
│   │   │   │   └── eodhd.provider.ts            # EODHD impl (NOT Stooq)
│   │   │   ├── llm/
│   │   │   │   ├── llm.provider.ts              # Interface
│   │   │   │   └── anthropic.provider.ts        # Claude impl
│   │   │   └── podcast/
│   │   │       ├── podcast.provider.ts          # Interface
│   │   │       └── podscan.provider.ts          # Podscan.fm impl
│   │   ├── layers/
│   │   │   ├── database.layer.ts         # Drizzle connection
│   │   │   ├── cache.layer.ts            # Upstash Redis
│   │   │   ├── config.layer.ts           # Environment config
│   │   │   └── app.layer.ts              # Composed application layer
│   │   └── index.ts
│   └── package.json
│
├── api/                            # Hono + tRPC server
│   ├── src/
│   │   ├── routers/
│   │   │   ├── stock.router.ts
│   │   │   ├── thesis.router.ts
│   │   │   └── index.ts
│   │   ├── middleware/
│   │   │   └── effect.middleware.ts  # Provides Effect layer to context
│   │   ├── context.ts
│   │   └── index.ts
│   └── package.json
│
├── web/                            # Next.js frontend (existing)
│
├── functions/                      # Lambda handlers for cron jobs
│   ├── src/
│   │   ├── pipelines/
│   │   │   ├── transcript-fetch.handler.ts
│   │   │   ├── thesis-extraction.handler.ts
│   │   │   ├── stock-data-refresh.handler.ts
│   │   │   └── social-post.handler.ts
│   │   └── shared/
│   │       └── layer-provider.ts   # Shared Effect layer setup
│   └── package.json
│
└── infra/                          # SST v3 infrastructure
    └── sst.config.ts
```

---

## Architectural Patterns

### Pattern 1: Effect TS Service Layer

Effect provides compile-time dependency injection through `Context.Tag` and
`Layer`. Services declare dependencies in their type signatures, enabling
testability and composition.

**Defining a Service:**

```typescript
// packages/core/src/domains/stock/stock.service.ts
import { Context, Effect, Layer } from "effect";
import type { StockRepository } from "./stock.repository";
import type { FinancialDataProvider } from "../../providers/financial-data/financial-data.provider";
import type { CacheService } from "../../layers/cache.layer";

// 1. Define service interface using Context.Tag
export class StockService extends Context.Tag("StockService")<
  StockService,
  {
    readonly getStock: (
      ticker: string,
    ) => Effect.Effect<Stock, StockNotFoundError>;
    readonly getStockWithFinancials: (
      ticker: string,
    ) => Effect.Effect<StockWithFinancials, StockError>;
    readonly listStocks: () => Effect.Effect<Stock[]>;
  }
>() {}

// 2. Create Live implementation as a Layer
export const StockServiceLive = Layer.effect(
  StockService,
  Effect.gen(function* () {
    // Dependencies are yielded, not injected via constructor
    const repo = yield* StockRepository;
    const financialData = yield* FinancialDataProvider;
    const cache = yield* CacheService;

    return {
      getStock: (ticker) =>
        Effect.gen(function* () {
          // Check cache first
          const cached = yield* cache.get(`stock:${ticker}`);
          if (cached) return cached as Stock;

          // Fetch from repository
          const stock = yield* repo.findByTicker(ticker);
          if (!stock) {
            return yield* Effect.fail(new StockNotFoundError(ticker));
          }

          yield* cache.set(`stock:${ticker}`, stock, { ttl: 3600 });
          return stock;
        }),

      getStockWithFinancials: (ticker) =>
        Effect.gen(function* () {
          const stock = yield* StockService.getStock(ticker);
          const financials = yield* financialData.getFinancials(ticker);
          return { ...stock, financials };
        }),

      listStocks: () => repo.findAll(),
    };
  }),
);

// Layer type: Layer<StockService, never, StockRepository | FinancialDataProvider | CacheService>
```

**Composing Layers:**

```typescript
// packages/core/src/layers/app.layer.ts
import { Layer } from "effect";
import { DatabaseLayerLive } from "./database.layer";
import { CacheLayerLive } from "./cache.layer";
import { ConfigLayerLive } from "./config.layer";
import { StockRepositoryLive } from "../domains/stock/stock.repository";
import { StockServiceLive } from "../domains/stock/stock.service";
import { FinancialDataProviderLive } from "../providers/financial-data/financial-data.provider";
// ... other imports

// Compose all layers into single application layer
export const AppLayerLive = Layer.mergeAll(
  ConfigLayerLive,
  DatabaseLayerLive,
  CacheLayerLive,
).pipe(
  Layer.provideMerge(StockRepositoryLive),
  Layer.provideMerge(FinancialDataProviderLive),
  Layer.provideMerge(StockServiceLive),
  // ... other services
);

// For testing: swap implementations
export const AppLayerTest = Layer.mergeAll(
  ConfigLayerTest,
  DatabaseLayerTest, // Uses test DB or in-memory
  CacheLayerTest, // Uses in-memory cache
).pipe(
  Layer.provideMerge(StockRepositoryLive),
  Layer.provideMerge(FinancialDataProviderTest), // Mock provider
  Layer.provideMerge(StockServiceLive),
);
```

**Integrating with tRPC:**

```typescript
// packages/api/src/routers/stock.router.ts
import { router, protectedProcedure } from "../index";
import { StockService } from "@gemhog/core";
import { Effect } from "effect";
import { AppLayerLive } from "@gemhog/core/layers";
import { z } from "zod";

export const stockRouter = router({
  getStock: protectedProcedure
    .input(z.object({ ticker: z.string().min(1).max(5) }))
    .query(async ({ input }) => {
      const program = Effect.gen(function* () {
        const stockService = yield* StockService;
        return yield* stockService.getStock(input.ticker);
      });

      // Run Effect with provided layer
      return Effect.runPromise(program.pipe(Effect.provide(AppLayerLive)));
    }),
});
```

**Key Benefits:**

1. **Type-safe DI** - Dependencies declared in types, not runtime registries
2. **Testability** - Swap `Live` layers for `Test` layers
3. **Composability** - Layers compose cleanly, Effect handles lifecycle
4. **Error handling** - Typed errors propagate through Effect chain

---

### Pattern 2: Provider Abstraction for External APIs

Financial data comes from multiple sources with different interfaces. The
provider pattern abstracts these behind consistent interfaces, enabling swaps
without refactoring business logic.

**Provider Interface:**

```typescript
// packages/core/src/providers/financial-data/financial-data.provider.ts
import { Context, Effect } from "effect";

// Domain types (provider-agnostic)
export interface CompanyProfile {
  cik: string;
  ticker: string;
  name: string;
  exchange: string;
  sector: string;
  industry: string;
}

export interface FinancialMetrics {
  ticker: string;
  period: string;
  revenue: number;
  netIncome: number;
  eps: number;
  peRatio: number | null;
  debtToEquity: number | null;
}

export interface HistoricalPrice {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

// Provider interface as Effect service
export class FinancialDataProvider extends Context.Tag("FinancialDataProvider")<
  FinancialDataProvider,
  {
    readonly getProfile: (
      ticker: string,
    ) => Effect.Effect<CompanyProfile, ProviderError>;
    readonly getFinancials: (
      ticker: string,
    ) => Effect.Effect<FinancialMetrics[], ProviderError>;
    readonly getHistoricalPrices: (
      ticker: string,
      from: Date,
      to: Date,
    ) => Effect.Effect<HistoricalPrice[], ProviderError>;
  }
>() {}

// Error types
export class ProviderError extends Error {
  readonly _tag = "ProviderError";
  constructor(
    readonly provider: string,
    readonly operation: string,
    readonly cause: unknown,
  ) {
    super(`${provider}.${operation} failed: ${String(cause)}`);
  }
}
```

**SEC EDGAR Provider Implementation:**

```typescript
// packages/core/src/providers/financial-data/sec-edgar.provider.ts
import { Effect, Layer } from "effect";
import {
  FinancialDataProvider,
  ProviderError,
} from "./financial-data.provider";
import type { ConfigService } from "../../layers/config.layer";
import type { CacheService } from "../../layers/cache.layer";

// SEC EDGAR API base URL (no auth required)
const SEC_DATA_BASE = "https://data.sec.gov";

export const SecEdgarProviderLive = Layer.effect(
  FinancialDataProvider,
  Effect.gen(function* () {
    const config = yield* ConfigService;
    const cache = yield* CacheService;

    // Load CIK mapping from SEC (cache for 24 hours)
    // https://www.sec.gov/files/company_tickers.json
    const getCikMapping = Effect.gen(function* () {
      const cached = yield* cache.get("sec:cik-mapping");
      if (cached) return cached;

      const response = yield* Effect.tryPromise({
        try: () =>
          fetch("https://www.sec.gov/files/company_tickers.json", {
            headers: {
              // SEC requires User-Agent with contact email
              "User-Agent": `${config.appName}/1.0 (${config.contactEmail})`,
            },
          }).then((r) => r.json()),
        catch: (e) => new ProviderError("SEC_EDGAR", "getCikMapping", e),
      });

      // Transform to ticker-keyed map
      const mapping = {};
      for (const entry of Object.values(response)) {
        mapping[entry.ticker] = {
          cik_str: String(entry.cik_str).padStart(10, "0"),
          title: entry.title,
        };
      }

      yield* cache.set("sec:cik-mapping", mapping, { ttl: 86400 });
      return mapping;
    });

    return {
      getProfile: (ticker) =>
        Effect.gen(function* () {
          const mapping = yield* getCikMapping;
          const cik = mapping[ticker.toUpperCase()]?.cik_str;
          if (!cik) {
            return yield* Effect.fail(
              new ProviderError(
                "SEC_EDGAR",
                "getProfile",
                `Unknown ticker: ${ticker}`,
              ),
            );
          }

          // Fetch company submissions for profile data
          const response = yield* Effect.tryPromise({
            try: () =>
              fetch(`${SEC_DATA_BASE}/submissions/CIK${cik}.json`, {
                headers: {
                  "User-Agent": `${config.appName}/1.0 (${config.contactEmail})`,
                },
              }).then((r) => r.json()),
            catch: (e) => new ProviderError("SEC_EDGAR", "getProfile", e),
          });

          return {
            cik,
            ticker: ticker.toUpperCase(),
            name: response.name,
            exchange: response.exchanges?.[0] ?? "UNKNOWN",
            sector: response.sicDescription ?? "Unknown",
            industry: response.sicDescription ?? "Unknown",
          };
        }),

      getFinancials: (ticker) =>
        Effect.gen(function* () {
          const mapping = yield* getCikMapping;
          const cik = mapping[ticker.toUpperCase()]?.cik_str;
          if (!cik) {
            return yield* Effect.fail(
              new ProviderError(
                "SEC_EDGAR",
                "getFinancials",
                `Unknown ticker: ${ticker}`,
              ),
            );
          }

          // Fetch company facts (all XBRL data)
          // https://data.sec.gov/api/xbrl/companyfacts/CIK##########.json
          const response = yield* Effect.tryPromise({
            try: () =>
              fetch(`${SEC_DATA_BASE}/api/xbrl/companyfacts/CIK${cik}.json`, {
                headers: {
                  "User-Agent": `${config.appName}/1.0 (${config.contactEmail})`,
                },
              }).then((r) => r.json()),
            catch: (e) => new ProviderError("SEC_EDGAR", "getFinancials", e),
          });

          // Extract key metrics from us-gaap taxonomy
          const usGaap = response.facts?.["us-gaap"] ?? {};
          return extractMetricsFromXbrl(usGaap, ticker);
        }),

      // SEC EDGAR doesn't have price data - delegate to price provider
      getHistoricalPrices: () =>
        Effect.fail(
          new ProviderError(
            "SEC_EDGAR",
            "getHistoricalPrices",
            "Not supported",
          ),
        ),
    };
  }),
);
```

**Price Data Provider (Alternative to Stooq):**

```typescript
// packages/core/src/providers/financial-data/price-data.provider.ts
// IMPORTANT: Stooq requires CAPTCHA since Dec 2020, use alternative provider

import { Context, Effect, Layer } from "effect";
import { HistoricalPrice, ProviderError } from "./financial-data.provider";
import type { ConfigService } from "../../layers/config.layer";
import type { CacheService } from "../../layers/cache.layer";

// Separate interface for price-only provider
export class PriceDataProvider extends Context.Tag("PriceDataProvider")<
  PriceDataProvider,
  {
    readonly getHistoricalPrices: (
      ticker: string,
      from: Date,
      to: Date,
    ) => Effect.Effect<HistoricalPrice[], ProviderError>;
    readonly getLatestPrice: (
      ticker: string,
    ) => Effect.Effect<number, ProviderError>;
  }
>() {}

// EODHD Implementation (recommended alternative to Stooq)
// Free tier: 20 API calls/day, 1 year history
// Starter: $19.99/mo unlimited
export const EodhdProviderLive = Layer.effect(
  PriceDataProvider,
  Effect.gen(function* () {
    const config = yield* ConfigService;
    const cache = yield* CacheService;

    const EODHD_BASE = "https://eodhd.com/api";

    return {
      getHistoricalPrices: (ticker, from, to) =>
        Effect.gen(function* () {
          const cacheKey = `eodhd:prices:${ticker}:${from.toISOString()}:${to.toISOString()}`;

          const cached = yield* cache.get(cacheKey);
          if (cached) return cached as HistoricalPrice[];

          const params = new URLSearchParams({
            api_token: config.eodhdApiKey,
            fmt: "json",
            from: from.toISOString().split("T")[0],
            to: to.toISOString().split("T")[0],
          });

          const response = yield* Effect.tryPromise({
            try: () =>
              fetch(`${EODHD_BASE}/eod/${ticker}.US?${params}`).then((r) =>
                r.json(),
              ),
            catch: (e) => new ProviderError("EODHD", "getHistoricalPrices", e),
          });

          const prices: HistoricalPrice[] = response.map((p: any) => ({
            date: p.date,
            open: p.open,
            high: p.high,
            low: p.low,
            close: p.adjusted_close ?? p.close,
            volume: p.volume,
          }));

          yield* cache.set(cacheKey, prices, { ttl: 900 }); // 15 min
          return prices;
        }),

      getLatestPrice: (ticker) =>
        Effect.gen(function* () {
          const cacheKey = `eodhd:latest:${ticker}`;

          const cached = yield* cache.get<number>(cacheKey);
          if (cached !== null) return cached;

          const params = new URLSearchParams({
            api_token: config.eodhdApiKey,
            fmt: "json",
          });

          const response = yield* Effect.tryPromise({
            try: () =>
              fetch(`${EODHD_BASE}/real-time/${ticker}.US?${params}`).then(
                (r) => r.json(),
              ),
            catch: (e) => new ProviderError("EODHD", "getLatestPrice", e),
          });

          const price = response.close;
          yield* cache.set(cacheKey, price, { ttl: 900 });
          return price;
        }),
    };
  }),
);
```

---

### Pattern 3: Pipeline Architecture for Content Processing

The thesis extraction pipeline processes podcast transcripts through multiple
stages, each with clear inputs/outputs.

**Pipeline Flow:**

```
+-------------------+     +-------------------+     +-------------------+
| 1. Transcript     |     | 2. Thesis         |     | 3. Stock          |
|    Fetcher        | --> |    Extractor      | --> |    Linker         |
+-------------------+     +-------------------+     +-------------------+
        |                         |                         |
        v                         v                         v
  Podscan.fm API           LLM (Claude)              Ticker lookup +
  - Search new episodes    - Structured output       Stock creation
  - Store transcripts      - Extract theses

+-------------------+     +-------------------+
| 4. Data           |     | 5. Social         |
|    Enricher       | --> |    Publisher      |
+-------------------+     +-------------------+
        |                         |
        v                         v
  SEC EDGAR + Price        Twitter + Bluesky
  - Fetch fundamentals     - Post new theses
  - Calculate metrics      - Schedule posts
```

**Pipeline Stage Implementation:**

```typescript
// packages/core/src/domains/thesis/extraction/extractor.service.ts
import { Context, Effect, Layer } from "effect";
import { generateText, Output } from "ai";
import { anthropic } from "@ai-sdk/anthropic";
import { z } from "zod";

// Zod schema for LLM structured output
const ExtractedThesisSchema = z.object({
  theses: z.array(
    z.object({
      ticker: z.string().describe("Stock ticker symbol (e.g., AAPL)"),
      thesis: z
        .string()
        .describe("Investment thesis narrative (2-4 sentences)"),
      assumptions: z
        .array(z.string())
        .describe("Key assumptions underlying the thesis"),
      catalysts: z
        .array(z.string())
        .describe("Potential catalysts that could validate thesis"),
      risks: z.array(z.string()).describe("Key risks to the thesis"),
      timeHorizon: z
        .enum(["short", "medium", "long"])
        .describe("Investment time horizon"),
      confidence: z
        .number()
        .min(0)
        .max(1)
        .describe("Speaker's apparent confidence"),
      speakerName: z
        .string()
        .optional()
        .describe("Name of person making the thesis"),
    }),
  ),
});

export class ThesisExtractorService extends Context.Tag(
  "ThesisExtractorService",
)<
  ThesisExtractorService,
  {
    readonly extractFromTranscript: (
      transcriptId: string,
    ) => Effect.Effect<ExtractedThesis[], ExtractionError>;
    readonly processNewTranscripts: () => Effect.Effect<ProcessingResult>;
  }
>() {}

export const ThesisExtractorServiceLive = Layer.effect(
  ThesisExtractorService,
  Effect.gen(function* () {
    const transcriptRepo = yield* TranscriptRepository;
    const thesisRepo = yield* ThesisRepository;
    const stockService = yield* StockService;

    const extractionPrompt = `You are a financial analyst extracting investment theses from podcast transcripts.

Analyze the following podcast transcript and extract any investment theses mentioned.

For each thesis:
1. Identify the stock ticker being discussed
2. Summarize the investment thesis in 2-4 sentences
3. List the key assumptions
4. Identify potential catalysts
5. Note the risks mentioned
6. Determine the time horizon (short: <1 year, medium: 1-3 years, long: >3 years)
7. Estimate the speaker's confidence level

Only extract theses that are:
- About specific, publicly traded US stocks
- Substantive (not just mentions or passing references)
- Backed by reasoning (not just "buy X")

If no investment theses are found, return an empty array.

Transcript:
`;

    return {
      extractFromTranscript: (transcriptId) =>
        Effect.gen(function* () {
          const transcript = yield* transcriptRepo.findById(transcriptId);
          if (!transcript) {
            return yield* Effect.fail(
              new ExtractionError("Transcript not found", transcriptId),
            );
          }

          // Chunk transcript if too long
          const chunks = chunkTranscript(transcript.content, 100000);
          const allTheses: ExtractedThesis[] = [];

          for (const chunk of chunks) {
            const result = yield* Effect.tryPromise({
              try: async () => {
                const response = await generateText({
                  model: anthropic("claude-sonnet-4-5-20250514"),
                  prompt: extractionPrompt + chunk,
                  output: Output.object({ schema: ExtractedThesisSchema }),
                });
                return response.object.theses;
              },
              catch: (e) =>
                new ExtractionError("LLM extraction failed", transcriptId, e),
            });

            allTheses.push(...result);
          }

          return deduplicateTheses(allTheses);
        }),

      processNewTranscripts: () =>
        Effect.gen(function* () {
          const pending = yield* transcriptRepo.findUnprocessed();

          let processed = 0;
          let thesesCreated = 0;
          const errors: string[] = [];

          for (const transcript of pending) {
            const result = yield* Effect.either(
              Effect.gen(function* () {
                const extracted =
                  yield* ThesisExtractorService.extractFromTranscript(
                    transcript.id,
                  );

                for (const thesis of extracted) {
                  yield* stockService.ensureStockExists(thesis.ticker);
                  yield* thesisRepo.create({
                    stockTicker: thesis.ticker,
                    transcriptId: transcript.id,
                    thesis: thesis.thesis,
                    assumptions: thesis.assumptions,
                    catalysts: thesis.catalysts,
                    risks: thesis.risks,
                    timeHorizon: thesis.timeHorizon,
                    confidence: thesis.confidence,
                    speakerName: thesis.speakerName,
                  });
                  thesesCreated++;
                }

                yield* transcriptRepo.markProcessed(transcript.id);
                processed++;
              }),
            );

            if (result._tag === "Left") {
              errors.push(`${transcript.id}: ${result.left.message}`);
            }
          }

          return { processed, thesesCreated, errors };
        }),
    };
  }),
);
```

**Cron Job Handler:**

```typescript
// packages/functions/src/pipelines/thesis-extraction.handler.ts
import { Effect } from "effect";
import { ThesisExtractorService } from "@gemhog/core/domains/thesis/extraction";
import { AppLayerLive } from "@gemhog/core/layers";

export const handler = async () => {
  const program = Effect.gen(function* () {
    const extractor = yield* ThesisExtractorService;
    const result = yield* extractor.processNewTranscripts();

    console.log(`Processed: ${result.processed} transcripts`);
    console.log(`Created: ${result.thesesCreated} theses`);

    if (result.errors.length > 0) {
      console.error("Errors:", result.errors);
    }

    return result;
  });

  return Effect.runPromise(program.pipe(Effect.provide(AppLayerLive)));
};
```

---

## Data Flow

### Thesis Extraction Pipeline

```
Cron Trigger (hourly)
        |
        v
+------------------+
| 1. Fetch New     |
|    Transcripts   |
+--------+---------+
         |
         | Podscan.fm API
         v
+------------------+
| 2. Store Raw     |
|    Transcripts   |
+--------+---------+
         |
         | PostgreSQL
         v
+------------------+
| 3. Extract       |
|    Theses (LLM)  |
+--------+---------+
         |
         | Claude API (structured output)
         v
+------------------+
| 4. Validate &    |
|    Link Tickers  |
+--------+---------+
         |
         | Ticker lookup, stock creation
         v
+------------------+
| 5. Store Theses  |
|    + Relations   |
+--------+---------+
         |
         | PostgreSQL
         v
+------------------+
| 6. Queue for     |
|    Social Post   |
+------------------+
```

### Financial Data Flow

```
Stock Page Request
        |
        v
+------------------+
| 1. Check Cache   |
+--------+---------+
         |
    Cache miss
         v
+------------------+      +------------------+
| 2. Fetch Profile | ---> | SEC EDGAR        |
|    (SEC EDGAR)   |      | /submissions/    |
+--------+---------+      +------------------+
         |
         v
+------------------+      +------------------+
| 3. Fetch XBRL    | ---> | SEC EDGAR        |
|    Financials    |      | /api/xbrl/       |
+--------+---------+      +------------------+
         |
         v
+------------------+      +------------------+
| 4. Fetch Prices  | ---> | EODHD (or alt)   |
|    (EOD)         |      | /eod/            |
+--------+---------+      +------------------+
         |
         v
+------------------+
| 5. Calculate     |
|    Derived       |
|    Metrics       |
+--------+---------+
         |
         | P/E, debt ratios, growth rates
         v
+------------------+
| 6. Cache &       |
|    Return        |
+------------------+
```

### Request Flow (Frontend to Backend)

```
Next.js Page
        |
        | tRPC Client
        v
+------------------+
| Hono Server      |
| (tRPC Adapter)   |
+--------+---------+
         |
         | createContext (auth)
         v
+------------------+
| tRPC Router      |
| (stock.getStock) |
+--------+---------+
         |
         | Effect.gen + Effect.provide
         v
+------------------+
| Effect Service   |
| Layer            |
+--------+---------+
         |
    Parallel fetch
    +----+----+
    |         |
    v         v
+-------+ +--------+
| Cache | | DB/API |
+-------+ +--------+
    |         |
    +----+----+
         |
         v
+------------------+
| Response         |
+------------------+
```

---

## Anti-Patterns to Avoid

### Anti-Pattern 1: SST SDK in Application Code

**Problem:** Importing SST SDK directly couples code to deployment
infrastructure.

```typescript
// BAD - Don't do this
import { Config } from "sst";
const apiKey = Config.PODSCAN_API_KEY;
```

**Why bad:**

- Cannot run locally without SST dev mode
- Cannot test without cloud resources
- Agents cannot verify code

**Instead:**

```typescript
// GOOD - Read from environment
const apiKey = process.env.PODSCAN_API_KEY;
if (!apiKey) throw new Error("PODSCAN_API_KEY not set");
```

SST injects env vars at deploy time. Local dev uses `.env` files.

### Anti-Pattern 2: Scattered Effect.provide Calls

**Problem:** Providing layers at each call site creates inconsistency and
testing difficulty.

```typescript
// BAD - Layer provided at every call
const getStock = (ticker: string) =>
  Effect.runPromise(
    stockService.getStock(ticker).pipe(Effect.provide(AppLayerLive)),
  );

const getTheses = (ticker: string) =>
  Effect.runPromise(
    thesisService.getByTicker(ticker).pipe(Effect.provide(AppLayerLive)),
  );
```

**Instead:**

```typescript
// GOOD - Provide once at entry point
// packages/api/src/effect-runtime.ts
import { ManagedRuntime } from "effect";
import { AppLayerLive } from "@gemhog/core/layers";

export const runtime = ManagedRuntime.make(AppLayerLive);

// Use in routers
export const stockRouter = router({
  getStock: protectedProcedure.query(({ input }) =>
    runtime.runPromise(stockService.getStock(input.ticker)),
  ),
});
```

### Anti-Pattern 3: Business Logic in tRPC Routers

**Problem:** Putting business logic in routers makes it untestable and couples
to HTTP.

```typescript
// BAD - Logic in router
export const stockRouter = router({
  getStockWithAnalysis: protectedProcedure.query(async ({ input }) => {
    const stock = await db.query.stocks.findFirst({
      where: eq(ticker, input.ticker),
    });
    const financials = await fetch(`https://data.sec.gov/...`);
    const theses = await db.query.theses.findMany({
      where: eq(stockId, stock.id),
    });
    // 50 more lines of business logic...
  }),
});
```

**Instead:**

```typescript
// GOOD - Router is thin, logic in services
export const stockRouter = router({
  getStockWithAnalysis: protectedProcedure.query(({ input }) =>
    runtime.runPromise(stockService.getStockWithAnalysis(input.ticker)),
  ),
});
```

### Anti-Pattern 4: Stooq for Automated Price Fetching

**Problem:** Stooq requires CAPTCHA since December 2020, blocking automated
requests.

**Evidence:** "Note that STOOQ requires CAPTCHA starting Dec 10, 2020 so that
code that downloads and unpacks the zip files will no longer work"

**Instead:**

- Use EODHD (20 calls/day free, $19.99/mo unlimited)
- Use Alpha Vantage (25 calls/day free)
- Use Marketstack (100 calls/month free)
- Manually download Stooq bulk data for historical analysis only

---

## Integration Points

### External APIs

| Service         | Purpose             | Auth                       | Rate Limits                          | Notes                                |
| --------------- | ------------------- | -------------------------- | ------------------------------------ | ------------------------------------ |
| **Podscan.fm**  | Podcast transcripts | API key                    | 100/day (trial), 1000/day ($50/mo)   | Requires subscription for production |
| **SEC EDGAR**   | Fundamentals (XBRL) | None (User-Agent required) | 10 req/sec                           | Free, authoritative, no auth         |
| **EODHD**       | EOD prices          | API key                    | 20/day (free), unlimited ($19.99/mo) | Recommended over Stooq               |
| **Claude API**  | Thesis extraction   | API key                    | Per-token pricing                    | $3/MTok input, $15/MTok output       |
| **Twitter API** | Social posting      | OAuth 1.0a                 | 1,500 tweets/month (free)            | Post-only on free tier               |
| **Bluesky API** | Social posting      | App password               | No limits                            | Free, growing platform               |

### Internal Integration

| From           | To            | Method          | Purpose                 |
| -------------- | ------------- | --------------- | ----------------------- |
| Web            | API           | tRPC            | Type-safe data fetching |
| Cron Lambda    | Core          | Effect services | Pipeline execution      |
| Core services  | PostgreSQL    | Drizzle ORM     | Data persistence        |
| Core services  | Upstash       | @upstash/redis  | Caching                 |
| Core providers | External APIs | fetch           | Data retrieval          |

---

## Build Order Implications

Based on architectural dependencies, recommended build order:

### Phase 1: Foundation

1. **Effect service layer setup** - Define core services, layers, config
2. **Database schema** - Stock, thesis, transcript tables
3. **Provider interfaces** - Define without implementations

**Why first:** Everything else depends on this foundation.

### Phase 2: Data Integration

1. **SEC EDGAR provider** - Fundamentals (no auth, easy to test)
2. **Price data provider** - EOD prices (EODHD, not Stooq)
3. **Podscan.fm provider** - Transcripts
4. **Caching layer** - Upstash integration

**Why second:** Need data providers before business logic.

### Phase 3: Extraction Pipeline

1. **LLM provider** - Claude integration with AI SDK
2. **Thesis extractor service** - Core extraction logic
3. **Cron job infrastructure** - SST Cron + Lambda handlers

**Why third:** Depends on providers and database schema.

### Phase 4: Presentation

1. **tRPC routers** - Stock, thesis endpoints
2. **Stock pages** - Dynamic routes, data display
3. **Discovery feed** - Category/strategy views

**Why fourth:** Frontend depends on all backend being ready.

### Phase 5: Distribution

1. **Social posting service** - Twitter + Bluesky
2. **Newsletter integration** - AWS SES
3. **Social automation cron** - Scheduled posts

**Why last:** Nice-to-have, not blocking core functionality.

---

## Scalability Considerations

| Concern            | At 100 Users      | At 10K Users             | At 100K Users            |
| ------------------ | ----------------- | ------------------------ | ------------------------ |
| **API Response**   | Direct DB queries | Add Redis caching        | Read replicas            |
| **LLM Processing** | Synchronous       | Queue-based              | Batch API (50% discount) |
| **Financial Data** | On-demand fetch   | Pre-cache popular stocks | Bulk data + incremental  |
| **Social Posting** | Direct posting    | Queue with rate limiting | Multiple accounts        |
| **Database**       | Single RDS        | RDS with replicas        | Horizontal sharding      |

---

## Sources

### Effect TS

- [Effect Documentation - Services](https://effect.website/docs/requirements-management/services/)
- [Effect Documentation - Layers](https://effect.website/docs/guides/context-management/layers)
- [Effect Patterns Repository](https://github.com/PaulJPhilp/EffectPatterns)
- [Sandro Maglione - Complete Introduction to Effect](https://www.sandromaglione.com/articles/complete-introduction-to-using-effect-in-typescript)

### Hono Integration

- [Hono Best Practices](https://hono.dev/docs/guides/best-practices)
- [Hono tRPC Server Middleware](https://www.npmjs.com/package/@hono/trpc-server)
- [Hono + Effect-TS Starter (deprecated)](https://github.com/Oungseik/ts-starter)
- [@hono/effect-validator](https://www.npmjs.com/package/@hono/effect-validator)

### Pipeline Architecture

- [LLM-Based Extraction Pipeline - Emergent Mind](https://www.emergentmind.com/topics/llm-based-extraction-pipeline)
- [AWS Transcript Insights with Bedrock](https://aws.amazon.com/blogs/machine-learning/unearth-insights-from-audio-transcripts-generated-by-amazon-transcribe-using-amazon-bedrock/)
- [LaunchDarkly Data Extraction Pipeline](https://launchdarkly.com/docs/tutorials/data-extraction-pipeline)

### Financial Data Integration

- [SEC EDGAR APIs](https://www.sec.gov/search-filings/edgar-application-programming-interfaces)
- [SEC EDGAR Toolkit (TypeScript)](https://github.com/stefanoamorelli/sec-edgar-toolkit)
- [Introduction to SEC EDGAR API](https://www.thefullstackaccountant.com/blog/intro-to-edgar)
- [Stooq Data (CAPTCHA warning)](https://www.quantstart.com/articles/an-introduction-to-stooq-pricing-data/)
- [EODHD API](https://eodhd.com/financial-apis/api-for-historical-data-and-volumes)

### Serverless Patterns

- [AWS Serverless Batch Processing](https://blog.cloudcraft.co/aws-architecture-pattern-for-scheduled-serverless-batch-processing/)
- [Cron Jobs on AWS](https://www.serverless.com/blog/cron-jobs-on-aws)
- [SST v3 Cron Component](https://sst.dev/docs/component/aws/cron)

---

_Last updated: 2026-01-19_
