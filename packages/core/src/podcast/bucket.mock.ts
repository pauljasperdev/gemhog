import { FileSystem } from "@effect/platform";
import * as NodeFileSystem from "@effect/platform-node/NodeFileSystem";
import * as Effect from "effect";
import { BucketService } from "./bucket";
import { BucketError } from "./errors";

export const makeBucketServiceMock = (basePath: string) =>
  Effect.Layer.effect(
    BucketService,
    Effect.Effect.gen(function* () {
      const fs = yield* FileSystem.FileSystem;

      return BucketService.of({
        writeEpisode: (prefix, date, episode) =>
          Effect.Effect.gen(function* () {
            const dir = `${basePath}/${prefix}/${date}`;
            yield* fs.makeDirectory(dir, { recursive: true });
            yield* fs.writeFileString(
              `${dir}/${episode.episode_id}.json`,
              JSON.stringify(episode),
            );
          }).pipe(
            Effect.Effect.mapError(
              (cause: unknown) => new BucketError({ cause }),
            ),
          ),
      });
    }),
  );

export const BucketServiceMock = makeBucketServiceMock(".bucket").pipe(
  Effect.Layer.provide(NodeFileSystem.layer),
);
