// packages/core/src/drizzle/connection.int.test.ts

import { sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

describe("database connection", () => {
  let pool: pg.Pool;
  let db: ReturnType<typeof drizzle>;

  beforeAll(() => {
    const connectionString =
      process.env.DATABASE_URL ||
      "postgresql://postgres:password@localhost:5432/gemhog";

    pool = new pg.Pool({ connectionString });
    db = drizzle(pool);
  });

  afterAll(async () => {
    await pool.end();
  });

  it("should connect and execute a query", async () => {
    const result = await db.execute(sql`SELECT 1 as value`);
    expect(result.rows[0]).toEqual({ value: 1 });
  });

  it("should return current timestamp", async () => {
    const result = await db.execute(sql`SELECT NOW() as now`);
    // biome-ignore lint/style/noNonNullAssertion: SELECT NOW() always returns one row
    const row = result.rows[0]!;
    // Raw SQL returns timestamp as string, verify it's a valid parseable date
    expect(new Date(row.now as string).getTime()).not.toBeNaN();
  });
});
