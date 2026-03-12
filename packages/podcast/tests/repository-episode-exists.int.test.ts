import * as PgDrizzle from "@effect/sql-drizzle/Pg";
import { DrizzleIntegrationLive } from "@gemhog/db";
import { ConfigLayerTest } from "@gemhog/env/test";
import * as Effect from "effect";
import { afterEach, describe, expect, it } from "vitest";
import { PodcastRepository } from "../src/repository";
import { PodcastRepositoryLive } from "../src/repository.live";
import { podscanEpisode, podscanPodcast } from "../src/sql";
import { createMockEpisode, createMockPodcastDetail } from "./test-fixtures";

describe("episodeExistsByPodscanId", () => {
  const TestDrizzleLive = DrizzleIntegrationLive.pipe(
    Effect.Layer.provide(ConfigLayerTest),
  );
  const TestRepositoryLive = PodcastRepositoryLive.pipe(
    Effect.Layer.provide(TestDrizzleLive),
  );

  const truncate = Effect.Effect.gen(function* () {
    const db = yield* PgDrizzle.PgDrizzle;
    // Delete episode first (child), then podcast (parent) - FK order matters
    yield* db
      .delete(podscanEpisode)
      .pipe(Effect.Effect.catchAll(() => Effect.Effect.succeed(undefined)));
    yield* db
      .delete(podscanPodcast)
      .pipe(Effect.Effect.catchAll(() => Effect.Effect.succeed(undefined)));
  });

  const runWithRepository = <A, E>(
    effect: Effect.Effect.Effect<A, E, PodcastRepository>,
  ) =>
    Effect.Effect.runPromise(
      effect.pipe(
        Effect.Effect.provide(TestRepositoryLive),
      ) as Effect.Effect.Effect<A, E, never>,
    );

  const runTruncate = () =>
    Effect.Effect.runPromise(
      truncate.pipe(
        Effect.Effect.provide(TestDrizzleLive),
      ) as Effect.Effect.Effect<void, never, never>,
    );

  afterEach(async () => {
    await runTruncate();
  });

  it("returns false for non-existent podscan episode ID", async () => {
    const result = await runWithRepository(
      PodcastRepository.pipe(
        Effect.Effect.flatMap((repo) =>
          repo.episodeExistsByPodscanId("non-existent-id-12345"),
        ),
      ),
    );

    expect(result).toBe(false);
  });

  it("returns true for existing episode", async () => {
    const podscanEpisodeId = "exists-check-episode-1";

    const podcastData = createMockPodcastDetail({
      podcast_id: "exists-check-podcast-1",
    });

    await runWithRepository(
      PodcastRepository.pipe(
        Effect.Effect.flatMap((repo) =>
          repo.upsertPodcastByPodscanId(podcastData),
        ),
      ),
    );

    await runWithRepository(
      PodcastRepository.pipe(
        Effect.Effect.flatMap((repo) =>
          repo.upsertEpisodeByPodscanId(
            createMockEpisode({
              episode_id: podscanEpisodeId,
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

    const result = await runWithRepository(
      PodcastRepository.pipe(
        Effect.Effect.flatMap((repo) =>
          repo.episodeExistsByPodscanId(podscanEpisodeId),
        ),
      ),
    );

    expect(result).toBe(true);
  });
});
