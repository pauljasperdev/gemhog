import { PgClient } from "@effect/sql-pg";
import { Config } from "effect";

// PostgreSQL connection layer - reads DATABASE_URL at construction time
export const PgLive = PgClient.layerConfig({
  url: Config.redacted("DATABASE_URL"),
});
