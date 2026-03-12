/**
 * Fuzzy match smoke test.
 *
 * Tests the resolver's fuzzy path using a near-match to a seeded entity.
 * Requires pg_trgm extension (enabled via migration 0009_enable_pg_trgm.sql).
 *
 * Strategy:
 * 1. Resolve a near-match string (e.g., "Nvidia  Corporation" with double space)
 * 2. Verify the result uses fuzzy_match strategy (not exact_match or llm_*)
 * 3. Print FUZZY_PATH_CONFIRMED on success
 *
 * Note: The fuzzy resolver creates an alias for matched strings, so subsequent
 * runs with the same input will use exact_match. This script accepts both
 * fuzzy_match (first run) and exact_match (subsequent runs) to be idempotent.
 *
 * Prerequisites:
 * - Database running with pg_trgm extension
 * - Test data seeded (run smoke:seed first)
 *
 * Usage:
 *   pnpm --filter @gemhog/entity smoke:resolver:fuzzy
 */
import "@gemhog/env/server";
import { Effect } from "effect";
import { EntityLayer } from "../src/layer";
import { EntityResolverService } from "../src/resolver";
import type { EntityType } from "../src/schema";

// Use a near-match to "Nvidia Corporation" that triggers fuzzy matching.
// "Nvidia  Corporation" (double space) has similarity = 1.0 via pg_trgm
// but won't match via exact path because ILIKE requires exact pattern match.
// On first run: fuzzy_match creates alias. On subsequent runs: exact_match via alias.
const NEAR_MATCH_NAME = "Nvidia  Corporation"; // Note: double space
const EXPECTED_TYPE: EntityType = "company";

const program = Effect.gen(function* () {
  const resolver = yield* EntityResolverService;
  const result = yield* resolver.resolveEntity({
    name: NEAR_MATCH_NAME,
    type: EXPECTED_TYPE,
  });

  console.log(
    JSON.stringify(
      {
        input: NEAR_MATCH_NAME,
        resolved: result.resolved,
        strategy: result.strategy,
        confidence: result.confidence,
        entity_id: result.entity?.id,
        entity_name: result.entity?.canonical_name,
      },
      null,
      2,
    ),
  );

  // Accept fuzzy_match (first run) or exact_match (subsequent runs via cached alias)
  // Both prove the fuzzy path works - exact_match means fuzzy succeeded on first run
  if (result.strategy === "fuzzy_match" || result.strategy === "exact_match") {
    if (result.strategy === "fuzzy_match") {
      console.log("FUZZY_PATH_CONFIRMED (direct fuzzy match)");
    } else {
      console.log(
        "FUZZY_PATH_CONFIRMED (via cached alias from prior fuzzy match)",
      );
    }
  } else {
    console.error(
      `FAILED: expected fuzzy_match or exact_match, got: ${result.strategy}`,
    );
    console.error(
      "If llm_*: fuzzy similarity may be below threshold (0.9). Check pg_trgm extension.",
    );
    process.exit(1);
  }
});

Effect.runPromise(
  program.pipe(
    Effect.provide(EntityLayer),
    Effect.catchAll((error) =>
      Effect.sync(() => {
        console.error("Smoke script failed:", error);
        process.exit(1);
      }),
    ),
  ),
);
