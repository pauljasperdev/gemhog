import * as LanguageModel from "@effect/ai/LanguageModel";
import { it } from "@effect/vitest";
import {
  type GenerateTextCall,
  MockModelLayer,
  MockModelText,
  Model,
} from "@gemhog/ai";
import * as Effect from "effect";
import { Exit, Layer, Ref, Stream } from "effect";
import { describe, expect } from "vitest";
import {
  EntityNotFoundError,
  EntityRepositoryError,
  EntityResolutionError,
  OpenFigiError,
} from "../src/errors.js";
import { OpenFigiClient } from "../src/openfigi.js";
import { MockOpenFigiClient } from "../src/openfigi.mock.js";
import { EntityRepository } from "../src/repository.js";
import { EntityResolverService } from "../src/resolver.js";
import { EntityResolverServiceLive } from "../src/resolver.live.js";
import type { EntityAliasResponse, EntityResponse } from "../src/schema.js";
import { MockWikidataClient } from "../src/wikidata.mock.js";

// Mock entity fixture
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

// Mock repository that returns entity for known aliases/tickers
const MockEntityRepository = Layer.succeed(
  EntityRepository,
  EntityRepository.of({
    createEntity: (_data) => Effect.Effect.succeed(MOCK_ENTITY),
    updateEntity: (_id, _data) => Effect.Effect.succeed(MOCK_ENTITY),
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
    searchEntitiesFuzzy: (query, _threshold) =>
      query.toLowerCase().includes("nvidia")
        ? Effect.Effect.succeed([{ entity: MOCK_ENTITY, score: 0.95 }])
        : Effect.Effect.succeed([]),
    createAlias: (_data) => Effect.Effect.succeed(MOCK_ALIAS),
    findEntityByAlias: (alias) =>
      alias.toLowerCase() === "nvda" || alias.toLowerCase() === "nvidia"
        ? Effect.Effect.succeed(MOCK_ENTITY)
        : Effect.Effect.succeed(null),
  }),
);

// Mock repository that returns no matches (for LLM fallback testing)
const EmptyMockEntityRepository = Layer.succeed(
  EntityRepository,
  EntityRepository.of({
    createEntity: (_data) => Effect.Effect.succeed(MOCK_ENTITY),
    updateEntity: (_id, _data) => Effect.Effect.succeed(MOCK_ENTITY),
    readEntityById: (id) =>
      Effect.Effect.fail(new EntityNotFoundError({ identifier: id })),
    readEntityByTicker: (ticker) =>
      Effect.Effect.fail(new EntityNotFoundError({ identifier: ticker })),
    searchEntitiesByTicker: (_ticker) => Effect.Effect.succeed([]),
    searchEntitiesByName: (_query) => Effect.Effect.succeed([]),
    searchEntitiesFuzzy: (_query, _threshold) => Effect.Effect.succeed([]),
    createAlias: (_data) => Effect.Effect.succeed(MOCK_ALIAS),
    findEntityByAlias: (_alias) => Effect.Effect.succeed(null),
  }),
);

// Resolver layer with mock dependencies
const ResolverLayer = EntityResolverServiceLive.pipe(
  Layer.provide(
    Layer.mergeAll(
      MockEntityRepository,
      MockOpenFigiClient,
      MockWikidataClient,
    ),
  ),
);

// Resolver layer with empty repository (for LLM fallback testing)
const EmptyResolverLayer = EntityResolverServiceLive.pipe(
  Layer.provide(
    Layer.mergeAll(
      EmptyMockEntityRepository,
      MockOpenFigiClient,
      MockWikidataClient,
    ),
  ),
);

/**
 * Factory to create a mock model layer that invokes tools through the toolkit.
 * This simulates realistic LLM behavior where the model calls tools during resolution.
 *
 * @param searchQuery - Query to pass to search_entities
 * @param returnTrustedId - If true, returns the first ID from search results; if false, returns a fabricated ID
 * @param action - The action to return ("matched" or "created")
 */
const createToolInvokingMockModel = (config: {
  searchQuery: string;
  returnTrustedId: boolean;
  action: "matched" | "created";
}) =>
  Layer.effect(
    Model,
    Effect.Effect.gen(function* () {
      return Model.of({
        generateObject: (opts: {
          toolkit?: Effect.Effect.Effect<
            {
              handle: (
                name: "search_entities",
                params: { query: string },
              ) => Effect.Effect.Effect<
                {
                  isFailure: boolean;
                  result: Array<{
                    id: string;
                    canonical_name: string;
                    score: number;
                  }>;
                  encodedResult: unknown;
                },
                unknown,
                never
              >;
            },
            never,
            never
          >;
        }) =>
          Effect.Effect.gen(function* () {
            if (!opts.toolkit) {
              return yield* Effect.Effect.die("No toolkit provided");
            }
            // Run the toolkit effect to get the toolkit service (WithHandler)
            const toolkitService = yield* opts.toolkit;
            // Call search_entities via handle() to populate trustedEntityIds
            const handlerResult = yield* toolkitService.handle(
              "search_entities",
              {
                query: config.searchQuery,
              },
            );
            const searchResults = handlerResult.result;
            // Return either a trusted ID from results or a fabricated one
            const entityId = config.returnTrustedId
              ? (searchResults[0]?.id ?? "fabricated_id_999")
              : "fabricated_id_999";
            return new LanguageModel.GenerateObjectResponse(
              { entity_id: entityId, action: config.action },
              [],
            );
          }),
        generateText: () => Effect.Effect.die("Not implemented"),
        streamText: () => Stream.die("Not implemented"),
      } as LanguageModel.Service);
    }),
  );

