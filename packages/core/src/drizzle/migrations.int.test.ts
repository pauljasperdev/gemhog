// packages/core/src/drizzle/migrations.int.test.ts
// Integration tests for migration application

import path from "node:path";
import { sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import pg from "pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

describe("database migrations", () => {
  let pool: pg.Pool;
  let db: ReturnType<typeof drizzle>;
  const migrationsFolder = path.resolve(import.meta.dirname, "../migrations");

  beforeAll(async () => {
    const connectionString =
      process.env.DATABASE_URL ||
      "postgresql://postgres:password@localhost:5432/gemhog";

    pool = new pg.Pool({ connectionString });
    db = drizzle(pool);

    // Apply migrations before tests
    await migrate(db, { migrationsFolder });
  });

  afterAll(async () => {
    await pool.end();
  });

  it("should create user, session, account, and verification tables", async () => {
    // Query information_schema to verify tables exist
    const result = await db.execute(sql`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_type = 'BASE TABLE'
        AND table_name IN ('user', 'session', 'account', 'verification')
      ORDER BY table_name
    `);

    const tableNames = result.rows.map((row) => row.table_name);

    expect(tableNames).toContain("account");
    expect(tableNames).toContain("session");
    expect(tableNames).toContain("user");
    expect(tableNames).toContain("verification");
  });

  it("should populate __drizzle_migrations tracking table", async () => {
    // Query the drizzle migrations tracking table
    // drizzle-kit creates this table in the "drizzle" schema
    const result = await db.execute(sql`
      SELECT id, hash, created_at
      FROM "drizzle"."__drizzle_migrations"
      ORDER BY created_at
    `);

    // At least one migration should be recorded
    expect(result.rows.length).toBeGreaterThanOrEqual(1);

    // First migration should have a hash (non-empty string)
    const firstMigration = result.rows[0];
    expect(firstMigration).toBeDefined();
    expect(typeof firstMigration?.hash).toBe("string");
    expect((firstMigration?.hash as string).length).toBeGreaterThan(0);
  });
});
