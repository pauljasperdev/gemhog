/**
 * Deterministic LLM fallback smoke test.
 *
 * Tests the resolver's non-exact path using MockModelLayer to avoid live LLM calls.
 *
 * Strategy:
 * 1. Resolve NVDA via exact match to get a real entity_id from the DB
 * 2. Resolve a non-existent entity using MockModelLayer, returning that entity_id
 * 3. Verify the result uses a non-exact strategy (llm_match)
 *
 * Usage:
 *   pnpm --filter @gemhog/entity smoke:resolver:fallback
 */
import "@gemhog/env/server";
import { MockModelLayer, MockModelText } from "@gemhog/ai";
import { Effect, Layer } from "effect";
import { EntityLayer } from "../src/layer";
import { EntityResolverService } from "../src/resolver";
import type { EntityType } from "../src/schema";

// Step 1: Resolve NVDA via exact match to get a real entity_id from the DB
const exactProgram = Effect.gen(function* () {
  const resolver = yield* EntityResolverService;
  const result = yield* resolver.resolveEntity({
    name: "NVDA",
    type: "company" as EntityType,
  });

  if (result.strategy !== "exact_match") {
    console.error(
      `Expected exact_match for NVDA, got: ${result.strategy}. Run smoke:seed first.`,
    );
    process.exit(1);
  }

  if (!result.entity?.id) {
    console.error("No entity ID returned for NVDA. Run smoke:seed first.");
    process.exit(1);
  }

  console.log(
    `✓ Exact match verified: strategy=${result.strategy}, entity_id=${result.entity.id}`,
  );
  return result.entity.id;
});

// Step 2: Create fallback program with mock model pointing to captured entity_id
const makeFallbackProgram = (entityId: string) => {
  // Mock LLM returns JSON matching the expected ResolutionResult schema
  const mockResponse = JSON.stringify({
    entity_id: entityId,
    action: "matched",
  });

  // Compose EntityLayer with MockModelLayer for deterministic LLM fallback
  const FallbackLayer = EntityLayer.pipe(
    Layer.provideMerge(
      MockModelLayer.pipe(
        Layer.provide(Layer.succeed(MockModelText, mockResponse)),
      ),
    ),
  );

  return Effect.gen(function* () {
    const resolver = yield* EntityResolverService;

    // Use a non-existent entity name to force LLM fallback
    const result = yield* resolver.resolveEntity({
      name: "UnknownEntityFallbackSmoke999",
      type: "company" as EntityType,
    });

    console.log(
      JSON.stringify(
        {
          resolved: result.resolved,
          strategy: result.strategy,
          confidence: result.confidence,
          entity_id: result.entity?.id,
        },
        null,
        2,
      ),
    );

    if (result.strategy !== "exact_match") {
      console.log("NON_EXACT_PATH_CONFIRMED");
    } else {
      console.error("FAILED: expected non-exact strategy");
      process.exit(1);
    }
  }).pipe(Effect.provide(FallbackLayer));
};

// Run sequentially: exact match first, then fallback with captured entity_id
Effect.runPromise(
  exactProgram.pipe(
    Effect.provide(EntityLayer),
    Effect.catchAll((error) =>
      Effect.sync(() => {
        console.error("Exact resolution failed:", error);
        process.exit(1);
      }),
    ),
  ),
)
  .then((entityId) => {
    return Effect.runPromise(
      makeFallbackProgram(entityId).pipe(
        Effect.catchAll((error) =>
          Effect.sync(() => {
            console.error("Fallback resolution failed:", error);
            process.exit(1);
          }),
        ),
      ),
    );
  })
  .catch((error) => {
    console.error("Smoke script failed:", error);
    process.exit(1);
  });
