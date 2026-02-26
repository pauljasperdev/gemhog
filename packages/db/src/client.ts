import { PgClient } from "@effect/sql-pg";
import "@gemhog/env/server";
import * as Effect from "effect";

export const PgLive = PgClient.layerConfig({
  url: Effect.Config.redacted("DATABASE_URL_POOLER"),
});
