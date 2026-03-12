import { relations, sql } from "drizzle-orm";
import {
  index,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  unique,
} from "drizzle-orm/pg-core";

export const entityTypeEnum = pgEnum("entity_type", [
  "company",
  "asset",
  "industry",
  "institution",
  "geography",
  "person",
  "other",
]);

export const entityStatusEnum = pgEnum("entity_status", ["active", "inactive"]);

export const aliasTypeEnum = pgEnum("alias_type", [
  "ticker",
  "abbrev",
  "legal",
  "colloquial",
]);

export const entity = pgTable(
  "entity",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    canonicalName: text("canonical_name").notNull(),
    type: entityTypeEnum("type").notNull(),
    figi: text("figi"),
    wikidataQid: text("wikidata_qid"),
    ticker: text("ticker"),
    exchange: text("exchange"),
    description: text("description"),
    metadata: jsonb("metadata"),
    status: entityStatusEnum("status").notNull().default("active"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [
    index("entity_canonical_name_idx").on(table.canonicalName),
    index("entity_ticker_idx").on(table.ticker),
    index("entity_canonical_name_trgm_idx").using(
      "gin",
      sql`${table.canonicalName} gin_trgm_ops`,
    ),
    unique("entity_canonical_name_type_unique").on(
      table.canonicalName,
      table.type,
    ),
  ],
);

export const entityAlias = pgTable(
  "entity_alias",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    entityId: text("entity_id")
      .notNull()
      .references(() => entity.id),
    alias: text("alias").notNull(),
    aliasType: aliasTypeEnum("alias_type").notNull(),
    source: text("source").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [
    index("entity_alias_alias_idx").on(table.alias),
    unique("entity_alias_alias_entity_id_unique").on(
      table.alias,
      table.entityId,
    ),
  ],
);

export type Entity = typeof entity.$inferSelect;
export type EntityAlias = typeof entityAlias.$inferSelect;

export const entityRelations = relations(entity, ({ many }) => ({
  aliases: many(entityAlias),
}));

export const entityAliasRelations = relations(entityAlias, ({ one }) => ({
  entity: one(entity, {
    fields: [entityAlias.entityId],
    references: [entity.id],
  }),
}));
