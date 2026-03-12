import * as Effect from "effect";
import type {
  EpisodeNotFoundError,
  PodcastNotFoundError,
  PodcastRepositoryError,
} from "./errors";
import type { PodscanEpisodeResponse, PodscanPodcastDetail } from "./schema";
import type { PodscanEpisode, PodscanPodcast } from "./sql";

interface PodcastRepositoryShape {
  readonly upsertPodcastByPodscanId: (
    data: PodscanPodcastDetail,
  ) => Effect.Effect.Effect<PodscanPodcast, PodcastRepositoryError, never>;

  readonly upsertEpisodeByPodscanId: (
    data: PodscanEpisodeResponse,
  ) => Effect.Effect.Effect<PodscanEpisode, PodcastRepositoryError, never>;

  readonly readPodcastById: (
    podcastId: string,
  ) => Effect.Effect.Effect<
    PodscanPodcast,
    PodcastRepositoryError | PodcastNotFoundError,
    never
  >;

  readonly readEpisodeById: (
    episodeId: string,
  ) => Effect.Effect.Effect<
    PodscanEpisode,
    PodcastRepositoryError | EpisodeNotFoundError,
    never
  >;

  readonly readEpisodesByPodcastId: (
    podcastId: string,
  ) => Effect.Effect.Effect<
    ReadonlyArray<PodscanEpisode>,
    PodcastRepositoryError,
    never
  >;

  readonly episodeExistsByPodscanId: (
    podscanEpisodeId: string,
  ) => Effect.Effect.Effect<boolean, PodcastRepositoryError, never>;

  readonly readPodcastByPodscanId: (
    podscanPodcastId: string,
  ) => Effect.Effect.Effect<
    PodscanPodcast,
    PodcastRepositoryError | PodcastNotFoundError,
    never
  >;
}

export class PodcastRepository extends Effect.Context.Tag(
  "@gemhog/podcast/PodcastRepository",
)<PodcastRepository, PodcastRepositoryShape>() {}
