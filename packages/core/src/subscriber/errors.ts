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

export class SubscriberRepositoryError extends Effect.Data.TaggedError(
  "SubscriberRepositoryError",
)<{
  cause: unknown;
}> {}

export class SubscriberServiceError extends Effect.Data.TaggedError(
  "SubscriberServiceError",
)<{
  cause: unknown;
}> {}
