/**
 * Integration tests for EntityRepository against a real PostgreSQL database.
 *
 * Tests verify:
 * - Entity creation and retrieval
 * - Alias creation and lookup
 * - Exact match semantics (no substring matching)
 * - Fuzzy search with alias-inclusive matching
 *
 * Run with: npx vitest run --config ../../vitest.integration.config.ts
 * Requires: Docker test DB running on localhost:5433
 */
import { SqlLive } from "@gemhog/db";
import { entity, entityAlias } from "@gemhog/db/entity";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import * as Effect from "effect";
import { ConfigProvider, Layer } from "effect";
import { Pool } from "pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { EntityRepository } from "../src/repository";
import { EntityRepositoryLive } from "../src/repository.live";

// Use ConfigLayerTest with SST_STAGE=test added for layer selection
const testConfigMap = new Map<string, string>([
  ["DATABASE_URL", "postgresql://postgres:password@localhost:5433/gemhog_test"],
  [
    "DATABASE_URL_POOLER",
    "postgresql://postgres:password@localhost:5433/gemhog_test",
  ],
  ["SST_STAGE", "test"],
]);

const TestConfigLayer = Layer.setConfigProvider(
  ConfigProvider.fromMap(testConfigMap),
);

// Entity repository layer with test DB
const EntityRepositoryLayerTest = EntityRepositoryLive.pipe(
  Layer.provide(SqlLive),
  Layer.provide(TestConfigLayer),
);

