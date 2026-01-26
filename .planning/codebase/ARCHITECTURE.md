# Architecture

**Analysis Date:** 2026-01-15 **Updated:** 2026-01-24 — Phase 4 SST deployment
complete

## Pattern Overview

**Overall:** Monorepo with Layered Architecture (Better-T-Stack)

**Key Characteristics:**

- pnpm workspace monorepo structure
- Type-safe API via tRPC (client-server communication)
- Shared packages for cross-app code reuse
- React/Next.js frontend with Next API routes for auth/tRPC
- Hono backend reserved for long-running/streaming endpoints
- Effect TS for backend dependency injection and error handling

## Layers

**Presentation Layer:**

- Purpose: User interface and client-side rendering
- Contains: React components, Next.js pages, UI primitives
- Location: `apps/web/src/`
- Depends on: API layer (via tRPC), Auth (client)
- Used by: End users via browser

**API Layer:**

- Purpose: Type-safe RPC endpoints and procedure definitions
- Contains: tRPC routers, procedures, context
- Location: `packages/api/src/`
- Depends on: Core layer (auth)
- Used by: Web app

**Server Layer (Hono):**

- Purpose: Long-running/streaming endpoints
- Contains: Hono server, AI endpoint
- Location: `apps/server/src/`
- Depends on: Core layer (auth), Env
- Used by: Web app (HTTP requests)

**Web Backend Layer (Next API):**

- Purpose: Auth + tRPC request handling on the same origin
- Contains: Next.js route handlers for `/api/auth/*` and `/api/trpc/*`
- Location: `apps/web/src/app/api/`
- Depends on: API layer, Core layer (auth)
- Used by: Web app (HTTP requests)

**Core Layer:**

- Purpose: Domain logic with Effect-based services, database, and schemas
- Contains: Domain services (Auth), Drizzle schemas, Effect layers
- Location: `packages/core/src/`
- Structure:
  - `drizzle/` — Database client, connection layer
  - `auth/` — Authentication domain (service, schema, errors, mocks)
  - `migrations/` — Database migration files
- Depends on: Env (DATABASE_URL, BETTER_AUTH_SECRET)
- Used by: Server, API procedures

**Configuration Layer:**

- Purpose: Environment validation and type-safe config
- Contains: t3-env validated env schemas for server and web
- Location: `packages/env/src/`
- Depends on: None
- Used by: All layers

## Data Flow

**HTTP Request (tRPC Query):**

1. Web client calls `useQuery(trpc.healthCheck.queryOptions())`
   (`apps/web/src/app/page.tsx`)
2. tRPC client sends HTTP request (`apps/web/src/trpc/client.ts`)
3. Next API handler receives request
   (`apps/web/src/app/api/trpc/[trpc]/route.ts`)
4. tRPC adapter routes to appRouter (`packages/api/src/routers/index.ts`)
5. Procedure executes and returns response
6. TanStack Query caches result
7. Component re-renders with data

**Authentication Flow:**

1. User submits credentials (`apps/web/src/components/sign-in-form.tsx`)
2. authClient.signIn() called (`apps/web/src/server/better-auth/client.ts`)
3. HTTP POST to `/api/auth/*` (`apps/web/src/app/api/auth/[...all]/route.ts`)
4. Better-Auth validates credentials via `auth.handler`
   (`packages/core/src/auth/auth.service.ts`)
5. Session created in database (`packages/core/src/auth/auth.sql.ts`)
6. HTTP-only cookie set
7. Client redirects to dashboard

**AI Chat Request:**

1. User sends message (`apps/web/src/app/ai/page.tsx`)
2. useChat() hook triggers request
3. HTTP POST to `/ai` endpoint (`apps/server/src/app.ts`)
4. Google Gemini model called via AI SDK
5. Streaming response returned
6. Streamdown component renders markdown

**State Management:**

