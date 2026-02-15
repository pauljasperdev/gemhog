import * as Effect from "effect";
import type {
  EpisodeNotFoundError,
  PodcastNotFoundError,
  PodcastRepositoryError,
} from "./errors";
import type { PodscanEpisode, PodscanPodcastDetail } from "./schema";
import type { Episode, Podcast } from "./sql";

interface PodcastRepositoryShape {
  readonly upsertPodcastByPodscanId: (
    data: PodscanPodcastDetail,
  ) => Effect.Effect.Effect<Podcast, PodcastRepositoryError, never>;

  readonly upsertEpisodeByPodscanId: (
    data: PodscanEpisode,
  ) => Effect.Effect.Effect<Episode, PodcastRepositoryError, never>;

  readonly readPodcastById: (
    podcastId: string,
  ) => Effect.Effect.Effect<
    Podcast,
    PodcastRepositoryError | PodcastNotFoundError,
    never
  >;

  readonly readEpisodeById: (
    episodeId: string,
  ) => Effect.Effect.Effect<
    Episode,
    PodcastRepositoryError | EpisodeNotFoundError,
    never
  >;

  readonly readEpisodesByPodcastId: (
    podcastId: string,
  ) => Effect.Effect.Effect<
    ReadonlyArray<Episode>,
    PodcastRepositoryError,
    never
  >;
}

export class PodcastRepository extends Effect.Context.Tag(
  "@gemhog/core/podcast/PodcastRepository",
)<PodcastRepository, PodcastRepositoryShape>() {}
