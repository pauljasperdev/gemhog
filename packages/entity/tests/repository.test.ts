import * as Effect from "effect";
import { Exit, Layer } from "effect";
import { describe, expect, it } from "vitest";
import { EntityNotFoundError } from "../src/errors.js";
import { EntityRepository } from "../src/repository.js";
import type { EntityAliasResponse, EntityResponse } from "../src/schema.js";

// Mock entity fixtures
const MOCK_ENTITY: EntityResponse = {
  id: "ent_test_123",
  canonical_name: "NVIDIA Corporation",
  type: "company",
  figi: "BBG000BBJQV0",
  wikidata_qid: null,
  ticker: "NVDA",
  exchange: "XNAS",
  description: "Semiconductor company",
  metadata: {},
  status: "active",
  created_at: "2024-01-01T00:00:00Z",
  updated_at: "2024-01-01T00:00:00Z",
};

const MOCK_ALIAS: EntityAliasResponse = {
  id: "alias_test_123",
  entity_id: MOCK_ENTITY.id,
  alias: "NVDA",
  alias_type: "ticker",
  source: "openfigi",
  created_at: "2024-01-01T00:00:00Z",
  updated_at: "2024-01-01T00:00:00Z",
};

// Mock repository implementation
const MockEntityRepository = Layer.succeed(
  EntityRepository,
  EntityRepository.of({
    createEntity: (data) =>
      Effect.Effect.succeed({
        ...MOCK_ENTITY,
        canonical_name: data.canonical_name,
        type: data.type,
        figi: data.figi ?? null,
        ticker: data.ticker ?? null,
        exchange: data.exchange ?? null,
        description: data.description ?? null,
        wikidata_qid: data.wikidata_qid ?? null,
        metadata: data.metadata ?? {},
        status: data.status ?? "active",
      }),
    updateEntity: (id, data) =>
      id === MOCK_ENTITY.id
        ? Effect.Effect.succeed({
            ...MOCK_ENTITY,
            ...data,
            updated_at: new Date().toISOString(),
          })
        : Effect.Effect.fail(new EntityNotFoundError({ identifier: id })),
    readEntityById: (id) =>
      id === MOCK_ENTITY.id
        ? Effect.Effect.succeed(MOCK_ENTITY)
        : Effect.Effect.fail(new EntityNotFoundError({ identifier: id })),
    readEntityByTicker: (ticker) =>
      ticker === "NVDA"
        ? Effect.Effect.succeed(MOCK_ENTITY)
        : Effect.Effect.fail(new EntityNotFoundError({ identifier: ticker })),
    searchEntitiesByTicker: (ticker) =>
      ticker === "NVDA"
        ? Effect.Effect.succeed([MOCK_ENTITY])
        : Effect.Effect.succeed([]),
    // Exact case-insensitive match (no substring matching)
    searchEntitiesByName: (query) =>
      query.toLowerCase() === MOCK_ENTITY.canonical_name.toLowerCase()
        ? Effect.Effect.succeed([MOCK_ENTITY])
        : Effect.Effect.succeed([]),
    // Fuzzy search: matches canonical name OR aliases
    // Simulates alias-inclusive behavior by checking both canonical name and alias strings
    searchEntitiesFuzzy: (query, _threshold) => {
      const q = query.toLowerCase();
      const matchesCanonicalName =
        MOCK_ENTITY.canonical_name.toLowerCase().includes(q) ||
        q.includes("nvidia");
      const matchesAlias =
        MOCK_ALIAS.alias.toLowerCase().includes(q) ||
        q.includes(MOCK_ALIAS.alias.toLowerCase());
      return matchesCanonicalName || matchesAlias
        ? Effect.Effect.succeed([{ entity: MOCK_ENTITY, score: 0.95 }])
        : Effect.Effect.succeed([]);
    },
    createAlias: (data) =>
      Effect.Effect.succeed({
        ...MOCK_ALIAS,
        entity_id: data.entity_id,
        alias: data.alias,
        alias_type: data.alias_type,
        source: data.source,
      }),
    findEntityByAlias: (alias) =>
      alias.toLowerCase() === "nvda" || alias.toLowerCase() === "nvidia"
        ? Effect.Effect.succeed(MOCK_ENTITY)
        : Effect.Effect.succeed(null),
  }),
);

