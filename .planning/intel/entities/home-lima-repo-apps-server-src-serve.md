---
path: /home/lima/repo/apps/server/src/serve.ts
type: config
updated: 2026-01-22
status: active
---

# serve.ts

## Purpose

Local development server entrypoint that runs the Hono application using the Node.js HTTP adapter. Starts the server on port 3000 for local development and testing.

## Exports

None

## Dependencies

- [[apps-server-src-app]] - Hono application instance
- @hono/node-server - Node.js HTTP server adapter for Hono

## Used By

TBD

## Notes

- This file is used for local development only; Lambda deployments use `lambda.ts` instead
- The console.log callback is currently empty (placeholder for startup message)