---
phase: 04-sst-deployment
plan: 04
subsystem: infrastructure
tags: [sst, aws, lambda, nextjs, cloudflare, cors]

# Dependency graph
requires:
  - phase: 04-02
    provides: sst.config.ts, secrets, neon Linkable
  - phase: 04-03
    provides: Lambda handler with streaming
provides:
  - Hono Lambda function configuration (infra/api.ts)
  - Next.js deployment configuration (infra/web.ts)
  - Stage-conditional domain routing
affects: [04-05-deployment-verification]

# Tech tracking
tech-stack:
  added: []
  patterns: [router-for-streaming, transform-for-self-reference, linkable-env-vars]

key-files:
  created:
    - infra/api.ts
    - infra/web.ts
  modified: []

key-decisions:
  - "Router for CloudFront domain routing (api.gemhog.com)"
  - "Function URL with streaming (!$dev) for AI responses"
  - "Transform pattern for personal stage BETTER_AUTH_URL self-reference"
  - "Nullish coalescing for CLOUDFLARE_ZONE_ID (avoids non-null assertion)"
  - "Domain config only for dev/test/prod stages"

patterns-established:
  - "Stage-conditional domain config: prod vs dev/test vs personal stages"
  - "Transform for self-referencing environment variables"
  - "Linkable properties for env vars (neon.properties.urlPooler)"

# Metrics
duration: 3min
completed: 2026-01-22
---

# Phase 4 Plan 04: API and Web Infrastructure Summary

**SST component configurations for Hono Lambda API and Next.js web app with
streaming support and stage-conditional domains**

## Performance

- **Duration:** 3 min
- **Started:** 2026-01-22T20:12:02Z
- **Completed:** 2026-01-22T20:15:18Z
- **Tasks:** 2
- **Files created:** 2
- **Deviations:** None

## Accomplishments

- Created Hono Lambda function with streaming and Router for CloudFront domain
- Created Next.js deployment with Cloudflare DNS
- Configured stage-conditional domains (prod, dev/test, personal stages)
- Set up CORS for gemhog.com and localhost:3001
- Linked all required secrets and Neon database

## Task Commits

Each task was committed atomically:

1. **Task 1: Create infra/api.ts** - `45475f3` (feat)
2. **Task 2: Create infra/web.ts** - `ac94b7c` (feat)

## Files Created

### infra/api.ts

Hono Lambda configuration with:

- **Router:** CloudFront domain routing for `api.gemhog.com` / `api.dev.gemhog.com`
- **Function:** Lambda with streaming (!$dev), 15 min timeout, 512 MB memory
- **CORS:** Origins for gemhog.com, *.gemhog.com, localhost:3001
- **Links:** Neon (pooled URL), BetterAuthSecret, GoogleApiKey
- **Transform:** Sets BETTER_AUTH_URL for personal stages (self-reference pattern)

Key environment variables:
- `DATABASE_URL` from neon.properties.urlPooler
- `CORS_ORIGIN` stage-conditional
- `BETTER_AUTH_URL` stage-conditional (transform for personal stages)
- `BETTER_AUTH_SECRET` from secrets
- `GOOGLE_GENERATIVE_AI_API_KEY` from secrets

### infra/web.ts

Next.js deployment configuration with:

- **Domain:** `gemhog.com` / `dev.gemhog.com` via Cloudflare DNS
- **Links:** Neon (pooled URL), BetterAuthSecret
- **Environment:** All required server and client env vars

Key environment variables:
- `NEXT_PUBLIC_SERVER_URL` for client-side API calls
- `DATABASE_URL` from neon.properties.urlPooler
- `BETTER_AUTH_SECRET` from secrets
- `BETTER_AUTH_URL` stage-conditional
- `CORS_ORIGIN` stage-conditional

## Patterns Established

### Stage-Conditional Domain Configuration

```typescript
const domainConfig = ["dev", "test", "prod"].includes($app.stage)
  ? { domain: { name: ..., dns: sst.cloudflare.dns({...}) } }
  : {};
```

Personal stages skip domain configuration and use direct Function URL / CloudFront URL.

### Transform for Self-Referencing Environment Variables

```typescript
transform: {
  function: (args) => {
    if (!["dev", "test", "prod"].includes($app.stage)) {
      args.environment = $resolve([args.environment, api.url]).apply(
        ([env, url]) => ({ ...env, BETTER_AUTH_URL: url }),
      );
    }
  },
},
```

Avoids circular reference lint error when env var needs the function's own URL.

### Router for Streaming Support

API Gateway doesn't support AWS Lambda streaming. Using Router (CloudFront) with
Function URL enables streaming for AI responses while providing custom domain.

## Deviations from Plan

None - plan executed exactly as written.

## Verification Results

All success criteria met:

- [x] infra/api.ts configures Hono Lambda with streaming, Router, and all env vars
- [x] infra/web.ts configures Next.js with domain and environment
- [x] Both link to Neon and required secrets
- [x] Stage-conditional domains (prod, dev, test vs personal stages)
- [x] CORS configured for *.gemhog.com and localhost
- [x] Full verification pipeline passes (static, unit, integration, e2e)

## User Setup Required

Before deploying, set SST secrets:

```bash
# Production
sst secret set DatabaseUrl "postgresql://..."
sst secret set DatabaseUrlPooler "postgresql://..."
sst secret set BetterAuthSecret "..."
sst secret set GoogleApiKey "..."

# Dev/test stages use same commands with --stage flag
sst secret set DatabaseUrl "..." --stage dev
```

Also set `CLOUDFLARE_ZONE_ID` environment variable for domain configuration.

## Next Phase Readiness

- All SST infrastructure files created and configured
- Ready for 04-05: Deployment verification and secrets setup
- Can run `sst deploy --stage <name>` once secrets are set

---

*Phase: 04-sst-deployment*
*Completed: 2026-01-22*
