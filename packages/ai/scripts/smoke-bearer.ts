import { Effect, Layer } from "effect";
import { Model } from "../src/model";
import { LightModelLayer } from "../src/model.layer";
import { AnthropicBearerLayer } from "../src/provider.layer";

const program = Effect.gen(function* () {
  const model = yield* Model;
  const result = yield* model.generateText({
    prompt: "Tell one short dad joke. Return only the joke.",
  });
  console.log(result.text.trim());
});

Effect.runPromise(
  program.pipe(
    Effect.provide(LightModelLayer.pipe(Layer.provide(AnthropicBearerLayer))),
    Effect.catchAll((error) =>
      Effect.sync(() => {
        console.error(error);
        process.exitCode = 1;
      }),
    ),
  ),
);
