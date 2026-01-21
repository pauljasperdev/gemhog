// packages/env/src/web.test.ts
// Unit tests for WebConfig schema validation using Effect ConfigProvider
// for isolated testing without touching process.env
import { Config, ConfigProvider, Effect } from "effect";
import { describe, expect, it } from "vitest";

// Recreate the config definition for isolated testing
// DO NOT import from ./web.ts - that would trigger validation with real env vars
const WebConfig = Config.all({
  NEXT_PUBLIC_SERVER_URL: Config.string("NEXT_PUBLIC_SERVER_URL"),
});

// Helper to create a ConfigProvider from a map of env vars
const createProvider = (vars: Record<string, string>) =>
  ConfigProvider.fromMap(new Map(Object.entries(vars)));

describe("WebConfig schema", () => {
  it("should fail when NEXT_PUBLIC_SERVER_URL is missing", async () => {
    const provider = createProvider({});

    await expect(
      Effect.runPromise(WebConfig.pipe(Effect.withConfigProvider(provider))),
    ).rejects.toThrow();
  });

  it("should succeed when NEXT_PUBLIC_SERVER_URL is provided", async () => {
    const provider = createProvider({
      NEXT_PUBLIC_SERVER_URL: "http://localhost:3000",
    });

    const result = await Effect.runPromise(
      WebConfig.pipe(Effect.withConfigProvider(provider)),
    );

    expect(result.NEXT_PUBLIC_SERVER_URL).toBe("http://localhost:3000");
  });
});
