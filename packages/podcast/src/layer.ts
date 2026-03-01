import { FetchHttpClient } from "@effect/platform";
import { SqlLive } from "@gemhog/db";
import { makeTracingLive } from "@gemhog/telemetry";
import * as Effect from "effect";
import { BucketServiceLive } from "./bucket.live";
import { BucketServiceMock } from "./bucket.mock";
import { PodscanServiceLive } from "./podscan.live";
import { MockPodscanService } from "./podscan.mock";
import { PodcastRepositoryLive } from "./repository.live";

export const PodscanLayer = Effect.Layer.unwrapEffect(
  Effect.Effect.gen(function* () {
    const stage = yield* Effect.Config.string("SST_STAGE");
    return stage === "dev" || stage === "prod"
      ? PodscanServiceLive
      : MockPodscanService;
  }),
).pipe(Effect.Layer.provide(FetchHttpClient.layer));
export const PodcastRepositoryLayer = PodcastRepositoryLive.pipe(
  Effect.Layer.provide(SqlLive),
);

export const BucketLayer = Effect.Layer.unwrapEffect(
  Effect.Effect.gen(function* () {
    const isDev = yield* Effect.Config.boolean("SST_DEV").pipe(
      Effect.Config.withDefault(false),
    );
    return isDev ? BucketServiceMock : BucketServiceLive;
  }),
);

export const PodcastLayer = Effect.Layer.mergeAll(
  makeTracingLive("gemhog-podcast"),
  PodcastRepositoryLayer,
  PodscanLayer,
  BucketLayer,
);
