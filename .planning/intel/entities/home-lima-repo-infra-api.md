---
path: /home/lima/repo/infra/api.ts
type: config
updated: 2026-01-22
status: active
---

# api.ts

## Purpose

Defines the SST AWS Lambda function configuration for the API server. Configures the serverless function with streaming, CORS settings, custom domain routing for permanent stages, and environment variables for database, auth, and AI services.

## Exports

- `api` - SST AWS Function resource for the API Lambda, configured with handler, streaming, URL routing, CORS, and environment variables
- `outputs` - Object containing the API URL output for stack references

## Dependencies

- [[infra-router]] - Imports `domain`, `domainApi`, `isPermanentStage`, `router` for routing configuration
- [[infra-secrets]] - Imports `secrets` for secure environment variable values
- `sst` - SST framework (global)

## Used By

TBD

## Notes

- Uses conditional URL configuration based on `isPermanentStage` - permanent stages get router integration with custom domain, ephemeral stages get direct function URLs
- CORS allows both production domain and localhost:3001 for local development
- Streaming is disabled for permanent stages (likely for compatibility with router)
- All sensitive values come from SST secrets, keeping credentials out of code