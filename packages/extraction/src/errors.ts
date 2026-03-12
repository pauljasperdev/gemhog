import * as Effect from "effect";

export class ExtractionError extends Effect.Data.TaggedError(
  "ExtractionError",
)<{
  readonly cause: unknown;
}> {}

export class ValidationError extends Effect.Data.TaggedError(
  "ValidationError",
)<{
  readonly cause: unknown;
}> {}

export class TokenLimitError extends Effect.Data.TaggedError(
  "TokenLimitError",
)<{
  tokenCount: number;
  limit: number;
}> {}

export class EmptyTranscriptError extends Effect.Data.TaggedError(
  "EmptyTranscriptError",
)<{
  episodeId: string;
}> {}
