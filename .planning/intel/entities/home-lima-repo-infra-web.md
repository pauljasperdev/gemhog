---
path: /home/lima/repo/infra/web.ts
type: config
updated: 2026-01-22
status: active
---

# web.ts

## Purpose

Configures the Next.js frontend deployment using SST's AWS Nextjs component. Handles domain configuration for permanent stages (production/staging) with Cloudflare DNS and injects environment variables for API connectivity, authentication, and database access.

## Exports

- `web` - SST AWS Nextjs component instance configured for the apps/web directory with conditional domain setup and environment variables
- `outputs` - Object containing `webUrl` for exposing the deployed web application URL

## Dependencies

- [[infra-api]] - Imports `api` for the API URL reference
- [[infra-router]] - Imports `domain`, `domainApi`, and `isPermanentStage` for routing configuration
- [[infra-secrets]] - Imports `secrets` for database URL and auth secrets
- `sst` (external) - SST framework for AWS Nextjs component and Cloudflare DNS

## Used By

TBD

## Notes

- Uses conditional spreading to only apply domain configuration for permanent stages (production/staging)
- Environment variables include both public (`NEXT_PUBLIC_*`) and server-side secrets
- Relies on `CLOUDFLARE_ZONE_ID` environment variable for DNS configuration
- The `isPermanentStage` check determines whether to use custom domains or default SST-generated URLs