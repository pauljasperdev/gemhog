---
path: /home/lima/repo/apps/server/src/index.ts
type: api
updated: 2026-01-21
status: active
---

# index.ts

## Purpose

Main entry point for the Hono-based HTTP server that provides REST API endpoints, tRPC integration, and AI chat functionality. Configures middleware (CORS, logging), authentication routes, and starts the server on port 3000.

## Exports

None

## Dependencies

- @ai-sdk/devtools (AI SDK development tools middleware)
- @ai-sdk/google (Google Gemini model provider)
- [[gemhog-api-context]] (tRPC context creation)
- [[gemhog-api-routers-index]] (tRPC app router)
- [[gemhog-core-auth]] (Better Auth handler)
- [[gemhog-env-server]] (Server environment variables)
- @hono/trpc-server (tRPC-Hono integration)
- @hono/node-server (Node.js server adapter)
- ai (Vercel AI SDK for streaming)
- hono (Web framework)
- zod (Schema validation)

## Used By

TBD

## Notes

- Implements in-memory rate limiting (10 req/min per identifier) with cleanup interval - needs Redis for multi-server production deployments
- AI request validation schemas defined but not currently applied to the `/ai` endpoint (SEC-001/SEC-002 fixes prepared but unused)
- CORS origin configured via `env.CORS_ORIGIN` environment variable
- Server listens on hardcoded port 3000
- Auth routes mounted at `/api/auth/*`, tRPC at `/trpc/*`, AI streaming at `/ai`