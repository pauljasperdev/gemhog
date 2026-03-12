import * as Effect from "effect";
import type { EntityResolutionError } from "./errors";
import type { EntityResponse, EntityType } from "./schema";

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

interface EntityResolverServiceShape {
  readonly resolveEntity: (
    mention: EntityMention,
  ) => Effect.Effect.Effect<ResolvedEntity, EntityResolutionError, never>;
}

export class EntityResolverService extends Effect.Context.Tag(
  "@gemhog/entity/EntityResolverService",
)<EntityResolverService, EntityResolverServiceShape>() {}
