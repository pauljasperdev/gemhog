import * as PgDrizzle from "@effect/sql-drizzle/Pg";
import { PgClient } from "@effect/sql-pg";
import * as Effect from "effect";
import { afterEach, describe, expect, it } from "vitest";
import {
  EpisodeNotFoundError,
  PodcastNotFoundError,
  PodcastRepositoryError,
} from "../src/errors";
import { PodcastRepository } from "../src/repository";
import { PodcastRepositoryLive } from "../src/repository.live";
import { episode, podcast } from "../src/sql";
import { createMockEpisode, createMockPodcastDetail } from "./test-fixtures";

const DATABASE_URL =
  process.env.DATABASE_URL ??
  "postgresql://postgres:password@localhost:5432/gemhog";

const TestPgLive = PgClient.layer({ url: Effect.Redacted.make(DATABASE_URL) });
const TestDrizzleLive = PgDrizzle.layer.pipe(Effect.Layer.provide(TestPgLive));
const TestRepositoryLive = PodcastRepositoryLive.pipe(
  Effect.Layer.provide(TestDrizzleLive),
);

const truncate = Effect.Effect.gen(function* () {
  const db = yield* PgDrizzle.PgDrizzle;
  // Delete episode first (child), then podcast (parent) - FK order matters
  yield* db
    .delete(episode)
    .pipe(Effect.Effect.catchAll(() => Effect.Effect.succeed(undefined)));
  yield* db
    .delete(podcast)
    .pipe(Effect.Effect.catchAll(() => Effect.Effect.succeed(undefined)));
});

const runWithRepository = <A, E>(
  effect: Effect.Effect.Effect<A, E, PodcastRepository>,
) =>
  Effect.Effect.runPromise(
    effect.pipe(Effect.Effect.provide(TestRepositoryLive)),
  );

const runTruncate = () =>
  Effect.Effect.runPromise(
    truncate.pipe(Effect.Effect.provide(TestDrizzleLive)),
  );

