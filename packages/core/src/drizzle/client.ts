import { PgClient } from "@effect/sql-pg";
import { env } from "@gemhog/env";
import { Redacted } from "effect";

// PostgreSQL connection layer - reads DATABASE_URL at construction time
export const PgLive = PgClient.layer({
  url: Redacted.make(env.server.DATABASE_URL),
});
