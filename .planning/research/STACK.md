# Stack Research: Effect TS + Hono + tRPC Integration

**Domain:** Financial research platform / Podcast insight extraction
**Researched:** 2026-01-19
**Confidence:** HIGH (verified via official documentation and current package versions)

---

## Executive Summary

The 2026 TypeScript stack for Effect TS + Hono + tRPC integration in a monorepo with
SST v3 deployment requires careful consideration of integration boundaries. The key
finding: **tRPC and Effect schemas have a fundamental type inference incompatibility**
that affects transformations. The recommended approach is a **pragmatic coexistence
strategy** that uses Effect TS for backend business logic while keeping tRPC for
API contracts, with Effect Schema used internally but Zod at tRPC boundaries.

---

## Recommended Stack

### Core Technologies

| Technology           | Version   | Purpose                    | Why Recommended                                                                                           |
| -------------------- | --------- | -------------------------- | --------------------------------------------------------------------------------------------------------- |
| Effect TS            | ^3.19.14  | Backend DI, error handling | API stable since 3.0, superior testability via Layers, type-safe dependency injection, composable errors |
| Hono                 | ^4.11.4   | HTTP framework             | Lightweight, Web Standards, excellent TypeScript support, works with Lambda and containers                |
| tRPC                 | ^11.8.1   | Type-safe API layer        | End-to-end type safety with frontend, mature ecosystem, React Query integration                           |
| SST v3               | latest    | AWS deployment             | TypeScript IaC, Pulumi-based, native Hono support, function URLs                                          |
| TypeScript           | ^5.9.3    | Language                   | tRPC v11 requires >=5.7.2, Effect requires >=5.4 with strict mode                                         |
| Zod                  | ^4.3.5    | tRPC validation            | tRPC's native validator, use at API boundaries                                                            |
| @effect/schema       | ^0.77.x   | Effect-side validation     | Use internally in Effect services, bidirectional transformations                                          |
| @hono/effect-validator | ^1.2.0  | Hono middleware            | Effect Schema validation in Hono routes (optional, for non-tRPC routes)                                   |

### Supporting Libraries

| Library                | Version  | Purpose                    | When to Use                                    |
| ---------------------- | -------- | -------------------------- | ---------------------------------------------- |
| @effect/platform       | ^0.77.x  | HTTP client, file system   | Internal HTTP calls, platform abstractions     |
| @effect/platform-node  | ^0.73.x  | Node.js runtime            | Lambda/Node.js execution environment           |
| vitest                 | ^3.1.x   | Unit/integration testing   | All tests, works well with Effect Layers       |
| msw                    | ^2.8.x   | HTTP mocking               | Integration tests, mock external APIs          |
| @playwright/test       | ^1.52.x  | E2E testing                | Browser automation, Playwright MCP compatible  |
| @trpc/client           | ^11.8.1  | Frontend tRPC client       | React Query integration, type-safe calls       |
| @tanstack/react-query  | ^5.90.x  | Data fetching              | tRPC integration, caching, optimistic updates  |

### Development Tools

| Tool              | Purpose                    | Notes                                               |
| ----------------- | -------------------------- | --------------------------------------------------- |
| tsx               | TypeScript execution       | Fast dev server, hot reload                         |
| tsdown            | TypeScript build           | Fast builds, ESM output                             |
| Biome             | Lint + format              | Fast, unified tooling, already configured           |
| Playwright MCP    | AI-assisted E2E            | Model Context Protocol for intelligent test gen     |

---

## Effect TS + Hono + tRPC Integration

### The Integration Challenge

**Critical finding:** tRPC and Effect Schema have a fundamental type inference
incompatibility. tRPC determines input types from validator function return values,
but Effect Schema's `decodeUnknownSync` can transform data differently than expected.

Example problem:
```typescript
// Effect Schema can decode string "2024-01-01" -> Date object
// tRPC would then expect Date on client, but client sends string
// This breaks the type contract
```

### Recommended Architecture: Pragmatic Coexistence

The solution is **layered integration** where each technology handles what it does best:

