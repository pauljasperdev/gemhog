import { PgClient } from "@effect/sql-pg";
import "@gemhog/env/server";
import * as Effect from "effect";

// PostgreSQL connection layer - reads DATABASE_URL at construction time
export const PgLive = PgClient.layer({
  url: Effect.Redacted.make(process.env.DATABASE_URL ?? ""),
});
