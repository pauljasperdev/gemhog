import * as Effect from "effect";
import type { BucketError } from "./errors";
import type { PodscanEpisode } from "./schema";

interface BucketServiceShape {
  readonly writeEpisode: (
    prefix: string,
    date: string,
    episode: PodscanEpisode,
  ) => Effect.Effect.Effect<void, BucketError, never>;
}

export class BucketService extends Effect.Context.Tag(
  "@gemhog/core/podcast/BucketService",
)<BucketService, BucketServiceShape>() {}
