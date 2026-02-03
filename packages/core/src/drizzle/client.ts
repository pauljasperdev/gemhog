import { PgClient } from "@effect/sql-pg";
import "@gemhog/env/server";
import { Redacted } from "effect";

// PostgreSQL connection layer - reads DATABASE_URL at construction time
export const PgLive = PgClient.layer({
  url: Redacted.make(process.env.DATABASE_URL ?? ""),
});
