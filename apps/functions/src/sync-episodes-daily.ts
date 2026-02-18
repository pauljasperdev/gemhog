import "@gemhog/env/server";

import type { EventBridgeEvent, LambdaContext } from "@effect-aws/lambda";
import { LambdaHandler } from "@effect-aws/lambda";
import {
  PodcastLayer,
  PodcastRepository,
  PodscanService,
} from "@gemhog/core/podcast";
import { PutObjectCommand, S3Client } from "@gemhog/core/s3";
import { Effect } from "effect";

const s3 = new S3Client({});
const bucketName = process.env.PODCAST_BUCKET_NAME;

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

const effectHandler = (
  _event: EventBridgeEvent<string, unknown>,
  _context: LambdaContext,
) =>
  Effect.gen(function* () {
    const podscan = yield* PodscanService;
    const repo = yield* PodcastRepository;
    const today = new Date().toISOString().split("T")[0];

    let processed = 0;
    let totalEpisodes = 0;
    const errors: string[] = [];

    for (const podcastId of PODCAST_IDS) {
      yield* Effect.gen(function* () {
        const detail = yield* podscan.getPodcast(podcastId);
        yield* repo.upsertPodcastByPodscanId(detail);

        const { episodes } = yield* podscan.getLatest(podcastId);
        for (const ep of episodes) {
          const isNew = yield* repo
            .episodeExistsByPodscanId(ep.episode_id)
            .pipe(Effect.map((exists) => !exists));
          yield* repo.upsertEpisodeByPodscanId(ep);
          if (isNew && bucketName) {
            yield* Effect.tryPromise({
              try: () =>
                s3.send(
                  new PutObjectCommand({
                    Bucket: bucketName,
                    Key: `daily/${today}/${ep.episode_id}.json`,
                    Body: JSON.stringify(ep),
                    ContentType: "application/json",
                  }),
                ),
              catch: (err) => new Error(`S3 write failed: ${String(err)}`),
            }).pipe(
              Effect.catchAll((error) =>
                Effect.logWarning(
                  `Failed to write episode ${ep.episode_id} to S3: ${String(error)}`,
                ),
              ),
            );
          }
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