```
+------------------+
|  Next.js Client  |  <-- Uses tRPC client with Zod schemas
+--------+---------+
         |
         | tRPC (Zod schemas at boundary)
         v
+------------------+
|   Hono Router    |  <-- Routes tRPC + other endpoints
|   + tRPC Adapter |
+--------+---------+
         |
         | Internal calls (Effect programs)
         v
+------------------+
|  Effect Services |  <-- Business logic, DI via Layers
|  (Effect Schema  |  <-- Internal validation with Effect Schema
|   internally)    |
+--------+---------+
         |
         v
+------------------+
| Effect Layers    |  <-- Testable dependencies (DB, APIs, etc.)
| (Live/Test)      |
+------------------+
```

### Integration Pattern: tRPC Procedures Wrapping Effect

```typescript
// packages/api/src/trpc.ts
import { initTRPC, TRPCError } from "@trpc/server";
import { Effect, Exit } from "effect";
import { z } from "zod";

const t = initTRPC.context<Context>().create();

// Helper to run Effect programs in tRPC procedures
export const runEffect = <A, E>(
  effect: Effect.Effect<A, E, AppContext>
): Promise<A> =>
  effect.pipe(
    Effect.provide(AppContextLive), // Provide production layers
    Effect.runPromise
  ).catch((error) => {
    // Map Effect errors to tRPC errors
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: error.message,
    });
  });

// Usage in procedure
export const thesisRouter = t.router({
  extract: t.procedure
    .input(z.object({ transcriptId: z.string() })) // Zod at boundary
    .mutation(async ({ input, ctx }) => {
      return runEffect(
        ThesisService.extract(input.transcriptId) // Effect program
      );
    }),
});
```

### Integration Pattern: Effect Services

```typescript
// packages/core/src/services/thesis.ts
import { Effect, Layer, Context } from "effect";
import * as S from "@effect/schema/Schema";

// Define service interface
export class ThesisService extends Context.Tag("ThesisService")<
  ThesisService,
  {
    extract: (transcriptId: string) => Effect.Effect<Thesis, ThesisError>;
    analyze: (thesis: Thesis) => Effect.Effect<Analysis, AnalysisError>;
  }
>() {}

// Internal schema (Effect Schema for transforms)
const ThesisSchema = S.Struct({
  id: S.String,
  ticker: S.String,
  narrative: S.String,
  assumptions: S.Array(S.String),
  extractedAt: S.Date, // Transforms work internally
});

// Live implementation
export const ThesisServiceLive = Layer.succeed(
  ThesisService,
  ThesisService.of({
    extract: (transcriptId) =>
      Effect.gen(function* () {
        const transcript = yield* TranscriptRepo.get(transcriptId);
        const result = yield* AIService.extractThesis(transcript);
        return yield* S.decodeUnknown(ThesisSchema)(result);
      }),
    analyze: (thesis) =>
      Effect.gen(function* () {
        const data = yield* FinancialDataService.get(thesis.ticker);
        return yield* AIService.analyze(thesis, data);
      }),
  })
);
```

### Integration Pattern: Testing with Layers

```typescript
// packages/core/src/services/thesis.test.ts
import { describe, it, expect, beforeAll, afterEach, afterAll } from "vitest";
import { Effect, Layer } from "effect";
import { setupServer } from "msw/node";
import { http, HttpResponse } from "msw";

// Mock layers for testing
const ThesisServiceTest = Layer.succeed(
  ThesisService,
  ThesisService.of({
    extract: (transcriptId) =>
      Effect.succeed({
        id: "test-id",
        ticker: "AAPL",
        narrative: "Test thesis",
        assumptions: ["assumption 1"],
        extractedAt: new Date(),
      }),
    analyze: (thesis) =>
      Effect.succeed({
        pros: ["pro 1"],
        cons: ["con 1"],
        unknowns: ["unknown 1"],
      }),
  })
);

// MSW for external HTTP mocking
const server = setupServer(
  http.get("https://api.external.com/*", () => {
    return HttpResponse.json({ data: "mocked" });
  })
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe("ThesisService", () => {
  it("extracts thesis from transcript", async () => {
    const result = await Effect.runPromise(
      ThesisService.pipe(
        Effect.flatMap((service) => service.extract("transcript-123")),
        Effect.provide(ThesisServiceTest) // Provide test layer
      )
    );

    expect(result.ticker).toBe("AAPL");
  });
});
```