describe("entity repository integration", () => {
  // Direct drizzle connection for cleanup
  let pool: Pool;
  let db: ReturnType<typeof drizzle>;

  // Test entity data
  let testEntityId: string;
  const TEST_ENTITY_NAME = `Integration Test Entity ${Date.now()}`;
  const TEST_ALIAS = `test-alias-${Date.now()}`;

  beforeAll(async () => {
    // Create direct DB connection for cleanup operations
    pool = new Pool({
      connectionString:
        "postgresql://postgres:password@localhost:5433/gemhog_test",
    });
    db = drizzle(pool);

    // Create test entity using the repository layer
    const createdEntity = await Effect.Effect.runPromise(
      Effect.Effect.gen(function* () {
        const repo = yield* EntityRepository;
        return yield* repo.createEntity({
          canonical_name: TEST_ENTITY_NAME,
          type: "company",
          ticker: `INT${Date.now()}`,
          description: "Integration test entity",
        });
      }).pipe(Effect.Effect.provide(EntityRepositoryLayerTest)),
    );

    testEntityId = createdEntity.id;

    // Create an alias for fuzzy search testing
    await Effect.Effect.runPromise(
      Effect.Effect.gen(function* () {
        const repo = yield* EntityRepository;
        return yield* repo.createAlias({
          entity_id: testEntityId,
          alias: TEST_ALIAS,
          alias_type: "colloquial",
          source: "integration-test",
        });
      }).pipe(Effect.Effect.provide(EntityRepositoryLayerTest)),
    );
  });

  afterAll(async () => {
    // Clean up test data using direct drizzle queries
    if (testEntityId) {
      // Delete aliases first (foreign key constraint)
      await db
        .delete(entityAlias)
        .where(eq(entityAlias.entityId, testEntityId));
      // Delete the entity
      await db.delete(entity).where(eq(entity.id, testEntityId));
    }
    await pool.end();
  });

  describe("createEntity", () => {
    it("creates an entity that can be retrieved by ID", async () => {
      const result = await Effect.Effect.runPromise(
        Effect.Effect.gen(function* () {
          const repo = yield* EntityRepository;
          return yield* repo.readEntityById(testEntityId);
        }).pipe(Effect.Effect.provide(EntityRepositoryLayerTest)),
      );

      expect(result.id).toBe(testEntityId);
      expect(result.canonical_name).toBe(TEST_ENTITY_NAME);
      expect(result.type).toBe("company");
    });
  });

  describe("createAlias", () => {
    it("creates an alias that can be found by findEntityByAlias", async () => {
      const result = await Effect.Effect.runPromise(
        Effect.Effect.gen(function* () {
          const repo = yield* EntityRepository;
          return yield* repo.findEntityByAlias(TEST_ALIAS);
        }).pipe(Effect.Effect.provide(EntityRepositoryLayerTest)),
      );

      expect(result).not.toBeNull();
      expect(result?.id).toBe(testEntityId);
      expect(result?.canonical_name).toBe(TEST_ENTITY_NAME);
    });

    it("returns null for unknown alias", async () => {
      const result = await Effect.Effect.runPromise(
        Effect.Effect.gen(function* () {
          const repo = yield* EntityRepository;
          return yield* repo.findEntityByAlias("nonexistent-alias-xyz");
        }).pipe(Effect.Effect.provide(EntityRepositoryLayerTest)),
      );

      expect(result).toBeNull();
    });
  });

  describe("searchEntitiesByName (exact match)", () => {
    it("returns entity for exact canonical name match (case-insensitive)", async () => {
      const result = await Effect.Effect.runPromise(
        Effect.Effect.gen(function* () {
          const repo = yield* EntityRepository;
          return yield* repo.searchEntitiesByName(TEST_ENTITY_NAME);
        }).pipe(Effect.Effect.provide(EntityRepositoryLayerTest)),
      );

      expect(result).toHaveLength(1);
      expect(result[0]?.id).toBe(testEntityId);
    });

    it("returns entity for exact match with different case", async () => {
      const result = await Effect.Effect.runPromise(
        Effect.Effect.gen(function* () {
          const repo = yield* EntityRepository;
          return yield* repo.searchEntitiesByName(
            TEST_ENTITY_NAME.toUpperCase(),
          );
        }).pipe(Effect.Effect.provide(EntityRepositoryLayerTest)),
      );

      expect(result).toHaveLength(1);
      expect(result[0]?.id).toBe(testEntityId);
    });

    it("returns empty array for substring (no longer matches)", async () => {
      // Extract first few words as substring
      const substring = TEST_ENTITY_NAME.split(" ").slice(0, 2).join(" ");

      const result = await Effect.Effect.runPromise(
        Effect.Effect.gen(function* () {
          const repo = yield* EntityRepository;
          return yield* repo.searchEntitiesByName(substring);
        }).pipe(Effect.Effect.provide(EntityRepositoryLayerTest)),
      );

      // Substring should NOT match with exact semantics
      expect(result).toHaveLength(0);
    });

    it("returns empty array for non-matching query", async () => {
      const result = await Effect.Effect.runPromise(
        Effect.Effect.gen(function* () {
          const repo = yield* EntityRepository;
          return yield* repo.searchEntitiesByName(
            "Completely Nonexistent Company XYZ",
          );
        }).pipe(Effect.Effect.provide(EntityRepositoryLayerTest)),
      );

      expect(result).toHaveLength(0);
    });
  });

  // pg_trgm extension is enabled via migration 0009_enable_pg_trgm.sql
  describe("searchEntitiesFuzzy (alias-inclusive)", () => {
    it("returns entity when query fuzzy-matches canonical name", async () => {
      // Use the full canonical name for a high similarity score
      const result = await Effect.Effect.runPromise(
        Effect.Effect.gen(function* () {
          const repo = yield* EntityRepository;
          return yield* repo.searchEntitiesFuzzy(TEST_ENTITY_NAME, 0.3);
        }).pipe(Effect.Effect.provide(EntityRepositoryLayerTest)),
      );

      // Should match with high similarity
      const match = result.find((r) => r.entity.id === testEntityId);
      expect(match).toBeDefined();
      expect(match?.score).toBeGreaterThan(0.3);
    });

    it("returns entity when query fuzzy-matches alias", async () => {
      // Search for something similar to the alias
      const result = await Effect.Effect.runPromise(
        Effect.Effect.gen(function* () {
          const repo = yield* EntityRepository;
          // Use the alias (or slight variation) with low threshold
          return yield* repo.searchEntitiesFuzzy(TEST_ALIAS, 0.3);
        }).pipe(Effect.Effect.provide(EntityRepositoryLayerTest)),
      );

      // Should match via alias
      const match = result.find((r) => r.entity.id === testEntityId);
      expect(match).toBeDefined();
      expect(match?.entity.canonical_name).toBe(TEST_ENTITY_NAME);
    });

    it("returns empty array when nothing matches above threshold", async () => {
      const result = await Effect.Effect.runPromise(
        Effect.Effect.gen(function* () {
          const repo = yield* EntityRepository;
          // Use a very high threshold that nothing can match
          return yield* repo.searchEntitiesFuzzy("xyz123abc", 0.99);
        }).pipe(Effect.Effect.provide(EntityRepositoryLayerTest)),
      );

      expect(result).toHaveLength(0);
    });
  });
});
