import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import * as Effect from "effect";
import { annotateCurrentSpan } from "effect/Effect";
import { BucketService } from "./bucket";
import { BucketError } from "./errors";
import type { PodscanEpisode } from "./schema";

export const BucketServiceLive = Effect.Layer.effect(
  BucketService,
  Effect.Effect.gen(function* () {
    const bucketName = yield* Effect.Config.string("PODCAST_BUCKET_NAME");
    const s3 = new S3Client({});

    const writeEpisode = Effect.Effect.fn("podcast.bucket.writeEpisode")(
      function* (prefix: string, date: string, episode: PodscanEpisode) {
        yield* annotateCurrentSpan("prefix", prefix);
        yield* annotateCurrentSpan("date", date);
        yield* annotateCurrentSpan("episodeId", episode.episode_id);
        yield* Effect.Effect.tryPromise({
          try: () =>
            s3.send(
              new PutObjectCommand({
                Bucket: bucketName,
                Key: `${prefix}/${date}/${episode.episode_id}.json`,
                Body: JSON.stringify(episode),
                ContentType: "application/json",
              }),
            ),
          catch: (err: unknown) => new BucketError({ cause: err }),
        });
      },
      (effect: Effect.Effect.Effect<void, BucketError>) =>
        effect.pipe(Effect.Effect.asVoid),
    );

    return BucketService.of({ writeEpisode });
  }),
);