describe("podcast repository integration", () => {
  afterEach(async () => {
    await runTruncate();
  });

  describe("upsertPodcastByPodscanId", () => {
    it("inserts new podcast and returns it with generated UUID", async () => {
      const mockPodcast = createMockPodcastDetail({
        podcast_id: "test-podscan-podcast-1",
        podcast_name: "Test Podcast 1",
        podcast_url: "https://example.com/podcast1",
      });

      const result = await runWithRepository(
        PodcastRepository.pipe(
          Effect.Effect.flatMap((repo) =>
            repo.upsertPodcastByPodscanId(mockPodcast),
          ),
        ),
      );

      // Verify internal ID and timestamps
      expect(result.id).toBeTruthy();
      expect(result.id).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
      );
      expect(result.createdAt).toBeInstanceOf(Date);
      expect(result.updatedAt).toBeInstanceOf(Date);

      // Verify all 27 PodscanPodcastDetail fields are stored
      expect(result.podscanPodcastId).toBe(mockPodcast.podcast_id);
      expect(result.name).toBe(mockPodcast.podcast_name);
      expect(result.url).toBe(mockPodcast.podcast_url);
      expect(result.guid).toBe(mockPodcast.podcast_guid);
      expect(result.description).toBe(mockPodcast.podcast_description);
      expect(result.imageUrl).toBe(mockPodcast.podcast_image_url);
      expect(result.publisherName).toBe(mockPodcast.publisher_name);
      expect(result.rssUrl).toBe(mockPodcast.rss_url);
      expect(result.language).toBe(mockPodcast.language);
      expect(result.region).toBe(mockPodcast.region);
      expect(result.itunesId).toBe(mockPodcast.podcast_itunes_id);
      expect(result.spotifyId).toBe(mockPodcast.podcast_spotify_id);
      expect(result.isDuplicateOf).toBe(mockPodcast.is_duplicate_of);
      expect(result.episodeCount).toBe(mockPodcast.episode_count);
      expect(result.reachScore).toBe(mockPodcast.podcast_reach_score);
      expect(result.isActive).toBe(mockPodcast.is_active);
      expect(result.isDuplicate).toBe(mockPodcast.is_duplicate);
      expect(result.hasGuests).toBe(mockPodcast.podcast_has_guests);
      expect(result.hasSponsors).toBe(mockPodcast.podcast_has_sponsors);
      expect(result.categories).toEqual(mockPodcast.podcast_categories);
      expect(result.iabCategories).toEqual(mockPodcast.podcast_iab_categories);
      expect(result.reach).toEqual(mockPodcast.reach);
      expect(result.brandSafety).toEqual(mockPodcast.brand_safety);
      // Timestamp fields
      expect(result.lastPostedAt).toBeInstanceOf(Date);
      expect(result.lastScannedAt).toBeInstanceOf(Date);
      expect(result.podscanCreatedAt).toBeInstanceOf(Date);
      expect(result.podscanUpdatedAt).toBeInstanceOf(Date);
    });

    it("updates existing podcast when podscan ID matches (full replace)", async () => {
      const podscanId = "test-podscan-podcast-update";

      // First upsert
      const initial = await runWithRepository(
        PodcastRepository.pipe(
          Effect.Effect.flatMap((repo) =>
            repo.upsertPodcastByPodscanId(
              createMockPodcastDetail({
                podcast_id: podscanId,
                podcast_name: "Initial Name",
                podcast_description: "Initial Description",
                episode_count: 10,
              }),
            ),
          ),
        ),
      );

      // Second upsert with same podscan ID but different values
      const updated = await runWithRepository(
        PodcastRepository.pipe(
          Effect.Effect.flatMap((repo) =>
            repo.upsertPodcastByPodscanId(
              createMockPodcastDetail({
                podcast_id: podscanId,
                podcast_name: "Updated Name",
                podcast_description: "Updated Description",
                episode_count: 20,
              }),
            ),
          ),
        ),
      );

      // Verify same internal ID
      expect(updated.id).toBe(initial.id);

      // Verify fields are updated
      expect(updated.name).toBe("Updated Name");
      expect(updated.description).toBe("Updated Description");
      expect(updated.episodeCount).toBe(20);

      // Verify updatedAt changed
      expect(updated.updatedAt.getTime()).toBeGreaterThanOrEqual(
        initial.updatedAt.getTime(),
      );
    });

    it("maps SqlError to PodcastRepositoryError with descriptive message", async () => {
      // Force a DB error by passing invalid date string
      // This will trigger a SqlError that should be caught and wrapped in PodcastRepositoryError
      const invalidPodcast = createMockPodcastDetail();
      // @ts-expect-error - Intentionally passing invalid date to trigger DB error
      invalidPodcast.last_posted_at = "not-a-valid-date-string-at-all";

      const result = await runWithRepository(
        PodcastRepository.pipe(
          Effect.Effect.flatMap((repo) =>
            repo.upsertPodcastByPodscanId(invalidPodcast),
          ),
          Effect.Effect.either,
        ),
      );

      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left).toBeInstanceOf(PodcastRepositoryError);
        if (result.left instanceof PodcastRepositoryError) {
          expect(typeof result.left.cause).toBe("string");
          expect(result.left.cause.length).toBeGreaterThan(0);
        }
      }
    });
  });

  describe("upsertEpisodeByPodscanId", () => {
    it("inserts new episode and resolves podcast FK internally", async () => {
      // First, upsert the parent podcast
      const podcastData = createMockPodcastDetail({
        podcast_id: "test-podcast-for-episode-1",
      });

      const podcast = await runWithRepository(
        PodcastRepository.pipe(
          Effect.Effect.flatMap((repo) =>
            repo.upsertPodcastByPodscanId(podcastData),
          ),
        ),
      );

      // Then upsert episode with matching podcast.podcast_id
      const episodeData = createMockEpisode({
        episode_id: "test-episode-1",
        episode_title: "Test Episode 1",
        podcast: {
          podcast_id: podcastData.podcast_id, // Match the podscan podcast ID
          podcast_name: podcastData.podcast_name,
          podcast_url: podcastData.podcast_url,
        },
      });

      const result = await runWithRepository(
        PodcastRepository.pipe(
          Effect.Effect.flatMap((repo) =>
            repo.upsertEpisodeByPodscanId(episodeData),
          ),
        ),
      );

      // Verify episode has correct FK to internal podcast ID
      expect(result.id).toBeTruthy();
      expect(result.id).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
      );
      expect(result.podcastId).toBe(podcast.id); // Internal UUID FK
      expect(result.podscanEpisodeId).toBe(episodeData.episode_id);
      expect(result.title).toBe(episodeData.episode_title);
      expect(result.createdAt).toBeInstanceOf(Date);
      expect(result.updatedAt).toBeInstanceOf(Date);
      expect(result.categories).toEqual([
        { category_id: "cat-1", category_name: "Technology" },
      ]);
    });

    it("updates existing episode when podscan ID matches", async () => {
      // Setup podcast
      const podcastData = createMockPodcastDetail({
        podcast_id: "test-podcast-for-update",
      });

      await runWithRepository(
        PodcastRepository.pipe(
          Effect.Effect.flatMap((repo) =>
            repo.upsertPodcastByPodscanId(podcastData),
          ),
        ),
      );

      const episodeId = "test-episode-update";

      // First upsert
      const initial = await runWithRepository(
        PodcastRepository.pipe(
          Effect.Effect.flatMap((repo) =>
            repo.upsertEpisodeByPodscanId(
              createMockEpisode({
                episode_id: episodeId,
                episode_title: "Initial Title",
                episode_description: "Initial Description",
                podcast: {
                  podcast_id: podcastData.podcast_id,
                  podcast_name: podcastData.podcast_name,
                  podcast_url: podcastData.podcast_url,
                },
              }),
            ),
          ),
        ),
      );

      // Second upsert with different title
      const updated = await runWithRepository(
        PodcastRepository.pipe(
          Effect.Effect.flatMap((repo) =>
            repo.upsertEpisodeByPodscanId(
              createMockEpisode({
                episode_id: episodeId,
                episode_title: "Updated Title",
                episode_description: "Updated Description",
                podcast: {
                  podcast_id: podcastData.podcast_id,
                  podcast_name: podcastData.podcast_name,
                  podcast_url: podcastData.podcast_url,
                },
              }),
            ),
          ),
        ),
      );

      // Verify same internal ID and updated title
      expect(updated.id).toBe(initial.id);
      expect(updated.title).toBe("Updated Title");
      expect(updated.description).toBe("Updated Description");
    });

    it("fails with descriptive PodcastRepositoryError when podcast not found during FK resolution", async () => {
      // Try to upsert episode without creating podcast first
      const episodeData = createMockEpisode({
        episode_id: "orphan-episode",
        podcast: {
          podcast_id: "nonexistent-podcast-id",
          podcast_name: "Nonexistent Podcast",
          podcast_url: "https://example.com/nonexistent",
        },
      });

      const result = await runWithRepository(
        PodcastRepository.pipe(
          Effect.Effect.flatMap((repo) =>
            repo.upsertEpisodeByPodscanId(episodeData),
          ),
          Effect.Effect.either,
        ),
      );

      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left).toBeInstanceOf(PodcastRepositoryError);
        if (result.left instanceof PodcastRepositoryError) {
          expect(typeof result.left.cause).toBe("string");
          expect(result.left.cause.toLowerCase()).toContain("podcast");
        }
      }
    });
  });

  describe("readPodcastById", () => {
    it("returns podcast when exists", async () => {
      const podcastData = createMockPodcastDetail({
        podcast_id: "test-podcast-read",
        podcast_name: "Podcast to Read",
      });

      const created = await runWithRepository(
        PodcastRepository.pipe(
          Effect.Effect.flatMap((repo) =>
            repo.upsertPodcastByPodscanId(podcastData),
          ),
        ),
      );

      const result = await runWithRepository(
        PodcastRepository.pipe(
          Effect.Effect.flatMap((repo) => repo.readPodcastById(created.id)),
        ),
      );

      expect(result.id).toBe(created.id);
      expect(result.podscanPodcastId).toBe(podcastData.podcast_id);
      expect(result.name).toBe(podcastData.podcast_name);
    });

    it("fails with PodcastNotFoundError when not found", async () => {
      const nonexistentId = "00000000-0000-0000-0000-000000000000";

      const result = await runWithRepository(
        PodcastRepository.pipe(
          Effect.Effect.flatMap((repo) => repo.readPodcastById(nonexistentId)),
          Effect.Effect.either,
        ),
      );

      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left).toBeInstanceOf(PodcastNotFoundError);
        if (result.left instanceof PodcastNotFoundError) {
          expect(result.left.identifier).toBe(nonexistentId);
        }
      }
    });
  });

  describe("readEpisodeById", () => {
    it("returns episode when exists", async () => {
      // Setup podcast
      const podcastData = createMockPodcastDetail({
        podcast_id: "test-podcast-for-episode-read",
      });

      await runWithRepository(
        PodcastRepository.pipe(
          Effect.Effect.flatMap((repo) =>
            repo.upsertPodcastByPodscanId(podcastData),
          ),
        ),
      );

      // Create episode
      const episodeData = createMockEpisode({
        episode_id: "test-episode-read",
        episode_title: "Episode to Read",
        podcast: {
          podcast_id: podcastData.podcast_id,
          podcast_name: podcastData.podcast_name,
          podcast_url: podcastData.podcast_url,
        },
      });

      const created = await runWithRepository(
        PodcastRepository.pipe(
          Effect.Effect.flatMap((repo) =>
            repo.upsertEpisodeByPodscanId(episodeData),
          ),
        ),
      );

      // Read episode by internal UUID
      const result = await runWithRepository(
        PodcastRepository.pipe(
          Effect.Effect.flatMap((repo) => repo.readEpisodeById(created.id)),
        ),
      );

      expect(result.id).toBe(created.id);
      expect(result.podscanEpisodeId).toBe(episodeData.episode_id);
      expect(result.title).toBe(episodeData.episode_title);
    });

    it("fails with EpisodeNotFoundError when not found", async () => {
      const nonexistentId = "00000000-0000-0000-0000-000000000000";

      const result = await runWithRepository(
        PodcastRepository.pipe(
          Effect.Effect.flatMap((repo) => repo.readEpisodeById(nonexistentId)),
          Effect.Effect.either,
        ),
      );

      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left).toBeInstanceOf(EpisodeNotFoundError);
        if (result.left instanceof EpisodeNotFoundError) {
          expect(result.left.identifier).toBe(nonexistentId);
        }
      }
    });
  });

  describe("readPodcastByPodscanId", () => {
    it("returns podcast when found by podscan ID", async () => {
      const podcastData = createMockPodcastDetail({
        podcast_id: "test-podscan-id-read",
        podcast_name: "Podcast to Read by Podscan ID",
      });

      const created = await runWithRepository(
        PodcastRepository.pipe(
          Effect.Effect.flatMap((repo) =>
            repo.upsertPodcastByPodscanId(podcastData),
          ),
        ),
      );

      const result = await runWithRepository(
        PodcastRepository.pipe(
          Effect.Effect.flatMap((repo) =>
            repo.readPodcastByPodscanId(podcastData.podcast_id),
          ),
        ),
      );

      expect(result.id).toBe(created.id);
      expect(result.podscanPodcastId).toBe(podcastData.podcast_id);
      expect(result.name).toBe(podcastData.podcast_name);
    });

    it("fails with PodcastNotFoundError when podscan ID not found", async () => {
      const result = await runWithRepository(
        PodcastRepository.pipe(
          Effect.Effect.flatMap((repo) =>
            repo.readPodcastByPodscanId("nonexistent-podscan-id"),
          ),
          Effect.Effect.either,
        ),
      );

      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left).toBeInstanceOf(PodcastNotFoundError);
        if (result.left instanceof PodcastNotFoundError) {
          expect(result.left.identifier).toBe("nonexistent-podscan-id");
        }
      }
    });
  });

  describe("readEpisodesByPodcastId", () => {
    it("returns all episodes for podcast", async () => {
      // Setup podcast
      const podcastData = createMockPodcastDetail({
        podcast_id: "test-podcast-with-episodes",
      });

      const podcast = await runWithRepository(
        PodcastRepository.pipe(
          Effect.Effect.flatMap((repo) =>
            repo.upsertPodcastByPodscanId(podcastData),
          ),
        ),
      );

      // Create two episodes
      await runWithRepository(
        PodcastRepository.pipe(
          Effect.Effect.flatMap((repo) =>
            repo.upsertEpisodeByPodscanId(
              createMockEpisode({
                episode_id: "episode-1",
                episode_title: "Episode 1",
                podcast: {
                  podcast_id: podcastData.podcast_id,
                  podcast_name: podcastData.podcast_name,
                  podcast_url: podcastData.podcast_url,
                },
              }),
            ),
          ),
        ),
      );

      await runWithRepository(
        PodcastRepository.pipe(
          Effect.Effect.flatMap((repo) =>
            repo.upsertEpisodeByPodscanId(
              createMockEpisode({
                episode_id: "episode-2",
                episode_title: "Episode 2",
                podcast: {
                  podcast_id: podcastData.podcast_id,
                  podcast_name: podcastData.podcast_name,
                  podcast_url: podcastData.podcast_url,
                },
              }),
            ),
          ),
        ),
      );

      // Read all episodes by podcast internal UUID
      const result = await runWithRepository(
        PodcastRepository.pipe(
          Effect.Effect.flatMap((repo) =>
            repo.readEpisodesByPodcastId(podcast.id),
          ),
        ),
      );

      expect(result).toHaveLength(2);
      expect(result[0]?.podcastId).toBe(podcast.id);
      expect(result[1]?.podcastId).toBe(podcast.id);

      const titles = result.map((ep) => ep.title).sort();
      expect(titles).toEqual(["Episode 1", "Episode 2"]);
    });

    it("returns empty array when podcast has no episodes", async () => {
      // Setup podcast without episodes
      const podcastData = createMockPodcastDetail({
        podcast_id: "test-podcast-no-episodes",
      });

      const podcast = await runWithRepository(
        PodcastRepository.pipe(
          Effect.Effect.flatMap((repo) =>
            repo.upsertPodcastByPodscanId(podcastData),
          ),
        ),
      );

      // Read episodes - should be empty
      const result = await runWithRepository(
        PodcastRepository.pipe(
          Effect.Effect.flatMap((repo) =>
            repo.readEpisodesByPodcastId(podcast.id),
          ),
        ),
      );

      expect(result).toHaveLength(0);
      expect(result).toEqual([]);
    });
  });
});
