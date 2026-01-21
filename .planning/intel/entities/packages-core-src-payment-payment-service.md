---
path: /home/lima/repo/packages/core/src/payment/payment.service.ts
type: service
updated: 2025-01-21
status: active
---

# payment.service.ts

## Purpose

Payment service wrapping the Polar SDK for subscription and checkout handling. Defines an Effect-based PaymentService interface, creates the Polar client with deferred environment access, and provides both Effect layers and backward-compatible proxy exports for direct client access.

## Exports

- `PaymentService` - Effect Context tag for dependency injection
- `PaymentLive` - Effect Layer providing live Polar client
- `getPolarClient()` - Lazy getter for Polar SDK instance
- `polarClient` - Proxy for backward compatibility with direct SDK access

## Dependencies

- [[packages-env-src-server]] - Environment configuration (dynamic import)
- @polar-sh/sdk - Polar payment platform SDK
- effect - Context and Layer for DI

## Used By

TBD

## Notes

Uses dynamic require to defer env validation, configured for Polar sandbox environment.
