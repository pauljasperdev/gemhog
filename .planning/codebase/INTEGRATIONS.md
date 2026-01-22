# External Integrations

**Analysis Date:** 2026-01-15

## APIs & External Services

### Active (V0)

**AI/LLM:**

- Google Generative AI (Gemini) - AI chat responses
  - SDK/Client: `@ai-sdk/google` v3.0.8 (`apps/server/package.json`)
  - Model: `gemini-2.5-flash` (`apps/server/src/index.ts`)
  - Auth: API key in `GOOGLE_GENERATIVE_AI_API_KEY` env var
  - Endpoint: `POST /ai` (`apps/server/src/index.ts`)

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

### Deferred (V1)

These integrations will be implemented after V0 foundation is complete.

**Email/Newsletter:**

- AWS SES (Simple Email Service) - Newsletter delivery
  - Purpose: Send blog-post style stock finding summaries to subscribers
  - Auth: AWS credentials via SST/IAM
  - Features: Email sending, bounce/complaint handling
  - Rationale: Infrastructure-as-code via SST, no external service dependency

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

- Not detected

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
```

**Web (`packages/env/src/web.ts`):**

```
NEXT_PUBLIC_SERVER_URL    # Backend API URL
```

**Server-only (not in schema):**

```
GOOGLE_GENERATIVE_AI_API_KEY    # Google AI API key
```

**Newsletter (AWS SES) — Deferred V1:**

- No additional env vars needed — SST injects AWS credentials at deploy time
- Local dev: Use Test stage SES or mock email sending

---

_Integration audit: 2026-01-15_ _Updated: 2026-01-19 — moved stock data APIs and
newsletter to Deferred (V1)_ _Update when adding/removing external services_
