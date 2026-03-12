import {
  boolean,
  date,
  index,
  jsonb,
  numeric,
  type PgColumn,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  vector,
} from "drizzle-orm/pg-core";

export const claimTypeEnum = pgEnum("claim_type", ["micro", "macro"]);
export const stanceEnum = pgEnum("stance", ["bullish", "bearish", "neutral"]);
export const horizonEnum = pgEnum("horizon", [
  "immediate",
  "near_term",
  "medium_term",
  "long_term",
  "structural",
  "not_specified",
]);
export const speakerRoleEnum = pgEnum("speaker_role", [
  "host",
  "guest",
  "unknown",
]);
export const speakerConfidenceEnum = pgEnum("speaker_confidence", [
  "high",
  "inferred",
  "unknown",
]);
export const specificityLevelEnum = pgEnum("specificity_level", [
  "high",
  "medium",
  "low",
  "background",
]);
export const evidentiaryBasisEnum = pgEnum("evidentiary_basis", [
  "reported_data",
  "expert_opinion",
  "company_statement",
  "market_observation",
  "speculative",
]);
export const positionTypeEnum = pgEnum("position_type", [
  "long",
  "short",
  "none_stated",
  "not_mentioned",
]);
export const rankingTagEnum = pgEnum("ranking_tag", [
  "notable_speaker",
  "skin_in_game",
  "high_specificity",
  "catalyst_identified",
]);
export const claimStatusEnum = pgEnum("claim_status", ["active", "expired"]);
export const validationStatusEnum = pgEnum("validation_status", [
  "PASS",
  "FAIL",
  "REJECT",
]);

export const claim = pgTable(
  "claim",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    episodeId: text("episode_id").notNull(),
    stance: stanceEnum("stance").notNull(),
    rankingScore: numeric("ranking_score", { precision: 3, scale: 2 }),
    rankingTags: text("ranking_tags").array(),
    entityNames: text("entity_names").array().notNull(),
    fullText: text("full_text").notNull(),
    embedding: vector("embedding", { dimensions: 1536 }),
    expirationDate: date("expiration_date"),
    status: claimStatusEnum("status").notNull().default("active"),
    isDuplicate: boolean("is_duplicate").notNull().default(false),
    originalClaimId: text("original_claim_id").references(
      (): PgColumn => claim.id,
    ),
    claimData: jsonb("claim_data").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [
    index("claim_episode_id_idx").on(table.episodeId),
    index("claim_status_idx").on(table.status),
  ],
);

export const claimEntity = pgTable(
  "claim_entity",
  {
    claimId: text("claim_id")
      .notNull()
      .references(() => claim.id),
    entityId: text("entity_id").notNull(),
    mentionName: text("mention_name").notNull(),
    isPrimary: boolean("is_primary").notNull().default(false),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.claimId, table.entityId] }),
    index("claim_entity_entity_id_idx").on(table.entityId),
  ],
);

export type Claim = typeof claim.$inferSelect;
export type ClaimEntity = typeof claimEntity.$inferSelect;
