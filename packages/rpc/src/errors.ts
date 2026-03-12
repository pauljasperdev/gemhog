import * as Effect from "effect";

export class RpcError extends Effect.Data.TaggedError("RpcError")<{
  readonly cause: unknown;
}> {}
