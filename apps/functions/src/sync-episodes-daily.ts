import "@gemhog/env/server";

import type { EventBridgeEvent, LambdaContext } from "@effect-aws/lambda";
import { LambdaHandler } from "@effect-aws/lambda";
import {
  BucketService,
  PodcastLayer,
  PodcastRepository,
  PodscanService,
} from "@gemhog/core/podcast";
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

        const { episodes } = yield* podscan.getLatest(podcastId);
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