- Server: Stateless HTTP with session cookies
- Client: React Query for server state caching
- Auth: Database-backed sessions via Better-Auth

## Key Abstractions

**Effect Service:**

- Purpose: Dependency-injected service with testable layers
- Examples: `AuthService` (`packages/core/src/auth/auth.service.ts`)
- Pattern: Context.Tag + Layer for production, mock Layer for tests

**Effect Layer:**

- Purpose: Composable dependency providers
- Examples: `DatabaseLive` (`packages/core/src/drizzle/`)
- Pattern: `Layer.sync()` or `Layer.provide()` for composition

**Tagged Error:**

- Purpose: Structured, typed domain errors
- Examples: `AuthError`, `SessionNotFoundError`
  (`packages/core/src/auth/auth.errors.ts`)
- Pattern: `Data.TaggedError` for pattern matching in Effect

**tRPC Procedure:**

- Purpose: Type-safe API endpoint definition
- Examples: `publicProcedure`, `protectedProcedure`
  (`packages/api/src/index.ts`)
- Pattern: Middleware chain with context injection

**Context:**

- Purpose: Request context with session data
- Examples: `createContext()` (`packages/api/src/context.ts`)
- Pattern: Per-request context creation

**Drizzle Schema:**

- Purpose: Database table definitions with relations
- Examples: `user`, `session`, `account` (`packages/core/src/auth/auth.sql.ts`)
- Pattern: Schema-first ORM with typed relations, `*.sql.ts` naming convention

**Auth Client:**

- Purpose: Client-side authentication operations
- Examples: `authClient` (`apps/web/src/server/better-auth/client.ts`)
- Pattern: Better-Auth React client

## Entry Points

**Server:**

- Location: `apps/server/src/serve.ts`
- Triggers: HTTP requests on port 3000
- Responsibilities: Route handling, AI streaming

**Web:**

- Location: `apps/web/src/app/layout.tsx`
- Triggers: Next.js page navigation
- Responsibilities: Root layout, providers, client rendering

**API Router:**

- Location: `packages/api/src/routers/index.ts`
- Triggers: tRPC procedure calls
- Responsibilities: healthCheck, privateData endpoints

**Database:**

- Location: `packages/core/src/drizzle/index.ts`
- Triggers: Query execution
- Responsibilities: Effect PgClient layer, Drizzle layer composition

**Auth Domain:**

- Location: `packages/core/src/auth/index.ts`
- Triggers: Session validation, sign-in/sign-out
- Responsibilities: AuthService layer, Better-Auth configuration

## Error Handling

**Strategy:** Throw errors, catch at boundaries (route handlers, tRPC
middleware). Domain services use Effect TaggedErrors for typed error handling.

**Patterns:**

- Effect domains: `Data.TaggedError` with typed payloads
  (`packages/core/src/*/errors.ts`)
- tRPC: `TRPCError` with codes (UNAUTHORIZED, etc.)
  (`packages/api/src/index.ts`)
- Auth: Error callback on auth operations
  (`apps/web/src/components/sign-in-form.tsx`)
- API: Toast notifications for user feedback (`apps/web/src/trpc/client.ts`)

**Domain Errors:**

- Auth: `AuthError`, `SessionNotFoundError`, `SessionExpiredError`,
  `UnauthorizedError`

## Cross-Cutting Concerns

**Security:**

- Input validation at all boundaries (Zod schemas on API endpoints)
- Authentication via Better-Auth with HTTP-only secure cookies
- Authorization checks via `protectedProcedure` middleware
- No secrets in code (env vars only, validated at startup)
- Security review required before merge (see `SECURITY-CHECKLIST.md`)
- Critical/High findings block deployment
- Findings tracked in `CONCERNS.md` with severity levels

**Logging:**

- Console.log for server startup (`apps/server/src/serve.ts`)
- Hono logger middleware for requests
- No sensitive data in logs (passwords, tokens, PII)

**Validation:**

