import { Model } from "@gemhog/ai/model";
import * as Effect from "effect";
import { Ref, Schema } from "effect";
import { annotateCurrentSpan } from "effect/Effect";
import * as Option from "effect/Option";
import {
  type EntityNotFoundError,
  type EntityRepositoryError,
  EntityResolutionError,
  type EntityResolutionStage,
} from "./errors";
import { OpenFigiClient } from "./openfigi";
import { EntityRepository } from "./repository";
import { EntityResolverService } from "./resolver";
import { EntityToolkit } from "./resolver.tools";
import type { EntityResponse, EntityType } from "./schema";
import { WikidataClient } from "./wikidata";

interface EntityMention {
  readonly name: string;
  readonly type: EntityType;
  readonly context?: string;
}

interface ResolvedEntity {
  readonly resolved: boolean;
  readonly entity: EntityResponse | null;
  readonly strategy: "exact_match" | "fuzzy_match" | "llm_match" | "llm_create";
  readonly confidence: number;
}

const ResolutionResult = Schema.Struct({
  entity_id: Schema.String,
  action: Schema.Literal("matched", "created"),
});

const isTickerLike = (name: string): boolean =>
  /^[A-Z]{1,5}$/.test(name.toUpperCase());

const toEntityType = (value: string): EntityType => {
  switch (value) {
    case "company":
    case "asset":
    case "industry":
    case "institution":
    case "geography":
    case "person":
    case "other":
      return value;
    default:
      return "other";
  }
};

const getCauseMessage = (cause: unknown): string => {
  if (typeof cause === "string") {
    return cause;
  }

  if (cause instanceof Error && cause.message.length > 0) {
    return cause.message;
  }

  if (
    typeof cause === "object" &&
    cause !== null &&
    "message" in cause &&
    typeof cause.message === "string" &&
    cause.message.length > 0
  ) {
    return cause.message;
  }

  return String(cause);
};

const getUpstreamTag = (cause: unknown): string | undefined => {
  if (
    typeof cause === "object" &&
    cause !== null &&
    "_tag" in cause &&
    typeof cause._tag === "string"
  ) {
    return cause._tag;
  }

  return undefined;
};

const repositoryFailure = (
  stage: Extract<
    EntityResolutionStage,
    "exact_match" | "fuzzy_match" | "llm_entity_lookup"
  >,
  cause: unknown,
  attemptedStages?: ReadonlyArray<string>,
) =>
  new EntityResolutionError({
    code: "resolution.repository_failure",
    stage,
    message: `Entity repository failed during ${stage}: ${getCauseMessage(cause)}`,
    context: attemptedStages ? { attemptedStages } : {},
    cause,
  });

