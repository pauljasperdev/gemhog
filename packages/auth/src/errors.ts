import * as Effect from "effect";

export class AuthError extends Effect.Data.TaggedError("AuthError")<{
  message: string;
  cause?: unknown;
}> {}

export class SessionNotFoundError extends Effect.Data.TaggedError(
  "SessionNotFoundError",
)<{
  token?: string;
}> {}

export class SessionExpiredError extends Effect.Data.TaggedError(
  "SessionExpiredError",
)<{
  sessionId: string;
  expiredAt: Date;
}> {}

export class UnauthorizedError extends Effect.Data.TaggedError(
  "UnauthorizedError",
)<{
  message: string;
}> {}