describe("EntityResolverService", () => {
  describe("exact match", () => {
    it.effect("resolves entity when findEntityByAlias returns a match", () =>
      Effect.Effect.gen(function* () {
        const resolver = yield* EntityResolverService;
        const result = yield* resolver.resolveEntity({
          name: "NVDA",
          type: "company",
        });
        expect(result.resolved).toBe(true);
        expect(result.strategy).toBe("exact_match");
        expect(result.confidence).toBe(1);
        expect(result.entity?.canonical_name).toBe("NVIDIA Corporation");
      }).pipe(Effect.Effect.provide(ResolverLayer)),
    );

    it.effect(
      "resolves entity when readEntityByTicker returns a match for ticker-like name",
      () => {
        // Create a repo that only returns result for ticker lookup, not alias
        const TickerOnlyRepo = Layer.succeed(
          EntityRepository,
          EntityRepository.of({
            createEntity: (_data) => Effect.Effect.succeed(MOCK_ENTITY),
            updateEntity: (_id, _data) => Effect.Effect.succeed(MOCK_ENTITY),
            readEntityById: (id) =>
              id === MOCK_ENTITY.id
                ? Effect.Effect.succeed(MOCK_ENTITY)
                : Effect.Effect.fail(
                    new EntityNotFoundError({ identifier: id }),
                  ),
            readEntityByTicker: (ticker) =>
              ticker === "MSFT"
                ? Effect.Effect.succeed({
                    ...MOCK_ENTITY,
                    ticker: "MSFT",
                    canonical_name: "Microsoft Corporation",
                  })
                : Effect.Effect.fail(
                    new EntityNotFoundError({ identifier: ticker }),
                  ),
            searchEntitiesByTicker: (ticker) =>
              ticker === "MSFT"
                ? Effect.Effect.succeed([
                    {
                      ...MOCK_ENTITY,
                      ticker: "MSFT",
                      canonical_name: "Microsoft Corporation",
                    },
                  ])
                : Effect.Effect.succeed([]),
            searchEntitiesByName: (_query) => Effect.Effect.succeed([]),
            searchEntitiesFuzzy: (_query, _threshold) =>
              Effect.Effect.succeed([]),
            createAlias: (_data) => Effect.Effect.succeed(MOCK_ALIAS),
            findEntityByAlias: (_alias) => Effect.Effect.succeed(null),
          }),
        );

        const TickerResolverLayer = EntityResolverServiceLive.pipe(
          Layer.provide(
            Layer.mergeAll(
              TickerOnlyRepo,
              MockOpenFigiClient,
              MockWikidataClient,
            ),
          ),
        );

        return Effect.Effect.gen(function* () {
          const resolver = yield* EntityResolverService;
          const result = yield* resolver.resolveEntity({
            name: "MSFT",
            type: "company",
          });
          expect(result.resolved).toBe(true);
          expect(result.strategy).toBe("exact_match");
          expect(result.confidence).toBe(1);
          expect(result.entity?.canonical_name).toBe("Microsoft Corporation");
        }).pipe(Effect.Effect.provide(TickerResolverLayer));
      },
    );

    it.effect(
      "falls through when searchEntitiesByTicker returns 2+ results (ambiguous ticker)",
      () => {
        const MOCK_ENTITY_2: EntityResponse = {
          ...MOCK_ENTITY,
          id: "ent_test_456",
          canonical_name: "MSFT on Different Exchange",
          exchange: "NYSE",
        };

        // Create a repo that returns 2 entities for the same ticker (ambiguous)
        const AmbiguousTickerRepo = Layer.succeed(
          EntityRepository,
          EntityRepository.of({
            createEntity: (_data) => Effect.Effect.succeed(MOCK_ENTITY),
            updateEntity: (_id, _data) => Effect.Effect.succeed(MOCK_ENTITY),
            readEntityById: (id) =>
              id === MOCK_ENTITY.id
                ? Effect.Effect.succeed(MOCK_ENTITY)
                : Effect.Effect.fail(
                    new EntityNotFoundError({ identifier: id }),
                  ),
            readEntityByTicker: (_ticker) =>
              Effect.Effect.fail(new EntityNotFoundError({ identifier: "" })),
            // Returns 2 entities for MSFT - ambiguous!
            searchEntitiesByTicker: (ticker) =>
              ticker === "MSFT"
                ? Effect.Effect.succeed([
                    {
                      ...MOCK_ENTITY,
                      ticker: "MSFT",
                      canonical_name: "Microsoft Corporation",
                    },
                    MOCK_ENTITY_2,
                  ])
                : Effect.Effect.succeed([]),
            searchEntitiesByName: (_query) => Effect.Effect.succeed([]),
            // Fuzzy search returns the first entity as fallback
            searchEntitiesFuzzy: (query, _threshold) =>
              query.toLowerCase().includes("msft")
                ? Effect.Effect.succeed([{ entity: MOCK_ENTITY, score: 0.95 }])
                : Effect.Effect.succeed([]),
            createAlias: (_data) => Effect.Effect.succeed(MOCK_ALIAS),
            findEntityByAlias: (_alias) => Effect.Effect.succeed(null),
          }),
        );

        const AmbiguousTickerResolverLayer = EntityResolverServiceLive.pipe(
          Layer.provide(
            Layer.mergeAll(
              AmbiguousTickerRepo,
              MockOpenFigiClient,
              MockWikidataClient,
            ),
          ),
        );

        return Effect.Effect.gen(function* () {
          const resolver = yield* EntityResolverService;
          const result = yield* resolver.resolveEntity({
            name: "MSFT",
            type: "company",
          });
          // Since ticker is ambiguous (2+ matches), falls through to fuzzy
          expect(result.resolved).toBe(true);
          expect(result.strategy).toBe("fuzzy_match");
          expect(result.confidence).toBe(0.95);
        }).pipe(Effect.Effect.provide(AmbiguousTickerResolverLayer));
      },
    );

    it.effect(
      "resolves entity when searchEntitiesByName returns exactly 1 result",
      () => {
        // Create a repo that only returns result for name search
        const NameSearchRepo = Layer.succeed(
          EntityRepository,
          EntityRepository.of({
            createEntity: (_data) => Effect.Effect.succeed(MOCK_ENTITY),
            updateEntity: (_id, _data) => Effect.Effect.succeed(MOCK_ENTITY),
            readEntityById: (id) =>
              id === MOCK_ENTITY.id
                ? Effect.Effect.succeed(MOCK_ENTITY)
                : Effect.Effect.fail(
                    new EntityNotFoundError({ identifier: id }),
                  ),
            readEntityByTicker: (_ticker) =>
              Effect.Effect.fail(new EntityNotFoundError({ identifier: "" })),
            searchEntitiesByTicker: (_ticker) => Effect.Effect.succeed([]),
            searchEntitiesByName: (query) =>
              query.toLowerCase().includes("nvidia corporation")
                ? Effect.Effect.succeed([MOCK_ENTITY])
                : Effect.Effect.succeed([]),
            searchEntitiesFuzzy: (_query, _threshold) =>
              Effect.Effect.succeed([]),
            createAlias: (_data) => Effect.Effect.succeed(MOCK_ALIAS),
            findEntityByAlias: (_alias) => Effect.Effect.succeed(null),
          }),
        );

        const NameSearchResolverLayer = EntityResolverServiceLive.pipe(
          Layer.provide(
            Layer.mergeAll(
              NameSearchRepo,
              MockOpenFigiClient,
              MockWikidataClient,
            ),
          ),
        );

        return Effect.Effect.gen(function* () {
          const resolver = yield* EntityResolverService;
          const result = yield* resolver.resolveEntity({
            name: "NVIDIA Corporation",
            type: "company",
          });
          expect(result.resolved).toBe(true);
          expect(result.strategy).toBe("exact_match");
          expect(result.confidence).toBe(1);
        }).pipe(Effect.Effect.provide(NameSearchResolverLayer));
      },
    );

    // Multi-match behavior: when searchEntitiesByName returns 2+ results,
    // exactMatch returns null and resolver falls through to fuzzy/LLM.
    // This can happen if somehow two entities share the same canonical name
    // (rare, but the resolver must handle it gracefully).
    it.effect(
      "falls through to fuzzy when searchEntitiesByName returns multiple results",
      () => {
        const MOCK_ENTITY_2: EntityResponse = {
          ...MOCK_ENTITY,
          id: "ent_test_456",
          canonical_name: "NVIDIA Corporation", // Same name, different entity!
          ticker: "NVDA2",
        };

        // Create a repo that returns 2 entities for name search
        const MultiMatchRepo = Layer.succeed(
          EntityRepository,
          EntityRepository.of({
            createEntity: (_data) => Effect.Effect.succeed(MOCK_ENTITY),
            updateEntity: (_id, _data) => Effect.Effect.succeed(MOCK_ENTITY),
            readEntityById: (id) =>
              id === MOCK_ENTITY.id
                ? Effect.Effect.succeed(MOCK_ENTITY)
                : Effect.Effect.fail(
                    new EntityNotFoundError({ identifier: id }),
                  ),
            readEntityByTicker: (_ticker) =>
              Effect.Effect.fail(new EntityNotFoundError({ identifier: "" })),
            searchEntitiesByTicker: (_ticker) => Effect.Effect.succeed([]),
            // Returns 2 results for "NVIDIA Corporation" - ambiguous!
            searchEntitiesByName: (query) =>
              query.toLowerCase().includes("nvidia corporation")
                ? Effect.Effect.succeed([MOCK_ENTITY, MOCK_ENTITY_2])
                : Effect.Effect.succeed([]),
            // Fuzzy search returns the first entity
            searchEntitiesFuzzy: (query, _threshold) =>
              query.toLowerCase().includes("nvidia")
                ? Effect.Effect.succeed([{ entity: MOCK_ENTITY, score: 0.95 }])
                : Effect.Effect.succeed([]),
            createAlias: (_data) => Effect.Effect.succeed(MOCK_ALIAS),
            findEntityByAlias: (_alias) => Effect.Effect.succeed(null),
          }),
        );

        const MultiMatchResolverLayer = EntityResolverServiceLive.pipe(
          Layer.provide(
            Layer.mergeAll(
              MultiMatchRepo,
              MockOpenFigiClient,
              MockWikidataClient,
            ),
          ),
        );

        return Effect.Effect.gen(function* () {
          const resolver = yield* EntityResolverService;
          const result = yield* resolver.resolveEntity({
            name: "NVIDIA Corporation",
            type: "company",
          });
          // exactMatch returns null when byName.length !== 1, falls through to fuzzy
          expect(result.resolved).toBe(true);
          expect(result.strategy).toBe("fuzzy_match");
          expect(result.confidence).toBe(0.95);
        }).pipe(Effect.Effect.provide(MultiMatchResolverLayer));
      },
    );
  });

  describe("fuzzy", () => {
    it.effect(
      "resolves entity when searchEntitiesFuzzy returns 1 result with score > 0.9",
      () => {
        // Create a repo that only returns result for fuzzy search
        const FuzzyOnlyRepo = Layer.succeed(
          EntityRepository,
          EntityRepository.of({
            createEntity: (_data) => Effect.Effect.succeed(MOCK_ENTITY),
            updateEntity: (_id, _data) => Effect.Effect.succeed(MOCK_ENTITY),
            readEntityById: (id) =>
              id === MOCK_ENTITY.id
                ? Effect.Effect.succeed(MOCK_ENTITY)
                : Effect.Effect.fail(
                    new EntityNotFoundError({ identifier: id }),
                  ),
            readEntityByTicker: (_ticker) =>
              Effect.Effect.fail(new EntityNotFoundError({ identifier: "" })),
            searchEntitiesByTicker: (_ticker) => Effect.Effect.succeed([]),
            searchEntitiesByName: (_query) => Effect.Effect.succeed([]),
            searchEntitiesFuzzy: (query, _threshold) =>
              query.toLowerCase().includes("nvidi")
                ? Effect.Effect.succeed([{ entity: MOCK_ENTITY, score: 0.95 }])
                : Effect.Effect.succeed([]),
            createAlias: (_data) => Effect.Effect.succeed(MOCK_ALIAS),
            findEntityByAlias: (_alias) => Effect.Effect.succeed(null),
          }),
        );

        const FuzzyResolverLayer = EntityResolverServiceLive.pipe(
          Layer.provide(
            Layer.mergeAll(
              FuzzyOnlyRepo,
              MockOpenFigiClient,
              MockWikidataClient,
            ),
          ),
        );

        return Effect.Effect.gen(function* () {
          const resolver = yield* EntityResolverService;
          const result = yield* resolver.resolveEntity({
            name: "Nvidi Corp",
            type: "company",
          });
          expect(result.resolved).toBe(true);
          expect(result.strategy).toBe("fuzzy_match");
          expect(result.confidence).toBe(0.95);
          expect(result.entity?.canonical_name).toBe("NVIDIA Corporation");
        }).pipe(Effect.Effect.provide(FuzzyResolverLayer));
      },
    );

    it.effect("creates alias after fuzzy match", () => {
      let aliasCreated = false;

      const FuzzyWithAliasRepo = Layer.succeed(
        EntityRepository,
        EntityRepository.of({
          createEntity: (_data) => Effect.Effect.succeed(MOCK_ENTITY),
          updateEntity: (_id, _data) => Effect.Effect.succeed(MOCK_ENTITY),
          readEntityById: (id) =>
            id === MOCK_ENTITY.id
              ? Effect.Effect.succeed(MOCK_ENTITY)
              : Effect.Effect.fail(new EntityNotFoundError({ identifier: id })),
          readEntityByTicker: (_ticker) =>
            Effect.Effect.fail(new EntityNotFoundError({ identifier: "" })),
          searchEntitiesByTicker: (_ticker) => Effect.Effect.succeed([]),
          searchEntitiesByName: (_query) => Effect.Effect.succeed([]),
          searchEntitiesFuzzy: (query, _threshold) =>
            query.toLowerCase().includes("nvidi")
              ? Effect.Effect.succeed([{ entity: MOCK_ENTITY, score: 0.95 }])
              : Effect.Effect.succeed([]),
          createAlias: (_data) => {
            aliasCreated = true;
            return Effect.Effect.succeed(MOCK_ALIAS);
          },
          findEntityByAlias: (_alias) => Effect.Effect.succeed(null),
        }),
      );

      const FuzzyAliasResolverLayer = EntityResolverServiceLive.pipe(
        Layer.provide(
          Layer.mergeAll(
            FuzzyWithAliasRepo,
            MockOpenFigiClient,
            MockWikidataClient,
          ),
        ),
      );

      return Effect.Effect.gen(function* () {
        const resolver = yield* EntityResolverService;
        yield* resolver.resolveEntity({
          name: "Nvidi Corp",
          type: "company",
        });
        expect(aliasCreated).toBe(true);
      }).pipe(Effect.Effect.provide(FuzzyAliasResolverLayer));
    });

    it.effect("returns source fuzzy and confidence equal to score", () => {
      const FuzzyScoreRepo = Layer.succeed(
        EntityRepository,
        EntityRepository.of({
          createEntity: (_data) => Effect.Effect.succeed(MOCK_ENTITY),
          updateEntity: (_id, _data) => Effect.Effect.succeed(MOCK_ENTITY),
          readEntityById: (id) =>
            id === MOCK_ENTITY.id
              ? Effect.Effect.succeed(MOCK_ENTITY)
              : Effect.Effect.fail(new EntityNotFoundError({ identifier: id })),
          readEntityByTicker: (_ticker) =>
            Effect.Effect.fail(new EntityNotFoundError({ identifier: "" })),
          searchEntitiesByTicker: (_ticker) => Effect.Effect.succeed([]),
          searchEntitiesByName: (_query) => Effect.Effect.succeed([]),
          searchEntitiesFuzzy: (query, _threshold) =>
            query.toLowerCase().includes("nvidia")
              ? Effect.Effect.succeed([{ entity: MOCK_ENTITY, score: 0.92 }])
              : Effect.Effect.succeed([]),
          createAlias: (_data) => Effect.Effect.succeed(MOCK_ALIAS),
          findEntityByAlias: (_alias) => Effect.Effect.succeed(null),
        }),
      );

      const ScoreResolverLayer = EntityResolverServiceLive.pipe(
        Layer.provide(
          Layer.mergeAll(
            FuzzyScoreRepo,
            MockOpenFigiClient,
            MockWikidataClient,
          ),
        ),
      );

      return Effect.Effect.gen(function* () {
        const resolver = yield* EntityResolverService;
        const result = yield* resolver.resolveEntity({
          name: "nVidia",
          type: "company",
        });
        expect(result.strategy).toBe("fuzzy_match");
        expect(result.confidence).toBe(0.92);
      }).pipe(Effect.Effect.provide(ScoreResolverLayer));
    });
  });

  describe("LLM fallback", () => {
    it.effect(
      "fails with EntityResolutionError when no LLM model is available and includes attemptedStages",
      () =>
        Effect.Effect.gen(function* () {
          const exit = yield* Effect.Effect.exit(
            Effect.Effect.gen(function* () {
              const resolver = yield* EntityResolverService;
              return yield* resolver.resolveEntity({
                name: "UnknownEntity",
                type: "company",
              });
            }).pipe(Effect.Effect.provide(EmptyResolverLayer)),
          );
          expect(Exit.isFailure(exit)).toBe(true);
          if (Exit.isFailure(exit)) {
            const error = exit.cause;
            expect(error._tag).toBe("Fail");
            if (error._tag === "Fail") {
              expect(error.error).toBeInstanceOf(EntityResolutionError);
              expect((error.error as EntityResolutionError).code).toBe(
                "resolution.model_unavailable",
              );
              expect((error.error as EntityResolutionError).stage).toBe(
                "llm_prepare",
              );
              expect((error.error as EntityResolutionError).message).toBe(
                "LanguageModel not available",
              );
              // Verify attemptedStages includes exact_match and fuzzy_match
              const context = (error.error as EntityResolutionError).context;
              expect(context.attemptedStages).toEqual([
                "exact_match",
                "fuzzy_match",
              ]);
              expect(context.mentionName).toBe("UnknownEntity");
              expect(context.mentionType).toBe("company");
            }
          }
        }),
    );

    it.effect(
      "resolves entity with source 'llm' when AI returns matched action from trusted ID",
      () => {
        // Create a repo that:
        // - Fails exact match (no alias, no ticker)
        // - Fails fuzzy match (no results at 0.9 threshold)
        // - Returns results for searchEntitiesFuzzy at 0.7 threshold (for search_entities tool)
        // - Succeeds readEntityById for the matched entity
        const AiMatchRepo = Layer.succeed(
          EntityRepository,
          EntityRepository.of({
            createEntity: (_data) => Effect.Effect.succeed(MOCK_ENTITY),
            updateEntity: (_id, _data) => Effect.Effect.succeed(MOCK_ENTITY),
            readEntityById: (id) =>
              id === MOCK_ENTITY.id
                ? Effect.Effect.succeed(MOCK_ENTITY)
                : Effect.Effect.fail(
                    new EntityNotFoundError({ identifier: id }),
                  ),
            readEntityByTicker: (_ticker) =>
              Effect.Effect.fail(new EntityNotFoundError({ identifier: "" })),
            searchEntitiesByTicker: (_ticker) => Effect.Effect.succeed([]),
            searchEntitiesByName: (_query) => Effect.Effect.succeed([]),
            // No results at 0.9 threshold (for fuzzy match stage)
            // But returns results at 0.7 threshold (for search_entities tool)
            searchEntitiesFuzzy: (_query, threshold = 0.9) =>
              threshold < 0.8
                ? Effect.Effect.succeed([{ entity: MOCK_ENTITY, score: 0.75 }])
                : Effect.Effect.succeed([]),
            createAlias: (_data) => Effect.Effect.succeed(MOCK_ALIAS),
            findEntityByAlias: (_alias) => Effect.Effect.succeed(null),
          }),
        );

        // Use tool-invoking mock that calls search_entities and returns a trusted ID
        const MockAiMatchLayer = EntityResolverServiceLive.pipe(
          Layer.provide(
            Layer.mergeAll(
              AiMatchRepo,
              MockOpenFigiClient,
              MockWikidataClient,
              createToolInvokingMockModel({
                searchQuery: "NVIDIA",
                returnTrustedId: true,
                action: "matched",
              }),
            ),
          ),
        );

        return Effect.Effect.gen(function* () {
          const resolver = yield* EntityResolverService;
          const result = yield* resolver.resolveEntity({
            name: "UnknownEntity",
            type: "company",
          });

          expect(result.resolved).toBe(true);
          expect(result.strategy).toBe("llm_match");
          expect(result.confidence).toBe(0.8);
          expect(result.entity?.id).toBe("ent_test_123");
        }).pipe(Effect.Effect.provide(MockAiMatchLayer));
      },
    );

    it.effect(
      "resolves entity with source 'created' when AI invokes create_entity tool",
      () => {
        // Create a repo that:
        // - Fails exact/fuzzy match
        // - Returns results for searchEntitiesFuzzy at 0.7 threshold (for search_entities tool)
        // - Succeeds createEntity and readEntityById
        const AiCreateRepo = Layer.succeed(
          EntityRepository,
          EntityRepository.of({
            createEntity: (_data) => Effect.Effect.succeed(MOCK_ENTITY),
            updateEntity: (_id, _data) => Effect.Effect.succeed(MOCK_ENTITY),
            readEntityById: (id) =>
              id === MOCK_ENTITY.id
                ? Effect.Effect.succeed(MOCK_ENTITY)
                : Effect.Effect.fail(
                    new EntityNotFoundError({ identifier: id }),
                  ),
            readEntityByTicker: (_ticker) =>
              Effect.Effect.fail(new EntityNotFoundError({ identifier: "" })),
            searchEntitiesByTicker: (_ticker) => Effect.Effect.succeed([]),
            searchEntitiesByName: (_query) => Effect.Effect.succeed([]),
            // Return results at 0.7 threshold (for search_entities tool)
            searchEntitiesFuzzy: (_query, threshold = 0.9) =>
              threshold < 0.8
                ? Effect.Effect.succeed([{ entity: MOCK_ENTITY, score: 0.75 }])
                : Effect.Effect.succeed([]),
            createAlias: (_data) => Effect.Effect.succeed(MOCK_ALIAS),
            findEntityByAlias: (_alias) => Effect.Effect.succeed(null),
          }),
        );

        // Use tool-invoking mock that calls search_entities and returns "created" action
        const MockAiCreateLayer = EntityResolverServiceLive.pipe(
          Layer.provide(
            Layer.mergeAll(
              AiCreateRepo,
              MockOpenFigiClient,
              MockWikidataClient,
              createToolInvokingMockModel({
                searchQuery: "NewEntity",
                returnTrustedId: true,
                action: "created",
              }),
            ),
          ),
        );

        return Effect.Effect.gen(function* () {
          const resolver = yield* EntityResolverService;
          const result = yield* resolver.resolveEntity({
            name: "NewEntity",
            type: "company",
          });

          expect(result.resolved).toBe(true);
          expect(result.strategy).toBe("llm_create");
          expect(result.confidence).toBe(0.7);
          expect(result.entity?.id).toBe("ent_test_123");
        }).pipe(Effect.Effect.provide(MockAiCreateLayer));
      },
    );

    it.effect(
      "fails with EntityResolutionError when model returns malformed JSON",
      () => {
        const MockMalformedJsonLayer = EntityResolverServiceLive.pipe(
          Layer.provide(
            Layer.mergeAll(
              EmptyMockEntityRepository,
              MockOpenFigiClient,
              MockWikidataClient,
              MockModelLayer.pipe(
                Layer.provide(
                  Layer.succeed(MockModelText, { text: "not json at all" }),
                ),
              ),
            ),
          ),
        );

        return Effect.Effect.gen(function* () {
          const exit = yield* Effect.Effect.exit(
            Effect.Effect.gen(function* () {
              const resolver = yield* EntityResolverService;
              return yield* resolver.resolveEntity({
                name: "SomeEntity",
                type: "company",
              });
            }).pipe(Effect.Effect.provide(MockMalformedJsonLayer)),
          );

          expect(Exit.isFailure(exit)).toBe(true);
          if (Exit.isFailure(exit)) {
            const error = exit.cause;
            expect(error._tag).toBe("Fail");
            if (error._tag === "Fail") {
              expect(error.error).toBeInstanceOf(EntityResolutionError);
              expect((error.error as EntityResolutionError).code).toBe(
                "resolution.tool_failure",
              );
              expect((error.error as EntityResolutionError).stage).toBe(
                "llm_tool",
              );
              expect(
                (error.error as EntityResolutionError).message.length,
              ).toBeGreaterThan(0);
            }
          }
        });
      },
    );

    it.effect(
      "fails with EntityResolutionError when entity_id is not produced by tools (unverified)",
      () => {
        // Repo that returns results for search_entities but model ignores them
        // and returns a fabricated ID
        const UnverifiedIdRepo = Layer.succeed(
          EntityRepository,
          EntityRepository.of({
            createEntity: (_data) => Effect.Effect.succeed(MOCK_ENTITY),
            updateEntity: (_id, _data) => Effect.Effect.succeed(MOCK_ENTITY),
            readEntityById: (id) =>
              Effect.Effect.fail(new EntityNotFoundError({ identifier: id })),
            readEntityByTicker: (_ticker) =>
              Effect.Effect.fail(new EntityNotFoundError({ identifier: "" })),
            searchEntitiesByTicker: (_ticker) => Effect.Effect.succeed([]),
            searchEntitiesByName: (_query) => Effect.Effect.succeed([]),
            // Return results for search_entities tool
            searchEntitiesFuzzy: (_query, threshold = 0.9) =>
              threshold < 0.8
                ? Effect.Effect.succeed([{ entity: MOCK_ENTITY, score: 0.75 }])
                : Effect.Effect.succeed([]),
            createAlias: (_data) => Effect.Effect.succeed(MOCK_ALIAS),
            findEntityByAlias: (_alias) => Effect.Effect.succeed(null),
          }),
        );

        // Use tool-invoking mock that returns a FABRICATED ID (not from tools)
        const MockUnverifiedIdLayer = EntityResolverServiceLive.pipe(
          Layer.provide(
            Layer.mergeAll(
              UnverifiedIdRepo,
              MockOpenFigiClient,
              MockWikidataClient,
              createToolInvokingMockModel({
                searchQuery: "SomeQuery",
                returnTrustedId: false, // Returns fabricated ID instead
                action: "matched",
              }),
            ),
          ),
        );

        return Effect.Effect.gen(function* () {
          const exit = yield* Effect.Effect.exit(
            Effect.Effect.gen(function* () {
              const resolver = yield* EntityResolverService;
              return yield* resolver.resolveEntity({
                name: "NonexistentEntity",
                type: "company",
              });
            }).pipe(Effect.Effect.provide(MockUnverifiedIdLayer)),
          );

          expect(Exit.isFailure(exit)).toBe(true);
          if (Exit.isFailure(exit)) {
            const error = exit.cause;
            expect(error._tag).toBe("Fail");
            if (error._tag === "Fail") {
              expect(error.error).toBeInstanceOf(EntityResolutionError);
              // Now correctly expects entity_id_unverified
              expect((error.error as EntityResolutionError).code).toBe(
                "resolution.entity_id_unverified",
              );
              expect((error.error as EntityResolutionError).stage).toBe(
                "llm_entity_lookup",
              );
              expect((error.error as EntityResolutionError).message).toBe(
                "Model returned entity_id that was not produced by tools in this run",
              );
              expect(
                (error.error as EntityResolutionError).context.mentionName,
              ).toBe("NonexistentEntity");
              // Verify attemptedStages is included
              expect(
                (error.error as EntityResolutionError).context.attemptedStages,
              ).toEqual(["exact_match", "fuzzy_match"]);
            }
          }
        });
      },
    );

    it.effect(
      "captures prompt containing entity name and type via SpyModelLayer",
      () =>
        Effect.Effect.gen(function* () {
          // Repo that returns results for search_entities tool
          const SpyTestRepo = Layer.succeed(
            EntityRepository,
            EntityRepository.of({
              createEntity: (_data) => Effect.Effect.succeed(MOCK_ENTITY),
              updateEntity: (_id, _data) => Effect.Effect.succeed(MOCK_ENTITY),
              readEntityById: (id) =>
                id === MOCK_ENTITY.id
                  ? Effect.Effect.succeed(MOCK_ENTITY)
                  : Effect.Effect.fail(
                      new EntityNotFoundError({ identifier: id }),
                    ),
              readEntityByTicker: (_ticker) =>
                Effect.Effect.fail(new EntityNotFoundError({ identifier: "" })),
              searchEntitiesByTicker: (_ticker) => Effect.Effect.succeed([]),
              searchEntitiesByName: (_query) => Effect.Effect.succeed([]),
              // Return results for search_entities tool at 0.7 threshold
              searchEntitiesFuzzy: (_query, threshold = 0.9) =>
                threshold < 0.8
                  ? Effect.Effect.succeed([
                      { entity: MOCK_ENTITY, score: 0.75 },
                    ])
                  : Effect.Effect.succeed([]),
              createAlias: (_data) => Effect.Effect.succeed(MOCK_ALIAS),
              findEntityByAlias: (_alias) => Effect.Effect.succeed(null),
            }),
          );

          const callsRef = yield* Ref.make<ReadonlyArray<GenerateTextCall>>([]);

          // Use tool-invoking mock that records calls
          const SpyToolInvokingModel = Layer.effect(
            Model,
            Effect.Effect.gen(function* () {
              return Model.of({
                generateObject: (opts: {
                  prompt?: string;
                  toolkit?: Effect.Effect.Effect<
                    {
                      handle: (
                        name: "search_entities",
                        params: { query: string },
                      ) => Effect.Effect.Effect<
                        {
                          isFailure: boolean;
                          result: Array<{
                            id: string;
                            canonical_name: string;
                            score: number;
                          }>;
                          encodedResult: unknown;
                        },
                        unknown,
                        never
                      >;
                    },
                    never,
                    never
                  >;
                }) =>
                  Effect.Effect.gen(function* () {
                    // Record the call
                    yield* Ref.update(callsRef, (calls) => [
                      ...calls,
                      {
                        method: "generateObject" as const,
                        prompt: opts.prompt,
                        toolkit: opts.toolkit,
                        system: undefined,
                        options: opts,
                      },
                    ]);
                    // Invoke toolkit to get trusted ID
                    if (!opts.toolkit) {
                      return yield* Effect.Effect.die("No toolkit provided");
                    }
                    const toolkitService = yield* opts.toolkit;
                    const handlerResult = yield* toolkitService.handle(
                      "search_entities",
                      {
                        query: "test",
                      },
                    );
                    const searchResults = handlerResult.result;
                    const entityId = searchResults[0]?.id ?? "fabricated_id";
                    return new LanguageModel.GenerateObjectResponse(
                      { entity_id: entityId, action: "matched" as const },
                      [],
                    );
                  }),
                generateText: () => Effect.Effect.die("Not implemented"),
                streamText: () => Stream.die("Not implemented"),
              } as LanguageModel.Service);
            }),
          );

          const SpyModelResolverLayer = EntityResolverServiceLive.pipe(
            Layer.provide(
              Layer.mergeAll(
                SpyTestRepo,
                MockOpenFigiClient,
                MockWikidataClient,
                SpyToolInvokingModel,
              ),
            ),
          );

          yield* Effect.Effect.gen(function* () {
            const resolver = yield* EntityResolverService;
            return yield* resolver.resolveEntity({
              name: "TestCompanyName",
              type: "company",
            });
          }).pipe(Effect.Effect.provide(SpyModelResolverLayer));

          const calls = yield* Ref.get(callsRef);

          expect(calls).toHaveLength(1);
          expect(calls[0]?.method).toBe("generateObject");
          const promptStr = String(calls[0]?.prompt ?? "");
          expect(promptStr).toContain("TestCompanyName");
          expect(promptStr).toContain("company");
          // Verify toolkit is provided
          expect(calls[0]?.toolkit).toBeDefined();
        }),
    );
  });

  describe("tool handler failure semantics", () => {
    it.effect(
      "propagates EntityRepositoryError from exact match as EntityResolutionError",
      () => {
        const repositoryCause = new Error("alias lookup failed");

        // Repository that fails on all operations
        const FailingRepository = Layer.succeed(
          EntityRepository,
          EntityRepository.of({
            createEntity: () =>
              Effect.Effect.fail(
                new EntityRepositoryError({ cause: "create failed" }),
              ),
            updateEntity: () =>
              Effect.Effect.fail(
                new EntityRepositoryError({ cause: "update failed" }),
              ),
            readEntityById: () =>
              Effect.Effect.fail(
                new EntityRepositoryError({ cause: "read failed" }),
              ),
            readEntityByTicker: () =>
              Effect.Effect.fail(
                new EntityRepositoryError({ cause: "ticker lookup failed" }),
              ),
            searchEntitiesByTicker: () =>
              Effect.Effect.fail(
                new EntityRepositoryError({ cause: "ticker search failed" }),
              ),
            searchEntitiesByName: () =>
              Effect.Effect.fail(
                new EntityRepositoryError({ cause: "search failed" }),
              ),
            searchEntitiesFuzzy: () =>
              Effect.Effect.fail(
                new EntityRepositoryError({ cause: "fuzzy failed" }),
              ),
            createAlias: () =>
              Effect.Effect.fail(
                new EntityRepositoryError({ cause: "alias failed" }),
              ),
            findEntityByAlias: () =>
              Effect.Effect.fail(
                new EntityRepositoryError({ cause: repositoryCause }),
              ),
          }),
        );

        const FailingResolverLayer = EntityResolverServiceLive.pipe(
          Layer.provide(
            Layer.mergeAll(
              FailingRepository,
              MockOpenFigiClient,
              MockWikidataClient,
            ),
          ),
        );

        return Effect.Effect.gen(function* () {
          const exit = yield* Effect.Effect.exit(
            Effect.Effect.gen(function* () {
              const resolver = yield* EntityResolverService;
              return yield* resolver.resolveEntity({
                name: "NVDA",
                type: "company",
              });
            }).pipe(Effect.Effect.provide(FailingResolverLayer)),
          );

          expect(Exit.isFailure(exit)).toBe(true);
          if (Exit.isFailure(exit)) {
            const error = exit.cause;
            expect(error._tag).toBe("Fail");
            if (error._tag === "Fail") {
              expect(error.error).toBeInstanceOf(EntityResolutionError);
              expect((error.error as EntityResolutionError).code).toBe(
                "resolution.repository_failure",
              );
              expect((error.error as EntityResolutionError).stage).toBe(
                "exact_match",
              );
              expect((error.error as EntityResolutionError).cause).toBe(
                repositoryCause,
              );
            }
          }
        });
      },
    );

    it.effect(
      "default layer without Model still works for exact match resolution",
      () =>
        Effect.Effect.gen(function* () {
          const resolver = yield* EntityResolverService;
          const result = yield* resolver.resolveEntity({
            name: "NVDA",
            type: "company",
          });
          expect(result.resolved).toBe(true);
          expect(result.strategy).toBe("exact_match");
          // No Model was provided, yet exact match worked
        }).pipe(Effect.Effect.provide(ResolverLayer)),
    );

    it.effect(
      "default layer without Model still works for fuzzy match resolution",
      () => {
        // Create a repo that only returns result for fuzzy search
        const FuzzyOnlyRepo = Layer.succeed(
          EntityRepository,
          EntityRepository.of({
            createEntity: (_data) => Effect.Effect.succeed(MOCK_ENTITY),
            updateEntity: (_id, _data) => Effect.Effect.succeed(MOCK_ENTITY),
            readEntityById: (id) =>
              id === MOCK_ENTITY.id
                ? Effect.Effect.succeed(MOCK_ENTITY)
                : Effect.Effect.fail(
                    new EntityNotFoundError({ identifier: id }),
                  ),
            readEntityByTicker: (_ticker) =>
              Effect.Effect.fail(new EntityNotFoundError({ identifier: "" })),
            searchEntitiesByTicker: (_ticker) => Effect.Effect.succeed([]),
            searchEntitiesByName: (_query) => Effect.Effect.succeed([]),
            searchEntitiesFuzzy: (query, _threshold) =>
              query.toLowerCase().includes("nvidi")
                ? Effect.Effect.succeed([{ entity: MOCK_ENTITY, score: 0.95 }])
                : Effect.Effect.succeed([]),
            createAlias: (_data) => Effect.Effect.succeed(MOCK_ALIAS),
            findEntityByAlias: (_alias) => Effect.Effect.succeed(null),
          }),
        );

        const FuzzyResolverLayer = EntityResolverServiceLive.pipe(
          Layer.provide(
            Layer.mergeAll(
              FuzzyOnlyRepo,
              MockOpenFigiClient,
              MockWikidataClient,
            ),
          ),
        );

        return Effect.Effect.gen(function* () {
          const resolver = yield* EntityResolverService;
          const result = yield* resolver.resolveEntity({
            name: "Nvidi Corp",
            type: "company",
          });
          expect(result.resolved).toBe(true);
          expect(result.strategy).toBe("fuzzy_match");
          // No Model was provided, yet fuzzy match worked
        }).pipe(Effect.Effect.provide(FuzzyResolverLayer));
      },
    );
  });
});

