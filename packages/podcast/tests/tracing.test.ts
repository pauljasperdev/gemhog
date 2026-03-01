import * as NodeSdk from "@effect/opentelemetry/NodeSdk";
import { beforeEach, describe, expect, it } from "@effect/vitest";
import type { Episode, Podcast } from "@gemhog/db/podcast";
import {
  InMemorySpanExporter,
  SimpleSpanProcessor,
} from "@opentelemetry/sdk-trace-base";
import * as Effect from "effect";
import { BucketService } from "../src/bucket";
import { PodscanService } from "../src/podscan";
import { PodcastRepository } from "../src/repository";
import type {
  PodscanChartPodcast,
  PodscanEpisode,
  PodscanPodcastDetail,
} from "../src/schema";

function makeTestPodcast(overrides?: Partial<Podcast>): Podcast {
  return {
    id: overrides?.id ?? "test-podcast-id",
    podscanPodcastId: overrides?.podscanPodcastId ?? "test-podscan-id",
    name: overrides?.name ?? "Test Podcast",
    url: overrides?.url ?? "https://example.com",
    guid: overrides?.guid ?? null,
    description: overrides?.description ?? "A test podcast",
    imageUrl: overrides?.imageUrl ?? "https://example.com/image.jpg",
    publisherName: overrides?.publisherName ?? null,
    rssUrl: overrides?.rssUrl ?? "https://example.com/rss",
    language: overrides?.language ?? "en",
    region: overrides?.region ?? "US",
    itunesId: overrides?.itunesId ?? null,
    spotifyId: overrides?.spotifyId ?? null,
    isDuplicateOf: overrides?.isDuplicateOf ?? null,
    lastPostedAt: overrides?.lastPostedAt ?? new Date(),
    lastScannedAt: overrides?.lastScannedAt ?? new Date(),
    podscanCreatedAt: overrides?.podscanCreatedAt ?? new Date(),
    podscanUpdatedAt: overrides?.podscanUpdatedAt ?? new Date(),
    episodeCount: overrides?.episodeCount ?? 100,
    reachScore: overrides?.reachScore ?? null,
    isActive: overrides?.isActive ?? true,
    isDuplicate: overrides?.isDuplicate ?? false,
    hasGuests: overrides?.hasGuests ?? null,
    hasSponsors: overrides?.hasSponsors ?? null,
    categories: overrides?.categories ?? null,
    iabCategories: overrides?.iabCategories ?? null,
    reach: overrides?.reach ?? null,
    brandSafety: overrides?.brandSafety ?? null,
    createdAt: overrides?.createdAt ?? new Date(),
    updatedAt: overrides?.updatedAt ?? new Date(),
  };
}

function makeTestEpisode(overrides?: Partial<Episode>): Episode {
  return {
    id: overrides?.id ?? "test-episode-id",
    podcastId: overrides?.podcastId ?? "test-podcast-id",
    podscanEpisodeId: overrides?.podscanEpisodeId ?? "test-podscan-episode-id",
    title: overrides?.title ?? "Test Episode",
    description: overrides?.description ?? "A test episode",
    url: overrides?.url ?? "https://example.com/episode",
    imageUrl: overrides?.imageUrl ?? "https://example.com/image.jpg",
    audioUrl: overrides?.audioUrl ?? "https://example.com/audio.mp3",
    duration: overrides?.duration ?? 3600,
    wordCount: overrides?.wordCount ?? 5000,
    postedAt: overrides?.postedAt ?? "2024-01-01T00:00:00Z",
    categories: overrides?.categories ?? null,
    transcript: overrides?.transcript ?? "Test transcript",
    fullyProcessed: overrides?.fullyProcessed ?? true,
    guid: overrides?.guid ?? "test-guid",
    hasGuests: overrides?.hasGuests ?? false,
    hasSponsors: overrides?.hasSponsors ?? false,
    permalink: overrides?.permalink ?? null,
    metadata: overrides?.metadata ?? null,
    topics: overrides?.topics ?? null,
    createdAt: overrides?.createdAt ?? new Date(),
    updatedAt: overrides?.updatedAt ?? new Date(),
  };
}

