import { Effect } from "effect";
import { PodScanLive, PodScanService } from "../src/podscan";

const program = Effect.gen(function* () {
  const podScan = yield* PodScanService;
  const shows = yield* podScan.getTop("Investing", 10);
  console.log(JSON.stringify(shows, null, 2));
});

Effect.runPromise(
  program.pipe(
    Effect.provide(PodScanLive),
    Effect.catchAll((error) =>
      Effect.sync(() => {
        console.error(error);
        process.exitCode = 1;
      }),
    ),
  ),
);
