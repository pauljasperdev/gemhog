---
path: /home/lima/repo/packages/core/src/payment/payment.errors.ts
type: model
updated: 2025-01-21
status: active
---

# payment.errors.ts

## Purpose

Typed error definitions for payment operations using Effect's tagged error pattern. Defines structured errors for general payment failures, checkout issues, and subscription problems. Enables pattern matching on payment errors in Effect pipelines.

## Exports

- `PaymentError` - General payment error with message and optional cause
- `CheckoutError` - Checkout-specific error with message and optional productId
- `SubscriptionError` - Subscription-specific error with message and optional customerId

## Dependencies

- effect - Data.TaggedError for typed error construction

## Used By

TBD
