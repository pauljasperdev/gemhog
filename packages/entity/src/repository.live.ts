import type { SqlError } from "@effect/sql/SqlError";
import { PgDrizzle } from "@effect/sql-drizzle/Pg";
import type {
  Entity as DbEntity,
  EntityAlias as DbEntityAlias,
} from "@gemhog/db/entity";
import { and, eq, ilike, sql } from "drizzle-orm";
import * as Effect from "effect";
import { annotateCurrentSpan } from "effect/Effect";
import { EntityNotFoundError, EntityRepositoryError } from "./errors";
import { EntityRepository } from "./repository";
import type { EntityAliasResponse, EntityResponse, EntityType } from "./schema";
import { entity, entityAlias } from "./sql";

function mapToEntity(row: DbEntity): EntityResponse {
  return {
    id: row.id,
    canonical_name: row.canonicalName,
    type: row.type,
    figi: row.figi,
    wikidata_qid: row.wikidataQid,
    ticker: row.ticker,
    exchange: row.exchange,
    description: row.description,
    metadata: row.metadata,
    status: row.status,
    created_at: row.createdAt.toISOString(),
    updated_at: row.updatedAt.toISOString(),
  };
}

function mapToAlias(row: DbEntityAlias): EntityAliasResponse {
  return {
    id: row.id,
    entity_id: row.entityId,
    alias: row.alias,
    alias_type: row.aliasType,
    source: row.source,
    created_at: row.createdAt.toISOString(),
    updated_at: row.updatedAt.toISOString(),
  };
}

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

