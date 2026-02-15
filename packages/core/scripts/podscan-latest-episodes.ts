import { Effect } from "effect";
import { PodScanService, PodScanServiceLive } from "../src/podscan";

const podcastId = "pd_a86x53rznwa5wgdv";

const limit = 5;

const program = Effect.gen(function* () {
  const podScan = yield* PodScanService;
  const { episodes } = yield* podScan.getLatest(podcastId, limit);
  yield* Effect.sync(() => {
    console.log(episodes);
  });
});

Effect.runPromise(
  program.pipe(
    Effect.provide(PodScanServiceLive),
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
