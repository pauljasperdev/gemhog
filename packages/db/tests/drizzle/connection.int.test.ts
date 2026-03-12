import { SqlClient } from "@effect/sql";
import { expect, layer } from "@effect/vitest";
import { PgIntegrationLive } from "@gemhog/db";
import { ConfigLayerTest } from "@gemhog/env/test";
import * as Effect from "effect";
import { describe } from "vitest";

describe("database connection", () => {
  layer(PgIntegrationLive.pipe(Effect.Layer.provide(ConfigLayerTest)))(
    "Effect layer",
    (it) => {
      it.effect("should connect and execute query", () =>
        Effect.Effect.gen(function* () {
          const sql = yield* SqlClient.SqlClient;
          const result = yield* sql`SELECT 1 as value`;
          expect(result[0]?.value).toBe(1);
        }),
      );

      it.effect("should return current timestamp", () =>
        Effect.Effect.gen(function* () {
          const sql = yield* SqlClient.SqlClient;
          const result = yield* sql`SELECT NOW() as now`;
          // @effect/sql-pg parses timestamp to Date
          expect(result[0]?.now).toBeInstanceOf(Date);
        }),
      );
    },
  );
});
