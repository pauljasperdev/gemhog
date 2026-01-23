---
path: /home/lima/repo/apps/server/src/lambda.ts
type: api
updated: 2026-01-22
status: active
---

# lambda.ts

## Purpose

AWS Lambda entry point that wraps the Hono application for serverless deployment. Conditionally uses streaming or standard handler based on environment (SST dev vs production).

## Exports

- `handler` - Lambda handler function that conditionally uses `handle()` in SST dev mode or `streamHandle()` in production for AI streaming responses

## Dependencies

- `hono/aws-lambda` - AWS Lambda adapter for Hono framework
- [[home-lima-repo-apps-server-src-app]] - Shared Hono application instance

## Used By

TBD

## Notes

- `SST_DEV` environment variable determines handler type - set during local Lambda emulation
- Streaming (`streamHandle`) is used in production for AI streaming responses but not supported in SST dev mode
- This separation enables the same app code to work in both local development and production Lambda