import * as Effect from "effect";

export class PodScanError extends Effect.Data.TaggedError("PodScanError")<{
  readonly cause: unknown;
}> {}
