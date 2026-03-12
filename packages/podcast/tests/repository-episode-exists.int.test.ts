import * as PgDrizzle from "@effect/sql-drizzle/Pg";
import { PgClient } from "@effect/sql-pg";
import * as Effect from "effect";
import { afterEach, describe, expect, it } from "vitest";
import { PodcastRepository } from "../src/repository";
import { PodcastRepositoryLive } from "../src/repository.live";
import { podscanEpisode, podscanPodcast } from "../src/sql";
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
    effect.pipe(Effect.Effect.provide(TestRepositoryLive)),
  );

const runTruncate = () =>
  Effect.Effect.runPromise(
    truncate.pipe(Effect.Effect.provide(TestDrizzleLive)),
  );

describe("episodeExistsByPodscanId", () => {
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
