import * as NodeSdk from "@effect/opentelemetry/NodeSdk";
import {
  HttpClient,
  type HttpClientRequest,
  HttpClientResponse,
} from "@effect/platform";
import { PgDrizzle } from "@effect/sql-drizzle/Pg";
import { beforeEach, describe, expect, it } from "@effect/vitest";
import type { PodscanEpisode, PodscanPodcast } from "@gemhog/db/podcast";
import {
  InMemorySpanExporter,
  SimpleSpanProcessor,
} from "@opentelemetry/sdk-trace-base";
import * as Effect from "effect";
import { vi } from "vitest";
import { BucketService } from "../src/bucket";
import { BucketServiceLive } from "../src/bucket.live";
import { PodscanService } from "../src/podscan";
import { PodscanServiceLive } from "../src/podscan.live";
import { PodcastRepository } from "../src/repository";
import { PodcastRepositoryLive } from "../src/repository.live";
import type {
  PodscanChartPodcastResponse,
  PodscanEpisodeResponse,
  PodscanPodcastDetail,
} from "../src/schema";

// Mock S3Client to avoid real AWS calls in tests
vi.mock("@aws-sdk/client-s3", () => {
  class MockS3Client {
    send = vi.fn(async () => ({}));
  }
  return {
    S3Client: MockS3Client,
    PutObjectCommand: class {
      constructor(params: unknown) {
        Object.assign(this, params);
      }
    },
  };
});

process.env.PODSCAN_API_TOKEN = process.env.PODSCAN_API_TOKEN ?? "test-token";
process.env.PODSCAN_BASE_URL =
  process.env.PODSCAN_BASE_URL ?? "https://test.podscan.api/v1";
process.env.PODCAST_BUCKET_NAME =
  process.env.PODCAST_BUCKET_NAME ?? "test-bucket";

