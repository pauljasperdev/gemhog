import { FetchHttpClient } from "@effect/platform";
import * as Effect from "effect";
import { SqlLive } from "../sql";
import { BucketServiceLive } from "./bucket.live";
import { BucketServiceMock } from "./bucket.mock";
import { PodscanServiceLive } from "./podscan.live";
import { MockPodscanService } from "./podscan.mock";
import { PodcastRepositoryLive } from "./repository.live";

export const PodscanLayer = Effect.Layer.suspend(() => {
  const isProd = process.env.SST_STAGE === "prod";
  return isProd ? PodscanServiceLive : MockPodscanService;
}).pipe(Effect.Layer.provide(FetchHttpClient.layer));

export const PodcastRepositoryLayer = PodcastRepositoryLive.pipe(
  Effect.Layer.provide(SqlLive),
);

export const BucketLayer = Effect.Layer.suspend(() => {
  const isDev = process.env.SST_DEV === "true";
  return isDev ? BucketServiceMock : BucketServiceLive;
});

export const PodcastLayer = Effect.Layer.mergeAll(
  PodcastRepositoryLayer,
  PodscanLayer,
  BucketLayer,
);
