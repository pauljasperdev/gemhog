import { Effect, Layer } from "effect";
import { Model } from "../src/model";
import { HeavyModelLayer } from "../src/model.layer";
import { AntrhopicApiLayer } from "../src/provider.layer";

const program = Effect.gen(function* () {
  const model = yield* Model;
  const result = yield* model.generateText({
    prompt: "Tell one short dad joke. Return only the joke.",
  });
  const hasReasoning = result.reasoning.length > 0;
  console.log("tier: heavy");
  console.log("model: claude-opus-4-5");
  console.log(`text: ${result.text.trim()}`);
  console.log(
    `reasoning: ${hasReasoning ? `present (${result.reasoning.length} blocks)` : "none"}`,
  );
});

const layer = HeavyModelLayer.pipe(Layer.provide(AntrhopicApiLayer));

Effect.runPromise(
  program.pipe(
    Effect.provide(layer),
    Effect.catchAll((error) =>
      Effect.sync(() => {
        console.error(error);
        process.exitCode = 1;
      }),
    ),
  ),
);
