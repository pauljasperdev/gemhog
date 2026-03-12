import * as Effect from "effect";
import type { EntityNotFoundError, EntityRepositoryError } from "./errors";
import type { EntityAliasResponse, EntityResponse, EntityType } from "./schema";

interface CreateEntityInput {
  readonly canonical_name: string;
  readonly type: EntityType;
  readonly figi?: string | null;
  readonly wikidata_qid?: string | null;
  readonly ticker?: string | null;
  readonly exchange?: string | null;
  readonly description?: string | null;
  readonly metadata?: unknown;
  readonly status?: "active" | "inactive";
}

interface UpdateEntityInput {
  readonly canonical_name?: string;
  readonly figi?: string | null;
  readonly wikidata_qid?: string | null;
  readonly ticker?: string | null;
  readonly exchange?: string | null;
  readonly description?: string | null;
  readonly metadata?: unknown;
  readonly status?: "active" | "inactive";
}

interface CreateAliasInput {
  readonly entity_id: string;
  readonly alias: string;
  readonly alias_type: "ticker" | "abbrev" | "legal" | "colloquial";
  readonly source: string;
}

interface EntityRepositoryShape {
  readonly createEntity: (
    data: CreateEntityInput,
  ) => Effect.Effect.Effect<EntityResponse, EntityRepositoryError, never>;

  readonly updateEntity: (
    id: string,
    data: UpdateEntityInput,
  ) => Effect.Effect.Effect<
    EntityResponse,
    EntityRepositoryError | EntityNotFoundError,
    never
  >;

  readonly readEntityById: (
    id: string,
  ) => Effect.Effect.Effect<
    EntityResponse,
    EntityRepositoryError | EntityNotFoundError,
    never
  >;

  readonly readEntityByTicker: (
    ticker: string,
  ) => Effect.Effect.Effect<
    EntityResponse,
    EntityRepositoryError | EntityNotFoundError,
    never
  >;

  readonly searchEntitiesByTicker: (
    ticker: string,
  ) => Effect.Effect.Effect<
    ReadonlyArray<EntityResponse>,
    EntityRepositoryError,
    never
  >;

  readonly searchEntitiesByName: (
    query: string,
    type?: EntityType,
  ) => Effect.Effect.Effect<
    ReadonlyArray<EntityResponse>,
    EntityRepositoryError,
    never
  >;

  readonly searchEntitiesFuzzy: (
    query: string,
    threshold?: number,
  ) => Effect.Effect.Effect<
    ReadonlyArray<{ entity: EntityResponse; score: number }>,
    EntityRepositoryError,
    never
  >;

  readonly createAlias: (
    data: CreateAliasInput,
  ) => Effect.Effect.Effect<EntityAliasResponse, EntityRepositoryError, never>;
  readonly findEntityByAlias: (
    alias: string,
  ) => Effect.Effect.Effect<
    EntityResponse | null,
    EntityRepositoryError,
    never
  >;
}

export class EntityRepository extends Effect.Context.Tag(
  "@gemhog/entity/EntityRepository",
)<EntityRepository, EntityRepositoryShape>() {}