describe("EntityRepository interface", () => {
  describe("createEntity", () => {
    it("returns an Entity with correct fields", async () => {
      const result = await Effect.Effect.runPromise(
        Effect.Effect.gen(function* () {
          const repo = yield* EntityRepository;
          return yield* repo.createEntity({
            canonical_name: "Apple Inc.",
            type: "company",
            figi: "BBG000B9XRY4",
            ticker: "AAPL",
            exchange: "XNAS",
            description: "Technology company",
          });
        }).pipe(Effect.Effect.provide(MockEntityRepository)),
      );
      expect(result.id).toBeDefined();
      expect(result.canonical_name).toBe("Apple Inc.");
      expect(result.type).toBe("company");
      expect(result.figi).toBe("BBG000B9XRY4");
      expect(result.ticker).toBe("AAPL");
      expect(result.status).toBe("active");
    });

    it("handles optional fields correctly", async () => {
      const result = await Effect.Effect.runPromise(
        Effect.Effect.gen(function* () {
          const repo = yield* EntityRepository;
          return yield* repo.createEntity({
            canonical_name: "Minimal Entity",
            type: "other",
          });
        }).pipe(Effect.Effect.provide(MockEntityRepository)),
      );
      expect(result.canonical_name).toBe("Minimal Entity");
      expect(result.figi).toBeNull();
      expect(result.ticker).toBeNull();
    });
  });

  describe("readEntityById", () => {
    it("returns entity for known ID", async () => {
      const result = await Effect.Effect.runPromise(
        Effect.Effect.gen(function* () {
          const repo = yield* EntityRepository;
          return yield* repo.readEntityById("ent_test_123");
        }).pipe(Effect.Effect.provide(MockEntityRepository)),
      );
      expect(result.id).toBe("ent_test_123");
      expect(result.canonical_name).toBe("NVIDIA Corporation");
    });

    it("fails with EntityNotFoundError for unknown ID", async () => {
      const exit = await Effect.Effect.runPromiseExit(
        Effect.Effect.gen(function* () {
          const repo = yield* EntityRepository;
          return yield* repo.readEntityById("unknown_id");
        }).pipe(Effect.Effect.provide(MockEntityRepository)),
      );
      expect(Exit.isFailure(exit)).toBe(true);
      if (Exit.isFailure(exit)) {
        const error = exit.cause;
        expect(error._tag).toBe("Fail");
        if (error._tag === "Fail") {
          expect(error.error).toBeInstanceOf(EntityNotFoundError);
          expect((error.error as EntityNotFoundError).identifier).toBe(
            "unknown_id",
          );
        }
      }
    });
  });

  describe("findEntityByAlias", () => {
    it("returns entity for known alias", async () => {
      const result = await Effect.Effect.runPromise(
        Effect.Effect.gen(function* () {
          const repo = yield* EntityRepository;
          return yield* repo.findEntityByAlias("NVDA");
        }).pipe(Effect.Effect.provide(MockEntityRepository)),
      );
      expect(result).not.toBeNull();
      expect(result?.canonical_name).toBe("NVIDIA Corporation");
    });

    it("returns null for unknown alias", async () => {
      const result = await Effect.Effect.runPromise(
        Effect.Effect.gen(function* () {
          const repo = yield* EntityRepository;
          return yield* repo.findEntityByAlias("unknown_alias");
        }).pipe(Effect.Effect.provide(MockEntityRepository)),
      );
      expect(result).toBeNull();
    });
  });

  describe("searchEntitiesFuzzy", () => {
    it("returns array of entity-score pairs for matching canonical name", async () => {
      const result = await Effect.Effect.runPromise(
        Effect.Effect.gen(function* () {
          const repo = yield* EntityRepository;
          return yield* repo.searchEntitiesFuzzy("nvidia", 0.8);
        }).pipe(Effect.Effect.provide(MockEntityRepository)),
      );
      expect(result).toHaveLength(1);
      expect(result[0]?.entity.canonical_name).toBe("NVIDIA Corporation");
      expect(result[0]?.score).toBe(0.95);
    });

    it("returns matching entity when query matches an alias (alias-inclusive)", async () => {
      const result = await Effect.Effect.runPromise(
        Effect.Effect.gen(function* () {
          const repo = yield* EntityRepository;
          // "NVDA" is an alias for NVIDIA Corporation
          return yield* repo.searchEntitiesFuzzy("NVDA", 0.8);
        }).pipe(Effect.Effect.provide(MockEntityRepository)),
      );
      // Fuzzy search should match via alias
      expect(result).toHaveLength(1);
      expect(result[0]?.entity.canonical_name).toBe("NVIDIA Corporation");
    });

    it("returns empty array for non-matching query", async () => {
      const result = await Effect.Effect.runPromise(
        Effect.Effect.gen(function* () {
          const repo = yield* EntityRepository;
          return yield* repo.searchEntitiesFuzzy("unknown company", 0.8);
        }).pipe(Effect.Effect.provide(MockEntityRepository)),
      );
      expect(result).toHaveLength(0);
    });
  });

  describe("searchEntitiesByName", () => {
    it("returns matching entities for exact canonical name (case-insensitive)", async () => {
      const result = await Effect.Effect.runPromise(
        Effect.Effect.gen(function* () {
          const repo = yield* EntityRepository;
          // Exact match: full canonical name
          return yield* repo.searchEntitiesByName("NVIDIA Corporation");
        }).pipe(Effect.Effect.provide(MockEntityRepository)),
      );
      expect(result).toHaveLength(1);
      expect(result[0]?.canonical_name).toBe("NVIDIA Corporation");
    });

    it("returns empty array for substring that is NOT exact match", async () => {
      const result = await Effect.Effect.runPromise(
        Effect.Effect.gen(function* () {
          const repo = yield* EntityRepository;
          // "NVIDIA" is a substring of "NVIDIA Corporation", but NOT an exact match
          return yield* repo.searchEntitiesByName("NVIDIA");
        }).pipe(Effect.Effect.provide(MockEntityRepository)),
      );
      // Exact match semantics: substring does NOT match
      expect(result).toHaveLength(0);
    });

    it("returns empty array for non-matching query", async () => {
      const result = await Effect.Effect.runPromise(
        Effect.Effect.gen(function* () {
          const repo = yield* EntityRepository;
          return yield* repo.searchEntitiesByName("Unknown Company");
        }).pipe(Effect.Effect.provide(MockEntityRepository)),
      );
      expect(result).toHaveLength(0);
    });
  });

  describe("createAlias", () => {
    it("returns an EntityAlias with correct fields", async () => {
      const result = await Effect.Effect.runPromise(
        Effect.Effect.gen(function* () {
          const repo = yield* EntityRepository;
          return yield* repo.createAlias({
            entity_id: "ent_test_123",
            alias: "nvidia",
            alias_type: "colloquial",
            source: "manual",
          });
        }).pipe(Effect.Effect.provide(MockEntityRepository)),
      );
      expect(result.id).toBeDefined();
      expect(result.entity_id).toBe("ent_test_123");
      expect(result.alias).toBe("nvidia");
      expect(result.alias_type).toBe("colloquial");
      expect(result.source).toBe("manual");
    });
  });

  describe("readEntityByTicker", () => {
    it("returns entity for known ticker", async () => {
      const result = await Effect.Effect.runPromise(
        Effect.Effect.gen(function* () {
          const repo = yield* EntityRepository;
          return yield* repo.readEntityByTicker("NVDA");
        }).pipe(Effect.Effect.provide(MockEntityRepository)),
      );
      expect(result.ticker).toBe("NVDA");
      expect(result.canonical_name).toBe("NVIDIA Corporation");
    });

    it("fails with EntityNotFoundError for unknown ticker", async () => {
      const exit = await Effect.Effect.runPromiseExit(
        Effect.Effect.gen(function* () {
          const repo = yield* EntityRepository;
          return yield* repo.readEntityByTicker("UNKNOWN");
        }).pipe(Effect.Effect.provide(MockEntityRepository)),
      );
      expect(Exit.isFailure(exit)).toBe(true);
      if (Exit.isFailure(exit)) {
        const error = exit.cause;
        expect(error._tag).toBe("Fail");
        if (error._tag === "Fail") {
          expect(error.error).toBeInstanceOf(EntityNotFoundError);
        }
      }
    });
  });

  describe("searchEntitiesByTicker", () => {
    it("returns array with single entity for known ticker", async () => {
      const result = await Effect.Effect.runPromise(
        Effect.Effect.gen(function* () {
          const repo = yield* EntityRepository;
          return yield* repo.searchEntitiesByTicker("NVDA");
        }).pipe(Effect.Effect.provide(MockEntityRepository)),
      );
      expect(result).toHaveLength(1);
      expect(result[0]?.ticker).toBe("NVDA");
      expect(result[0]?.canonical_name).toBe("NVIDIA Corporation");
    });

    it("returns empty array for unknown ticker", async () => {
      const result = await Effect.Effect.runPromise(
        Effect.Effect.gen(function* () {
          const repo = yield* EntityRepository;
          return yield* repo.searchEntitiesByTicker("UNKNOWN");
        }).pipe(Effect.Effect.provide(MockEntityRepository)),
      );
      expect(result).toHaveLength(0);
    });
  });

  describe("updateEntity", () => {
    it("updates entity for known ID", async () => {
      const result = await Effect.Effect.runPromise(
        Effect.Effect.gen(function* () {
          const repo = yield* EntityRepository;
          return yield* repo.updateEntity("ent_test_123", {
            description: "Updated description",
          });
        }).pipe(Effect.Effect.provide(MockEntityRepository)),
      );
      expect(result.description).toBe("Updated description");
    });

    it("fails with EntityNotFoundError for unknown ID", async () => {
      const exit = await Effect.Effect.runPromiseExit(
        Effect.Effect.gen(function* () {
          const repo = yield* EntityRepository;
          return yield* repo.updateEntity("unknown_id", {
            description: "test",
          });
        }).pipe(Effect.Effect.provide(MockEntityRepository)),
      );
      expect(Exit.isFailure(exit)).toBe(true);
    });
  });
});
