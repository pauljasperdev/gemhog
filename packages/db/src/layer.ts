import * as PgDrizzle from "@effect/sql-drizzle/Pg";
import { PgClient } from "@effect/sql-pg";
import * as Effect from "effect";
import { PgLive } from "./client";
import { DrizzleLive } from "./drizzle";

export const SqlLive = Effect.Layer.mergeAll(PgLive, DrizzleLive);

export const PgIntegrationLive = PgClient.layerConfig({
  url: Effect.Config.redacted("DATABASE_URL"),
});

export const DrizzleIntegrationLive = PgDrizzle.layer.pipe(
  Effect.Layer.provide(PgIntegrationLive),
);