### When to Use Each Validation Library

| Context                  | Use         | Rationale                                        |
| ------------------------ | ----------- | ------------------------------------------------ |
| tRPC input/output        | Zod         | Native tRPC support, no type inference issues    |
| Effect service internals | Effect Schema | Bidirectional transforms, Effect ecosystem       |
| Hono non-tRPC routes     | Effect Schema | Via @hono/effect-validator, consistent with services |
| Environment validation   | Zod         | @t3-oss/env compatibility, simpler for env vars  |
| Database schemas         | Drizzle     | Drizzle's own schema system, infers types        |

---

## SST v3 Deployment Patterns

### SST-Agnostic Application Code (Critical Constraint)

The project constraint requires app code to read env vars only, no SST SDK imports.
This enables local development and agent verification without SST context.

**Pattern: Environment Variables Bridge**

```typescript
// sst.config.ts - SST configuration injects env vars
export default $config({
  app(input) {
    return { name: "gemhog", home: "aws" };
  },
  async run() {
    const database = new sst.aws.Postgres("Database");
    const anthropicKey = new sst.Secret("AnthropicApiKey");

    new sst.aws.Function("Api", {
      handler: "apps/server/src/index.handler",
      url: true,
      link: [database, anthropicKey],
      environment: {
        // Bridge: SST resources -> env vars
        DATABASE_URL: $interpolate`postgres://${database.username}:${database.password}@${database.host}:${database.port}/${database.database}`,
        ANTHROPIC_API_KEY: anthropicKey.value,
      },
    });
  },
});
```

```typescript
// packages/env/src/server.ts - App reads env vars only (SST-agnostic)
import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

export const env = createEnv({
  server: {
    DATABASE_URL: z.string().url(),
    ANTHROPIC_API_KEY: z.string().min(1),
    NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  },
  runtimeEnv: process.env,
});
```

```typescript
// apps/server/src/index.ts - Uses env vars, no SST imports
import { Hono } from "hono";
import { handle } from "hono/aws-lambda";
import { env } from "@gemhog/env/server";

const app = new Hono();

app.get("/health", (c) => c.json({ status: "ok" }));

// Works locally with .env, works on Lambda with SST-injected env vars
export const handler = handle(app);
export default app;
```

### Local Development (.env files)

```bash
# .env.local (git-ignored, for local development)
DATABASE_URL=postgres://postgres:postgres@localhost:5432/gemhog
ANTHROPIC_API_KEY=sk-ant-...
PODSCAN_API_KEY=...
```

```bash
# Development: uses .env.local
pnpm dev

# Deployment: SST injects env vars
npx sst deploy --stage production
```

### Cron Jobs Pattern

```typescript
// sst.config.ts
new sst.aws.Cron("TranscriptPipeline", {
  job: {
    handler: "packages/functions/src/cron/transcript.handler",
    environment: {
      DATABASE_URL: databaseUrl,
      PODSCAN_API_KEY: podscanKey.value,
    },
  },
  schedule: "rate(1 hour)",
});
```

```typescript
// packages/functions/src/cron/transcript.ts - SST-agnostic
import { Effect } from "effect";
import { env } from "@gemhog/env/server";
import { TranscriptPipeline } from "@gemhog/core/pipelines";

export const handler = async () => {
  await Effect.runPromise(
    TranscriptPipeline.run.pipe(
      Effect.provide(PipelineLayerLive)
    )
  );
};
```

---

## Testing Stack

### Vitest Configuration for Effect TS

```typescript
// vitest.config.ts
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: ["**/*.test.ts"],
    coverage: {
      provider: "v8",
      include: ["packages/*/src/**/*.ts", "apps/*/src/**/*.ts"],
      exclude: ["**/*.test.ts", "**/index.ts"],
    },
    setupFiles: ["./test/setup.ts"],
  },
});
```

```typescript
// test/setup.ts
import { vi } from "vitest";

