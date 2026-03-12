import "@gemhog/env/server";
import { Effect } from "effect";
import { EntityLayer } from "../src/layer";
import { EntityResolverService } from "../src/resolver";
import type { EntityType } from "../src/schema";

const program = Effect.gen(function* () {
  const name = process.argv[2] ?? "NVDA";
  const type = (process.argv[3] ?? "company") as EntityType;

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

  // Assert exact_match for NVDA (default case)
  if (name === "NVDA" && result.strategy === "exact_match") {
    console.log("EXACT_PATH_CONFIRMED");
  } else if (name === "NVDA") {
    console.error(`Expected exact_match for NVDA, got: ${result.strategy}`);
    process.exitCode = 1;
  }
});

Effect.runPromise(
  program.pipe(
    Effect.provide(EntityLayer),
    Effect.catchAll((error) =>
      Effect.sync(() => {
        console.error(error);
        process.exitCode = 1;
      }),
    ),
  ),
);
