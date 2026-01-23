---
path: /home/lima/repo/apps/server/src/app.ts
type: api
updated: 2026-01-22
status: active
---

# app.ts

## Purpose

Main Hono server application that configures middleware, authentication, tRPC integration, and AI chat endpoints. Serves as the HTTP entry point for the backend API with rate limiting, CORS, and streaming AI responses via Google's Gemini model.

## Exports

- `app` - Configured Hono application instance with all routes and middleware

## Dependencies

- [[gemhog-api-context]] - `createContext` for tRPC context creation
- [[gemhog-api-routers-index]] - `appRouter` for tRPC router
- [[gemhog-core-auth]] - `auth` for authentication handler
- [[gemhog-env-server]] - `env` for server environment variables
- `@ai-sdk/devtools` - AI SDK development tools middleware
- `@ai-sdk/google` - Google Gemini model provider
- `@hono/trpc-server` - tRPC integration for Hono
- `ai` - Vercel AI SDK for streaming text generation
- `hono` - Web framework
- `hono/cors` - CORS middleware
- `hono/logger` - Request logging middleware
- `zod` - Schema validation

## Used By

TBD

## Notes

- Uses in-memory rate limiting (10 requests/minute per IP) - needs Redis for multi-server deployments
- AI chat endpoint validates messages with Zod schemas including 10KB text limit and 50 message max
- Wraps Google Gemini model with devToolsMiddleware for debugging
- Streaming responses use AI SDK v6 UIMessage format with parts-based structure