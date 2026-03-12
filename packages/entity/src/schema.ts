import { Schema } from "effect";

export const EntityType = Schema.Literal(
  "company",
  "asset",
  "industry",
  "institution",
  "geography",
  "person",
  "other",
);
export type EntityType = Schema.Schema.Type<typeof EntityType>;

export const AliasType = Schema.Literal(
  "ticker",
  "abbrev",
  "legal",
  "colloquial",
);
export type AliasType = Schema.Schema.Type<typeof AliasType>;

export const EntityStatus = Schema.Literal("active", "inactive");
export type EntityStatus = Schema.Schema.Type<typeof EntityStatus>;

export const EntityMetadata = Schema.Unknown;
export type EntityMetadata = Schema.Schema.Type<typeof EntityMetadata>;

export const EntitySchema = Schema.Struct({
  id: Schema.String,
  canonical_name: Schema.String,
  type: EntityType,
  figi: Schema.NullOr(Schema.String),
  wikidata_qid: Schema.NullOr(Schema.String),
  ticker: Schema.NullOr(Schema.String),
  exchange: Schema.NullOr(Schema.String),
  description: Schema.NullOr(Schema.String),
  metadata: EntityMetadata,
  status: EntityStatus,
  created_at: Schema.String,
  updated_at: Schema.String,
});

export type EntityResponse = Schema.Schema.Type<typeof EntitySchema>;

export const EntityAliasSchema = Schema.Struct({
  id: Schema.String,
  entity_id: Schema.String,
  alias: Schema.String,
  alias_type: AliasType,
  source: Schema.String,
  created_at: Schema.String,
  updated_at: Schema.String,
});

export type EntityAliasResponse = Schema.Schema.Type<typeof EntityAliasSchema>;

export const ResolvedEntitySchema = Schema.Struct({
  entity: EntitySchema,
  match_confidence: Schema.Number,
  match_source: Schema.String,
});

export type ResolvedEntityResponse = Schema.Schema.Type<
  typeof ResolvedEntitySchema
>;
