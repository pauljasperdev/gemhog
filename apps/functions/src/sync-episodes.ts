import "@gemhog/env/server";

import type { EventBridgeEvent, LambdaContext } from "@effect-aws/lambda";
import { LambdaHandler } from "@effect-aws/lambda";
import {
  PodcastLayer,
  PodcastRepository,
  PodscanService,
} from "@gemhog/core/podcast";
import { Effect } from "effect";

// Podcast IDs to sync from Podscan — replace with actual Podscan podcast IDs
const PODCAST_IDS: readonly string[] = [
  // "abc123", // Example: Replace with real Podscan podcast ID
  // "def456", // Example: Replace with real Podscan podcast ID
];

const effectHandler = (
  _event: EventBridgeEvent<string, unknown>,
  _context: LambdaContext,
) =>
  Effect.gen(function* () {
    const podscan = yield* PodscanService;
    const repo = yield* PodcastRepository;

    let processed = 0;
    let totalEpisodes = 0;
    const errors: string[] = [];

    for (const podcastId of PODCAST_IDS) {
      yield* Effect.gen(function* () {
        const detail = yield* podscan.getPodcast(podcastId);
        yield* repo.upsertPodcastByPodscanId(detail);

        const { episodes } = yield* podscan.getLatest(podcastId);
        for (const ep of episodes) {
          yield* repo.upsertEpisodeByPodscanId(ep);
        }

        totalEpisodes += episodes.length;
        processed += 1;
        yield* Effect.logInfo(
          `Synced podcast ${podcastId}: ${String(episodes.length)} episodes`,
        );
      }).pipe(
        Effect.catchAll((error) =>
          Effect.gen(function* () {
            errors.push(podcastId);
            yield* Effect.logError(
              `Failed to sync podcast ${podcastId}`,
              error,
            );
          }),
        ),
      );
    }

    yield* Effect.logInfo(
      `Sync complete: ${String(processed)}/${String(PODCAST_IDS.length)} podcasts processed, ${String(totalEpisodes)} episodes upserted, ${String(errors.length)} errors`,
    );
  });

export const handler = LambdaHandler.make({
  handler: effectHandler,
  layer: PodcastLayer,
});
