import { Data } from "effect";

export class EmailSendError extends Data.TaggedError("EmailSendError")<{
  message: string;
  cause?: unknown;
}> {}

export class SubscriberError extends Data.TaggedError("SubscriberError")<{
  message: string;
  cause?: unknown;
}> {}

export class SubscriberNotFoundError extends Data.TaggedError(
  "SubscriberNotFoundError",
)<{
  email: string;
}> {}

export class InvalidTokenError extends Data.TaggedError("InvalidTokenError")<{
  reason: "expired" | "invalid_signature" | "malformed";
}> {}
