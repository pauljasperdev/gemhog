import "@gemhog/env/server";
import { FetchHttpClient } from "@effect/platform";
import { Effect, Layer, Logger } from "effect";
import { OpenFigiClient } from "../src/openfigi";
import { OpenFigiClientLive } from "../src/openfigi.live";

const query = process.argv[2] ?? "NVIDIA";

const program = Effect.gen(function* () {
  const client = yield* OpenFigiClient;
  const results = yield* client.lookupByName(query);

  // Contract assertion: results should be an array
  if (!Array.isArray(results)) {
    throw new Error("Contract violation: results is not an array");
  }
  // Contract assertion: if results exist, they should have required fields
  for (const result of results) {
    if (!result.figi || typeof result.figi !== "string") {
      throw new Error("Contract violation: result missing figi field");
    }
    if (!result.name || typeof result.name !== "string") {
      throw new Error("Contract violation: result missing name field");
    }
  }

  console.log(`Query: "${query}"`);
  console.log(`Results (${results.length}):`);
  console.log(JSON.stringify(results, null, 2));
});

Effect.runPromise(
  program.pipe(
    // Use pretty logger to surface Effect warnings (including pagination warnings)
    Effect.provide(Logger.pretty),
    Effect.provide(
      OpenFigiClientLive.pipe(Layer.provide(FetchHttpClient.layer)),
    ),
    Effect.catchAll((error) =>
      Effect.sync(() => {
        console.error("OpenFIGI name search failed:", error);
        process.exitCode = 1;
      }),
    ),
  ),
);
