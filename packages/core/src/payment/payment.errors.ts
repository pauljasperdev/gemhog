import { Data } from "effect";

export class PaymentError extends Data.TaggedError("PaymentError")<{
  message: string;
  cause?: unknown;
}> {}

export class CheckoutError extends Data.TaggedError("CheckoutError")<{
  message: string;
  productId?: string;
}> {}

export class SubscriptionError extends Data.TaggedError("SubscriptionError")<{
  message: string;
  customerId?: string;
}> {}