export const EntityRepositoryLive = Effect.Layer.effect(
  EntityRepository,
  Effect.Effect.gen(function* () {
    const db = yield* PgDrizzle;

    const createEntity = Effect.Effect.fn("entity.repository.createEntity")(
      function* (data: CreateEntityInput) {
        yield* annotateCurrentSpan("canonicalName", data.canonical_name);

        const rows = yield* db
          .insert(entity)
          .values({
            canonicalName: data.canonical_name,
            type: data.type,
            figi: data.figi ?? null,
            wikidataQid: data.wikidata_qid ?? null,
            ticker: data.ticker ?? null,
            exchange: data.exchange ?? null,
            description: data.description ?? null,
            metadata: data.metadata ?? {},
            status: data.status ?? "active",
          })
          .returning();

        // biome-ignore lint/style/noNonNullAssertion: Database insert returns at least one row.
        return mapToEntity(rows[0]!);
      },
      (eff) =>
        eff.pipe(
          Effect.Effect.catchTag("SqlError", (sqlError: SqlError) =>
            Effect.Effect.fail(
              new EntityRepositoryError({
                cause: `Database operation failed during entity create: ${sqlError.message}`,
              }),
            ),
          ),
        ),
    );

    const updateEntity = Effect.Effect.fn("entity.repository.updateEntity")(
      function* (id: string, data: UpdateEntityInput) {
        yield* annotateCurrentSpan("entityId", id);

        const updateData = Object.fromEntries(
          Object.entries({
            canonicalName: data.canonical_name,
            figi: data.figi,
            wikidataQid: data.wikidata_qid,
            ticker: data.ticker,
            exchange: data.exchange,
            description: data.description,
            metadata: data.metadata,
            status: data.status,
          }).filter(([, v]) => v !== undefined),
        );

        const rows = yield* db
          .update(entity)
          .set(updateData)
          .where(eq(entity.id, id))
          .returning();

        const row = rows[0];
        if (!row) {
          return yield* Effect.Effect.fail(
            new EntityNotFoundError({ identifier: id }),
          );
        }
        return mapToEntity(row);
      },
      (eff) =>
        eff.pipe(
          Effect.Effect.catchTag("SqlError", (sqlError: SqlError) =>
            Effect.Effect.fail(
              new EntityRepositoryError({
                cause: `Database operation failed during entity update: ${sqlError.message}`,
              }),
            ),
          ),
        ),
    );

    const readEntityById = Effect.Effect.fn("entity.repository.readEntityById")(
      function* (id: string) {
        yield* annotateCurrentSpan("entityId", id);

        const rows = yield* db.select().from(entity).where(eq(entity.id, id));

        const row = rows[0];
        if (!row) {
          return yield* Effect.Effect.fail(
            new EntityNotFoundError({ identifier: id }),
          );
        }
        return mapToEntity(row);
      },
      (eff) =>
        eff.pipe(
          Effect.Effect.catchTag("SqlError", (sqlError: SqlError) =>
            Effect.Effect.fail(
              new EntityRepositoryError({
                cause: `Database operation failed during entity read: ${sqlError.message}`,
              }),
            ),
          ),
        ),
    );

    const readEntityByTicker = Effect.Effect.fn(
      "entity.repository.readEntityByTicker",
    )(
      function* (ticker: string) {
        yield* annotateCurrentSpan("ticker", ticker);

        const rows = yield* db
          .select()
          .from(entity)
          .where(eq(entity.ticker, ticker));

        const row = rows[0];
        if (!row) {
          return yield* Effect.Effect.fail(
            new EntityNotFoundError({ identifier: ticker }),
          );
        }
        return mapToEntity(row);
      },
      (eff) =>
        eff.pipe(
          Effect.Effect.catchTag("SqlError", (sqlError: SqlError) =>
            Effect.Effect.fail(
              new EntityRepositoryError({
                cause: `Database operation failed during entity read by ticker: ${sqlError.message}`,
              }),
            ),
          ),
        ),
    );

    const searchEntitiesByTicker = Effect.Effect.fn(
      "entity.repository.searchEntitiesByTicker",
    )(
      function* (ticker: string) {
        yield* annotateCurrentSpan("ticker", ticker);

        // Case-insensitive match on ticker column.
        // Returns ALL matches - the resolver must handle disambiguation
        // when a ticker is listed on multiple exchanges.
        const rows = yield* db
          .select()
          .from(entity)
          .where(ilike(entity.ticker, ticker));

        return rows.map(mapToEntity);
      },
      (eff) =>
        eff.pipe(
          Effect.Effect.catchTag("SqlError", (sqlError: SqlError) =>
            Effect.Effect.fail(
              new EntityRepositoryError({
                cause: `Database operation failed during entity search by ticker: ${sqlError.message}`,
              }),
            ),
          ),
        ),
    );

    const searchEntitiesByName = Effect.Effect.fn(
      "entity.repository.searchEntitiesByName",
    )(
      function* (query: string, type?: EntityType) {
        yield* annotateCurrentSpan("query", query);
        if (type) {
          yield* annotateCurrentSpan("type", type);
        }

        // Exact case-insensitive match on canonical name (no substring wildcards).
        // NOTE: When multiple entities share the same canonical name (which should be
        // rare given the unique constraint on (canonical_name, type)), the resolver
        // will fall through to fuzzy/LLM resolution since byName.length !== 1.
        const condition = type
          ? and(ilike(entity.canonicalName, query), eq(entity.type, type))
          : ilike(entity.canonicalName, query);
        const rows = yield* db.select().from(entity).where(condition);

        return rows.map(mapToEntity);
      },
      (eff) =>
        eff.pipe(
          Effect.Effect.catchTag("SqlError", (sqlError: SqlError) =>
            Effect.Effect.fail(
              new EntityRepositoryError({
                cause: `Database operation failed during entity search by name: ${sqlError.message}`,
              }),
            ),
          ),
        ),
    );

    const searchEntitiesFuzzy = Effect.Effect.fn(
      "entity.repository.searchEntitiesFuzzy",
    )(
      function* (query: string, threshold = 0.9) {
        yield* annotateCurrentSpan("query", query);
        yield* annotateCurrentSpan("threshold", threshold);

        // Fuzzy search matches against both canonical name AND aliases.
        // Returns entities where EITHER the canonical name OR any alias exceeds threshold.
        // The score is the MAX of canonical name similarity and best alias similarity.
        const rows = yield* db
          .select({
            id: entity.id,
            canonicalName: entity.canonicalName,
            type: entity.type,
            figi: entity.figi,
            wikidataQid: entity.wikidataQid,
            ticker: entity.ticker,
            exchange: entity.exchange,
            description: entity.description,
            metadata: entity.metadata,
            status: entity.status,
            createdAt: entity.createdAt,
            updatedAt: entity.updatedAt,
            score: sql<number>`GREATEST(
              similarity(${entity.canonicalName}, ${query}),
              COALESCE(MAX(similarity(${entityAlias.alias}, ${query})), 0)
            )`,
          })
          .from(entity)
          .leftJoin(entityAlias, eq(entityAlias.entityId, entity.id))
          .groupBy(
            entity.id,
            entity.canonicalName,
            entity.type,
            entity.figi,
            entity.wikidataQid,
            entity.ticker,
            entity.exchange,
            entity.description,
            entity.metadata,
            entity.status,
            entity.createdAt,
            entity.updatedAt,
          )
          .having(
            sql`GREATEST(
              similarity(${entity.canonicalName}, ${query}),
              COALESCE(MAX(similarity(${entityAlias.alias}, ${query})), 0)
            ) > ${threshold}`,
          )
          .orderBy(
            sql`GREATEST(
              similarity(${entity.canonicalName}, ${query}),
              COALESCE(MAX(similarity(${entityAlias.alias}, ${query})), 0)
            ) DESC`,
          );
        return rows.map((r) => ({
          entity: mapToEntity(r),
          score: r.score,
        }));
      },
      (eff) =>
        eff.pipe(
          Effect.Effect.catchTag("SqlError", (sqlError: SqlError) =>
            Effect.Effect.fail(
              new EntityRepositoryError({
                cause: `Database operation failed during fuzzy entity search: ${sqlError.message}`,
              }),
            ),
          ),
        ),
    );

    const createAlias = Effect.Effect.fn("entity.repository.createAlias")(
      function* (data: CreateAliasInput) {
        yield* annotateCurrentSpan("entityId", data.entity_id);
        yield* annotateCurrentSpan("alias", data.alias);

        const rows = yield* db
          .insert(entityAlias)
          .values({
            entityId: data.entity_id,
            alias: data.alias,
            aliasType: data.alias_type,
            source: data.source,
          })
          .returning();

        // biome-ignore lint/style/noNonNullAssertion: Database insert returns at least one row.
        return mapToAlias(rows[0]!);
      },
      (eff) =>
        eff.pipe(
          Effect.Effect.catchTag("SqlError", (sqlError: SqlError) =>
            Effect.Effect.fail(
              new EntityRepositoryError({
                cause: `Database operation failed during alias create: ${sqlError.message}`,
              }),
            ),
          ),
        ),
    );

    const findEntityByAlias = Effect.Effect.fn(
      "entity.repository.findEntityByAlias",
    )(
      function* (alias: string) {
        yield* annotateCurrentSpan("alias", alias);

        const rows = yield* db
          .select({
            entity: entity,
          })
          .from(entityAlias)
          .innerJoin(entity, eq(entityAlias.entityId, entity.id))
          .where(ilike(entityAlias.alias, alias));

        const row = rows[0];
        return row ? mapToEntity(row.entity) : null;
      },
      (eff) =>
        eff.pipe(
          Effect.Effect.catchTag("SqlError", (sqlError: SqlError) =>
            Effect.Effect.fail(
              new EntityRepositoryError({
                cause: `Database operation failed during find entity by alias: ${sqlError.message}`,
              }),
            ),
          ),
        ),
    );

    return EntityRepository.of({
      createEntity,
      updateEntity,
      readEntityById,
      readEntityByTicker,
      searchEntitiesByTicker,
      searchEntitiesByName,
      searchEntitiesFuzzy,
      createAlias,
      findEntityByAlias,
    });
  }),
);
