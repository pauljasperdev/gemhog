import * as Effect from "effect";
import type { PodscanError } from "./errors";
import type {
  PodscanChartPodcast,
  PodscanEpisode,
  PodscanPagination,
  PodscanPodcastDetail,
} from "./schema";

interface PodscanServiceShape {
  readonly getTop: (
    category: string,
    limit: number,
  ) => Effect.Effect.Effect<
    ReadonlyArray<PodscanChartPodcast>,
    PodscanError,
    never
  >;

  readonly getLatest: (
    podcastId: string,
    limit?: number,
    since?: string,
    page?: number,
  ) => Effect.Effect.Effect<
    {
      readonly episodes: ReadonlyArray<PodscanEpisode>;
      readonly pagination: PodscanPagination;
    },
    PodscanError,
    never
  >;

  readonly getPodcast: (
    podcastId: string,
  ) => Effect.Effect.Effect<PodscanPodcastDetail, PodscanError, never>;
}

export class PodscanService extends Effect.Context.Tag(
  "@gemhog/podcast/PodscanService",
)<PodscanService, PodscanServiceShape>() {}
