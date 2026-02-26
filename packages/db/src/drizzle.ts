import * as PgDrizzle from "@effect/sql-drizzle/Pg";
import * as Effect from "effect";
import { PgLive } from "./client";

export const DrizzleLive = PgDrizzle.layer.pipe(Effect.Layer.provide(PgLive));
