import { Effect } from "effect";
import { PodscanService, PodscanServiceLive } from "../src/podcast";

const program = Effect.gen(function* () {
  const podScan = yield* PodscanService;
  const shows = yield* podScan.getTop("Investing", 10);
  console.log(JSON.stringify(shows, null, 2));
});

Effect.runPromise(
  program.pipe(
    Effect.provide(PodscanServiceLive),
    Effect.catchAll((error) =>
      Effect.sync(() => {
        console.error(error);
        process.exitCode = 1;
      }),
    ),
  ),
);
