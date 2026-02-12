// packages/core/src/drizzle/connection.int.test.ts

import { SqlClient } from "@effect/sql";
import { PgClient } from "@effect/sql-pg";
import { expect, layer } from "@effect/vitest";
import { Effect, Redacted } from "effect";
import { describe } from "vitest";

// Test layer with explicit URL (bypasses Config.redacted)
// Uses PgClient.layer() instead of PgClient.layerConfig() for test isolation
const TestPgLive = PgClient.layer({
  url: Redacted.make(
    process.env.DATABASE_URL ??
      "postgresql://postgres:password@localhost:5432/gemhog",
  ),
});

describe("database connection", () => {
  layer(TestPgLive)("Effect layer", (it) => {
    it.effect("should connect and execute query", () =>
      Effect.gen(function* () {
        const sql = yield* SqlClient.SqlClient;
        const result = yield* sql`SELECT 1 as value`;
        expect(result[0]?.value).toBe(1);
      }),
    );

    it.effect("should return current timestamp", () =>
      Effect.gen(function* () {
        const sql = yield* SqlClient.SqlClient;
        const result = yield* sql`SELECT NOW() as now`;
        // @effect/sql-pg parses timestamp to Date
        expect(result[0]?.now).toBeInstanceOf(Date);
      }),
    );
  });
});
