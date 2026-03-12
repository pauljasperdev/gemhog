# Gemhog Pipeline Plan

## Current State

- Repository is at planning stage for pipeline implementation.
- `src/` implementation modules are not present yet.
- No extraction, validation, ranking, embedding, ingestion, or output services
  are implemented in this package.
- `plan/pipeline.yaml` is the source of truth for build order, contracts, and
  behavior.

## Models

- `heavy`: `claude-opus-4-5` for highest-quality long-context agent work.
- `balanced`: `claude-sonnet-4-6` for quality/cost-sensitive agent stages.
- `fast`: `claude-haiku-4-5` for lightweight or latency-sensitive tasks.

## Schemas

- Implement `ExtractedClaim` with source metadata, claim body, entities, quotes,
  confidence, speaker attribution, timeframe, specificity, evidentiary basis,
  and disclosed position (`type`: micro|macro, `stance`, `entities`, `speaker`,
  `timeframe`, `specificity_level`, `evidentiary_basis`, `disclosed_position`).
- Define `ExtractedClaim.speaker` enums explicitly: `role` is
  `host|guest|unknown`, and `confidence` is `high|inferred|unknown`.
- Define `ExtractedClaim.timeframe.horizon` enums explicitly:
  `immediate|near_term|medium_term|long_term|structural|not_specified`.
- Implement `ValidatedClaim` as `ExtractedClaim` plus `validation.status = PASS`
  and `validated_at`.
- Implement `RankedClaim` as `ValidatedClaim` plus ranking score (`0.0-1.0`) and
  `ranking.tags`.
- Implement `EmbeddedClaim` as `RankedClaim` plus embedding payload and
  search-enabling fields (`embedding.vector`, `embedding.model`,
  `embedding.input_text`, `full_text`, `entity_names`, timestamps).
- Implement `Entity` as canonical entity record with identifiers, lifecycle
  status, and metadata (`canonical_name`, `type`, `figi`, `wikidata_qid`,
  `ticker`, `exchange`, `description`, `metadata`, `status`).
- Implement `EntityAlias` as variant-name mapping to canonical entities
  (`entity_id`, `alias`, `alias_type`, `source`).
- Implement `ClaimEntity` as many-to-many claim-to-entity link with primary
  mention flag and composite key (`claim_id`, `entity_id`, `mention_name`,
  `is_primary`).
- Implement `ranking_tag` enum/list with MVP tags: `notable_speaker`,
  `skin_in_game`, `high_specificity`, `catalyst_identified`.
- Implement `ValidationReport` for per-claim PASS/FAIL/REJECT statuses and
  summary counts.
- Implement `EpisodeStats` for per-episode extraction statistics and participant
  metadata (`episode_id`, `podcast_id`, `podcast_name`, `podcast_reach_score`,
  `claim_count`, `avg_confidence`, `hosts`, `guests`).

## Scripts

- Implement `schema-validate.ts` with input `ExtractedClaim[]` and output
  `{ valid, errors }` via Zod validation.
- Implement `embed-claims.ts` with input `RankedClaim[]` and output
  `EmbeddedClaim[]`, using OpenAI embeddings API `text-embedding-3-small` and
  generating search fields.
- Implement `validate-output.ts` with input `EmbeddedClaim[]` and output
  `{ valid, errors }` via Zod validation.

## Pipeline

### fetch-phase

- Implement transcript fetch from S3 path `daily/{date}/*.json`.
- Implement empty-input handling to skip run without error.

### extraction-phase

- Implement extraction orchestrator to process one transcript at a time and emit
  `extraction/{date}/{episode-id}-claims.json`.
- Implement `claim-extractor` agent using model alias `heavy` and
  investment-content filtering rules.
- Implement `schema-validate` script call as hard contract gate for extractor
  output.
- Implement `content-validator` agent using model alias `balanced` with
  PASS/FAIL/REJECT semantics and nine checks (faithfulness, reasoning quality,
  entity validity, coherence, investment-only content, confidence > 0.6,
  actionability, specificity, novelty).
- Implement `rank-claims` agent using model alias `balanced` to score and tag
  validated claims (`score` in `0.0-1.0`, `ranking_tags`).
- Implement `embed-claims` script call to add vectors and search-enabling
  fields.
- Implement orchestrator retry loop with max 2 rework cycles: FAIL claims get
  feedback and rework, PASS claims continue to ranking/embedding, unresolved
  FAIL claims are written to `extraction/{date}/unresolved.json`, and REJECT
  claims are dropped from downstream processing.

### ingestion-phase

- Implement `entity-resolver` agent with 3-layer matching: exact
  alias/ticker/canonical-name match, then `pg_trgm` fuzzy match at 0.9, then
  LLM-assisted resolution using OpenFIGI/Wikidata tools.
- Implement `persist-claims` persistence stage for claim rows, claim-entity
  links, and dedup metadata with pre-write check (cosine similarity > 0.92
  against same speaker + same entity sets `is_duplicate=true` and stores
  `original_claim_id`).
