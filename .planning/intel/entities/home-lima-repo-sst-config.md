---
path: /home/lima/repo/sst.config.ts
type: config
updated: 2026-01-22
status: active
---

# sst.config.ts

## Purpose

Root SST (Serverless Stack) configuration file that defines the application deployment settings, AWS provider configuration, and orchestrates infrastructure module loading. Controls stage-specific behavior for resource retention and protection.

## Exports

- `default` - SST config object with `app()` for application settings and `run()` for infrastructure orchestration

## Dependencies

- [[infra-secrets]] - Secrets management infrastructure
- [[infra-neon]] - Neon database infrastructure
- [[infra-api]] - API infrastructure (Hono server on Lambda)
- [[infra-web]] - Web frontend infrastructure (static site)
- sst (external) - SST v3 framework

## Used By

TBD

## Notes

- Uses dynamic imports in `run()` to load infrastructure modules, allowing SST to track dependencies
- Stage-aware configuration: `prod` stage retains resources on removal and enables deletion protection
- Deploys to AWS `eu-central-1` region with Cloudflare provider enabled
- Outputs are aggregated from api and web modules for stack export visibility