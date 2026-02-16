import * as Effect from "effect";
import { DatabaseLive } from "../drizzle";
import { PodscanServiceLive } from "./podscan.live";
import { MockPodscanService } from "./podscan.mock";
import { PodcastRepositoryLive } from "./repository.live";

const PodscanLayer = Effect.Layer.unwrapEffect(
  Effect.Effect.gen(function* () {
    const stage = yield* Effect.Config.string("SST_STAGE").pipe(
      Effect.Config.withDefault("dev"),
    );
    if (stage === "prod") {
      return PodscanServiceLive;
    }
    return MockPodscanService;
  }),
);

export const PodcastLive = Effect.Layer.mergeAll(
  PodcastRepositoryLive,
  PodscanLayer,
).pipe(Effect.Layer.provide(DatabaseLive));