function makeTestPodscanChartPodcast(
  overrides?: Partial<PodscanChartPodcast>,
): PodscanChartPodcast {
  return {
    rank: overrides?.rank ?? 1,
    name: overrides?.name ?? "Test Podcast",
    publisher: overrides?.publisher ?? "Test Publisher",
    movement: overrides?.movement ?? "up",
    podcast_id: overrides?.podcast_id ?? "test-podscan-id",
    thumbnail: overrides?.thumbnail ?? "https://example.com/thumb.jpg",
    audience_size: overrides?.audience_size ?? 10000,
    rating: overrides?.rating ?? 4.5,
    episode_count: overrides?.episode_count ?? 100,
    last_posted_at: overrides?.last_posted_at ?? 1234567890,
    frequency: overrides?.frequency ?? "weekly",
  };
}

function makeTestPodscanEpisode(
  overrides?: Partial<PodscanEpisode>,
): PodscanEpisode {
  return {
    episode_id: overrides?.episode_id ?? "test-episode-id",
    episode_title: overrides?.episode_title ?? "Test Episode",
    episode_url: overrides?.episode_url ?? "https://example.com/episode",
    episode_audio_url:
      overrides?.episode_audio_url ?? "https://example.com/audio.mp3",
    episode_image_url:
      overrides?.episode_image_url ?? "https://example.com/image.jpg",
    episode_duration: overrides?.episode_duration ?? 3600,
    episode_word_count: overrides?.episode_word_count ?? 5000,
    episode_transcript: overrides?.episode_transcript ?? "Test transcript",
    episode_description:
      overrides?.episode_description ?? "A test episode description",
    episode_categories: overrides?.episode_categories ?? [
      { category_id: "cat-1", category_name: "Technology" },
    ],
    episode_fully_processed: overrides?.episode_fully_processed ?? true,
    episode_guid: overrides?.episode_guid ?? "test-guid",
    episode_has_guests: overrides?.episode_has_guests ?? false,
    episode_has_sponsors: overrides?.episode_has_sponsors ?? false,
    episode_permalink: overrides?.episode_permalink ?? null,
    episode_transcript_word_level_timestamps:
      overrides?.episode_transcript_word_level_timestamps ?? {},
    metadata: overrides?.metadata ?? {},
    topics: overrides?.topics ?? [
      { topic_id: "topic-1", topic_name: "AI", topic_name_normalized: "ai" },
    ],
    podcast: overrides?.podcast ?? {
      podcast_id: "test-podscan-id",
      podcast_name: "Test Podcast",
      podcast_url: "https://example.com",
    },
    posted_at: overrides?.posted_at ?? "2024-01-01T00:00:00Z",
    created_at: overrides?.created_at ?? "2024-01-01T00:00:00Z",
    updated_at: overrides?.updated_at ?? "2024-01-01T00:00:00Z",
  };
}

