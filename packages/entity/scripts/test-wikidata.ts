import "@gemhog/env/server";
import { FetchHttpClient } from "@effect/platform";
import { Effect, Layer } from "effect";
import { WikidataClient } from "../src/wikidata";
import { WikidataClientLive } from "../src/wikidata.live";

const VALID_TYPES = ["person", "geography", "institution"] as const;
type ValidType = (typeof VALID_TYPES)[number];

const query = process.argv[2] ?? "Tim Cook";
const type = process.argv[3] ?? "person";

if (!VALID_TYPES.includes(type as ValidType)) {
  console.error(`Invalid type: "${type}"`);
  console.error(`Valid types: ${VALID_TYPES.join(", ")}`);
  process.exitCode = 1;
} else {
  const program = Effect.gen(function* () {
    const client = yield* WikidataClient;
    const results =
      type === "person"
        ? yield* client.searchPerson(query)
        : type === "geography"
          ? yield* client.searchPlace(query)
          : yield* client.searchInstitution(query);

    // Contract assertion: results should be an array
    if (!Array.isArray(results)) {
      throw new Error("Contract violation: results is not an array");
    }
    // Contract assertion: if results exist, they should have required fields
    for (const result of results) {
      if (!result.qid || typeof result.qid !== "string") {
        throw new Error("Contract violation: result missing qid field");
      }
      if (!result.label || typeof result.label !== "string") {
        throw new Error("Contract violation: result missing label field");
      }
    }

    console.log(`Query: "${query}" (type: ${type})`);
    console.log(`Results (${results.length}):`);
    console.log(JSON.stringify(results, null, 2));
  });

  Effect.runPromise(
    program.pipe(
      Effect.provide(
        WikidataClientLive.pipe(Layer.provide(FetchHttpClient.layer)),
      ),
      Effect.catchAll((error) =>
        Effect.sync(() => {
          console.error(error);
          process.exitCode = 1;
        }),
      ),
    ),
  );
}
