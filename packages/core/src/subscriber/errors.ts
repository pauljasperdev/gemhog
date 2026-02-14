import * as Effect from "effect";

export class SubscriberNotFoundError extends Effect.Data.TaggedError(
  "SubscriberNotFoundError",
)<{
  identifier: string;
}> {}

export class InvalidTokenError extends Effect.Data.TaggedError(
  "InvalidTokenError",
)<{
  reason: "expired" | "invalid_signature" | "malformed";
}> {}
