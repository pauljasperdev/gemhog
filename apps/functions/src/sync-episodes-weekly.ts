import "@gemhog/env/server";

import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import type { EventBridgeEvent, LambdaContext } from "@effect-aws/lambda";
import { LambdaHandler } from "@effect-aws/lambda";
import {
  PodcastLayer,
  PodcastRepository,
  PodscanService,
} from "@gemhog/core/podcast";
import { Effect } from "effect";

const s3 = new S3Client({});
const bucketName = process.env.PODCAST_BUCKET_NAME;

// Weekly investing podcasts (<2.5 episodes/week — in-depth analysis)
const PODCAST_IDS: readonly string[] = [
  "pd_ka86x53mg4l9wgdv", // The Ramsey Show
  "pd_dbka52p8eemj2gez", // Prof G Markets (Vox Media)
  "pd_k42yajrma4b5p8ow", // The Clark Howard Podcast
  "pd_ymlwx562xvmj8aop", // Mad Money w/ Jim Cramer (CNBC)
  "pd_4evzb9qe3e49873g", // Thoughts on the Market (Morgan Stanley)
  "pd_lz3od9wa765vxa8e", // Earn Your Leisure (iHeartPodcasts)
  "pd_rw2lvje4el9zax36", // CNBC's "Fast Money"
  "pd_6kewm9dqleja847o", // The Ramsey Show Highlights
  "pd_a3do5b3286k9kxyr", // George Kamel (Ramsey Network)
  "pd_rw2lvje8v4xjzax3", // Ramsey Everyday Millionaires
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
                    Key: `weekly/${today}/${ep.episode_id}.json`,
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