function makeTestPodscanPodcastDetail(
  overrides?: Partial<PodscanPodcastDetail>,
): PodscanPodcastDetail {
  return {
    podcast_id: overrides?.podcast_id ?? "test-podscan-id",
    podcast_guid: overrides?.podcast_guid ?? "test-guid",
    podcast_name: overrides?.podcast_name ?? "Test Podcast",
    podcast_url: overrides?.podcast_url ?? "https://example.com",
    podcast_description:
      overrides?.podcast_description ?? "A test podcast description",
    podcast_image_url:
      overrides?.podcast_image_url ?? "https://example.com/image.jpg",
    publisher_name: overrides?.publisher_name ?? "Test Publisher",
    is_active: overrides?.is_active ?? true,
    rss_url: overrides?.rss_url ?? "https://example.com/rss",
    episode_count: overrides?.episode_count ?? 100,
    last_posted_at: overrides?.last_posted_at ?? "2024-01-01T00:00:00Z",
    language: overrides?.language ?? "en",
    region: overrides?.region ?? "US",
    last_scanned_at: overrides?.last_scanned_at ?? "2024-01-01T00:00:00Z",
    created_at: overrides?.created_at ?? "2024-01-01T00:00:00Z",
    updated_at: overrides?.updated_at ?? "2024-01-01T00:00:00Z",
    is_duplicate: overrides?.is_duplicate ?? false,
    is_duplicate_of: overrides?.is_duplicate_of ?? null,
    podcast_itunes_id: overrides?.podcast_itunes_id ?? null,
    podcast_spotify_id: overrides?.podcast_spotify_id ?? null,
    podcast_reach_score: overrides?.podcast_reach_score ?? null,
    podcast_has_guests: overrides?.podcast_has_guests ?? null,
    podcast_has_sponsors: overrides?.podcast_has_sponsors ?? null,
    podcast_categories: overrides?.podcast_categories ?? [
      { category_id: "cat-1", category_name: "Technology" },
    ],
    podcast_iab_categories: overrides?.podcast_iab_categories ?? [
      {
        iab_category_id: "iab-1",
        unique_id: "unique-1",
        name: "Technology",
        tier_path: "Technology",
        confidence: "high",
      },
    ],
    reach: overrides?.reach ?? {},
    brand_safety: overrides?.brand_safety ?? null,
  };
}

