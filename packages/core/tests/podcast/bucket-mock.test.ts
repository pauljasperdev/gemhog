import { existsSync, readFileSync } from "node:fs";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import * as NodeFileSystem from "@effect/platform-node/NodeFileSystem";
import { Effect, Layer } from "effect";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { BucketService } from "../../src/podcast/bucket";
import { makeBucketServiceMock } from "../../src/podcast/bucket.mock";
import { BucketError } from "../../src/podcast/errors";
import { createMockEpisode } from "./test-fixtures";

const testLayer = (tmpDir: string) =>
  makeBucketServiceMock(tmpDir).pipe(Layer.provide(NodeFileSystem.layer));

const runWithLayer = <A, E>(
  tmpDir: string,
  program: Effect.Effect<A, E, BucketService>,
) => Effect.runPromise(program.pipe(Effect.provide(testLayer(tmpDir))));

describe("BucketServiceMock", () => {
  let tmpDir = "";

  beforeEach(async () => {
    tmpDir = await mkdtemp(join(tmpdir(), "bucket-test-"));
  });

  afterEach(async () => {
    await rm(tmpDir, { recursive: true, force: true });
  });

  it("writeEpisode creates correct directory", async () => {
    const prefix = "podcasts";
    const date = "2026-02-18";
    const episode = createMockEpisode({ episode_id: "test-ep-123" });

    await runWithLayer(
      tmpDir,
      BucketService.pipe(
        Effect.flatMap((service) =>
          service.writeEpisode(prefix, date, episode),
        ),
      ),
    );

    expect(existsSync(join(tmpDir, prefix, date))).toBe(true);
  });

  it("writeEpisode writes correct JSON file", async () => {
    const prefix = "podcasts";
    const date = "2026-02-18";
    const episode = createMockEpisode({ episode_id: "test-ep-123" });
    const filePath = join(tmpDir, prefix, date, `${episode.episode_id}.json`);

    await runWithLayer(
      tmpDir,
      BucketService.pipe(
        Effect.flatMap((service) =>
          service.writeEpisode(prefix, date, episode),
        ),
      ),
    );

    expect(existsSync(filePath)).toBe(true);
  });

  it("file content matches JSON.stringify(episode) when parsed back", async () => {
    const prefix = "podcasts";
    const date = "2026-02-18";
    const episode = createMockEpisode({ episode_id: "test-ep-123" });
    const filePath = join(tmpDir, prefix, date, `${episode.episode_id}.json`);

    await runWithLayer(
      tmpDir,
      BucketService.pipe(
        Effect.flatMap((service) =>
          service.writeEpisode(prefix, date, episode),
        ),
      ),
    );

    const fileContent = readFileSync(filePath, "utf8");
    expect(JSON.parse(fileContent)).toEqual(episode);
  });

  it("writeEpisode creates nested directories recursively", async () => {
    const prefix = "deep/nested/prefix";
    const date = "2026/02/18";
    const episode = createMockEpisode({ episode_id: "test-ep-123" });

    await runWithLayer(
      tmpDir,
      BucketService.pipe(
        Effect.flatMap((service) =>
          service.writeEpisode(prefix, date, episode),
        ),
      ),
    );

    expect(
      existsSync(join(tmpDir, "deep", "nested", "prefix", "2026", "02", "18")),
    ).toBe(true);
  });

  it("writeEpisode returns BucketError on filesystem failure", async () => {
    const episode = createMockEpisode({ episode_id: "test-ep-123" });
    const failingLayer = makeBucketServiceMock(
      "/dev/null/impossible/path",
    ).pipe(Layer.provide(NodeFileSystem.layer));

    const result = await Effect.runPromise(
      BucketService.pipe(
        Effect.flatMap((service) =>
          service.writeEpisode("podcasts", "2026-02-18", episode),
        ),
        Effect.provide(failingLayer),
        Effect.either,
      ),
    );

    expect(result._tag).toBe("Left");
    if (result._tag === "Left") {
      expect(result.left).toBeInstanceOf(BucketError);
    }
  });
});
