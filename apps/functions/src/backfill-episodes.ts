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

// Daily investing podcasts (5+ episodes/week — current market commentary)
const PODCAST_IDS: readonly string[] = [
  "pd_ndbka52yzyqj2gez", // Money Guy Show
  "pd_ndbka52ppbyj2gez", // Money For Couples with Ramit Sethi
  "pd_vp6km5awq8b94lae", // Rich Dad Radio Show
  "pd_3ymxjxog7ypjb8v6", // The Wealth Effect (Green Moon)
  "pd_pmk29n3q2rdjev8n", // The Investing for Beginners Podcast
  "pd_dpmk29nmper5ev8n", // Invest Like the Best with Patrick O'Shaughnessy
  "pd_eaboy5lnapkjzvdx", // NerdWallet's Smart Money Podcast
  "pd_mqazg9yb6bajr6w4", // All the Hacks: Money, Points & Life
  "pd_7a3do5b3ywp9kxyr", // WashingtonWise (Charles Schwab)
  "pd_ka86x53mllm9wgdv", // Macro Voices
];

const MAX_PAGES = 25;

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

    for (const podcastId of PODCAST_IDS) {
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
  });

export const handler = LambdaHandler.make({
  handler: effectHandler,
  layer: PodcastLayer,
});
