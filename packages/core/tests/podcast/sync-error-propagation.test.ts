import { Effect, Layer } from "effect";
import { describe, expect, it } from "vitest";
import { effectHandler } from "../../../../apps/functions/src/sync-episodes-weekly";
import { BucketService } from "../../src/podcast/bucket";
import { PodcastRepositoryError } from "../../src/podcast/errors";
import { MockPodscanService } from "../../src/podcast/podscan.mock";
import { PodcastRepository } from "../../src/podcast/repository";

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
});
