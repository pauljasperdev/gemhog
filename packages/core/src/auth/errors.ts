import { Data } from "effect";

export class AuthError extends Data.TaggedError("AuthError")<{
  message: string;
  cause?: unknown;
}> {}

export class SessionNotFoundError extends Data.TaggedError(
  "SessionNotFoundError",
)<{
  token?: string;
}> {}

export class SessionExpiredError extends Data.TaggedError(
  "SessionExpiredError",
)<{
  sessionId: string;
  expiredAt: Date;
}> {}

export class UnauthorizedError extends Data.TaggedError("UnauthorizedError")<{
  message: string;
}> {}