- Implement `expire-claims` nightly status transition for past-expiration
  claims.
- Implement `write-run-report` stage to emit `reports/{date}/run-report.json`
  with run metrics and errors.

### output-phase

- Implement `entity-search` against canonical names, tickers, and aliases.
- Implement `entity-card-view` with non-expired/non-duplicate filtering,
  sentiment breakdown, stance-wise argument clustering (cosine threshold ~0.85),
  recency weighting (1.0 at day 0 to 0.3 at 90+ days), and top N clusters per
  stance.
- Implement `discovery-view` for trending entities and sentiment extremes using
  query-time SQL aggregation on `claims` + `claim_entities`: trending velocity
  `mentions_7d / (mentions_30d/30*7)` with `min_mentions_7d >= 5` and
  `velocity >= 1.5`; sentiment extremes require `>= 90%` consensus and
  `min_claims >= 3`.

## Design Principles

1. Traceability: Every claim references source via `episode_id`; verbatim quotes
   support auditability; source block is immutable downstream.
2. Validation split: schema validation catches extractor contract bugs, while
   content validation checks semantic quality.
3. Entity-centric retrieval: claims resolve to canonical entities and are
   grouped at query time via embeddings.
4. Autonomous pipeline operation: validated outputs become queryable without
   manual review gates.
5. Canonical resolution discipline: variant names resolve to one entity record
   while preserving alias mappings.

---

## Decisions

### Output & Storage

- **Extraction phase output:** JSON files to
  `extraction/{date}/{episode_id}-claims.json` (episode extraction output)
- **Ingestion phase output:** Postgres database with JSONB claim storage +
  vector embeddings
- **Logging:** Structured JSON lines to `logs/{date}/run.log` (timestamp,
  episode_id, action, result/error)

### Entity Resolution

- **Three-layer matching:** Exact match (alias/ticker/canonical) → `pg_trgm`
  fuzzy match (0.9 threshold) → LLM resolver with OpenFIGI/Wikidata
- **Entity seeding:** On-demand via OpenFIGI/Wikidata, cached locally in
  entities table
- **Low-confidence entities:** Auto-create new entity record (source: extracted)
- **Alias registration:** Always register raw mention as alias (source:
  extracted)
- **Multi-entity claims:** Show on all entity pages (many-to-many via
  claim_entities table)

### Models & Agents

- **Extraction:** Anthropic Claude Opus with extended thinking (10k token
  budget) — heavy model for quality
- **Validation:** Anthropic Claude Sonnet — balanced cost/quality
- **Entity resolution:** Anthropic Claude Sonnet — balanced cost/quality
- **Ranking:** Anthropic Claude Sonnet — balanced cost/quality
- **Embedding:** OpenAI text-embedding-3-small (1536 dimensions)

### Query & Clustering

- **Argument grouping:** Embedding cosine similarity at query time (not
  pre-computed)
- **Clustering threshold:** ~0.85 cosine similarity
- **Top clusters:** Return top 5 per stance (configurable)
- Claim expiration: Claims with expiration_date in the past are excluded from
  all queries
- Recency weighting: claims decay linearly from weight 1.0 at 0 days to 0.3 at
  90+ days
- Deduplication: claims marked is_duplicate=true excluded from sentiment counts
  and source counts
- Credibility signals: ranking_tags (notable_speaker, skin_in_game) surfaced in
  cluster display
- **Sentiment breakdown:** Bullish/bearish/neutral percentages

### Infrastructure

- **Cron:** System cron (not application-level scheduler)
- **Schedule:** Nightly at 02:00 Europe/Berlin
- **Idempotency:** Skip already-processed episodes (by episode_id in database)
- **Error handling:** Log failures, continue with remaining claims/episodes
- **Database:** Postgres with pgvector extension for embeddings

### Discovery

- **Trending threshold:** velocity >= 1.5 (50%+ acceleration vs baseline)
- **Trending minimum:** 5+ mentions in 7 days (avoid noise)
- **Sentiment threshold:** 90%+ consensus for extremes
- **Sentiment minimum:** 3+ claims per entity
- **Computation:** Query-time SQL aggregation on demand (no batch job for MVP)

### Testing

- **Test data:** 3 investment podcast episodes in
  `packages/pipeline/plan/test-episodes/` for prompt iteration
- **Local mode:** Fallback to local filesystem if S3 not configured
- **Validation:** Zod schemas for all data structures

---

## Open Questions

None — all architectural decisions for this meta-plan scope are captured.

### Design Review Decisions (2026-03-03)

- Speaker attribution added to ExtractedClaim (flexible: high/inferred/unknown
  confidence)
- Verifiability schema removed (add back when building outcomes/track-record
  feature)
- Timeframe simplified to horizon + expiration_date only
- Entity.status simplified to active | inactive
- claim_entities uses composite PK (claim_id, entity_id)
- Discovery computation is query-time SQL, not daily batch job
- Pipeline flow order: validator → rank-claims → embed-claims (ranking before
  embedding)
