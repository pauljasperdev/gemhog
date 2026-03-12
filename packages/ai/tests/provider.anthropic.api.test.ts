import { FetchHttpClient } from "@effect/platform";
import * as Effect from "effect";
import { ConfigProvider, Context, Layer } from "effect";
import { describe, expect, it, vi } from "vitest";

// Mock @effect/ai-anthropic modules to work around dependency version mismatch
// (ai-anthropic@0.23 requires @effect/ai@^0.33 which exports IdGenerator,
// but workspace has @effect/ai@0.23 which doesn't)
// vi.mock is hoisted by vitest before imports
vi.mock("@effect/ai-anthropic/AnthropicClient", () => ({
  AnthropicClient: Context.GenericTag("MockAnthropicClient"),
  make: () =>
    Effect.Effect.succeed({
      _tag: "MockClient",
    }),
}));

vi.mock("@effect/ai-anthropic/AnthropicLanguageModel", () => ({
  make: vi.fn(() => Effect.Effect.succeed({ _tag: "MockLanguageModel" })),
}));

// These imports work after vi.mock due to hoisting
import * as AnthropicLanguageModel from "@effect/ai-anthropic/AnthropicLanguageModel";
import { AiAuthError } from "../src/errors";
import { AiProvider } from "../src/provider";
import { AnthropicApiProviderLayer } from "../src/provider.anthropic.api";

// Config layer with valid API key
const TestConfigLayer = Layer.setConfigProvider(
  ConfigProvider.fromMap(new Map([["ANTHROPIC_API_KEY", "test-api-key"]])),
);

// Config layer with no API key
const EmptyConfigLayer = Layer.setConfigProvider(
  ConfigProvider.fromMap(new Map()),
);

describe("AnthropicApiProviderLayer", () => {
  describe("success path", () => {
    it("builds layer and languageModel returns a service when API key is provided", async () => {
      vi.mocked(AnthropicLanguageModel.make).mockClear();
      const result = await Effect.Effect.runPromise(
        Effect.Effect.gen(function* () {
          const provider = yield* AiProvider;
          const service = yield* provider.languageModel({
            name: "claude-sonnet-4-6",
          });
          // If we get here, the service was created successfully
          return service;
        }).pipe(
          Effect.Effect.provide(
            AnthropicApiProviderLayer.pipe(
              Layer.provide(TestConfigLayer),
              Layer.provide(FetchHttpClient.layer),
            ),
          ),
        ),
      );

      expect(result).toEqual({ _tag: "MockLanguageModel" });
    });

    it("forwards balanced spec.anthropic as config to AnthropicLanguageModel.make", async () => {
      vi.mocked(AnthropicLanguageModel.make).mockClear();
      const testSpec = {
        name: "claude-sonnet-4-6",
        anthropic: {
          thinking: { type: "enabled" as const, budget_tokens: 16000 },
          max_tokens: 32768,
        },
      };
      await Effect.Effect.runPromise(
        Effect.Effect.gen(function* () {
          const provider = yield* AiProvider;
          yield* provider.languageModel(testSpec);
        }).pipe(
          Effect.Effect.provide(
            AnthropicApiProviderLayer.pipe(
              Layer.provide(TestConfigLayer),
              Layer.provide(FetchHttpClient.layer),
            ),
          ),
        ),
      );

      expect(vi.mocked(AnthropicLanguageModel.make)).toHaveBeenCalledWith(
        expect.objectContaining({
          model: "claude-sonnet-4-6",
          config: {
            thinking: { type: "enabled", budget_tokens: 16000 },
            max_tokens: 32768,
          },
        }),
      );
    });

    it("forwards heavy spec config with thinking enabled and max_tokens", async () => {
      vi.mocked(AnthropicLanguageModel.make).mockClear();
      const heavySpec = {
        name: "claude-opus-4-5",
        anthropic: {
          thinking: { type: "enabled" as const, budget_tokens: 10000 },
          max_tokens: 16384,
        },
      };
      await Effect.Effect.runPromise(
        Effect.Effect.gen(function* () {
          const provider = yield* AiProvider;
          yield* provider.languageModel(heavySpec);
        }).pipe(
          Effect.Effect.provide(
            AnthropicApiProviderLayer.pipe(
              Layer.provide(TestConfigLayer),
              Layer.provide(FetchHttpClient.layer),
            ),
          ),
        ),
      );

      expect(vi.mocked(AnthropicLanguageModel.make)).toHaveBeenCalledWith(
        expect.objectContaining({
          model: "claude-opus-4-5",
          config: {
            thinking: { type: "enabled", budget_tokens: 10000 },
            max_tokens: 16384,
          },
        }),
      );
    });
  });

  describe("failure path", () => {
    it("fails with AiAuthError when ANTHROPIC_API_KEY is not set", async () => {
      const result = await Effect.Effect.runPromise(
        Effect.Effect.gen(function* () {
          const provider = yield* AiProvider;
          return provider;
        }).pipe(
          Effect.Effect.provide(
            AnthropicApiProviderLayer.pipe(
              Layer.provide(EmptyConfigLayer),
              Layer.provide(FetchHttpClient.layer),
            ),
          ),
          Effect.Effect.either,
        ),
      );

      expect(Effect.Either.isLeft(result)).toBe(true);
      if (Effect.Either.isLeft(result)) {
        expect(result.left).toBeInstanceOf(AiAuthError);
        expect((result.left as AiAuthError).cause).toContain(
          "Missing ANTHROPIC_API_KEY",
        );
      }
    });
  });
});
