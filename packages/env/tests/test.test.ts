import { Config, Effect } from "effect";
import { describe, expect, it } from "vitest";
import { ConfigLayerTest } from "../src/test";

describe("ConfigLayerTest", () => {
  it("provides DATABASE_URL from static map", async () => {
    const program = Effect.gen(function* () {
      const dbUrl = yield* Config.string("DATABASE_URL");
      return dbUrl;
    });

    const result = await Effect.runPromise(
      Effect.provide(program, ConfigLayerTest),
    );

    expect(result).toBe(
      "postgresql://postgres:password@localhost:5433/gemhog_test",
    );
  });

  it("provides DATABASE_URL_POOLER from static map", async () => {
    const program = Effect.gen(function* () {
      const poolerUrl = yield* Config.string("DATABASE_URL_POOLER");
      return poolerUrl;
    });

    const result = await Effect.runPromise(
      Effect.provide(program, ConfigLayerTest),
    );

    expect(result).toBe(
      "postgresql://postgres:password@localhost:5433/gemhog_test",
    );
  });

  it("provides BETTER_AUTH_SECRET from static map", async () => {
    const program = Effect.gen(function* () {
      const secret = yield* Config.string("BETTER_AUTH_SECRET");
      return secret;
    });

    const result = await Effect.runPromise(
      Effect.provide(program, ConfigLayerTest),
    );

    expect(result).toBe("ZpgIiuzmFRdZ6OSFTJQ1PHqgRLyhnzIe");
  });

  it("provides BETTER_AUTH_URL from static map", async () => {
    const program = Effect.gen(function* () {
      const url = yield* Config.string("BETTER_AUTH_URL");
      return url;
    });

    const result = await Effect.runPromise(
      Effect.provide(program, ConfigLayerTest),
    );

    expect(result).toBe("http://localhost:3000");
  });

  it("provides APP_URL from static map", async () => {
    const program = Effect.gen(function* () {
      const url = yield* Config.string("APP_URL");
      return url;
    });

    const result = await Effect.runPromise(
      Effect.provide(program, ConfigLayerTest),
    );

    expect(result).toBe("http://localhost:3001");
  });

  it("fails when accessing undeclared key", async () => {
    const program = Effect.gen(function* () {
      const value = yield* Config.string("UNDECLARED_KEY");
      return value;
    });

    const result = await Effect.runPromise(
      Effect.provide(program, ConfigLayerTest).pipe(Effect.either),
    );

    expect(result._tag).toBe("Left");
  });
});