describe("Podcast Service Span Tracing", () => {
  let exporter: InMemorySpanExporter;
  let tracerLayer: Effect.Layer.Layer<never>;

  beforeEach(() => {
    exporter = new InMemorySpanExporter();
    tracerLayer = NodeSdk.layer(() => ({
      resource: { serviceName: "test" },
      spanProcessor: new SimpleSpanProcessor(exporter),
    }));
  });

  it("getTop creates podcast.podscan.getTop span with category attribute", async () => {
    const TestPodscanLayer = Effect.Layer.succeed(PodscanService, {
      getTop: (_category, _limit) =>
        Effect.Effect.succeed([makeTestPodscanChartPodcast()]),
      getLatest: (_podcastId, _limit, _since, _page) =>
        Effect.Effect.succeed({
          episodes: [makeTestPodscanEpisode()],
          pagination: {
            total: 1,
            per_page: 10,
            current_page: 1,
            last_page: 1,
            from: 1,
            to: 1,
          },
        }),
      getPodcast: (_podcastId) =>
        Effect.Effect.succeed(makeTestPodscanPodcastDetail()),
    });

    const TestLayers = Effect.Layer.mergeAll(TestPodscanLayer, tracerLayer);

    // IMPORTANT: Read spans INSIDE the Effect scope, before NodeSdk shuts down
    // the exporter (which clears _finishedSpans on shutdown).
    const { result, spanNames } = await Effect.Effect.runPromise(
      Effect.Effect.gen(function* () {
        const result = yield* PodscanService.pipe(
          Effect.Effect.flatMap((service) => service.getTop("technology", 10)),
          Effect.Effect.either,
        );
        const spans = exporter.getFinishedSpans();
        return { result, spanNames: spans.map((s: any) => s.name) };
      }).pipe(Effect.Effect.provide(TestLayers)),
    );

    expect(result._tag).toBe("Right");

    // Assert span name exists — THIS WILL FAIL until implementation
    expect(spanNames).toContain("podcast.podscan.getTop");
  });

  it("getLatest creates podcast.podscan.getLatest span with podcastId attribute", async () => {
    const TestPodscanLayer = Effect.Layer.succeed(PodscanService, {
      getTop: (_category, _limit) =>
        Effect.Effect.succeed([makeTestPodscanChartPodcast()]),
      getLatest: (_podcastId, _limit, _since, _page) =>
        Effect.Effect.succeed({
          episodes: [makeTestPodscanEpisode()],
          pagination: {
            total: 1,
            per_page: 10,
            current_page: 1,
            last_page: 1,
            from: 1,
            to: 1,
          },
        }),
      getPodcast: (_podcastId) =>
        Effect.Effect.succeed(makeTestPodscanPodcastDetail()),
    });

    const TestLayers = Effect.Layer.mergeAll(TestPodscanLayer, tracerLayer);

    const { result, spanNames } = await Effect.Effect.runPromise(
      Effect.Effect.gen(function* () {
        const result = yield* PodscanService.pipe(
          Effect.Effect.flatMap((service) =>
            service.getLatest("test-podcast-id", 10),
          ),
          Effect.Effect.either,
        );
        const spans = exporter.getFinishedSpans();
        return { result, spanNames: spans.map((s: any) => s.name) };
      }).pipe(Effect.Effect.provide(TestLayers)),
    );

    expect(result._tag).toBe("Right");

    // Assert span name exists — THIS WILL FAIL until implementation
    expect(spanNames).toContain("podcast.podscan.getLatest");
  });

  it("getPodcast creates podcast.podscan.getPodcast span with podcastId attribute", async () => {
    const TestPodscanLayer = Effect.Layer.succeed(PodscanService, {
      getTop: (_category, _limit) =>
        Effect.Effect.succeed([makeTestPodscanChartPodcast()]),
      getLatest: (_podcastId, _limit, _since, _page) =>
        Effect.Effect.succeed({
          episodes: [makeTestPodscanEpisode()],
          pagination: {
            total: 1,
            per_page: 10,
            current_page: 1,
            last_page: 1,
            from: 1,
            to: 1,
          },
        }),
      getPodcast: (_podcastId) =>
        Effect.Effect.succeed(makeTestPodscanPodcastDetail()),
    });

    const TestLayers = Effect.Layer.mergeAll(TestPodscanLayer, tracerLayer);

    const { result, spanNames } = await Effect.Effect.runPromise(
      Effect.Effect.gen(function* () {
        const result = yield* PodscanService.pipe(
          Effect.Effect.flatMap((service) =>
            service.getPodcast("test-podcast-id"),
          ),
          Effect.Effect.either,
        );
        const spans = exporter.getFinishedSpans();
        return { result, spanNames: spans.map((s: any) => s.name) };
      }).pipe(Effect.Effect.provide(TestLayers)),
    );

    expect(result._tag).toBe("Right");

    // Assert span name exists — THIS WILL FAIL until implementation
    expect(spanNames).toContain("podcast.podscan.getPodcast");
  });

  it("upsertPodcast creates podcast.repository.upsertPodcast span", async () => {
    const TestRepositoryLayer = Effect.Layer.succeed(PodcastRepository, {
      upsertPodcastByPodscanId: (_data) =>
        Effect.Effect.succeed(makeTestPodcast()),
      upsertEpisodeByPodscanId: (_data) =>
        Effect.Effect.succeed(makeTestEpisode()),
      readPodcastById: (_id) => Effect.Effect.succeed(makeTestPodcast()),
      readEpisodeById: (_id) => Effect.Effect.succeed(makeTestEpisode()),
      readEpisodesByPodcastId: (_id) =>
        Effect.Effect.succeed([makeTestEpisode()]),
      episodeExistsByPodscanId: (_id) => Effect.Effect.succeed(true),
      readPodcastByPodscanId: (_id) => Effect.Effect.succeed(makeTestPodcast()),
    });

    const TestLayers = Effect.Layer.mergeAll(TestRepositoryLayer, tracerLayer);

    const { result, spanNames } = await Effect.Effect.runPromise(
      Effect.Effect.gen(function* () {
        const result = yield* PodcastRepository.pipe(
          Effect.Effect.flatMap((repo) =>
            repo.upsertPodcastByPodscanId(makeTestPodscanPodcastDetail()),
          ),
          Effect.Effect.either,
        );
        const spans = exporter.getFinishedSpans();
        return { result, spanNames: spans.map((s: any) => s.name) };
      }).pipe(Effect.Effect.provide(TestLayers)),
    );

    expect(result._tag).toBe("Right");

    // Assert span name exists — THIS WILL FAIL until implementation
    expect(spanNames).toContain("podcast.repository.upsertPodcast");
  });

  it("upsertEpisode creates podcast.repository.upsertEpisode span", async () => {
    const TestRepositoryLayer = Effect.Layer.succeed(PodcastRepository, {
      upsertPodcastByPodscanId: (_data) =>
        Effect.Effect.succeed(makeTestPodcast()),
      upsertEpisodeByPodscanId: (_data) =>
        Effect.Effect.succeed(makeTestEpisode()),
      readPodcastById: (_id) => Effect.Effect.succeed(makeTestPodcast()),
      readEpisodeById: (_id) => Effect.Effect.succeed(makeTestEpisode()),
      readEpisodesByPodcastId: (_id) =>
        Effect.Effect.succeed([makeTestEpisode()]),
      episodeExistsByPodscanId: (_id) => Effect.Effect.succeed(true),
      readPodcastByPodscanId: (_id) => Effect.Effect.succeed(makeTestPodcast()),
    });

    const TestLayers = Effect.Layer.mergeAll(TestRepositoryLayer, tracerLayer);

    const { result, spanNames } = await Effect.Effect.runPromise(
      Effect.Effect.gen(function* () {
        const result = yield* PodcastRepository.pipe(
          Effect.Effect.flatMap((repo) =>
            repo.upsertEpisodeByPodscanId(makeTestPodscanEpisode()),
          ),
          Effect.Effect.either,
        );
        const spans = exporter.getFinishedSpans();
        return { result, spanNames: spans.map((s: any) => s.name) };
      }).pipe(Effect.Effect.provide(TestLayers)),
    );

    expect(result._tag).toBe("Right");

    // Assert span name exists — THIS WILL FAIL until implementation
    expect(spanNames).toContain("podcast.repository.upsertEpisode");
  });

  it("readPodcastById creates podcast.repository.readPodcastById span with podcastId attribute", async () => {
    const TestRepositoryLayer = Effect.Layer.succeed(PodcastRepository, {
      upsertPodcastByPodscanId: (_data) =>
        Effect.Effect.succeed(makeTestPodcast()),
      upsertEpisodeByPodscanId: (_data) =>
        Effect.Effect.succeed(makeTestEpisode()),
      readPodcastById: (_id) =>
        Effect.Effect.succeed(makeTestPodcast({ id: _id })),
      readEpisodeById: (_id) => Effect.Effect.succeed(makeTestEpisode()),
      readEpisodesByPodcastId: (_id) =>
        Effect.Effect.succeed([makeTestEpisode()]),
      episodeExistsByPodscanId: (_id) => Effect.Effect.succeed(true),
      readPodcastByPodscanId: (_id) => Effect.Effect.succeed(makeTestPodcast()),
    });

    const TestLayers = Effect.Layer.mergeAll(TestRepositoryLayer, tracerLayer);

    const { result, spanNames } = await Effect.Effect.runPromise(
      Effect.Effect.gen(function* () {
        const result = yield* PodcastRepository.pipe(
          Effect.Effect.flatMap((repo) => repo.readPodcastById("test-id")),
          Effect.Effect.either,
        );
        const spans = exporter.getFinishedSpans();
        return { result, spanNames: spans.map((s: any) => s.name) };
      }).pipe(Effect.Effect.provide(TestLayers)),
    );

    expect(result._tag).toBe("Right");

    // Assert span name exists — THIS WILL FAIL until implementation
    expect(spanNames).toContain("podcast.repository.readPodcastById");
  });

  it("readEpisodeById creates podcast.repository.readEpisodeById span with episodeId attribute", async () => {
    const TestRepositoryLayer = Effect.Layer.succeed(PodcastRepository, {
      upsertPodcastByPodscanId: (_data) =>
        Effect.Effect.succeed(makeTestPodcast()),
      upsertEpisodeByPodscanId: (_data) =>
        Effect.Effect.succeed(makeTestEpisode()),
      readPodcastById: (_id) => Effect.Effect.succeed(makeTestPodcast()),
      readEpisodeById: (_id) =>
        Effect.Effect.succeed(makeTestEpisode({ id: _id })),
      readEpisodesByPodcastId: (_id) =>
        Effect.Effect.succeed([makeTestEpisode()]),
      episodeExistsByPodscanId: (_id) => Effect.Effect.succeed(true),
      readPodcastByPodscanId: (_id) => Effect.Effect.succeed(makeTestPodcast()),
    });

    const TestLayers = Effect.Layer.mergeAll(TestRepositoryLayer, tracerLayer);

    const { result, spanNames } = await Effect.Effect.runPromise(
      Effect.Effect.gen(function* () {
        const result = yield* PodcastRepository.pipe(
          Effect.Effect.flatMap((repo) => repo.readEpisodeById("test-id")),
          Effect.Effect.either,
        );
        const spans = exporter.getFinishedSpans();
        return { result, spanNames: spans.map((s: any) => s.name) };
      }).pipe(Effect.Effect.provide(TestLayers)),
    );

    expect(result._tag).toBe("Right");

    // Assert span name exists — THIS WILL FAIL until implementation
    expect(spanNames).toContain("podcast.repository.readEpisodeById");
  });

  it("readEpisodesByPodcastId creates podcast.repository.readEpisodesByPodcastId span with podcastId attribute", async () => {
    const TestRepositoryLayer = Effect.Layer.succeed(PodcastRepository, {
      upsertPodcastByPodscanId: (_data) =>
        Effect.Effect.succeed(makeTestPodcast()),
      upsertEpisodeByPodscanId: (_data) =>
        Effect.Effect.succeed(makeTestEpisode()),
      readPodcastById: (_id) => Effect.Effect.succeed(makeTestPodcast()),
      readEpisodeById: (_id) => Effect.Effect.succeed(makeTestEpisode()),
      readEpisodesByPodcastId: (_id) =>
        Effect.Effect.succeed([makeTestEpisode({ podcastId: _id })]),
      episodeExistsByPodscanId: (_id) => Effect.Effect.succeed(true),
      readPodcastByPodscanId: (_id) => Effect.Effect.succeed(makeTestPodcast()),
    });

    const TestLayers = Effect.Layer.mergeAll(TestRepositoryLayer, tracerLayer);

    const { result, spanNames } = await Effect.Effect.runPromise(
      Effect.Effect.gen(function* () {
        const result = yield* PodcastRepository.pipe(
          Effect.Effect.flatMap((repo) =>
            repo.readEpisodesByPodcastId("test-podcast-id"),
          ),
          Effect.Effect.either,
        );
        const spans = exporter.getFinishedSpans();
        return { result, spanNames: spans.map((s: any) => s.name) };
      }).pipe(Effect.Effect.provide(TestLayers)),
    );

    expect(result._tag).toBe("Right");

    // Assert span name exists — THIS WILL FAIL until implementation
    expect(spanNames).toContain("podcast.repository.readEpisodesByPodcastId");
  });

  it("episodeExistsByPodscanId creates podcast.repository.episodeExists span with podscanEpisodeId attribute", async () => {
    const TestRepositoryLayer = Effect.Layer.succeed(PodcastRepository, {
      upsertPodcastByPodscanId: (_data) =>
        Effect.Effect.succeed(makeTestPodcast()),
      upsertEpisodeByPodscanId: (_data) =>
        Effect.Effect.succeed(makeTestEpisode()),
      readPodcastById: (_id) => Effect.Effect.succeed(makeTestPodcast()),
      readEpisodeById: (_id) => Effect.Effect.succeed(makeTestEpisode()),
      readEpisodesByPodcastId: (_id) =>
        Effect.Effect.succeed([makeTestEpisode()]),
      episodeExistsByPodscanId: (_id) => Effect.Effect.succeed(true),
      readPodcastByPodscanId: (_id) => Effect.Effect.succeed(makeTestPodcast()),
    });

    const TestLayers = Effect.Layer.mergeAll(TestRepositoryLayer, tracerLayer);

    const { result, spanNames } = await Effect.Effect.runPromise(
      Effect.Effect.gen(function* () {
        const result = yield* PodcastRepository.pipe(
          Effect.Effect.flatMap((repo) =>
            repo.episodeExistsByPodscanId("test-podscan-episode-id"),
          ),
          Effect.Effect.either,
        );
        const spans = exporter.getFinishedSpans();
        return { result, spanNames: spans.map((s: any) => s.name) };
      }).pipe(Effect.Effect.provide(TestLayers)),
    );

    expect(result._tag).toBe("Right");

    // Assert span name exists — THIS WILL FAIL until implementation
    expect(spanNames).toContain("podcast.repository.episodeExists");
  });

  it("readPodcastByPodscanId creates podcast.repository.readPodcastByPodscanId span with podscanPodcastId attribute", async () => {
    const TestRepositoryLayer = Effect.Layer.succeed(PodcastRepository, {
      upsertPodcastByPodscanId: (_data) =>
        Effect.Effect.succeed(makeTestPodcast()),
      upsertEpisodeByPodscanId: (_data) =>
        Effect.Effect.succeed(makeTestEpisode()),
      readPodcastById: (_id) => Effect.Effect.succeed(makeTestPodcast()),
      readEpisodeById: (_id) => Effect.Effect.succeed(makeTestEpisode()),
      readEpisodesByPodcastId: (_id) =>
        Effect.Effect.succeed([makeTestEpisode()]),
      episodeExistsByPodscanId: (_id) => Effect.Effect.succeed(true),
      readPodcastByPodscanId: (_id) =>
        Effect.Effect.succeed(makeTestPodcast({ podscanPodcastId: _id })),
    });

    const TestLayers = Effect.Layer.mergeAll(TestRepositoryLayer, tracerLayer);

    const { result, spanNames } = await Effect.Effect.runPromise(
      Effect.Effect.gen(function* () {
        const result = yield* PodcastRepository.pipe(
          Effect.Effect.flatMap((repo) =>
            repo.readPodcastByPodscanId("test-podscan-id"),
          ),
          Effect.Effect.either,
        );
        const spans = exporter.getFinishedSpans();
        return { result, spanNames: spans.map((s: any) => s.name) };
      }).pipe(Effect.Effect.provide(TestLayers)),
    );

    expect(result._tag).toBe("Right");

    // Assert span name exists — THIS WILL FAIL until implementation
    expect(spanNames).toContain("podcast.repository.readPodcastByPodscanId");
  });

  it("writeEpisode creates podcast.bucket.writeEpisode span", async () => {
    const TestBucketLayer = Effect.Layer.succeed(BucketService, {
      writeEpisode: (_prefix, _date, _episode) =>
        Effect.Effect.succeed(undefined),
    });

    const TestLayers = Effect.Layer.mergeAll(TestBucketLayer, tracerLayer);

    const { result, spanNames } = await Effect.Effect.runPromise(
      Effect.Effect.gen(function* () {
        const result = yield* BucketService.pipe(
          Effect.Effect.flatMap((service) =>
            service.writeEpisode(
              "prefix",
              "2024-01-01",
              makeTestPodscanEpisode(),
            ),
          ),
          Effect.Effect.either,
        );
        const spans = exporter.getFinishedSpans();
        return { result, spanNames: spans.map((s: any) => s.name) };
      }).pipe(Effect.Effect.provide(TestLayers)),
    );

    expect(result._tag).toBe("Right");

    // Assert span name exists — THIS WILL FAIL until implementation
    expect(spanNames).toContain("podcast.bucket.writeEpisode");
  });
});
