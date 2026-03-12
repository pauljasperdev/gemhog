import { Data } from "effect";

export class AiAuthError extends Data.TaggedError("AiAuthError")<{
  readonly cause: string;
}> {}
