---
path: /home/lima/repo/infra/router.ts
type: config
updated: 2026-01-22
status: active
---

# router.ts

## Purpose

Configures domain routing for the SST infrastructure based on deployment stage. Defines base domain, stage-specific subdomains, and creates an API router for permanent stages using Cloudflare DNS.

## Exports

- `isPermanentStage` - Re-exported from utils; boolean indicating if current stage is permanent (prod/dev)
- `baseDomain` - Base domain constant: "gemhog.com"
- `domain` - Stage-specific domain: bare domain for prod, `{stage}.gemhog.com` for permanent stages, `{stage}.dev.gemhog.com` for ephemeral
- `domainApi` - Stage-specific API domain: `api.gemhog.com` for prod, `api.{stage}.gemhog.com` for permanent, `api.{stage}.dev.gemhog.com` for ephemeral
- `router` - SST Router resource for permanent stages with Cloudflare DNS configuration; undefined for ephemeral stages

## Dependencies

- [[infra-utils]] (isPermanentStage)
- sst (external - SST framework globals)

## Used By

TBD

## Notes

- Router is only created for permanent stages to avoid unnecessary DNS records for ephemeral/PR deployments
- Requires `CLOUDFLARE_ZONE_ID` environment variable for DNS configuration
- Uses SST's `$app.stage` global to determine deployment context