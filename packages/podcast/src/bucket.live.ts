import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import * as Effect from "effect";
import { BucketService } from "./bucket";
import { BucketError } from "./errors";

export const BucketServiceLive = Effect.Layer.effect(
  BucketService,
  Effect.Effect.gen(function* () {
    const bucketName = yield* Effect.Config.string("PODCAST_BUCKET_NAME");
    const s3 = new S3Client({});
    return BucketService.of({
      writeEpisode: (prefix, date, episode) =>
        Effect.Effect.tryPromise({
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
        }).pipe(Effect.Effect.asVoid),
    });
  }),
);
