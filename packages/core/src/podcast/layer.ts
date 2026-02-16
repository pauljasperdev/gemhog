import { FetchHttpClient } from "@effect/platform";
import * as Effect from "effect";
import { SqlLive } from "../sql";
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

export const PodcastLayer = Effect.Layer.mergeAll(
  PodcastRepositoryLayer,
  PodscanLayer,
);
