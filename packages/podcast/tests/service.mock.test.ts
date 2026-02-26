import * as Effect from "effect";
import { describe, expect, it } from "vitest";
import { PodscanService } from "../src/podscan";
import { MockPodscanService } from "../src/podscan.mock";

const runWithMockService = <A, E>(
  effect: Effect.Effect.Effect<A, E, PodscanService>,
) =>
  Effect.Effect.runPromise(
    effect.pipe(Effect.Effect.provide(MockPodscanService)),
  );

describe("MockPodscanService", () => {
  describe("getTop", () => {
    it("returns array of mock chart podcasts", async () => {
      const result = await runWithMockService(
        PodscanService.pipe(
          Effect.Effect.flatMap((service) => service.getTop("technology", 10)),
        ),
      );

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
    });

    it("returns podcasts with correct shape", async () => {
      const result = await runWithMockService(
        PodscanService.pipe(
          Effect.Effect.flatMap((service) => service.getTop("technology", 10)),
        ),
      );

      const podcast = result[0];
      expect(podcast).toBeDefined();
      if (!podcast) return;
      expect(podcast).toHaveProperty("rank");
      expect(podcast).toHaveProperty("name");
      expect(podcast).toHaveProperty("publisher");
      expect(podcast).toHaveProperty("movement");
      expect(podcast).toHaveProperty("podcast_id");
      expect(podcast).toHaveProperty("thumbnail");
      expect(podcast).toHaveProperty("audience_size");
      expect(podcast).toHaveProperty("rating");
      expect(podcast).toHaveProperty("episode_count");
      expect(podcast).toHaveProperty("last_posted_at");
      expect(podcast).toHaveProperty("frequency");
    });

    it("returns podcasts with correct types", async () => {
      const result = await runWithMockService(
        PodscanService.pipe(
          Effect.Effect.flatMap((service) => service.getTop("technology", 10)),
        ),
      );

      const podcast = result[0];
      expect(podcast).toBeDefined();
      if (!podcast) return;
      expect(typeof podcast.rank).toBe("number");
      expect(typeof podcast.name).toBe("string");
      expect(typeof podcast.publisher).toBe("string");
      expect(typeof podcast.movement).toBe("string");
      expect(typeof podcast.podcast_id).toBe("string");
      expect(typeof podcast.thumbnail).toBe("string");
      expect(typeof podcast.audience_size).toBe("number");
      expect(typeof podcast.rating).toBe("number");
      expect(typeof podcast.episode_count).toBe("number");
      expect(typeof podcast.last_posted_at).toBe("number");
      expect(typeof podcast.frequency).toBe("string");
    });
  });

  describe("getLatest", () => {
    it("returns episodes tied to requested podcast id", async () => {
      const requestedPodcastId = "pd_custom_sync_target";
      const result = await runWithMockService(
        PodscanService.pipe(
          Effect.Effect.flatMap((service) =>
            service.getLatest(requestedPodcastId, 10),
          ),
        ),
      );

      expect(result.episodes.length).toBeGreaterThan(0);
      expect(
        result.episodes.every(
          (episode) => episode.podcast.podcast_id === requestedPodcastId,
        ),
      ).toBe(true);
    });

    it("returns episodes and pagination object", async () => {
      const result = await runWithMockService(
        PodscanService.pipe(
          Effect.Effect.flatMap((service) =>
            service.getLatest("mock-podcast-1", 10),
          ),
        ),
      );

      expect(result).toHaveProperty("episodes");
      expect(result).toHaveProperty("pagination");
      expect(Array.isArray(result.episodes)).toBe(true);
      expect(typeof result.pagination).toBe("object");
    });

    it("returns episodes with correct shape", async () => {
      const result = await runWithMockService(
        PodscanService.pipe(
          Effect.Effect.flatMap((service) =>
            service.getLatest("mock-podcast-1", 10),
          ),
        ),
      );

      const episode = result.episodes[0];
      expect(episode).toBeDefined();
      if (!episode) return;
      expect(episode).toHaveProperty("episode_id");
      expect(episode).toHaveProperty("episode_title");
      expect(episode).toHaveProperty("episode_url");
      expect(episode).toHaveProperty("episode_audio_url");
      expect(episode).toHaveProperty("episode_image_url");
      expect(episode).toHaveProperty("episode_duration");
      expect(episode).toHaveProperty("episode_word_count");
      expect(episode).toHaveProperty("episode_transcript");
      expect(episode).toHaveProperty("episode_description");
      expect(episode).toHaveProperty("episode_categories");
      expect(episode).toHaveProperty("episode_fully_processed");
      expect(episode).toHaveProperty("episode_guid");
      expect(episode).toHaveProperty("episode_has_guests");
      expect(episode).toHaveProperty("episode_has_sponsors");
      expect(episode).toHaveProperty("episode_permalink");
      expect(episode).toHaveProperty(
        "episode_transcript_word_level_timestamps",
      );
      expect(episode).toHaveProperty("metadata");
      expect(episode).toHaveProperty("topics");
      expect(episode).toHaveProperty("podcast");
      expect(episode).toHaveProperty("posted_at");
      expect(episode).toHaveProperty("created_at");
      expect(episode).toHaveProperty("updated_at");
    });

    it("returns episodes with correct types", async () => {
      const result = await runWithMockService(
        PodscanService.pipe(
          Effect.Effect.flatMap((service) =>
            service.getLatest("mock-podcast-1", 10),
          ),
        ),
      );

      const episode = result.episodes[0];
      expect(episode).toBeDefined();
      if (!episode) return;
      expect(typeof episode.episode_id).toBe("string");
      expect(typeof episode.episode_title).toBe("string");
      expect(typeof episode.episode_url).toBe("string");
      expect(typeof episode.episode_audio_url).toBe("string");
      expect(typeof episode.episode_image_url).toBe("string");
      expect(typeof episode.episode_duration).toBe("number");
      expect(typeof episode.episode_word_count).toBe("number");
      expect(typeof episode.episode_transcript).toBe("string");
      expect(typeof episode.episode_description).toBe("string");
      expect(typeof episode.episode_fully_processed).toBe("boolean");
      expect(typeof episode.episode_guid).toBe("string");
      expect(typeof episode.episode_has_guests).toBe("boolean");
      expect(typeof episode.episode_has_sponsors).toBe("boolean");
      expect(typeof episode.posted_at).toBe("string");
      expect(typeof episode.created_at).toBe("string");
      expect(typeof episode.updated_at).toBe("string");
    });

    it("returns pagination with string fields", async () => {
      const result = await runWithMockService(
        PodscanService.pipe(
          Effect.Effect.flatMap((service) =>
            service.getLatest("mock-podcast-1", 10),
          ),
        ),
      );

      const { pagination } = result;
      expect(typeof pagination.total).toBe("number");
      expect(typeof pagination.per_page).toBe("number");
      expect(typeof pagination.current_page).toBe("number");
      expect(typeof pagination.last_page).toBe("number");
      expect(typeof pagination.from).toBe("number");
      expect(typeof pagination.to).toBe("number");
    });

    it("returns pagination with expected values", async () => {
      const result = await runWithMockService(
        PodscanService.pipe(
          Effect.Effect.flatMap((service) =>
            service.getLatest("mock-podcast-1", 10),
          ),
        ),
      );

      const { pagination } = result;
      expect(pagination.total).toBe(100);
      expect(pagination.per_page).toBe(10);
      expect(pagination.current_page).toBe(1);
      expect(pagination.last_page).toBe(10);
      expect(pagination.from).toBe(1);
      expect(pagination.to).toBe(10);
    });

    it("returns episodes array with multiple items", async () => {
      const result = await runWithMockService(
        PodscanService.pipe(
          Effect.Effect.flatMap((service) =>
            service.getLatest("mock-podcast-1", 10),
          ),
        ),
      );

      expect(result.episodes.length).toBeGreaterThan(0);
    });
  });

  describe("getPodcast", () => {
    it("returns detail for requested podcast id", async () => {
      const requestedPodcastId = "pd_custom_sync_target";
      const result = await runWithMockService(
        PodscanService.pipe(
          Effect.Effect.flatMap((service) =>
            service.getPodcast(requestedPodcastId),
          ),
        ),
      );

      expect(result.podcast_id).toBe(requestedPodcastId);
    });

    it("returns a PodscanPodcastDetail object", async () => {
      const result = await runWithMockService(
        PodscanService.pipe(
          Effect.Effect.flatMap((service) =>
            service.getPodcast("mock-podcast-1"),
          ),
        ),
      );

      expect(result).toBeDefined();
      expect(typeof result).toBe("object");
    });

    it("returns detail with correct shape (27 fields)", async () => {
      const result = await runWithMockService(
        PodscanService.pipe(
          Effect.Effect.flatMap((service) =>
            service.getPodcast("mock-podcast-1"),
          ),
        ),
      );

      // Verify all 27 PodscanPodcastDetail fields exist
      expect(result).toHaveProperty("podcast_id");
      expect(result).toHaveProperty("podcast_guid");
      expect(result).toHaveProperty("podcast_name");
      expect(result).toHaveProperty("podcast_url");
      expect(result).toHaveProperty("podcast_description");
      expect(result).toHaveProperty("podcast_image_url");
      expect(result).toHaveProperty("publisher_name");
      expect(result).toHaveProperty("is_active");
      expect(result).toHaveProperty("rss_url");
      expect(result).toHaveProperty("episode_count");
      expect(result).toHaveProperty("last_posted_at");
      expect(result).toHaveProperty("language");
      expect(result).toHaveProperty("region");
      expect(result).toHaveProperty("last_scanned_at");
      expect(result).toHaveProperty("created_at");
      expect(result).toHaveProperty("updated_at");
      expect(result).toHaveProperty("is_duplicate");
      expect(result).toHaveProperty("is_duplicate_of");
      expect(result).toHaveProperty("podcast_itunes_id");
      expect(result).toHaveProperty("podcast_spotify_id");
      expect(result).toHaveProperty("podcast_reach_score");
      expect(result).toHaveProperty("podcast_has_guests");
      expect(result).toHaveProperty("podcast_has_sponsors");
      expect(result).toHaveProperty("podcast_categories");
      expect(result).toHaveProperty("podcast_iab_categories");
      expect(result).toHaveProperty("reach");
      expect(result).toHaveProperty("brand_safety");
    });

    it("returns detail with correct types", async () => {
      const result = await runWithMockService(
        PodscanService.pipe(
          Effect.Effect.flatMap((service) =>
            service.getPodcast("mock-podcast-1"),
          ),
        ),
      );

      // String fields
      expect(typeof result.podcast_id).toBe("string");
      expect(typeof result.podcast_guid).toBe("string");
      expect(typeof result.podcast_name).toBe("string");
      expect(typeof result.podcast_url).toBe("string");
      expect(typeof result.podcast_description).toBe("string");
      expect(typeof result.podcast_image_url).toBe("string");
      expect(typeof result.publisher_name).toBe("string");
      expect(typeof result.rss_url).toBe("string");
      expect(typeof result.language).toBe("string");
      expect(typeof result.region).toBe("string");
      expect(typeof result.last_posted_at).toBe("string");
      expect(typeof result.last_scanned_at).toBe("string");
      expect(typeof result.created_at).toBe("string");
      expect(typeof result.updated_at).toBe("string");

      // Boolean fields
      expect(typeof result.is_active).toBe("boolean");
      expect(typeof result.is_duplicate).toBe("boolean");

      // Number fields
      expect(typeof result.episode_count).toBe("number");
      expect(typeof result.podcast_reach_score).toBe("number");

      // Array fields
      expect(Array.isArray(result.podcast_categories)).toBe(true);
      expect(Array.isArray(result.podcast_iab_categories)).toBe(true);

      // Object/unknown fields (reach, brand_safety can be objects or null)
      // Just verify they exist (already checked in shape test)
    });
  });

  describe("MockPodscanService layer", () => {
    it("provides PodscanService correctly", async () => {
      const result = await runWithMockService(
        PodscanService.pipe(
          Effect.Effect.flatMap((service) => {
            expect(typeof service.getTop).toBe("function");
            expect(typeof service.getLatest).toBe("function");
            expect(typeof service.getPodcast).toBe("function");
            return Effect.Effect.succeed(true);
          }),
        ),
      );

      expect(result).toBe(true);
    });
  });
});
