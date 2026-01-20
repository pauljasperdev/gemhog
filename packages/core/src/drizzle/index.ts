import * as PgDrizzle from "@effect/sql-drizzle/Pg";
import { Layer } from "effect";
import { PgLive } from "./client";

// Drizzle layer composed on top of PgClient
export const DrizzleLive = PgDrizzle.layer.pipe(Layer.provide(PgLive));

// Combined database layer for app composition
export const DatabaseLive = Layer.mergeAll(PgLive, DrizzleLive);

// Re-export client for direct access
export { PgLive } from "./client";
export * from "./errors";