export const EntityResolverServiceLive = Effect.Layer.effect(
  EntityResolverService,
  Effect.Effect.gen(function* () {
    const repo = yield* EntityRepository;
    const openFigi = yield* OpenFigiClient;
    const wikidata = yield* WikidataClient;
    const modelOption = yield* Effect.Effect.serviceOption(Model);

    // Base toolkit layer for lookup tools (not dependent on per-call state)
    const baseLookupHandlers = {
      lookup_openfigi: ({ ticker }: { ticker: string }) =>
        openFigi.lookupByTicker(ticker).pipe(
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
          Effect.Effect.mapError((cause) => ({
            error: "OpenFigiError" as const,
            message: String(cause.cause),
          })),
        ),
      lookup_wikidata: ({ query, type }: { query: string; type: string }) => {
        const effect =
          type === "person"
            ? wikidata.searchPerson(query)
            : type === "geography"
              ? wikidata.searchPlace(query)
              : wikidata.searchInstitution(query);
        return effect.pipe(
          Effect.Effect.mapError((cause) => ({
            error: "WikidataError" as const,
            message: String(cause.cause),
          })),
        );
      },
      add_alias: (params: {
        entity_id: string;
        alias: string;
        alias_type: "ticker" | "abbrev" | "legal" | "colloquial";
        source: string;
      }) =>
        repo
          .createAlias({
            entity_id: params.entity_id,
            alias: params.alias,
            alias_type: params.alias_type,
            source: params.source,
          })
          .pipe(
            Effect.Effect.map(() => ({ success: true })),
            Effect.Effect.mapError((error) => ({
              error: error._tag as
                | "EntityRepositoryError"
                | "EntityNotFoundError",
              message: String(error.cause ?? error),
            })),
          ),
    };

    // Factory function to create toolkit layer with per-call trustedEntityIds tracking
    const createToolkitLayer = (trustedEntityIdsRef: Ref.Ref<Set<string>>) =>
      EntityToolkit.toLayer({
        ...baseLookupHandlers,
        search_entities: ({ query }: { query: string }) =>
          repo.searchEntitiesFuzzy(query, 0.7).pipe(
            Effect.Effect.flatMap((results) =>
              Effect.Effect.gen(function* () {
                // Add all result IDs to trusted set
                const ids = results.map((r) => r.entity.id);
                yield* Ref.update(trustedEntityIdsRef, (set) => {
                  const newSet = new Set(set);
                  for (const id of ids) {
                    newSet.add(id);
                  }
                  return newSet;
                });
                return results.map((result) => ({
                  id: result.entity.id,
                  canonical_name: result.entity.canonical_name,
                  score: result.score,
                }));
              }),
            ),
            Effect.Effect.mapError((cause) => ({
              error: cause._tag as
                | "EntityRepositoryError"
                | "EntityNotFoundError",
              message: String(cause.cause ?? cause),
            })),
          ),
        create_entity: (params: {
          canonical_name: string;
          type: string;
          figi?: string;
          ticker?: string;
          wikidata_qid?: string;
          description?: string;
        }) =>
          repo
            .createEntity({
              canonical_name: params.canonical_name,
              type: toEntityType(params.type),
              figi: params.figi,
              ticker: params.ticker,
              wikidata_qid: params.wikidata_qid,
              description: params.description,
            })
            .pipe(
              Effect.Effect.flatMap((entity) =>
                Effect.Effect.gen(function* () {
                  // Add created entity ID to trusted set
                  yield* Ref.update(trustedEntityIdsRef, (set) => {
                    const newSet = new Set(set);
                    newSet.add(entity.id);
                    return newSet;
                  });
                  return { entity_id: entity.id };
                }),
              ),
              Effect.Effect.mapError((error) => ({
                error: error._tag as
                  | "EntityRepositoryError"
                  | "EntityNotFoundError",
                message: String(error.cause ?? error),
              })),
            ),
      });

    const exactMatch = (
      mention: EntityMention,
    ): Effect.Effect.Effect<
      EntityResponse | null,
      EntityRepositoryError,
      never
    > =>
      Effect.Effect.gen(function* () {
        yield* annotateCurrentSpan("stage", "exact_match");
        yield* annotateCurrentSpan("mentionName", mention.name);
        yield* annotateCurrentSpan("mentionType", mention.type);

        const byAlias = yield* repo.findEntityByAlias(mention.name);
        if (byAlias) {
          return byAlias;
        }

        if (isTickerLike(mention.name)) {
          // Search for all entities with matching ticker.
          // Only return if exactly one match; ambiguous tickers (e.g., same ticker
          // on multiple exchanges) fall through to fuzzy/LLM resolution.
          const byTicker = yield* repo.searchEntitiesByTicker(
            mention.name.toUpperCase(),
          );
          if (byTicker.length === 1) {
            return byTicker[0] ?? null;
          }
          // If 0 or 2+ matches, fall through to name search and fuzzy/LLM
        }

        const byName = yield* repo.searchEntitiesByName(mention.name);
        if (byName.length === 1) {
          return byName[0] ?? null;
        }

        return null;
      });

    const fuzzyMatch = (
      mention: EntityMention,
    ): Effect.Effect.Effect<
      { entity: EntityResponse; score: number } | null,
      EntityRepositoryError,
      never
    > =>
      Effect.Effect.gen(function* () {
        yield* annotateCurrentSpan("stage", "fuzzy_match");
        yield* annotateCurrentSpan("mentionName", mention.name);
        yield* annotateCurrentSpan("mentionType", mention.type);
        yield* annotateCurrentSpan("threshold", 0.9);

        const results = yield* repo.searchEntitiesFuzzy(mention.name, 0.9);

        yield* annotateCurrentSpan("candidateCount", results.length);

        if (results.length === 1) {
          const candidate = results[0];
          if (candidate && candidate.score > 0.9) {
            yield* repo.createAlias({
              entity_id: candidate.entity.id,
              alias: mention.name,
              alias_type: "colloquial",
              source: "extraction",
            });

            return {
              entity: candidate.entity,
              score: candidate.score,
            };
          }
        }

        return null;
      });

    const llmResolution = (
      mention: EntityMention,
      attemptedStages: ReadonlyArray<string>,
    ): Effect.Effect.Effect<ResolvedEntity, EntityResolutionError, never> =>
      Effect.Effect.gen(function* () {
        yield* annotateCurrentSpan("mentionName", mention.name);
        yield* annotateCurrentSpan("mentionType", mention.type);
        yield* annotateCurrentSpan("stage", "llm_prepare");

        // Create per-call trustedEntityIds Ref
        const trustedEntityIdsRef = yield* Ref.make(new Set<string>());

        // Build toolkit layer with trustedEntityIds tracking
        const perCallToolkitLayer = createToolkitLayer(trustedEntityIdsRef);
        const toolkit = EntityToolkit.pipe(
          Effect.Effect.provide(perCallToolkitLayer),
        );

        // Require model with stage context
        const model = yield* modelOption.pipe(
          Option.match({
            onNone: () =>
              Effect.Effect.fail(
                new EntityResolutionError({
                  code: "resolution.model_unavailable",
                  stage: "llm_prepare",
                  message: "LanguageModel not available",
                  context: {
                    mentionName: mention.name,
                    mentionType: mention.type,
                    attemptedStages,
                  },
                  cause: undefined,
                }),
              ),
            onSome: (service) => Effect.Effect.succeed(service),
          }),
        );

        const prompt = `You are resolving entity mentions to canonical records.

Entity mention: "${mention.name}"
Entity type: ${mention.type}
${mention.context ? `Context: ${mention.context}` : ""}

Use the available tools to:
1. Search for this entity in our database (search_entities)
2. If it's a company/asset, look it up in OpenFIGI (lookup_openfigi)
3. If it's a person/geography/institution, look it up in Wikidata (lookup_wikidata)
4. If you find a match: register the alias (add_alias) and return the entity_id
5. If no match exists: create a new entity (create_entity) with any data you found

Return only JSON with this shape:
{"entity_id":"string","action":"matched"|"created"}`;

        yield* annotateCurrentSpan("stage", "llm_tool");

        const generateResolution =
          model.generateObject as unknown as (options: {
            readonly prompt: string;
            readonly toolkit: typeof toolkit;
            readonly schema: typeof ResolutionResult;
            readonly toolCallId: "entity-resolution";
          }) => Effect.Effect.Effect<
            { readonly value: Schema.Schema.Type<typeof ResolutionResult> },
            unknown,
            never
          >;

        const result = yield* generateResolution({
          prompt,
          toolkit,
          schema: ResolutionResult,
          toolCallId: "entity-resolution",
        }).pipe(
          Effect.Effect.mapError(
            (cause: unknown) =>
              new EntityResolutionError({
                code: "resolution.tool_failure",
                stage: "llm_tool",
                message: getCauseMessage(cause),
                context: {
                  upstreamTag: getUpstreamTag(cause),
                  attemptedStages,
                },
                cause,
              }),
          ),
        );

        yield* annotateCurrentSpan("stage", "llm_parse");
        const resolution = result.value;

        yield* annotateCurrentSpan("stage", "llm_entity_lookup");

        // Validate that entity_id was produced by tools in this run
        const trustedIds = yield* Ref.get(trustedEntityIdsRef);
        if (!trustedIds.has(resolution.entity_id)) {
          return yield* Effect.Effect.fail(
            new EntityResolutionError({
              code: "resolution.entity_id_unverified",
              stage: "llm_entity_lookup",
              message:
                "Model returned entity_id that was not produced by tools in this run",
              context: {
                mentionName: mention.name,
                attemptedStages,
              },
            }),
          );
        }

        const entity = yield* repo.readEntityById(resolution.entity_id).pipe(
          Effect.Effect.catchTag(
            "EntityNotFoundError",
            (e: EntityNotFoundError) =>
              Effect.Effect.fail(
                new EntityResolutionError({
                  code: "resolution.entity_lookup_failed",
                  stage: "llm_entity_lookup",
                  message: `Entity not found after LLM resolution: ${e.identifier}`,
                  context: {
                    mentionName: mention.name,
                    attemptedStages,
                  },
                  cause: e,
                }),
              ),
          ),
          Effect.Effect.catchTag(
            "EntityRepositoryError",
            (e: EntityRepositoryError) =>
              Effect.Effect.fail(
                repositoryFailure(
                  "llm_entity_lookup",
                  e.cause,
                  attemptedStages,
                ),
              ),
          ),
        );

        const strategy =
          resolution.action === "matched"
            ? ("llm_match" as const)
            : ("llm_create" as const);

        return {
          resolved: true,
          entity,
          strategy,
          confidence: resolution.action === "matched" ? 0.8 : 0.7,
        };
      });

    const resolveEntity: (
      mention: EntityMention,
    ) => Effect.Effect.Effect<ResolvedEntity, EntityResolutionError, never> =
      Effect.Effect.fn("entity.resolver.resolveEntity")(function* (
        mention: EntityMention,
      ) {
        const attemptedStages: string[] = [];

        attemptedStages.push("exact_match");
        const exactMatchResult = yield* exactMatch(mention).pipe(
          Effect.Effect.mapError((e) =>
            repositoryFailure("exact_match", e.cause, attemptedStages),
          ),
        );

        if (exactMatchResult) {
          return {
            resolved: true,
            entity: exactMatchResult,
            strategy: "exact_match" as const,
            confidence: 1,
          };
        }

        attemptedStages.push("fuzzy_match");
        const fuzzyMatchResult = yield* fuzzyMatch(mention).pipe(
          Effect.Effect.mapError((e) =>
            repositoryFailure("fuzzy_match", e.cause, attemptedStages),
          ),
        );

        if (fuzzyMatchResult) {
          return {
            resolved: true,
            entity: fuzzyMatchResult.entity,
            strategy: "fuzzy_match" as const,
            confidence: fuzzyMatchResult.score,
          };
        }

        return yield* llmResolution(mention, attemptedStages);
      });

    return EntityResolverService.of({
      resolveEntity,
    });
  }),
);
