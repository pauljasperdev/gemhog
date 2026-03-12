// Phase 1 Bootstrap: Migration Application Test Suite
// This suite is the canonical first phase of the unified integration test lifecycle.
// It starts from a blank compose-backed Postgres DB (started by integration.sh),
// applies all migrations programmatically, verifies the migrated schema,
// and intentionally leaves the schema in place for Phase 2 consumer suites.

import path from "node:path";
import { ConfigLayerTest } from "@gemhog/env/test";
import { sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { Config, Effect } from "effect";
import pg from "pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

describe("[Phase 1 Bootstrap] database migrations", () => {
  let pool: pg.Pool;
  let db: ReturnType<typeof drizzle>;
  const migrationsFolder = path.resolve(
    import.meta.dirname,
    "../../migrations",
  );

  beforeAll(async () => {
    // Read DATABASE_URL from ConfigLayerTest
    const connectionString = await Effect.runPromise(
      Config.string("DATABASE_URL").pipe(Effect.provide(ConfigLayerTest)),
    );

    pool = new pg.Pool({ connectionString });
    db = drizzle(pool);

    // Phase 1: Apply migrations to blank DB, leave schema in place for Phase 2 consumer suites
    await migrate(db, { migrationsFolder });
  }, 60000);

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

  it("should have podscan_podcast and podscan_episode tables (not old episode/podcast)", async () => {
    const result = await db.execute(sql`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_name IN ('podcast', 'episode', 'podscan_podcast', 'podscan_episode')
      ORDER BY table_name
    `);
    const tableNames = result.rows.map((r) => r.table_name);

    // Old tables must NOT exist
    expect(tableNames).not.toContain("podcast");
    expect(tableNames).not.toContain("episode");

    // New tables MUST exist
    expect(tableNames).toContain("podscan_podcast");
    expect(tableNames).toContain("podscan_episode");
  });

  it("should have unique constraints on podscan_podcast_id and podscan_episode_id", async () => {
    const result = await db.execute(sql`
      SELECT tc.table_name, tc.constraint_name, tc.constraint_type
      FROM information_schema.table_constraints tc
      WHERE tc.table_schema = 'public'
        AND tc.table_name IN ('podscan_podcast', 'podscan_episode')
        AND tc.constraint_type = 'UNIQUE'
      ORDER BY tc.constraint_name
    `);
    const constraintNames = result.rows.map((r) => r.constraint_name);

    expect(constraintNames).toContain(
      "podscan_podcast_podscan_podcast_id_unique",
    );
    expect(constraintNames).toContain(
      "podscan_episode_podscan_episode_id_unique",
    );
  });

  it("should have FK from podscan_episode.podcast_id to podscan_podcast.id", async () => {
    const result = await db.execute(sql`
      SELECT tc.constraint_name
      FROM information_schema.table_constraints tc
      WHERE tc.table_schema = 'public'
        AND tc.table_name = 'podscan_episode'
        AND tc.constraint_type = 'FOREIGN KEY'
    `);
    const fkNames = result.rows.map((r) => r.constraint_name);

    expect(fkNames).toContain(
      "podscan_episode_podcast_id_podscan_podcast_id_fk",
    );
  });

  it("should have supporting indexes for Podscan ID lookups", async () => {
    const result = await db.execute(sql`
      SELECT indexname
      FROM pg_indexes
      WHERE schemaname = 'public'
        AND tablename IN ('podscan_podcast', 'podscan_episode')
      ORDER BY indexname
    `);
    const indexNames = result.rows.map((r) => r.indexname);

    expect(indexNames).toContain("podscan_podcast_podscan_podcast_id_idx");
    expect(indexNames).toContain("podscan_episode_podcast_id_idx");
    expect(indexNames).toContain("podscan_episode_podscan_episode_id_idx");
  });
});
