import * as Effect from "effect";

export type EntityResolutionCode =
  | "resolution.model_unavailable"
  | "resolution.tool_failure"
  | "resolution.output_invalid"
  | "resolution.entity_id_unverified"
  | "resolution.entity_lookup_failed"
  | "resolution.repository_failure";

export type EntityResolutionStage =
  | "exact_match"
  | "fuzzy_match"
  | "llm_prepare"
  | "llm_tool"
  | "llm_parse"
  | "llm_entity_lookup";

export interface EntityResolutionContext {
  readonly mentionName?: string;
  readonly mentionType?: string;
  readonly attemptedStages?: ReadonlyArray<string>;
  readonly upstreamTag?: string;
  readonly toolName?: string;
  readonly threshold?: number;
  readonly candidateCount?: number;
}

export class EntityNotFoundError extends Effect.Data.TaggedError(
  "EntityNotFoundError",
)<{
  identifier: string;
}> {}

export class EntityRepositoryError extends Effect.Data.TaggedError(
  "EntityRepositoryError",
)<{
  readonly cause: unknown;
}> {}

export class EntityResolutionError extends Effect.Data.TaggedError(
  "EntityResolutionError",
)<{
  readonly code: EntityResolutionCode;
  readonly stage: EntityResolutionStage;
  readonly message: string;
  readonly context: EntityResolutionContext;
  readonly cause?: unknown;
}> {}

export class AmbiguousEntityError extends Effect.Data.TaggedError(
  "AmbiguousEntityError",
)<{
  identifier: string;
  candidates: string[];
}> {}

export class OpenFigiError extends Effect.Data.TaggedError("OpenFigiError")<{
  readonly cause: unknown;
}> {}

export class OpenFigiNotFoundError extends Effect.Data.TaggedError(
  "OpenFigiNotFoundError",
)<{
  readonly ticker: string;
}> {}

export class WikidataError extends Effect.Data.TaggedError("WikidataError")<{
  readonly cause: unknown;
}> {}
