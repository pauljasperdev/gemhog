/**
 * Live AI resolver smoke test.
 *
 * OPTIONAL: Requires an opencode OAuth session. Reads a bearer token from
 * `~/.local/share/opencode/auth.json` at the key `anthropic.access`.
 * No API key environment variable is read by this path.
 * Composes EntityLayer with AI at the script boundary for LLM fallback.
 *
 * Usage:
 *   pnpm --filter @gemhog/entity smoke:resolver:live [name] [type]
 *
 * Examples:
 *   pnpm --filter @gemhog/entity smoke:resolver:live "NVDA" company
 *   pnpm --filter @gemhog/entity smoke:resolver:live "Tim Cook" person
 */
import "@gemhog/env/server";
import { AnthropicBearerLayer, BalancedModelLayer } from "@gemhog/ai";
import { Effect, Layer } from "effect";
import { EntityLayer } from "../src/layer";
import { EntityResolverService } from "../src/resolver";
import type { EntityType } from "../src/schema";

const LiveAiResolverLayer = EntityLayer.pipe(
  Layer.provideMerge(
    BalancedModelLayer.pipe(Layer.provide(AnthropicBearerLayer)),
  ),
);

const program = Effect.gen(function* () {
  const name = process.argv[2] ?? "NVDA";
  const type = (process.argv[3] ?? "company") as EntityType;

  console.log(`Resolving: "${name}" (${type}) with AI fallback enabled...`);
  console.log("---");

  const resolver = yield* EntityResolverService;
  const result = yield* resolver.resolveEntity({ name, type });

  console.log(
    JSON.stringify(
      {
        resolved: result.resolved,
        strategy: result.strategy,
        confidence: result.confidence,
        entity: result.entity,
      },
      null,
      2,
    ),
  );

  if (result.strategy === "llm_match" || result.strategy === "llm_create") {
    console.log("---");
    console.log("✓ LLM fallback was used for resolution");
  }
});

Effect.runPromise(
  program.pipe(
    Effect.provide(LiveAiResolverLayer),
    Effect.catchAll((error) =>
      Effect.sync(() => {
        console.error("Resolution failed:", error);
        process.exitCode = 1;
      }),
    ),
  ),
);