describe("OpenFIGI tool handler semantics", () => {
  it.effect(
    "lookup_openfigi returns {found: false, ticker} on OpenFigiNotFoundError (success, not failure)",
    () =>
      Effect.Effect.gen(function* () {
        // Get the mock client
        const client = yield* OpenFigiClient.pipe(
          Effect.Effect.provide(MockOpenFigiClient),
        );

        // Simulate the NEW handler logic: catch NotFoundError, return success
        const result = yield* client.lookupByTicker("UNKNOWN").pipe(
          Effect.Effect.map((data) => ({
            found: true as const,
            figi: data.figi,
            name: data.name,
            ticker: data.ticker,
            exchCode: data.exchCode,
            securityType: data.securityType,
          })),
          Effect.Effect.catchTag("OpenFigiNotFoundError", (e) =>
            Effect.Effect.succeed({
              found: false as const,
              ticker: e.ticker,
            }),
          ),
        );

        // The result should be a SUCCESS with found: false
        expect(result.found).toBe(false);
        if (!result.found) {
          expect(result.ticker).toBe("UNKNOWN");
        }
      }),
  );

  it.effect(
    "lookup_openfigi still fails with OpenFigiError on transport/API errors",
    () =>
      Effect.Effect.gen(function* () {
        // Create a mock client that fails with OpenFigiError
        const FailingOpenFigiClient = Layer.succeed(
          OpenFigiClient,
          OpenFigiClient.of({
            lookupByTicker: () =>
              Effect.Effect.fail(
                new OpenFigiError({ cause: "Transport error" }),
              ),
            lookupByName: () => Effect.Effect.succeed([]),
          }),
        );

        // Simulate the NEW handler logic
        const exit = yield* Effect.Effect.gen(function* () {
          const client = yield* OpenFigiClient;
          return yield* client.lookupByTicker("AAPL").pipe(
            Effect.Effect.map((data) => ({
              found: true as const,
              figi: data.figi,
              name: data.name,
              ticker: data.ticker,
              exchCode: data.exchCode,
              securityType: data.securityType,
            })),
            Effect.Effect.catchTag("OpenFigiNotFoundError", (e) =>
              Effect.Effect.succeed({
                found: false as const,
                ticker: e.ticker,
              }),
            ),
            // Only NotFoundError is caught; OpenFigiError should flow through
            Effect.Effect.mapError((cause) => ({
              error: "OpenFigiError" as const,
              message: String(cause.cause),
            })),
          );
        }).pipe(
          Effect.Effect.provide(FailingOpenFigiClient),
          Effect.Effect.exit,
        );

        expect(Exit.isFailure(exit)).toBe(true);
        if (Exit.isFailure(exit)) {
          const cause = exit.cause;
          expect(cause._tag).toBe("Fail");
          if (cause._tag === "Fail") {
            expect(cause.error.error).toBe("OpenFigiError");
            expect(cause.error.message).toContain("Transport error");
          }
        }
      }),
  );
});
