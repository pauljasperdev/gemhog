import "@gemhog/env/server";
import { FetchHttpClient } from "@effect/platform";
import { Effect, Layer } from "effect";
import { OpenFigiClient } from "../src/openfigi";
import { OpenFigiClientLive } from "../src/openfigi.live";

const ticker = process.argv[2] ?? "AAPL";

const program = Effect.gen(function* () {
  const client = yield* OpenFigiClient;
  const result = yield* client.lookupByTicker(ticker);

  // Contract assertion: result should have required fields
  if (!result.figi || typeof result.figi !== "string") {
    throw new Error("Contract violation: result missing figi field");
  }
  if (!result.name || typeof result.name !== "string") {
    throw new Error("Contract violation: result missing name field");
  }
  if (!result.ticker || typeof result.ticker !== "string") {
    throw new Error("Contract violation: result missing ticker field");
  }
  if (!result.securityType || typeof result.securityType !== "string") {
    throw new Error("Contract violation: result missing securityType field");
  }

  console.log(`Ticker: ${ticker}`);
  console.log(JSON.stringify(result, null, 2));
});

Effect.runPromise(
  program.pipe(
    Effect.provide(
      OpenFigiClientLive.pipe(Layer.provide(FetchHttpClient.layer)),
    ),
    Effect.catchAll((error) =>
      Effect.sync(() => {
        if (error._tag === "OpenFigiNotFoundError") {
          console.log(
            `OpenFigiNotFoundError: ticker "${error.ticker}" not found in OpenFIGI`,
          );
          console.error("OpenFIGI lookup failed:", error);
        }
        process.exitCode = 1;
      }),
    ),
  ),
);