// Reset all mocks between tests
beforeEach(() => {
  vi.clearAllMocks();
});

// Global test config mock
vi.mock("@gemhog/env/server", () => ({
  env: {
    DATABASE_URL: "postgres://test:test@localhost:5432/test",
    ANTHROPIC_API_KEY: "test-key",
    NODE_ENV: "test",
  },
}));
```

### MSW Setup for Integration Tests

```typescript
// test/handlers.ts
import { http, HttpResponse } from "msw";

export const handlers = [
  // Mock Podscan API
  http.get("https://api.podscan.fm/episodes/*", () => {
    return HttpResponse.json({
      id: "episode-123",
      transcript: "This is a mock transcript...",
    });
  }),

  // Mock Anthropic API
  http.post("https://api.anthropic.com/v1/messages", () => {
    return HttpResponse.json({
      content: [{ type: "text", text: '{"ticker":"AAPL","thesis":"..."}' }],
    });
  }),
];
```

### Playwright MCP for E2E

Playwright MCP (Model Context Protocol) enables AI-powered test automation. The
server provides browser automation capabilities through structured accessibility
snapshots, enabling AI agents to interact with web pages.

```json
// mcp.json (Claude Code / Cursor / VS Code Copilot)
{
  "mcpServers": {
    "playwright": {
      "command": "npx",
      "args": ["@playwright/mcp@latest"]
    }
  }
}
```

Usage pattern: AI agents can generate, run, debug, and refine Playwright tests
through natural language interaction with the MCP server.

---

## Alternatives Considered

### Effect RPC Instead of tRPC

**Considered:** Replacing tRPC entirely with Effect RPC (@effect/rpc).

**Why not chosen:**
- tRPC ecosystem is more mature (React Query integration, devtools)
- Team already familiar with tRPC patterns
- Effect RPC requires more buy-in to Effect ecosystem
- Migration cost outweighs benefits for existing codebase

**When to reconsider:**
- If building a new greenfield project fully committed to Effect
- If tRPC type inference issues become blocking

### @effect/platform HttpApi Instead of Hono

**Considered:** Using Effect's built-in HTTP API framework instead of Hono.

**Why not chosen:**
- Hono has broader ecosystem support
- Better documentation and community resources
- More familiar patterns for team
- SST has native Hono examples

**When to reconsider:**
- If needing deep Effect integration for HTTP layer
- If @effect/platform HttpApi matures further

### ts-rest Instead of tRPC

**Considered:** Using ts-rest for RESTful type-safe APIs.

**Why not chosen:**
- tRPC's DX is superior for internal APIs
- React Query integration is seamless
- No need for REST semantics in this project

---

## What NOT to Use

### Do NOT Import SST SDK in Application Code

**Why:**
- Breaks local development workflow
- Prevents agent verification without SST context
- Creates tight coupling to deployment platform

**Instead:** Read environment variables that SST injects at deploy time.

### Do NOT Use Effect Schema at tRPC Boundaries

**Why:**
- Type inference incompatibility with tRPC
- Bidirectional transforms break client/server type contract
- Debugging type errors is extremely difficult

**Instead:** Use Zod for tRPC input/output, Effect Schema internally.

### Do NOT Use node-cron or agenda.js

**Why:**
- Lambda functions don't persist
- SST provides native Cron component
- EventBridge is more reliable than in-process timers

**Instead:** Use SST v3 Cron component with EventBridge.

### Do NOT Use Jest

**Why:**
- Vitest is faster with native ESM support
- Better TypeScript support out of the box
- Jest-compatible API makes migration easy

**Instead:** Use Vitest for all testing.

### Do NOT Mix Effect Layers Between Test and Production

**Why:**
- Leads to subtle bugs where test behavior differs from production
- Makes tests less reliable as indicators of real behavior

**Instead:** Clear separation: `*Live` layers for production, `*Test` layers for testing.

---

## Installation Commands

```bash
# Core Effect ecosystem
pnpm add effect @effect/schema @effect/platform @effect/platform-node

