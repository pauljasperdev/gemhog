# Phase 4: SST Deployment - Context

**Gathered:** 2026-01-22 **Status:** Ready for planning

<domain>
## Phase Boundary

Deploy the application to AWS via SST with zero SST SDK imports in application
code. Application reads all configuration from environment variables. SST
injects env vars at deploy time.

</domain>

<decisions>
## Implementation Decisions

### AWS Compute & Hosting

- Hono server (apps/server) deploys as Lambda with CloudFront Router
- Next.js app (apps/web) deploys via SST Nextjs component
- Region: eu-central-1 (Frankfurt)
- SST console enabled for monitoring/debugging
- Lambda uses SST defaults for memory/timeout

### SST Project Structure

- Infrastructure code lives in `/infra` at repo root (not packages/infra)
- One file per resource type: `infra/api.ts`, `infra/web.ts`,
  `infra/secrets.ts`, etc.
- Structure inspired by anomalyco/monorepo-template and terminaldotshop/terminal
- SST auto-naming for resources (no custom prefixes)

### Secrets & Environment Variables

- SST secrets managed via `sst secret set`, organized in `infra/secrets.ts`
- Secrets linked to Hono Lambda and Next.js constructs via SST
- App code reads env vars only — zero SST SDK dependencies
- Local development continues using `.env` files (no SST CLI required)
- Must remain compatible with existing t3-env validation

### Environment Strategy

- Three stages: `dev`, `test`, `prod` (short lowercase names)
- Deployment via SST console autodeploy (CI/CD)
- Personal stages for local development (`sst dev --stage <name>`)
- NODE_ENV=production for all deployed stages

### Domain Configuration

- Domain: gemhog.com (managed in Cloudflare)
- Production: gemhog.com (web) + api.gemhog.com (Hono)
- Dev: dev.gemhog.com (web) + api.dev.gemhog.com (Hono)
- Cloudflare DNS via SST provider (sst.dev/docs/component/cloudflare/dns/)
- Cloudflare proxy settings managed in Cloudflare dashboard (not SST)
- CORS: allow \*.gemhog.com

### Database (Neon)

- Neon PostgreSQL managed via custom SST Neon primitive (to be created)
- Reference pattern: github.com/pauljasperdev/immo/blob/dev/infra/neon.ts
- User will create the primitive and provide the link
- DATABASE_URL stored as SST secret, linked to Next.js and Lambda constructs
- Three databases/branches: dev, test, prod (research free tier options)
- Use Neon's connection pooler for Lambda compatibility
- Migrations run during deploy, fail-fast on errors

### Hono Entrypoints

- `lambda.ts` — Lambda handler for AWS deployment (supports streaming)
- `serve.ts` — Standard Node server for local dev without SST
- Streaming must work in deployed Lambda
- Streaming disabled for `sst dev` (local)

### Claude's Discretion

- Exact SST component configuration details
- Lambda function naming conventions
- CloudFront cache settings
- Error page configuration

</decisions>

<specifics>
## Specific Ideas

- Reference repos for patterns: github.com/anomalyco/monorepo-template,
  github.com/terminaldotshop/terminal
- Neon integration pattern: github.com/pauljasperdev/immo/blob/dev/infra/neon.ts
  (for future reference, not for this phase since DB is external)
- Hono streaming example: sst.dev/docs/examples/#aws-hono-streaming

</specifics>

<deferred>
## Deferred Ideas

- Redis/caching layer — add when performance requires
- S3 file storage — add when user uploads needed
- SQS/queues for async — add when background jobs needed

</deferred>

---

_Phase: 04-sst-deployment_ _Context gathered: 2026-01-22_
