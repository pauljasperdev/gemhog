import { Schema } from "effect";

export const ClaimSource = Schema.Struct({
  episode_id: Schema.String,
  podcast_id: Schema.String,
});

export type ClaimSource = Schema.Schema.Type<typeof ClaimSource>;

export const ClaimEntity = Schema.Struct({
  name: Schema.String,
  type: Schema.Literal(
    "company",
    "asset",
    "industry",
    "institution",
    "geography",
    "person",
    "other",
  ),
});

export type ClaimEntity = Schema.Schema.Type<typeof ClaimEntity>;

export const Speaker = Schema.Struct({
  name: Schema.NullOr(Schema.String),
  role: Schema.Literal("host", "guest", "unknown"),
  company: Schema.NullOr(Schema.String),
  speaker_label: Schema.NullOr(Schema.String),
  confidence: Schema.Literal("high", "inferred", "unknown"),
});

export type Speaker = Schema.Schema.Type<typeof Speaker>;

// HorizonDefinitions defines the authoritative time ranges for each horizon bucket.
// Literals are derived from these keys so definitions and schema stay in sync.
export const HorizonDefinitions = {
  immediate: {
    range: "0-2 weeks",
    description: "earnings reaction, breaking news",
  },
  near_term: {
    range: "2 weeks - 3 months",
    description: "quarter-over-quarter",
  },
  medium_term: { range: "3 months - 1 year", description: "annual cycle" },
  long_term: { range: "1-5 years", description: "business cycle" },
  structural: { range: "5+ years", description: "secular/demographic trends" },
  not_specified: { range: null, description: "no time reference given" },
} as const;

export type Horizon = keyof typeof HorizonDefinitions;

export const Timeframe = Schema.Struct({
  horizon: Schema.Literal(
    ...(Object.keys(HorizonDefinitions) as [Horizon, ...Horizon[]]),
  ),
  expiration_date: Schema.NullOr(Schema.String),
});

export type Timeframe = Schema.Schema.Type<typeof Timeframe>;

export const DisclosedPosition = Schema.Struct({
  type: Schema.Literal("long", "short", "none_stated", "not_mentioned"),
  position_quote: Schema.NullOr(Schema.String),
});

export type DisclosedPosition = Schema.Schema.Type<typeof DisclosedPosition>;

export const ExtractedClaim = Schema.Struct({
  id: Schema.String,
  source: ClaimSource,
  claim: Schema.Struct({
    type: Schema.Literal("micro", "macro"),
    stance: Schema.Literal("bullish", "bearish", "neutral"),
    statement: Schema.String,
    reasoning: Schema.String,
    entities: Schema.Array(ClaimEntity),
    quotes: Schema.Array(Schema.String),
  }),
  extraction_confidence: Schema.Number,
  speaker: Speaker,
  timeframe: Timeframe,
  specificity_level: Schema.Literal("high", "medium", "low", "background"),
  evidentiary_basis: Schema.Literal(
    "reported_data",
    "expert_opinion",
    "company_statement",
    "market_observation",
    "speculative",
  ),
  disclosed_position: DisclosedPosition,
});

export type ExtractedClaim = Schema.Schema.Type<typeof ExtractedClaim>;

export const ValidationMetadata = Schema.Struct({
  status: Schema.Literal("PASS", "FAIL", "REJECT"),
  validated_at: Schema.String,
});

export type ValidationMetadata = Schema.Schema.Type<typeof ValidationMetadata>;

export const ValidatedClaim = Schema.Struct({
  ...ExtractedClaim.fields,
  validation: ValidationMetadata,
});

export type ValidatedClaim = Schema.Schema.Type<typeof ValidatedClaim>;

// RankingTagDefinitions defines the meaning of each ranking tag.
// MVP tags for credibility and quality signals.
export const RankingTagDefinitions = {
  notable_speaker:
    "recognized authority with track record/credentials (typically guests over hosts)",
  skin_in_game: "speaker disclosed personal position in the asset",
  high_specificity: "concrete claim: ticker + direction + target + timeline",
  catalyst_identified: "clear event/trigger that will move the asset",
} as const;

export type RankingTag = keyof typeof RankingTagDefinitions;

export const RankingMetadata = Schema.Struct({
  score: Schema.Number,
  tags: Schema.Array(
    Schema.Literal(
      ...(Object.keys(RankingTagDefinitions) as [RankingTag, ...RankingTag[]]),
    ),
  ),
});

export type RankingMetadata = Schema.Schema.Type<typeof RankingMetadata>;

export const RankedClaim = Schema.Struct({
  ...ValidatedClaim.fields,
  ranking: RankingMetadata,
});

export type RankedClaim = Schema.Schema.Type<typeof RankedClaim>;

export const EmbeddingMetadata = Schema.Struct({
  vector: Schema.Array(Schema.Number),
  model: Schema.String,
  input_text: Schema.String,
});

export type EmbeddingMetadata = Schema.Schema.Type<typeof EmbeddingMetadata>;

export const EmbeddedClaim = Schema.Struct({
  ...RankedClaim.fields,
  embedding: EmbeddingMetadata,
  full_text: Schema.String,
  entity_names: Schema.Array(Schema.String),
  created_at: Schema.String,
  updated_at: Schema.String,
});

export type EmbeddedClaim = Schema.Schema.Type<typeof EmbeddedClaim>;

export const EpisodeStats = Schema.Struct({
  episode_id: Schema.String,
  podcast_id: Schema.String,
  podcast_name: Schema.String,
  podcast_reach_score: Schema.Number,
  claim_count: Schema.Number,
  avg_confidence: Schema.NullOr(Schema.Number),
  hosts: Schema.Array(
    Schema.Struct({
      name: Schema.String,
      company: Schema.NullOr(Schema.String),
    }),
  ),
  guests: Schema.Array(
    Schema.Struct({
      name: Schema.String,
      company: Schema.NullOr(Schema.String),
      occupation: Schema.NullOr(Schema.String),
    }),
  ),
});

export type EpisodeStats = Schema.Schema.Type<typeof EpisodeStats>;

export const ValidationReportItem = Schema.Struct({
  claim_index: Schema.Number,
  status: Schema.Literal("PASS", "FAIL", "REJECT"),
  reason: Schema.NullOr(Schema.String),
});

export type ValidationReportItem = Schema.Schema.Type<
  typeof ValidationReportItem
>;

export const ValidationReport = Schema.Struct({
  claims: Schema.Array(ValidationReportItem),
  summary: Schema.Struct({
    passed: Schema.Number,
    failed: Schema.Number,
    rejected: Schema.Number,
  }),
});

export type ValidationReport = Schema.Schema.Type<typeof ValidationReport>;
