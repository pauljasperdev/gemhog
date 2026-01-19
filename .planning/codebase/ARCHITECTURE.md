# Architecture

**Analysis Date:** 2026-01-15

## Pattern Overview

**Overall:** Monorepo with Layered Architecture (Better-T-Stack)

**Key Characteristics:**
- pnpm workspace monorepo structure
- Type-safe API via tRPC (client-server communication)
- Shared packages for cross-app code reuse
- React/Next.js frontend consuming Hono backend

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
- Depends on: Auth layer, Database layer
- Used by: Web app, Server

**Server Layer:**
- Purpose: HTTP routing, middleware, external integrations
- Contains: Hono server, auth handlers, AI endpoint
- Location: `apps/server/src/`
- Depends on: API layer, Auth layer, Env
- Used by: Web app (HTTP requests)

**Authentication Layer:**
- Purpose: User auth, session management, payments
- Contains: Better-Auth config, Polar integration
- Location: `packages/auth/src/`
- Depends on: Database layer, Env
- Used by: Server, API procedures

**Data Layer:**
- Purpose: Database schema and ORM configuration
- Contains: Drizzle schema, relations, db instance
- Location: `packages/db/src/`
- Depends on: Env (DATABASE_URL)
- Used by: Auth layer, API procedures

**Configuration Layer:**
- Purpose: Environment validation and type-safe config
- Contains: Zod schemas for env vars
- Location: `packages/env/src/`
- Depends on: None
- Used by: All layers

## Data Flow

**HTTP Request (tRPC Query):**

1. Web client calls `trpc.healthCheck.queryOptions()` (`apps/web/src/app/page.tsx`)
2. tRPC client sends HTTP request (`apps/web/src/utils/trpc.ts`)
3. Hono server receives request (`apps/server/src/index.ts`)
4. tRPC adapter routes to appRouter (`packages/api/src/routers/index.ts`)
5. Procedure executes and returns response
6. React Query caches result
7. Component re-renders with data

**Authentication Flow:**

1. User submits credentials (`apps/web/src/components/sign-in-form.tsx`)
2. authClient.signIn() called (`apps/web/src/lib/auth-client.ts`)
3. HTTP POST to `/api/auth/*` (`apps/server/src/index.ts`)
4. Better-Auth validates credentials (`packages/auth/src/index.ts`)
5. Session created in database (`packages/db/src/schema/auth.ts`)
6. HTTP-only cookie set
7. Client redirects to dashboard

**AI Chat Request:**

1. User sends message (`apps/web/src/app/ai/page.tsx`)
2. useChat() hook triggers request
3. HTTP POST to `/ai` endpoint (`apps/server/src/index.ts`)
4. Google Gemini model called via AI SDK
5. Streaming response returned
6. Streamdown component renders markdown

**State Management:**
- Server: Stateless HTTP with session cookies
- Client: React Query for server state caching
- Auth: Database-backed sessions via Better-Auth

## Key Abstractions

**tRPC Procedure:**
- Purpose: Type-safe API endpoint definition
- Examples: `publicProcedure`, `protectedProcedure` (`packages/api/src/index.ts`)
- Pattern: Middleware chain with context injection

**Context:**
- Purpose: Request context with session data
- Examples: `createContext()` (`packages/api/src/context.ts`)
- Pattern: Per-request context creation

**Drizzle Schema:**
- Purpose: Database table definitions with relations
- Examples: `user`, `session`, `account` (`packages/db/src/schema/auth.ts`)
- Pattern: Schema-first ORM with typed relations

**Auth Client:**
- Purpose: Client-side authentication operations
- Examples: `authClient` (`apps/web/src/lib/auth-client.ts`)
- Pattern: Better-Auth React client with Polar plugin

## Entry Points

**Server:**
- Location: `apps/server/src/index.ts`
- Triggers: HTTP requests on port 3000
- Responsibilities: Route handling, CORS, auth, tRPC, AI

**Web:**
- Location: `apps/web/src/app/layout.tsx`
- Triggers: Next.js page navigation
- Responsibilities: Root layout, providers, client rendering

**API Router:**
- Location: `packages/api/src/routers/index.ts`
- Triggers: tRPC procedure calls
- Responsibilities: healthCheck, privateData endpoints

**Database:**
- Location: `packages/db/src/index.ts`
- Triggers: Query execution
- Responsibilities: Drizzle instance creation

## Error Handling

**Strategy:** Throw errors, catch at boundaries (route handlers, tRPC middleware)

**Patterns:**
- tRPC: `TRPCError` with codes (UNAUTHORIZED, etc.) (`packages/api/src/index.ts`)
- Auth: Error callback on auth operations (`apps/web/src/components/sign-in-form.tsx`)
- API: Toast notifications for user feedback (`apps/web/src/utils/trpc.ts`)

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
- Console.log for server startup (`apps/server/src/index.ts`)
- Hono logger middleware for requests
- No sensitive data in logs (passwords, tokens, PII)

**Validation:**
- Zod schemas for environment variables (`packages/env/src/`)
- tRPC input validation via Zod (when defined)
- All user input validated server-side

**Authentication:**
- Better-Auth middleware handles `/api/auth/*` routes
- protectedProcedure middleware checks session (`packages/api/src/index.ts`)
- HTTP-only secure cookies for session storage

## Planned Architectural Changes

**Effect TS Integration (Backend):**
- Purpose: Testability, dependency injection, composable error handling
- Scope: Backend services in `apps/server/` and `packages/api/`
- Benefits: Easy mocking for unit tests, structured error handling
- Status: Pending implementation

**SST-Agnostic Architecture:**
- Principle: Application code reads env vars only, no SST SDK imports
- Rationale: Enables local development with `pnpm dev` without SST context
- Pattern: SST injects env vars at deploy time; `.env` files for local/test
- Benefit: Agents can verify code without SST multiplexer running

**Core Package Consolidation (Domain-Driven):**
- Pattern: Merge `packages/db` + `packages/auth` → `packages/core`
- Structure: `core/src/drizzle/` for DB, `core/src/auth/` for auth domain
- Schema naming: `*.sql.ts` files (e.g., `auth.sql.ts`)
- Schema aggregation: `drizzle/index.ts` spreads domain schemas
- Rationale: Avoids cyclic deps between db and domain packages
- Future domains: `stock/`, `thesis/` added as sibling folders
- Status: Pending refactoring (see STRUCTURE.md for full details)

---

*Architecture analysis: 2026-01-15*
*Updated: 2026-01-19 — added core package consolidation plan*
*Update when major patterns change*
