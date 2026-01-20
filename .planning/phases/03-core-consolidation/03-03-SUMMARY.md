---
phase: 03-core-consolidation
plan: 03
subsystem: core-payment
tags: [effect, payment, polar, dependency-injection]
dependency-graph:
  requires: ["03-01"]
  provides: ["payment-domain", "payment-service-layer", "polar-client-access"]
  affects: ["packages/auth", "apps/server"]
tech-stack:
  added: []
  patterns: ["Effect Context.Tag", "Effect Layer", "lazy-env-validation", "Proxy-for-backward-compatibility"]
key-files:
  created:
    - packages/core/src/payment/payment.service.ts
    - packages/core/src/payment/payment.errors.ts
    - packages/core/src/payment/payment.mock.ts
    - packages/core/src/payment/payment.test.ts
    - packages/core/src/payment/index.ts
  modified: []
decisions:
  - id: defer-env-validation
    choice: "Use require() to defer env validation"
    rationale: "Allows unit tests to run without env vars by deferring validation to runtime"
    alternatives: ["mock env module", "skip env in tests"]
  - id: proxy-for-backward-compat
    choice: "Use Proxy for polarClient export"
    rationale: "Maintains backward compatibility with existing imports while deferring client creation"
    alternatives: ["remove polarClient export", "always lazy getter"]
metrics:
  duration: 4 min
  completed: 2026-01-20
---

# Phase 3 Plan 3: Payment Domain Migration Summary

**PaymentService Effect Layer wrapping Polar SDK with testable mock layer**

## What Was Built

### Payment Service Layer
- `PaymentService` Context.Tag for Effect dependency injection
- `PaymentLive` layer that creates Polar client at runtime
- Deferred env validation via `require()` to enable unit testing
- `getPolarClient()` lazy getter for backward compatibility
- `polarClient` Proxy export for seamless migration

### Payment Errors
- `PaymentError` - general payment errors
- `CheckoutError` - checkout-specific errors with productId
- `SubscriptionError` - subscription errors with customerId

### Mock Layer
- `PaymentServiceTest` layer for unit testing
- Mock Polar client that can be extended with test methods

### Public API
```typescript
// packages/core/src/payment/index.ts exports:
export { PaymentService, PaymentLive, getPolarClient, polarClient } from "./payment.service";
export { PaymentServiceTest } from "./payment.mock";
export * from "./payment.errors";
```

## Key Implementation Details

### Deferred Environment Validation
The payment service uses `require()` instead of static import for `@gemhog/env/server`:
```typescript
const createPolarClient = () => {
  const { env } = require("@gemhog/env/server") as typeof import("@gemhog/env/server");
  return new Polar({ accessToken: env.POLAR_ACCESS_TOKEN, server: "sandbox" });
};
```
This allows unit tests to import the module without triggering env validation.

### Backward Compatibility
The `polarClient` export uses a Proxy to lazily create the client on first property access:
```typescript
export const polarClient = new Proxy({} as Polar, {
  get(_target, prop) {
    return (getPolarClient() as unknown as Record<string | symbol, unknown>)[prop];
  },
});
```

## Commits

| Commit | Description |
|--------|-------------|
| 67b8d96 | feat(03-03): create PaymentService with Effect Layer |
| 2b2b160 | feat(03-03): add payment mock layer and public API |

## Verification Results

- Unit test passes (PaymentService via mock)
- Type check passes
- All files created in packages/core/src/payment/

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Env validation at import time**
- **Found during:** Task 1/2
- **Issue:** Importing `@gemhog/env/server` triggers immediate validation, failing unit tests
- **Fix:** Changed to `require()` for deferred validation
- **Files modified:** packages/core/src/payment/payment.service.ts

**2. [Rule 1 - Bug] TypeScript error on Proxy type cast**
- **Found during:** Task 2
- **Issue:** `as Record<string | symbol, unknown>` failed TS strict type checking
- **Fix:** Added intermediate `as unknown` cast
- **Files modified:** packages/core/src/payment/payment.service.ts

## Decisions Made

| Decision | Rationale | Plan |
|----------|-----------|------|
| Use require() for deferred env validation | Allows unit tests without env vars | 03-03 |
| Use Proxy for backward-compatible polarClient | Seamless migration for existing code | 03-03 |
| Add getPolarClient() as explicit lazy getter | Clearer API than Proxy for new code | 03-03 |

## Next Phase Readiness

The payment domain is ready. Next steps:
- Auth domain can import `polarClient` from `@gemhog/core/payment`
- Consumer code can migrate to `getPolarClient()` or use Effect `PaymentService`