- Zod schemas for environment variables (`packages/env/src/`)
- tRPC input validation via Zod (when defined)
- All user input validated server-side

**Authentication:**

- Better-Auth handler handles `/api/auth/*` routes (Next API)
- protectedProcedure middleware checks session (`packages/api/src/index.ts`)
- HTTP-only secure cookies for session storage

## Completed Architectural Changes

**Effect TS Integration (Backend) — Completed Phase 03:**

- Purpose: Testability, dependency injection, composable error handling
- Scope: Core package services (`packages/core/`)
- Implementation:
  - Auth with direct Better Auth instance
    (`packages/core/src/auth/auth.service.ts`)
  - `DatabaseLive` layer composing PgClient + Drizzle
    (`packages/core/src/drizzle/index.ts`)
  - TaggedErrors for structured error handling

**Core Package Consolidation — Completed Phase 03:**

- Pattern: Merged `packages/db` + `packages/auth` → `packages/core`
- Structure:
  - `core/src/drizzle/` — Database client, connection
  - `core/src/auth/` — Auth domain (service, schema, errors)
  - `core/src/migrations/` — Database migration files
- Schema naming: `*.sql.ts` files (e.g., `auth.sql.ts`)
- Exports via `package.json`:
  - `@gemhog/core` → drizzle
  - `@gemhog/core/auth` → auth domain
- Future domains (Deferred V1): `stock/`, `thesis/`, `newsletter/` added as
  sibling folders when implementing V1 features

## Production Deployment (SST v3)

**Infrastructure as Code (`infra/`):**

- `sst.config.ts` - Root configuration with AWS + Cloudflare providers
- `infra/secrets.ts` - SST secrets (DatabaseUrl, BetterAuthSecret, GoogleApiKey)
- `infra/neon.ts` - Neon database Linkable with dual URLs (direct for
  migrations, pooled for Lambda)
- `infra/api.ts` - Hono Lambda function with Router (enables streaming via
  Function URL)
- `infra/web.ts` - Next.js deployment via OpenNext

**Deployment Data Flow:**

1. `sst deploy --stage dev` triggers infrastructure provisioning
2. SST reads secrets from AWS SSM Parameter Store
3. Lambda function deployed with environment variables from secrets
4. Router routes traffic from API Gateway to Lambda Function URL (streaming)
5. Next.js deployed via OpenNext to AWS Lambda@Edge
6. Cloudflare DNS records created for custom domains

**Stage Domains:**

- `prod`: gemhog.com / api.gemhog.com
- `dev`/`test`: dev.gemhog.com / api.dev.gemhog.com
- Personal stages: {stage}.gemhog.com / api.{stage}.gemhog.com

## Active Architecture Principles

**SST-Agnostic Architecture:**

- Principle: Application code reads env vars only, no SST SDK imports
- Rationale: Enables local development with `pnpm dev` without SST context
- Pattern: SST injects env vars at deploy time; `.env` files for local/test
- Benefit: Agents can verify code without SST multiplexer running

## Deferred Data Flows (V1)

These flows will be implemented after V0 foundation is complete.

**Newsletter Subscription Flow:**

1. User visits landing page and enters email
2. Server validates and stores subscriber
3. Emails sent via AWS SES

**Stock Data Flow:**

1. Stock page requested for ticker (e.g., `/stock/AAPL`)
2. Server checks cache for recent data
3. If stale/missing, fetches in parallel:
   - SEC EDGAR: Company facts API for fundamentals (XBRL data)
   - EODHD (or alternative): automated-friendly EOD price history
4. Data normalized via provider abstraction layer
5. Derived metrics computed (P/E, debt ratios, growth rates)
6. Results cached and returned to client
7. UI renders hobby-investor-friendly metrics and charts

---

_Architecture analysis: 2026-01-15_ _Updated: 2026-01-24 — Phase 4 SST
deployment complete_ _Update when major patterns change_
