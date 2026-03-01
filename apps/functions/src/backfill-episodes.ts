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

// MVP investing podcasts — 12 core shows for backfill
const PODCAST_IDS: readonly string[] = [
  // Daily market shows
  "pd_4evzb9qe3e49873g", // Thoughts on the Market (Morgan Stanley)
  "pd_4evzb9qkyyl9873g", // Wall Street Breakfast (Seeking Alpha)
  "pd_w6go3jmkn6l52la7", // Motley Fool Money

  // Weekly deep-dives
  "pd_6gokljvvn7yj37ma", // All-In
  "pd_dpmk29nmper5ev8n", // Invest Like the Best
  "pd_v8xnmz97l4534qeo", // We Study Billionaires
  "pd_kwgp3jzaep9xnbyz", // Odd Lots (Bloomberg)
  "pd_exk67jggkrjm8lrw", // Animal Spirits
  "pd_dbka52p8eemj2gez", // Prof G Markets
  "pd_ka86x53mllm9wgdv", // Macro Voices

  // Company deep-dives
  "pd_k42yajrkaq9p8owz", // Acquired
  "pd_rw2lvjex6x5zax36", // Business Breakdowns
];

// Trial limits: 100 req/day, 10 req/min
// 5 podcasts × 10 pages = 50 requests per run (within daily limit)
const MAX_PAGES = 10;
const PODCASTS_PER_RUN = 5;

export const effectHandler = (
  _event: EventBridgeEvent<string, unknown>,
  _context: LambdaContext,
) =>
  Effect.gen(function* () {
    const podscan = yield* PodscanService;
    const repo = yield* PodcastRepository;
    const bucket = yield* BucketService;
    const today = new Date().toISOString().split("T")[0] ?? "";

    let processed = 0;
    let totalEpisodes = 0;
    let totalNewEpisodes = 0;
    const errors: string[] = [];

    for (const podcastId of PODCAST_IDS.slice(0, PODCASTS_PER_RUN)) {
      yield* Effect.gen(function* () {
        // First fetch page 1 to discover last_page
        const firstPage = yield* podscan.getLatest(podcastId, 25, undefined, 1);
        const lastPage = Math.min(firstPage.pagination.last_page, MAX_PAGES);

        yield* Effect.logInfo(
          `Fetched page 1/${String(lastPage)} for podcast ${podcastId}`,
        );

        // Process page 1 episodes
        for (const ep of firstPage.episodes) {
          yield* Effect.gen(function* () {
            const exists = yield* repo.episodeExistsByPodscanId(ep.episode_id);
            if (exists) return;

            const postedAtDate = ep.posted_at.split("T")[0] ?? today;
            yield* repo.upsertEpisodeByPodscanId(ep);
            yield* bucket
              .writeEpisode("daily", postedAtDate, ep)
              .pipe(
                Effect.catchAll((error) =>
                  Effect.logWarning(
                    `Failed to write episode ${ep.episode_id} to bucket: ${String(error)}`,
                  ),
                ),
              );
            totalNewEpisodes += 1;
          });
        }
        totalEpisodes += firstPage.episodes.length;

        // Loop pages 2..lastPage
        for (let page = 2; page <= lastPage; page++) {
          const pageResult = yield* podscan.getLatest(
            podcastId,
            25,
            undefined,
            page,
          );

          yield* Effect.logInfo(
            `Fetched page ${String(page)}/${String(lastPage)} for podcast ${podcastId}`,
          );

          for (const ep of pageResult.episodes) {
            yield* Effect.gen(function* () {
              const exists = yield* repo.episodeExistsByPodscanId(
                ep.episode_id,
              );
              if (exists) return;

              const postedAtDate = ep.posted_at.split("T")[0] ?? today;
              yield* repo.upsertEpisodeByPodscanId(ep);
              yield* bucket
                .writeEpisode("daily", postedAtDate, ep)
                .pipe(
                  Effect.catchAll((error) =>
                    Effect.logWarning(
                      `Failed to write episode ${ep.episode_id} to bucket: ${String(error)}`,
                    ),
                  ),
                );
              totalNewEpisodes += 1;
            });
          }
          totalEpisodes += pageResult.episodes.length;
        }

        processed += 1;
        yield* Effect.logInfo(
          `Backfilled podcast ${podcastId}: ${String(lastPage)} pages processed`,
        );
      }).pipe(
        Effect.tapError((error) =>
          Effect.logError(`Failed to backfill podcast ${podcastId}`, error),
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
      `Backfill complete: ${String(processed)}/${String(PODCAST_IDS.length)} podcasts processed, ${String(totalEpisodes)} episodes checked, ${String(totalNewEpisodes)} new episodes written, ${String(errors.length)} errors`,
    );

    if (processed === 0 && errors.length > 0) {
      return yield* Effect.die(
        new Error(`All ${String(errors.length)} podcasts failed to backfill`),
      );
    }

    return { processed, totalEpisodes, totalNewEpisodes, errors };
  }).pipe(
    Effect.ensuring(Effect.sleep("200 millis")), // Allow BatchSpanProcessor to flush before Lambda freeze
  );

export const handler = LambdaHandler.make({
  handler: effectHandler,
  layer: PodcastLayer,
});
