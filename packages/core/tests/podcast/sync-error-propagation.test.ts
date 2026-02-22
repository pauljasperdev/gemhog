import { ConfigProvider, Effect, Layer } from "effect";
import { describe, expect, it } from "vitest";
import { effectHandler } from "../../../../apps/functions/src/sync-episodes-weekly";
import { BucketService } from "../../src/podcast/bucket";
import {
  PodcastNotFoundError,
  PodcastRepositoryError,
} from "../../src/podcast/errors";
import { BucketLayer } from "../../src/podcast/layer";
import { PodscanService } from "../../src/podcast/podscan";
import { MockPodscanService } from "../../src/podcast/podscan.mock";
import { PodcastRepository } from "../../src/podcast/repository";
import type {
  PodscanEpisode,
  PodscanPagination,
  PodscanPodcastDetail,
} from "../../src/podcast/schema";
import type { Episode, Podcast } from "../../src/podcast/sql";

const mockPagination: PodscanPagination = {
  total: 0,
  per_page: 10,
  current_page: 1,
  last_page: 0,
  from: 0,
  to: 0,
};

const buildPodcastDetail = (podcastId: string): PodscanPodcastDetail => ({
  podcast_id: podcastId,
  podcast_guid: `${podcastId}-guid`,
  podcast_name: `Podcast ${podcastId}`,
  podcast_url: `https://example.com/podcasts/${podcastId}`,
  podcast_description: "Mock podcast detail",
  podcast_image_url: "https://example.com/podcast.jpg",
  publisher_name: "Mock Publisher",
  is_active: true,
  rss_url: `https://example.com/podcasts/${podcastId}.xml`,
  episode_count: 0,
  last_posted_at: "2024-02-14T10:00:00Z",
  language: "en",
  region: "US",
  last_scanned_at: "2024-02-14T10:00:00Z",
  created_at: "2024-02-14T10:00:00Z",
  updated_at: "2024-02-14T10:00:00Z",
  is_duplicate: false,
  is_duplicate_of: null,
  podcast_itunes_id: null,
  podcast_spotify_id: null,
  podcast_reach_score: null,
  podcast_has_guests: null,
  podcast_has_sponsors: null,
  podcast_categories: [],
  podcast_iab_categories: [],
  reach: {},
  brand_safety: null,
});

const toPodcast = (detail: PodscanPodcastDetail): Podcast => ({
  id: `${detail.podcast_id}-id`,
  podscanPodcastId: detail.podcast_id,
  name: detail.podcast_name,
  url: detail.podcast_url,
  guid: detail.podcast_guid,
  description: detail.podcast_description,
  imageUrl: detail.podcast_image_url,
  publisherName: detail.publisher_name,
  rssUrl: detail.rss_url,
  language: detail.language,
  region: detail.region,
  itunesId: detail.podcast_itunes_id,
  spotifyId: detail.podcast_spotify_id,
  isDuplicateOf: detail.is_duplicate_of,
  lastPostedAt: new Date(detail.last_posted_at),
  lastScannedAt: new Date(detail.last_scanned_at),
  podscanCreatedAt: new Date(detail.created_at),
  podscanUpdatedAt: new Date(detail.updated_at),
  episodeCount: detail.episode_count,
  reachScore: detail.podcast_reach_score,
  isActive: detail.is_active,
  isDuplicate: detail.is_duplicate,
  hasGuests: detail.podcast_has_guests,
  hasSponsors: detail.podcast_has_sponsors,
  categories: detail.podcast_categories,
  iabCategories: detail.podcast_iab_categories,
  reach: detail.reach,
  brandSafety: detail.brand_safety,
  createdAt: new Date(),
  updatedAt: new Date(),
});

const toEpisode = (data: PodscanEpisode): Episode => ({
  id: `${data.episode_id}-id`,
  podscanEpisodeId: data.episode_id,
  podcastId: `${data.podcast.podcast_id}-id`,
  title: data.episode_title,
  description: data.episode_description,
  url: data.episode_url,
  imageUrl: data.episode_image_url,
  audioUrl: data.episode_audio_url,
  duration: data.episode_duration,
  wordCount: data.episode_word_count,
  postedAt: data.posted_at,
  categories: data.episode_categories,
  transcript: data.episode_transcript,
  fullyProcessed: data.episode_fully_processed,
  guid: data.episode_guid,
  hasGuests: data.episode_has_guests,
  hasSponsors: data.episode_has_sponsors,
  permalink: data.episode_permalink,
  metadata: data.metadata,
  topics: data.topics,
  createdAt: new Date(),
  updatedAt: new Date(),
});

