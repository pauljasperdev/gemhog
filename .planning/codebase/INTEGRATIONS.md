# External Integrations

**Analysis Date:** 2026-01-15

## APIs & External Services

**AI/LLM:**
- Google Generative AI (Gemini) - AI chat responses
  - SDK/Client: `@ai-sdk/google` v3.0.8 (`apps/server/package.json`)
  - Model: `gemini-2.5-flash` (`apps/server/src/index.ts`)
  - Auth: API key in `GOOGLE_GENERATIVE_AI_API_KEY` env var
  - Endpoint: `POST /ai` (`apps/server/src/index.ts`)

**Payment Processing:**
- Polar.sh - Subscription billing and checkout
  - SDK/Client: `@polar-sh/sdk`, `@polar-sh/better-auth` (`packages/auth/package.json`)
  - Auth: Access token in `POLAR_ACCESS_TOKEN` env var
  - Features: Product checkout, customer portal
  - Client setup: `packages/auth/src/lib/payments.ts`
  - Better-Auth plugin: `packages/auth/src/index.ts`

## Data Storage

**Databases:**
- PostgreSQL - Primary data store
  - Connection: via `DATABASE_URL` env var
  - Client: Drizzle ORM v0.45.1 (`packages/db/`)
  - Driver: `pg` v8.16.3
  - Migrations: Drizzle Kit (`packages/db/drizzle.config.ts`)

**File Storage:**
- Not detected

**Caching:**
- Not detected (no Redis or similar)

## Authentication & Identity

**Auth Provider:**
- Better-Auth - Email/password authentication
  - Implementation: `packages/auth/src/index.ts`
  - Database adapter: Drizzle ORM
  - Token storage: HTTP-only cookies
  - Session management: Database-backed sessions

**Cookie Configuration:**
- `sameSite: "none"` - Cross-origin support
- `secure: true` - HTTPS only
- `httpOnly: true` - Not accessible to JavaScript

**OAuth Integrations:**
- Not detected (email/password only currently)

## Monitoring & Observability

**Error Tracking:**
- Not detected (no Sentry or similar)

**Analytics:**
- Not detected

**Logs:**
- Console logging only
- Hono logger middleware for HTTP requests

## CI/CD & Deployment

**Hosting (Planned):**
- SST v3 on AWS - TypeScript-native infrastructure-as-code
- SST-agnostic application code (apps read env vars only, no SST SDK imports)
- Enables local development with `pnpm dev` without SST context

**Deployment Stages:**
- Local: Apps run with `.env` files, no SST dependency
- Test: Deployed AWS resources (S3, etc.) for integration testing via env vars
- Production: Full SST v3 deployment on AWS

**CI Pipeline:**
- Not yet configured
- Planned verification order: static → unit → integration → Playwright MCP

## Environment Configuration

**Development:**
- Required env vars:
  - `DATABASE_URL` - PostgreSQL connection
  - `BETTER_AUTH_SECRET` - Auth encryption
  - `CORS_ORIGIN` - Allowed origins
  - `GOOGLE_GENERATIVE_AI_API_KEY` - AI features
  - `POLAR_ACCESS_TOKEN` - Payments
  - `NEXT_PUBLIC_SERVER_URL` - API base URL
- Secrets location: `apps/server/.env`, `apps/web/.env`
- Local database: Docker Compose (`packages/db/docker-compose.yml`)

**Staging:**
- Not configured

**Production:**
- Environment variables must be set in hosting platform

## Webhooks & Callbacks

**Incoming:**
- Not detected (no webhook endpoints)

**Outgoing:**
- Polar checkout success URL: `POLAR_SUCCESS_URL` env var

## Communication Protocols

**tRPC:**
- Type-safe RPC between web and server
- HTTP batch link (`apps/web/src/utils/trpc.ts`)
- Endpoint: `/trpc` (`apps/server/src/index.ts`)
- Credentials: `include` for auth cookies

**HTTP/REST:**
- Hono server for HTTP routing
- CORS middleware configured
- Auth endpoints: `/api/auth/*`
- AI endpoint: `POST /ai`

## Environment Variable Reference

**Server (`packages/env/src/server.ts`):**
```
DATABASE_URL          # PostgreSQL connection string
BETTER_AUTH_SECRET    # Auth encryption secret
BETTER_AUTH_URL       # Auth callback URL
CORS_ORIGIN           # Allowed CORS origins
POLAR_ACCESS_TOKEN    # Polar API access token
POLAR_SUCCESS_URL     # Checkout success redirect
```

**Web (`packages/env/src/web.ts`):**
```
NEXT_PUBLIC_SERVER_URL    # Backend API URL
```

**Server-only (not in schema):**
```
GOOGLE_GENERATIVE_AI_API_KEY    # Google AI API key
```

---

*Integration audit: 2026-01-15*
*Update when adding/removing external services*
