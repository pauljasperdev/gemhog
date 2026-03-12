import * as PgDrizzle from "@effect/sql-drizzle/Pg";
import { DrizzleIntegrationLive } from "@gemhog/db";
import { ConfigLayerTest } from "@gemhog/env/test";
import * as Effect from "effect";
import { afterEach, describe, expect, it } from "vitest";
import { PodscanService } from "../src/podscan";
import { MockPodscanService } from "../src/podscan.mock";
import { PodcastRepository } from "../src/repository";
import { PodcastRepositoryLive } from "../src/repository.live";
import { podscanEpisode, podscanPodcast } from "../src/sql";

describe("mock podscan + repository integration", () => {
  const TestDrizzleLive = DrizzleIntegrationLive.pipe(
    Effect.Layer.provide(ConfigLayerTest),
  );
  const TestRepositoryLive = PodcastRepositoryLive.pipe(
    Effect.Layer.provide(TestDrizzleLive),
  );
  const TestLive = Effect.Layer.mergeAll(
    TestRepositoryLive,
    MockPodscanService,
  );

  const truncate = Effect.Effect.gen(function* () {
    const db = yield* PgDrizzle.PgDrizzle;
    yield* db
      .delete(podscanEpisode)
      .pipe(Effect.Effect.catchAll(() => Effect.Effect.void));
    yield* db
      .delete(podscanPodcast)
      .pipe(Effect.Effect.catchAll(() => Effect.Effect.void));
  });

  const runTruncate = () =>
    Effect.Effect.runPromise(
      truncate.pipe(
        Effect.Effect.provide(TestDrizzleLive),
      ) as Effect.Effect.Effect<void, never, never>,
    );

  afterEach(async () => {
    await runTruncate();
  });

  it("upserts episodes from mock service without FK mismatch for requested podcast", async () => {
    const requestedPodcastId = "pd_mock_integration_1";

    const result = await Effect.Effect.runPromise(
      Effect.Effect.gen(function* () {
        const podscan = yield* PodscanService;
        const repo = yield* PodcastRepository;

        const detail = yield* podscan.getPodcast(requestedPodcastId);
        const savedPodcast = yield* repo.upsertPodcastByPodscanId(detail);

        const latest = yield* podscan.getLatest(requestedPodcastId, 10);
        const savedEpisodes = yield* Effect.Effect.forEach(
          latest.episodes,
          (item) => repo.upsertEpisodeByPodscanId(item),
        );

        return { savedPodcast, savedEpisodes };
      }).pipe(
        Effect.Effect.provide(TestLive),
        // biome-ignore lint/suspicious/noExplicitAny: Test layer cast for runPromise
      ) as Effect.Effect.Effect<any, any, never>,
    );

    expect(result.savedPodcast.podscanPodcastId).toBe(requestedPodcastId);
    expect(result.savedEpisodes.length).toBeGreaterThan(0);
    expect(
      result.savedEpisodes.every(
        // biome-ignore lint/suspicious/noExplicitAny: Test assertion with any result
        (savedEpisode: any) =>
          savedEpisode.podcastId === result.savedPodcast.id,
      ),
    ).toBe(true);
  });
});