describe("sync-episodes-weekly error propagation", () => {
  it("propagates PodcastRepositoryError from readPodcastByPodscanId", async () => {
    const FailingRepositoryLayer = Layer.succeed(
      PodcastRepository,
      PodcastRepository.of({
        readPodcastByPodscanId: () =>
          Effect.fail(
            new PodcastRepositoryError({ cause: "table does not exist" }),
          ),
        upsertPodcastByPodscanId: () =>
          Effect.fail(
            new PodcastRepositoryError({ cause: "table does not exist" }),
          ),
        upsertEpisodeByPodscanId: () =>
          Effect.fail(
            new PodcastRepositoryError({ cause: "table does not exist" }),
          ),
        readPodcastById: () =>
          Effect.fail(
            new PodcastRepositoryError({ cause: "table does not exist" }),
          ),
        readEpisodeById: () =>
          Effect.fail(
            new PodcastRepositoryError({ cause: "table does not exist" }),
          ),
        readEpisodesByPodcastId: () =>
          Effect.fail(
            new PodcastRepositoryError({ cause: "table does not exist" }),
          ),
        episodeExistsByPodscanId: () =>
          Effect.fail(
            new PodcastRepositoryError({ cause: "table does not exist" }),
          ),
      }),
    );

    const NoOpBucketLayer = Layer.succeed(
      BucketService,
      BucketService.of({
        writeEpisode: () => Effect.void,
      }),
    );

    const TestLayer = Layer.mergeAll(
      FailingRepositoryLayer,
      MockPodscanService,
      NoOpBucketLayer,
    );

    const mockEvent = {} as Record<string, unknown>;
    const mockContext = {} as Record<string, unknown>;

    const exit = await Effect.runPromiseExit(
      effectHandler(mockEvent, mockContext).pipe(Effect.provide(TestLayer)),
    );

    expect(exit._tag).toBe("Failure");
    if (exit._tag === "Failure") {
      expect(exit.cause).toBeDefined();
    }
  });

  it("returns success when all podcasts sync and latest episode list is empty", async () => {
    const sampleDetail = buildPodcastDetail("pd_sample");
    const samplePodcast = toPodcast(sampleDetail);
    const sampleEpisode = toEpisode({
      episode_id: "episode-sample",
      episode_title: "Sample Episode",
      episode_url: "https://example.com/episodes/sample",
      episode_audio_url: "https://example.com/audio/sample.mp3",
      episode_image_url: "https://example.com/image/sample.jpg",
      episode_duration: 100,
      episode_word_count: 100,
      episode_transcript: "sample",
      episode_description: "sample",
      episode_categories: [],
      episode_fully_processed: true,
      episode_guid: "episode-sample-guid",
      episode_has_guests: false,
      episode_has_sponsors: false,
      episode_permalink: null,
      episode_transcript_word_level_timestamps: {},
      metadata: {},
      topics: [],
      podcast: {
        podcast_id: "pd_sample",
        podcast_name: "Sample Podcast",
        podcast_url: "https://example.com/podcasts/sample",
      },
      posted_at: "2024-02-14T10:00:00Z",
      created_at: "2024-02-14T10:00:00Z",
      updated_at: "2024-02-14T10:00:00Z",
    });

    const SucceedingRepositoryLayer = Layer.succeed(
      PodcastRepository,
      PodcastRepository.of({
        readPodcastByPodscanId: (podcastId) =>
          Effect.fail(new PodcastNotFoundError({ identifier: podcastId })),
        upsertPodcastByPodscanId: (detail) => Effect.succeed(toPodcast(detail)),
        upsertEpisodeByPodscanId: (episode) =>
          Effect.succeed(toEpisode(episode)),
        readPodcastById: () => Effect.succeed(samplePodcast),
        readEpisodeById: () => Effect.succeed(sampleEpisode),
        readEpisodesByPodcastId: () => Effect.succeed([]),
        episodeExistsByPodscanId: () => Effect.succeed(false),
      }),
    );

    const EmptyEpisodesPodscanLayer = Layer.succeed(
      PodscanService,
      PodscanService.of({
        getTop: () => Effect.succeed([]),
        getLatest: () =>
          Effect.succeed({ episodes: [], pagination: mockPagination }),
        getPodcast: (podcastId) =>
          Effect.succeed(buildPodcastDetail(podcastId)),
      }),
    );

    const NoOpBucketLayer = Layer.succeed(
      BucketService,
      BucketService.of({
        writeEpisode: () => Effect.void,
      }),
    );

    const TestLayer = Layer.mergeAll(
      SucceedingRepositoryLayer,
      EmptyEpisodesPodscanLayer,
      NoOpBucketLayer,
    );

    const mockEvent = {} as Record<string, unknown>;
    const mockContext = {} as Record<string, unknown>;

    const exit = await Effect.runPromiseExit(
      effectHandler(mockEvent, mockContext).pipe(Effect.provide(TestLayer)),
    );

    expect(exit._tag).toBe("Success");
    if (exit._tag === "Success") {
      expect(exit.value.processed).toBe(10);
      expect(exit.value.totalEpisodes).toBe(0);
      expect(exit.value.errors).toEqual([]);
    }
  });

  it("BucketLayer resolves without SST_DEV error when SST_STAGE is provided", async () => {
    const testEffect = BucketService.pipe(Effect.asVoid);

    const providedEffect = testEffect.pipe(
      Effect.provide(BucketLayer),
    ) as Effect.Effect<void, unknown, never>;

    const exit = await Effect.runPromiseExit(
      Effect.withConfigProvider(
        ConfigProvider.fromMap(new Map([["SST_STAGE", "paul"]])),
      )(providedEffect),
    );

    expect(exit._tag).toBe("Success");
  });
});
