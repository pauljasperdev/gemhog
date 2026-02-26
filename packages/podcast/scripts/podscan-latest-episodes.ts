import { Effect } from "effect";
import { PodscanLayer, PodscanService } from "../src";

const podcastId = "pd_a86x53rznwa5wgdv";

const limit = 5;

const program = Effect.gen(function* () {
  const podScan = yield* PodscanService;
  const { episodes } = yield* podScan.getLatest(podcastId, limit);
  yield* Effect.sync(() => {
    console.log(episodes);
  });
});

Effect.runPromise(
  program.pipe(
    Effect.provide(PodscanLayer),
    Effect.catchAll((error) =>
      Effect.sync(() => {
        console.error(
          "An error occurred while fetching the latest episodes:",
          error,
        );
        process.exitCode = 1;
      }),
    ),
  ),
);
