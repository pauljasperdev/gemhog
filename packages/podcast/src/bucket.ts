import * as Effect from "effect";
import type { BucketError } from "./errors";
import type { PodscanEpisodeResponse } from "./schema";

interface BucketServiceShape {
  readonly writeEpisode: (
    prefix: string,
    date: string,
    episode: PodscanEpisodeResponse,
  ) => Effect.Effect.Effect<void, BucketError, never>;
}

export class BucketService extends Effect.Context.Tag(
  "@gemhog/podcast/BucketService",
)<BucketService, BucketServiceShape>() {}