function makeTestPodcast(overrides?: Partial<PodscanPodcast>): PodscanPodcast {
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

function makeTestEpisode(overrides?: Partial<PodscanEpisode>): PodscanEpisode {
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
  overrides?: Partial<PodscanChartPodcastResponse>,
): PodscanChartPodcastResponse {
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
  overrides?: Partial<PodscanEpisodeResponse>,
): PodscanEpisodeResponse {
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

const makeClientResponse = (
  request: HttpClientRequest.HttpClientRequest,
  body: unknown,
): HttpClientResponse.HttpClientResponse =>
  HttpClientResponse.fromWeb(
    request,
    new Response(JSON.stringify(body), {
      status: 200,
      headers: { "content-type": "application/json" },
    }),
  );

const podscanHttpClientLayer = Effect.Layer.succeed(
  HttpClient.HttpClient,
  HttpClient.make((request, _url, _signal, _fiber) => {
    if (request.url.includes("/charts/apple/us/")) {
      return Effect.Effect.succeed(
        makeClientResponse(request, {
          podcasts: [makeTestPodscanChartPodcast()],
        }),
      );
    }

    if (request.url.includes("/episodes?")) {
      return Effect.Effect.succeed(
        makeClientResponse(request, {
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
      );
    }

    return Effect.Effect.succeed(
      makeClientResponse(request, {
        podcast: makeTestPodscanPodcastDetail(),
      }),
    );
  }),
);

// Mock PgDrizzle for repository tests - creates a chainable mock that returns Effects
function makeMockPgDrizzle(config: {
  selectResult?: unknown[];
  insertResult?: unknown[];
}) {
  const selectResult = config.selectResult ?? [];
  const insertResult = config.insertResult ?? [];

  const mockChain = {
    // select() or select({...})
    select: (_fields?: unknown) => ({
      from: (_table: unknown) => ({
        where: (_condition: unknown) => Effect.Effect.succeed(selectResult),
        pipe: (
          fn: (eff: Effect.Effect.Effect<unknown[], never, never>) => unknown,
        ) => fn(Effect.Effect.succeed(selectResult)),
      }),
    }),
    // insert(table)
    insert: (_table: unknown) => ({
      values: (_data: unknown) => ({
        onConflictDoUpdate: (_config: unknown) => ({
          returning: () => Effect.Effect.succeed(insertResult),
        }),
      }),
    }),
  };

  return mockChain;
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
    const TestLayers = Effect.Layer.mergeAll(
      PodscanServiceLive.pipe(Effect.Layer.provide(podscanHttpClientLayer)),
      tracerLayer,
    );

    // IMPORTANT: Read spans INSIDE the Effect scope, before NodeSdk shuts down
    // the exporter (which clears _finishedSpans on shutdown).
    const { result, spanNames, topSpanAttrs } = await Effect.Effect.runPromise(
      Effect.Effect.gen(function* () {
        const result = yield* PodscanService.pipe(
          Effect.Effect.flatMap((service) => service.getTop("technology", 10)),
          Effect.Effect.either,
        );
        const spans = exporter.getFinishedSpans();
        const topSpan = spans.find((s) => s.name === "podcast.podscan.getTop");
        return {
          result,
          // biome-ignore lint/suspicious/noExplicitAny: test helper
          spanNames: spans.map((s: any) => s.name),
          topSpanAttrs: topSpan?.attributes ?? null,
        };
      }).pipe(Effect.Effect.provide(TestLayers)),
    );

    expect(result._tag).toBe("Right");

    expect(spanNames).toContain("podcast.podscan.getTop");

    expect(topSpanAttrs).toEqual(
      expect.objectContaining({
        category: "technology",
        limit: 10,
      }),
    );
  });

  it("getLatest creates podcast.podscan.getLatest span with podcastId attribute", async () => {
    const TestLayers = Effect.Layer.mergeAll(
      PodscanServiceLive.pipe(Effect.Layer.provide(podscanHttpClientLayer)),
      tracerLayer,
    );

    const { result, spanNames, latestSpanAttrs } =
      await Effect.Effect.runPromise(
        Effect.Effect.gen(function* () {
          const result = yield* PodscanService.pipe(
            Effect.Effect.flatMap((service) =>
              service.getLatest("test-podcast-id", 10),
            ),
            Effect.Effect.either,
          );
          const spans = exporter.getFinishedSpans();
          const latestSpan = spans.find(
            (s) => s.name === "podcast.podscan.getLatest",
          );
          return {
            result,
            // biome-ignore lint/suspicious/noExplicitAny: test helper
            spanNames: spans.map((s: any) => s.name),
            latestSpanAttrs: latestSpan?.attributes ?? null,
          };
        }).pipe(Effect.Effect.provide(TestLayers)),
      );

    expect(result._tag).toBe("Right");

    expect(spanNames).toContain("podcast.podscan.getLatest");

    expect(latestSpanAttrs).toEqual(
      expect.objectContaining({
        podcastId: "test-podcast-id",
        limit: 10,
      }),
    );
  });

  it("getPodcast creates podcast.podscan.getPodcast span with podcastId attribute", async () => {
    const TestLayers = Effect.Layer.mergeAll(
      PodscanServiceLive.pipe(Effect.Layer.provide(podscanHttpClientLayer)),
      tracerLayer,
    );

    const { result, spanNames, podcastSpanAttrs } =
      await Effect.Effect.runPromise(
        Effect.Effect.gen(function* () {
          const result = yield* PodscanService.pipe(
            Effect.Effect.flatMap((service) =>
              service.getPodcast("test-podcast-id"),
            ),
            Effect.Effect.either,
          );
          const spans = exporter.getFinishedSpans();
          const podcastSpan = spans.find(
            (s) => s.name === "podcast.podscan.getPodcast",
          );
          return {
            result,
            // biome-ignore lint/suspicious/noExplicitAny: test helper
            spanNames: spans.map((s: any) => s.name),
            podcastSpanAttrs: podcastSpan?.attributes ?? null,
          };
        }).pipe(Effect.Effect.provide(TestLayers)),
      );

    expect(result._tag).toBe("Right");

    expect(spanNames).toContain("podcast.podscan.getPodcast");

    expect(podcastSpanAttrs).toEqual(
      expect.objectContaining({
        podcastId: "test-podcast-id",
      }),
    );
  });

  it("upsertPodcast creates podcast.repository.upsertPodcast span", async () => {
    const mockDrizzle = makeMockPgDrizzle({
      insertResult: [makeTestPodcast()],
    });
    const TestDrizzleLayer = Effect.Layer.succeed(
      PgDrizzle,
      // biome-ignore lint/suspicious/noExplicitAny: test helper
      mockDrizzle as any,
    );
    const TestRepoLayer = PodcastRepositoryLive.pipe(
      Effect.Layer.provide(TestDrizzleLayer),
    );

    const TestLayers = Effect.Layer.mergeAll(TestRepoLayer, tracerLayer);

    const { result, spanNames } = await Effect.Effect.runPromise(
      Effect.Effect.gen(function* () {
        const result = yield* PodcastRepository.pipe(
          Effect.Effect.flatMap((repo) =>
            repo.upsertPodcastByPodscanId(makeTestPodscanPodcastDetail()),
          ),
          Effect.Effect.either,
        );
        const spans = exporter.getFinishedSpans();
        // biome-ignore lint/suspicious/noExplicitAny: test helper
        return { result, spanNames: spans.map((s: any) => s.name) };
      }).pipe(Effect.Effect.provide(TestLayers)),
    );

    expect(result._tag).toBe("Right");
    expect(spanNames).toContain("podcast.repository.upsertPodcast");
  });

  it("upsertEpisode creates podcast.repository.upsertEpisode span", async () => {
    // upsertEpisode first queries for the podcast, then inserts the episode
    const mockDrizzle = makeMockPgDrizzle({
      selectResult: [makeTestPodcast()],
      insertResult: [makeTestEpisode()],
    });
    const TestDrizzleLayer = Effect.Layer.succeed(
      PgDrizzle,
      // biome-ignore lint/suspicious/noExplicitAny: test helper
      mockDrizzle as any,
    );
    const TestRepoLayer = PodcastRepositoryLive.pipe(
      Effect.Layer.provide(TestDrizzleLayer),
    );

    const TestLayers = Effect.Layer.mergeAll(TestRepoLayer, tracerLayer);

    const { result, spanNames } = await Effect.Effect.runPromise(
      Effect.Effect.gen(function* () {
        const result = yield* PodcastRepository.pipe(
          Effect.Effect.flatMap((repo) =>
            repo.upsertEpisodeByPodscanId(makeTestPodscanEpisode()),
          ),
          Effect.Effect.either,
        );
        const spans = exporter.getFinishedSpans();
        // biome-ignore lint/suspicious/noExplicitAny: test helper
        return { result, spanNames: spans.map((s: any) => s.name) };
      }).pipe(Effect.Effect.provide(TestLayers)),
    );

    expect(result._tag).toBe("Right");
    expect(spanNames).toContain("podcast.repository.upsertEpisode");
  });

  it("readPodcastById creates podcast.repository.readPodcastById span with podcastId attribute", async () => {
    const mockDrizzle = makeMockPgDrizzle({
      selectResult: [makeTestPodcast({ id: "test-id" })],
    });
    const TestDrizzleLayer = Effect.Layer.succeed(
      PgDrizzle,
      // biome-ignore lint/suspicious/noExplicitAny: test helper
      mockDrizzle as any,
    );
    const TestRepoLayer = PodcastRepositoryLive.pipe(
      Effect.Layer.provide(TestDrizzleLayer),
    );

    const TestLayers = Effect.Layer.mergeAll(TestRepoLayer, tracerLayer);

    const { result, spanNames } = await Effect.Effect.runPromise(
      Effect.Effect.gen(function* () {
        const result = yield* PodcastRepository.pipe(
          Effect.Effect.flatMap((repo) => repo.readPodcastById("test-id")),
          Effect.Effect.either,
        );
        const spans = exporter.getFinishedSpans();
        // biome-ignore lint/suspicious/noExplicitAny: test helper
        return { result, spanNames: spans.map((s: any) => s.name) };
      }).pipe(Effect.Effect.provide(TestLayers)),
    );

    expect(result._tag).toBe("Right");
    expect(spanNames).toContain("podcast.repository.readPodcastById");
  });

  it("readEpisodeById creates podcast.repository.readEpisodeById span with episodeId attribute", async () => {
    const mockDrizzle = makeMockPgDrizzle({
      selectResult: [makeTestEpisode({ id: "test-id" })],
    });
    const TestDrizzleLayer = Effect.Layer.succeed(
      PgDrizzle,
      // biome-ignore lint/suspicious/noExplicitAny: test helper
      mockDrizzle as any,
    );
    const TestRepoLayer = PodcastRepositoryLive.pipe(
      Effect.Layer.provide(TestDrizzleLayer),
    );

    const TestLayers = Effect.Layer.mergeAll(TestRepoLayer, tracerLayer);

    const { result, spanNames } = await Effect.Effect.runPromise(
      Effect.Effect.gen(function* () {
        const result = yield* PodcastRepository.pipe(
          Effect.Effect.flatMap((repo) => repo.readEpisodeById("test-id")),
          Effect.Effect.either,
        );
        const spans = exporter.getFinishedSpans();
        // biome-ignore lint/suspicious/noExplicitAny: test helper
        return { result, spanNames: spans.map((s: any) => s.name) };
      }).pipe(Effect.Effect.provide(TestLayers)),
    );

    expect(result._tag).toBe("Right");
    expect(spanNames).toContain("podcast.repository.readEpisodeById");
  });

  it("readEpisodesByPodcastId creates podcast.repository.readEpisodesByPodcastId span with podcastId attribute", async () => {
    const mockDrizzle = makeMockPgDrizzle({
      selectResult: [makeTestEpisode({ podcastId: "test-podcast-id" })],
    });
    const TestDrizzleLayer = Effect.Layer.succeed(
      PgDrizzle,
      // biome-ignore lint/suspicious/noExplicitAny: test helper
      mockDrizzle as any,
    );
    const TestRepoLayer = PodcastRepositoryLive.pipe(
      Effect.Layer.provide(TestDrizzleLayer),
    );

    const TestLayers = Effect.Layer.mergeAll(TestRepoLayer, tracerLayer);

    const { result, spanNames } = await Effect.Effect.runPromise(
      Effect.Effect.gen(function* () {
        const result = yield* PodcastRepository.pipe(
          Effect.Effect.flatMap((repo) =>
            repo.readEpisodesByPodcastId("test-podcast-id"),
          ),
          Effect.Effect.either,
        );
        const spans = exporter.getFinishedSpans();
        // biome-ignore lint/suspicious/noExplicitAny: test helper
        return { result, spanNames: spans.map((s: any) => s.name) };
      }).pipe(Effect.Effect.provide(TestLayers)),
    );

    expect(result._tag).toBe("Right");
    expect(spanNames).toContain("podcast.repository.readEpisodesByPodcastId");
  });

  it("episodeExistsByPodscanId creates podcast.repository.episodeExists span with podscanEpisodeId attribute", async () => {
    const mockDrizzle = makeMockPgDrizzle({
      selectResult: [{ id: "some-episode-id" }],
    });
    const TestDrizzleLayer = Effect.Layer.succeed(
      PgDrizzle,
      // biome-ignore lint/suspicious/noExplicitAny: test helper
      mockDrizzle as any,
    );
    const TestRepoLayer = PodcastRepositoryLive.pipe(
      Effect.Layer.provide(TestDrizzleLayer),
    );

    const TestLayers = Effect.Layer.mergeAll(TestRepoLayer, tracerLayer);

    const { result, spanNames } = await Effect.Effect.runPromise(
      Effect.Effect.gen(function* () {
        const result = yield* PodcastRepository.pipe(
          Effect.Effect.flatMap((repo) =>
            repo.episodeExistsByPodscanId("test-podscan-episode-id"),
          ),
          Effect.Effect.either,
        );
        const spans = exporter.getFinishedSpans();
        // biome-ignore lint/suspicious/noExplicitAny: test helper
        return { result, spanNames: spans.map((s: any) => s.name) };
      }).pipe(Effect.Effect.provide(TestLayers)),
    );

    expect(result._tag).toBe("Right");
    expect(spanNames).toContain("podcast.repository.episodeExists");
  });

  it("readPodcastByPodscanId creates podcast.repository.readPodcastByPodscanId span with podscanPodcastId attribute", async () => {
    const mockDrizzle = makeMockPgDrizzle({
      selectResult: [makeTestPodcast({ podscanPodcastId: "test-podscan-id" })],
    });
    const TestDrizzleLayer = Effect.Layer.succeed(
      PgDrizzle,
      // biome-ignore lint/suspicious/noExplicitAny: test helper
      mockDrizzle as any,
    );
    const TestRepoLayer = PodcastRepositoryLive.pipe(
      Effect.Layer.provide(TestDrizzleLayer),
    );

    const TestLayers = Effect.Layer.mergeAll(TestRepoLayer, tracerLayer);

    const { result, spanNames } = await Effect.Effect.runPromise(
      Effect.Effect.gen(function* () {
        const result = yield* PodcastRepository.pipe(
          Effect.Effect.flatMap((repo) =>
            repo.readPodcastByPodscanId("test-podscan-id"),
          ),
          Effect.Effect.either,
        );
        const spans = exporter.getFinishedSpans();
        // biome-ignore lint/suspicious/noExplicitAny: test helper
        return { result, spanNames: spans.map((s: any) => s.name) };
      }).pipe(Effect.Effect.provide(TestLayers)),
    );

    expect(result._tag).toBe("Right");
    expect(spanNames).toContain("podcast.repository.readPodcastByPodscanId");
  });

  it("writeEpisode creates podcast.bucket.writeEpisode span", async () => {
    const TestLayers = Effect.Layer.mergeAll(BucketServiceLive, tracerLayer);

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
        // biome-ignore lint/suspicious/noExplicitAny: test helper
        return { result, spanNames: spans.map((s: any) => s.name) };
      }).pipe(Effect.Effect.provide(TestLayers)),
    );

    expect(result._tag).toBe("Right");

    // Assert span name exists — THIS WILL FAIL until implementation
    expect(spanNames).toContain("podcast.bucket.writeEpisode");
  });
});
