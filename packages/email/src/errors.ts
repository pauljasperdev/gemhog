import * as Effect from "effect";

export class EmailSendError extends Effect.Data.TaggedError("EmailSendError")<{
  message: string;
  cause?: unknown;
}> {}

export class CodeBuildNotificationParseError extends Effect.Data.TaggedError(
  "CodeBuildNotificationParseError",
)<{
  message: string;
  cause?: unknown;
}> {}
