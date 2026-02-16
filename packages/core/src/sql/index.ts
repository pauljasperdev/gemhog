import * as Effect from "effect";
import { PgLive } from "./client";
import { DrizzleLive } from "./drizzle";

export const SqlLive = Effect.Layer.mergeAll(PgLive, DrizzleLive);

export { PgLive } from "./client";
export { DrizzleLive } from "./drizzle";
