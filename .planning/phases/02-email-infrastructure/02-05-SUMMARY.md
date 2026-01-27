---
phase: 02-email-infrastructure
plan: 05
subsystem: infra
tags: [sst, ses, aws, dkim, spf, dmarc, email, secrets, sesv2]

requires:
  - phase: 02-email-infrastructure/02-04
    provides: API endpoints using EmailService and SubscriberService
provides:
  - SST Email component with SES domain identity (DKIM/SPF/DMARC)
  - SubscriberTokenSecret SST secret
  - EmailServiceLive layer using @aws-sdk/client-sesv2
  - EmailServiceAuto (auto-selects console/SES based on env)
  - SES_FROM_EMAIL env var wired in infra
affects: [03-analytics, 04-landing-page]

tech-stack:
  added: [@aws-sdk/client-sesv2]
  patterns: [EmailServiceAuto for env-based layer selection, Layer.sync for SES client init]

key-files:
  created:
    - infra/email.ts
  modified:
    - infra/secrets.ts
    - infra/web.ts
    - infra/api.ts
    - sst.config.ts
    - packages/core/src/email/email.service.ts
    - packages/core/src/email/index.ts
    - packages/env/src/server.ts
    - packages/env/src/server.test.ts
    - apps/web/src/lib/email-layers.ts

key-decisions:
  - "EmailServiceAuto selects console (dev) or SES (prod) based on SES_FROM_EMAIL env var"
  - "SES_FROM_EMAIL is optional in env schema — dev uses console email"
  - "SES domain identity uses Cloudflare DNS adapter for DKIM records"

patterns-established:
  - "EmailServiceAuto: env-based layer selection for dev/prod email"
  - "Layer.sync for services that need runtime env var access during construction"

duration: N/A (resumed from previous execution)
completed: 2026-01-27
---

# Plan 02-05: SST Email Infrastructure Summary

**SST Email component with SES/DKIM/DMARC, EmailServiceLive via @aws-sdk/client-sesv2, and auto-switching console/SES layers**

## Performance

- **Tasks:** 2 auto + 1 checkpoint (pending)
- **Files modified:** 10

## Accomplishments
- SST Email component creates SES domain identity with DKIM and DMARC
- SubscriberTokenSecret added to SST secrets
- EmailServiceLive layer wraps SES v2 client with Effect.tryPromise
- EmailServiceAuto selects console (dev) or SES (prod) based on SES_FROM_EMAIL
- SES_FROM_EMAIL env var added as optional to env schema
- All infra env vars wired in web.ts and api.ts
- email-layers.ts updated to use EmailServiceAuto

## Task Commits

1. **Task 1: SST Email infrastructure and secrets wiring** - `58a2f00` (feat)
2. **Task 2: SES live email service layer and env var additions** - `7fd9c4a` (feat)
3. **Task 3: Deploy and verify (checkpoint)** - PENDING USER ACTION

## Files Created/Modified
- `infra/email.ts` - SST Email component for gemhog.com domain
- `infra/secrets.ts` - SubscriberTokenSecret added
- `infra/web.ts` - SES_FROM_EMAIL and SUBSCRIBER_TOKEN_SECRET env vars
- `infra/api.ts` - SES_FROM_EMAIL and SUBSCRIBER_TOKEN_SECRET env vars
- `sst.config.ts` - email import added to run()
- `packages/core/src/email/email.service.ts` - EmailServiceLive and EmailServiceAuto
- `packages/core/src/email/index.ts` - New exports
- `packages/env/src/server.ts` - SES_FROM_EMAIL optional env var
- `packages/env/src/server.test.ts` - SES_FROM_EMAIL test coverage
- `apps/web/src/lib/email-layers.ts` - Uses EmailServiceAuto

## Decisions Made
- EmailServiceAuto pattern: single import auto-selects dev/prod implementation
- SES_FROM_EMAIL optional for dev (console email fallback)
- DMARC policy set to quarantine with strict DKIM/SPF alignment

## Deviations from Plan
None - plan executed as specified.

## Issues Encountered
None for auto tasks. Checkpoint (deploy + verify) pending user action.

## User Setup Required
**External services require manual configuration:**
1. Set SST secret: `pnpm sst secret set SubscriberTokenSecret $(openssl rand -base64 32)`
2. Deploy: `pnpm sst deploy --stage dev`
3. Verify SES domain identity in AWS Console
4. Test real email sending after SES verification

## Next Phase Readiness
- Email infrastructure complete (pending deployment verification)
- Ready for Phase 3 (Analytics) after checkpoint

---
*Plan: 02-05*
*Completed: 2026-01-27 (auto tasks), checkpoint pending*
