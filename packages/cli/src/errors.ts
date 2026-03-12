import * as Effect from "effect";

export class CliError extends Effect.Data.TaggedError("CliError")<{
  readonly cause: unknown;
}> {}

export class RpcConnectionError extends Effect.Data.TaggedError(
  "RpcConnectionError",
)<{
  serverUrl: string;
  readonly cause: unknown;
}> {}