# Hono + Effect integration
pnpm add @hono/effect-validator

# Testing
pnpm add -D vitest msw @playwright/test

# Already in stack (verify versions)
pnpm add hono @trpc/server @trpc/client zod
```

---

## Environment Variables Required

```bash
# Core application
DATABASE_URL=postgres://...
BETTER_AUTH_SECRET=...
CORS_ORIGIN=https://gemhog.com

# AI/LLM
ANTHROPIC_API_KEY=sk-ant-...
OPENAI_API_KEY=sk-...  # backup

# External APIs
PODSCAN_API_KEY=...
FMP_API_KEY=...  # Financial Modeling Prep (if used)

# Social Media
TWITTER_API_KEY=...
TWITTER_API_SECRET=...
TWITTER_ACCESS_TOKEN=...
TWITTER_ACCESS_SECRET=...
BLUESKY_HANDLE=...
BLUESKY_APP_PASSWORD=...

# Caching (optional)
UPSTASH_REDIS_REST_URL=...
UPSTASH_REDIS_REST_TOKEN=...
```

---

## Confidence Assessment

| Area                          | Confidence | Reasoning                                                       |
| ----------------------------- | ---------- | --------------------------------------------------------------- |
| Effect TS version/stability   | HIGH       | Verified via npm (3.19.14), official docs confirm API stability |
| tRPC v11 requirements         | HIGH       | Official migration docs verify TypeScript >=5.7.2 requirement   |
| Effect + tRPC incompatibility | HIGH       | Documented by developers, verified via community reports        |
| Hono + Effect integration     | HIGH       | Official @hono/effect-validator package exists                  |
| SST v3 Hono deployment        | HIGH       | Official SST documentation with examples                        |
| Testing patterns              | HIGH       | Vitest + MSW patterns verified via Effect community guides      |
| Playwright MCP                | MEDIUM     | Recent technology (March 2025), official Microsoft support      |

---

## Sources

### Effect TS
- [Effect 3.0 Release](https://effect.website/blog/releases/effect/30/)
- [Effect npm package](https://www.npmjs.com/package/effect)
- [Effect Documentation](https://effect.website/docs/getting-started/introduction)
- [Effect 3.19 Release](https://effect.website/blog/releases/effect/319/)
- [Effect Patterns GitHub](https://github.com/PaulJPhilp/EffectPatterns)

### tRPC
- [tRPC v11 Announcement](https://trpc.io/blog/announcing-trpc-v11)
- [tRPC v10 to v11 Migration](https://trpc.io/docs/migrate-from-v10-to-v11)
- [tRPC Middleware](https://trpc.io/docs/server/middlewares)

### Effect + tRPC Integration
- [Replacing tRPC with Effect RPC](https://dev.to/titouancreach/how-i-replaced-trpc-with-effect-rpc-in-a-nextjs-app-router-application-4j8p)
- [Effect Backend Implementation](https://www.typeonce.dev/article/how-to-implement-a-backend-with-effect)

### Hono
- [Hono Best Practices](https://hono.dev/docs/guides/best-practices)
- [@hono/effect-validator npm](https://www.npmjs.com/package/@hono/effect-validator)
- [@hono/effect-validator GitHub](https://github.com/honojs/middleware/tree/main/packages/effect-validator)

### SST v3
- [SST Environment Variables](https://sst.dev/docs/environment-variables/)
- [SST Hono on AWS](https://sst.dev/docs/start/aws/hono/)
- [SST v3 Blog](https://sst.dev/blog/sst-v3/)

### Testing
- [Vitest and MSW with Effect](https://www.typeonce.dev/course/effect-beginners-complete-getting-started/testing-with-services/vitest-and-msw-testing-setup)
- [Vitest Mocking Guide](https://vitest.dev/guide/mocking)
- [Playwright MCP GitHub](https://github.com/microsoft/playwright-mcp)
- [Playwright MCP Guide 2026](https://www.testleaf.com/blog/playwright-mcp-ai-test-automation-2026/)

---

_Last updated: 2026-01-19_
