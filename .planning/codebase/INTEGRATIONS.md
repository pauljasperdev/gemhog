# External Integrations

**Analysis Date:** 2026-01-15

## APIs & External Services

### Active (V0)

**AI/LLM:**

- Google Generative AI (Gemini) - AI chat responses
  - SDK/Client: `@ai-sdk/google` v3.0.8 (`apps/server/package.json`)
  - Model: `gemini-2.5-flash` (`apps/server/src/app.ts`)
  - Auth: API key in `GOOGLE_GENERATIVE_AI_API_KEY` env var
  - Endpoint: `POST /ai` (`apps/server/src/index.ts`)

## Data Storage

**Databases:**

- PostgreSQL - Primary data store
  - Connection: via `DATABASE_URL` env var
  - Client: Drizzle ORM v0.45.1 (`packages/core/`)
  - Driver: `pg` v8.16.3
  - Migrations: Drizzle Kit (`packages/core/drizzle.config.ts`)

**File Storage:**

- Not detected

**Caching:**

- Not detected (no Redis or similar)

### Active (Email)

**Email/Newsletter:**

- AWS SES (Simple Email Service) - Newsletter delivery
  - Purpose: Send verification emails and newsletters to subscribers
  - Auth: AWS credentials via SST/IAM
  - Features:
    - Double opt-in verification flow
    - HMAC token-based verification/unsubscribe links
    - List-Unsubscribe headers (RFC 8058 compliant)
    - DKIM/SPF/DMARC configured via SST Email component
  - Configuration: `SES_FROM_EMAIL` env var enables SES mode
  - Local dev: Console logger mode (prints emails to terminal)
  - Implementation: Effect TS services in `packages/core/src/email/`

### Deferred (V1)

These integrations will be implemented after V0 foundation is complete.

**Stock Data ($0 budget, US stocks only):**

- SEC EDGAR - Financial fundamentals
  - Purpose: 10-K/10-Q filings via XBRL for authoritative financial data
  - Auth: None required (public API)
  - Endpoint: `https://data.sec.gov/` (company facts, submissions)
  - Data: Revenue, earnings, balance sheet items, cash flow
  - Rationale: Free, authoritative, no redistribution licensing concerns
  - Note: Requires User-Agent header per SEC guidelines

- EODHD (or alternative) - EOD price history
  - Purpose: End-of-day price data for charts and basic multiples (P/E, etc.)
  - Auth: API key (provider-specific)
  - Endpoint: Provider-specific (e.g., EODHD REST endpoints)
  - Data: Date, Open, High, Low, Close, Volume (and adjusted close when
    available)
  - Rationale: Automated-friendly provider; avoid Stooq (CAPTCHA); keep
    swappable via abstraction layer
  - Note: Verify ToS before production; keep a fallback provider available

- **Rejected providers:**
  - Financial Modeling Prep (FMP): Requires "Data Display and Licensing
    Agreement" for public redistribution
  - Alpha Vantage: Free tier too limited for production use
  - Twelve Data: Fundamentals endpoints too credit-expensive

## Authentication & Identity

**Auth Provider:**

- Better-Auth - Email/password authentication
  - Implementation: `packages/core/src/auth/auth.service.ts`
  - Handler: `apps/web/src/app/api/auth/[...all]/route.ts`
  - Database adapter: Drizzle ORM
  - Token storage: HTTP-only cookies
  - Session management: Database-backed sessions
  - **Skill:** Use `/better-auth-best-practices` when implementing or modifying
    authentication features

**Cookie Configuration:**

- Default Better Auth cookie settings for same-origin
- For cross-domain use, set `sameSite: "none"` and `secure: true`

**OAuth Integrations:**

- Not detected (email/password only currently)

## Monitoring & Observability

**Error Tracking:**

- Sentry - Error monitoring and stack traces
  - SDK/Client: `@sentry/nextjs` v10.36 (`apps/web/package.json`)
  - SDK/Server: `@sentry/node` (`apps/server/package.json`)
  - Auth: SENTRY_AUTH_TOKEN env var for source map upload
  - Configuration: Optional - graceful skip if SENTRY_DSN not set
  - Features:
    - Client-side error capture with session ID tagging
    - Server-side error capture (Node.js + Edge runtime)
    - Source map upload during build for readable stack traces
    - Error boundaries (global-error.tsx, error.tsx, section-error-boundary.tsx)
    - Browser extension filtering (ignoreErrors, denyUrls)
    - Tunnel route (/monitoring) to avoid ad blockers

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
  - `NEXT_PUBLIC_SERVER_URL` - API base URL
- Secrets location: `apps/web/.env` (Next auth/tRPC), `apps/server/.env` (Hono)
- Local database: Docker Compose (`infra/docker-compose.yml`)

**Staging:**

- Not configured

**Production:**

- Environment variables must be set in hosting platform

## Webhooks & Callbacks

**Incoming:**

- Not detected (no webhook endpoints)

**Outgoing:**

- Not detected

## Communication Protocols

**tRPC:**

- Type-safe RPC between web and server
- HTTP batch link (`apps/web/src/trpc/client.ts`)
- Endpoint: `/api/trpc` (`apps/web/src/app/api/trpc/[trpc]/route.ts`)
- Credentials: `include` for auth cookies

**HTTP/REST:**

- Next API for auth and tRPC
- Hono server for AI routing
- Auth endpoints: `/api/auth/*` (Next)
- tRPC endpoint: `/api/trpc` (Next)
- AI endpoint: `POST /ai` (Hono)

## Environment Variable Reference

**Server (`packages/env/src/server.ts`):**

```
DATABASE_URL          # PostgreSQL connection string
DATABASE_URL_POOLER   # Pooled PostgreSQL connection string
BETTER_AUTH_SECRET    # Auth encryption secret
BETTER_AUTH_URL       # Auth callback URL
CORS_ORIGIN           # Allowed CORS origins
GOOGLE_GENERATIVE_AI_API_KEY # Google AI API key
SENTRY_DSN            # Sentry DSN (optional - error monitoring)
SENTRY_AUTH_TOKEN     # Sentry auth token (optional - source map upload)
SENTRY_ORG            # Sentry organization (optional)
SENTRY_PROJECT        # Sentry project name (optional)
SES_FROM_EMAIL        # SES sender email (optional - enables SES mode)
```

**Web (`packages/env/src/web.ts`):**

```
NEXT_PUBLIC_SERVER_URL    # Backend API URL
NEXT_PUBLIC_SENTRY_DSN    # Sentry DSN for client-side (optional)
```

**Server-only (not in schema):**

- None

**Newsletter (AWS SES) — Deferred V1:**

- No additional env vars needed — SST injects AWS credentials at deploy time
- Local dev: Use Test stage SES or mock email sending

---

_Integration audit: 2026-01-15_ _Updated: 2026-01-28 — Added Sentry error
monitoring (Phase 01) and AWS SES email infrastructure (Phase 02)_ _Update when
adding/removing external services_
