import * as Effect from "effect";

// ServerLive composes all service layers for the Lambda HTTP handler.
// Phase 0: empty placeholder — no services registered yet.
// Phase 3: will merge layers from @gemhog/rpc, @gemhog/db, @gemhog/telemetry.
//   Example: Layer.mergeAll(RpcHandlerLive, DatabaseLive, TelemetryLive)

export const ServerLive = Effect.Layer.empty;
