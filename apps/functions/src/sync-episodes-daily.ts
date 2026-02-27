import "@gemhog/env/server";

import type { EventBridgeEvent, LambdaContext } from "@effect-aws/lambda";
import { LambdaHandler } from "@effect-aws/lambda";
import {
  BucketService,
  PodcastLayer,
  PodcastRepository,
  PodscanService,
} from "@gemhog/podcast";
import { Effect } from "effect";

// MVP investing podcasts — balanced daily + weekly content
const PODCAST_IDS: readonly string[] = [
  // Daily market shows (high volume, current news)
  "pd_4evzb9qe3e49873g", // Thoughts on the Market (Morgan Stanley) - daily
  "pd_4evzb9qkyyl9873g", // Wall Street Breakfast (Seeking Alpha) - daily
  "pd_w6go3jmkn6l52la7", // Motley Fool Money - daily

  // Weekly deep-dives (quality investment theses)
  "pd_6gokljvvn7yj37ma", // All-In - weekly
  "pd_dpmk29nmper5ev8n", // Invest Like the Best - weekly
  "pd_v8xnmz97l4534qeo", // We Study Billionaires - weekly
  "pd_kwgp3jzaep9xnbyz", // Odd Lots (Bloomberg) - 3x/week
  "pd_exk67jggkrjm8lrw", // Animal Spirits - 2x/week
  "pd_dbka52p8eemj2gez", // Prof G Markets - 2x/week
  "pd_ka86x53mllm9wgdv", // Macro Voices - weekly
];

export const effectHandler = (
  _event: EventBridgeEvent<string, unknown>,
  _context: LambdaContext,
) =>
  Effect.gen(function* () {
    const podscan = yield* PodscanService;
    const repo = yield* PodcastRepository;
    const bucket = yield* BucketService;
    const today = new Date().toISOString().split("T")[0] ?? "";
    const since = new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString();

    let processed = 0;
    let totalEpisodes = 0;
    const errors: string[] = [];

    for (const podcastId of PODCAST_IDS) {
      yield* Effect.gen(function* () {
        const ONE_MONTH_MS = 30 * 24 * 60 * 60 * 1000;
        const isFresh = yield* repo.readPodcastByPodscanId(podcastId).pipe(
          Effect.map(
            (existing) =>
              Date.now() - existing.updatedAt.getTime() < ONE_MONTH_MS,
          ),
          Effect.catchTag("PodcastNotFoundError", () => Effect.succeed(false)),
        );

        if (!isFresh) {
          const detail = yield* podscan.getPodcast(podcastId);
          yield* repo.upsertPodcastByPodscanId(detail);
        }

        const { episodes } = yield* podscan.getLatest(
          podcastId,
          undefined,
          since,
        );
        for (const ep of episodes) {
          yield* Effect.gen(function* () {
            const isNew = yield* repo
              .episodeExistsByPodscanId(ep.episode_id)
              .pipe(Effect.map((exists) => !exists));
            yield* repo.upsertEpisodeByPodscanId(ep);
            if (isNew) {
              yield* bucket
                .writeEpisode("daily", today, ep)
                .pipe(
                  Effect.catchAll((error) =>
                    Effect.logWarning(
                      `Failed to write episode ${ep.episode_id} to bucket: ${String(error)}`,
                    ),
                  ),
                );
            }
          });
        }

        totalEpisodes += episodes.length;
        processed += 1;
        yield* Effect.logInfo(
          `Synced podcast ${podcastId}: ${String(episodes.length)} episodes`,
        );
      }).pipe(
        Effect.tapError((error) =>
          Effect.logError(`Failed to sync podcast ${podcastId}`, error),
        ),
        Effect.catchTag("PodscanError", (error) =>
          Effect.gen(function* () {
            errors.push(podcastId);
            yield* Effect.logWarning(
              `Skipping podcast ${podcastId}: Podscan API error`,
              error,
            );
          }),
        ),
        Effect.catchTag("PodcastRepositoryError", (error) =>
          Effect.gen(function* () {
            errors.push(podcastId);
            yield* Effect.logWarning(
              `Skipping podcast ${podcastId}: DB error - ${error.cause}`,
            );
          }),
        ),
      );
    }

    yield* Effect.logInfo(
      `Sync complete: ${String(processed)}/${String(PODCAST_IDS.length)} podcasts processed, ${String(totalEpisodes)} episodes upserted, ${String(errors.length)} errors`,
    );

    if (processed === 0 && errors.length > 0) {
      return yield* Effect.die(
        new Error(`All ${String(errors.length)} podcasts failed to sync`),
      );
    }

    return { processed, totalEpisodes, errors };
  });

export const handler = LambdaHandler.make({
  handler: effectHandler,
  layer: PodcastLayer,
});
