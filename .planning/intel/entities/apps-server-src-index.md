---
path: /home/lima/repo/apps/server/src/index.ts
type: api
updated: 2025-01-21
status: active
---

# index.ts

## Purpose

Main entry point for the Hono-based HTTP server. Configures CORS, logging, authentication routes, tRPC API endpoints, and an AI chat endpoint using the Vercel AI SDK with Google Gemini. Serves as the backend application orchestrator that ties together auth, API, and AI functionality.

## Exports

None (entry point file)

## Dependencies

- [[packages-api-src-context]] - Creates tRPC request context with session info
- [[packages-api-src-routers-index]] - Provides the main tRPC router
- [[packages-core-src-auth-index]] - Provides the auth handler for authentication routes
- [[packages-env-src-server]] - Server environment configuration for CORS and other settings
- @ai-sdk/devtools - AI SDK developer tools middleware
- @ai-sdk/google - Google Gemini model integration
- @hono/trpc-server - tRPC integration for Hono
- @hono/node-server - Node.js server adapter for Hono
- ai - Vercel AI SDK for streaming text
- hono - Web framework for routing and middleware

## Used By

TBD
