---
path: /home/lima/repo/infra/neon.ts
type: config
updated: 2026-01-22
status: active
---

# neon.ts

## Purpose

Creates an SST Linkable resource to expose Neon database connection URLs to other SST resources. This enables Lambda functions and other linked resources to access both direct and pooled database connections.

## Exports

- `neon` - SST Linkable resource containing database connection URLs (direct for migrations, pooled for Lambda runtime)

## Dependencies

- [[home-lima-repo-infra-secrets]] - Provides DatabaseUrl and DatabaseUrlPooler secrets
- `sst` - SST framework (global, external)

## Used By

TBD

## Notes

- Neon is an external managed database, not provisioned by SST
- Two connection URLs are exposed: `url` for direct connections (migrations) and `urlPooler` for connection pooling (Lambda runtime)
- Resources that link to this Linkable will receive these properties via SST's resource linking mechanism