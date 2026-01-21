---
path: /home/lima/repo/packages/core/src/payment/index.ts
type: module
updated: 2025-01-21
status: active
---

# index.ts

## Purpose

Public API barrel file for the payment domain. Re-exports payment-related errors, test mocks, and the PaymentService with its Effect layer. Provides clean import paths for consumers while encapsulating the Polar SDK integration details.

## Exports

- `PaymentError`, `CheckoutError`, `SubscriptionError` - Payment error types
- `PaymentServiceTest` - Test mock layer
- `getPolarClient`, `PaymentLive`, `PaymentService`, `polarClient` - Service and client exports

## Dependencies

- [[packages-core-src-payment-payment-errors]] - Error type definitions
- [[packages-core-src-payment-payment-service]] - Service implementation

## Used By

TBD

## Notes

payment.mock.ts exists but was not in the file list to analyze.
