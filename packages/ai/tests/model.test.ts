import { FetchHttpClient, FileSystem, Path } from "@effect/platform";
import * as Effect from "effect";
import { ConfigProvider, Context, Layer, Option } from "effect";
import { describe, expect, it, vi } from "vitest";

// Mock @effect/ai-anthropic modules before imports to avoid IdGenerator error.
// vi.mock is hoisted by vitest, so these run before any module loading.
vi.mock("@effect/ai-anthropic/AnthropicClient", () => ({
  AnthropicClient: Context.GenericTag("MockAnthropicClient"),
  make: () =>
    Effect.Effect.succeed({
      _tag: "MockClient",
    }),
}));

// Mock the language model service returned by make()
const mockLanguageModelService = {
  _tag: "MockLanguageModel",
  generateText: (_opts: unknown) => Effect.Effect.succeed({ text: "mock" }),
};

vi.mock("@effect/ai-anthropic/AnthropicLanguageModel", () => ({
  make: vi.fn((_opts: unknown) =>
    Effect.Effect.succeed(mockLanguageModelService),
  ),
}));

// Imports after vi.mock (hoisted by vitest)
import * as AnthropicLanguageModel from "@effect/ai-anthropic/AnthropicLanguageModel";
import { Model } from "../src/model";
import { BalancedModelLayer, HeavyModelLayer } from "../src/model.layer";
import { AnthropicApiProviderLayer } from "../src/provider.anthropic.api";
import { AnthropicBearerProviderLayer } from "../src/provider.anthropic.bearer";
import { AnthropicModelTypeLayer } from "../src/provider.layer";

// Test config: API key for AnthropicApiProviderLayer
const ApiKeyConfigLayer = Layer.setConfigProvider(
  ConfigProvider.fromMap(new Map([["ANTHROPIC_API_KEY", "test-api-key"]])),
);

// Test config: HOME for bearer auth file path resolution
const HomeConfigLayer = Layer.setConfigProvider(
  ConfigProvider.fromMap(new Map([["HOME", "/home/testuser"]])),
);

// Mock FileSystem for bearer auth (returns valid auth JSON)
const validAuthContent = JSON.stringify({
  anthropic: { access: "test-bearer-token" },
});

const MockFileSystem = Layer.succeed(FileSystem.FileSystem, {
  readFileString: () => Effect.Effect.succeed(validAuthContent),
} as unknown as FileSystem.FileSystem);

// Mock Path for bearer auth
const MockPath = Layer.succeed(Path.Path, {
  join: (...parts: string[]) => parts.join("/"),
} as unknown as Path.Path);

describe("Model contract tests", () => {
  describe("consumer with yield* Model", () => {
    it("compiles and runs when provided with AnthropicAiLayer (via API auth)", async () => {
      // Consumer program that uses the Model service
      const consumerProgram = Effect.Effect.gen(function* () {
        const model = yield* Model;
        return model;
      });

      // Compose layers equivalent to AnthropicAiLayer but using API auth for testability.
      // AnthropicAiLayer uses bearer auth which requires FileSystem; this is simpler.
      const TestAnthropicLayer = BalancedModelLayer.pipe(
        Layer.provide(
          Layer.merge(AnthropicApiProviderLayer, AnthropicModelTypeLayer).pipe(
            Layer.provide(ApiKeyConfigLayer),
            Layer.provide(FetchHttpClient.layer),
          ),
        ),
      );

      const result = await Effect.Effect.runPromise(
        consumerProgram.pipe(Effect.Effect.provide(TestAnthropicLayer)),
      );

      expect(result).toEqual(mockLanguageModelService);
    });

    it("fails with missing-service error when NO layer is provided", async () => {
      // Use serviceOption to safely check for missing service
      const result = await Effect.Effect.runPromise(
        Effect.Effect.gen(function* () {
          const maybeModel = yield* Effect.Effect.serviceOption(Model);
          return maybeModel;
        }),
      );

      expect(Option.isNone(result)).toBe(true);
    });
  });

  describe("HeavyModelLayer + decoupled bearer/model-type composition", () => {
    it("satisfies a Model consumer when composed separately", async () => {
      // Consumer program that uses the Model service
      const consumerProgram = Effect.Effect.gen(function* () {
        const model = yield* Model;
        return model;
      });

      // Layer.merge(AnthropicBearerProviderLayer, AnthropicModelTypeLayer) = decoupled composition
      // It requires FileSystem | Path for bearer auth file reading.
      const ProviderWithDeps = Layer.merge(
        AnthropicBearerProviderLayer,
        AnthropicModelTypeLayer,
      ).pipe(
        Layer.provide(FetchHttpClient.layer),
        Layer.provide(MockFileSystem),
        Layer.provide(MockPath),
        Layer.provide(HomeConfigLayer),
      );

      // Compose HeavyModelLayer with decoupled provider layers (both provided separately)
      const TestLayer = HeavyModelLayer.pipe(Layer.provide(ProviderWithDeps));

      const result = await Effect.Effect.runPromise(
        consumerProgram.pipe(Effect.Effect.provide(TestLayer)),
      );

      expect(result).toEqual(mockLanguageModelService);
    });

    it("calls AnthropicLanguageModel.make with heavy thinking config", async () => {
      vi.mocked(AnthropicLanguageModel.make).mockClear();

      const consumerProgram = Effect.Effect.gen(function* () {
        const model = yield* Model;
        return model;
      });

      const ProviderWithDeps = Layer.merge(
        AnthropicBearerProviderLayer,
        AnthropicModelTypeLayer,
      ).pipe(
        Layer.provide(FetchHttpClient.layer),
        Layer.provide(MockFileSystem),
        Layer.provide(MockPath),
        Layer.provide(HomeConfigLayer),
      );

      const TestLayer = HeavyModelLayer.pipe(Layer.provide(ProviderWithDeps));

      await Effect.Effect.runPromise(
        consumerProgram.pipe(Effect.Effect.provide(TestLayer)),
      );

      expect(vi.mocked(AnthropicLanguageModel.make)).toHaveBeenCalledWith(
        expect.objectContaining({
          model: "claude-opus-4-5",
          config: expect.objectContaining({
            thinking: { type: "enabled", budget_tokens: 10000 },
            max_tokens: 16384,
          }),
        }),
      );
    });
  });
});

describe("Anthropic preset constants", () => {
  describe("heavyAnthropicSpec", () => {
    it("has name claude-opus-4-5", async () => {
      const { heavyAnthropicSpec } = await import("../src/model.anthropic");
      expect(heavyAnthropicSpec.name).toBe("claude-opus-4-5");
    });

    it("has thinking enabled with 10k budget_tokens", async () => {
      const { heavyAnthropicSpec } = await import("../src/model.anthropic");
      expect(heavyAnthropicSpec.anthropic?.thinking?.type).toBe("enabled");
      expect(
        (heavyAnthropicSpec.anthropic?.thinking as { budget_tokens?: number })
          ?.budget_tokens,
      ).toBe(10000);
    });

    it("has max_tokens 16384", async () => {
      const { heavyAnthropicSpec } = await import("../src/model.anthropic");
      expect(heavyAnthropicSpec.anthropic?.max_tokens).toBe(16384);
    });
  });

  describe("balancedAnthropicSpec", () => {
    it("has name claude-sonnet-4-6", async () => {
      const { balancedAnthropicSpec } = await import("../src/model.anthropic");
      expect(balancedAnthropicSpec.name).toBe("claude-sonnet-4-6");
    });

    it("has thinking enabled with 16k budget_tokens and max_tokens 32768", async () => {
      const { balancedAnthropicSpec } = await import("../src/model.anthropic");
      expect(balancedAnthropicSpec.anthropic?.thinking?.type).toBe("enabled");
      expect(
        (
          balancedAnthropicSpec.anthropic?.thinking as {
            budget_tokens?: number;
          }
        )?.budget_tokens,
      ).toBe(16000);
      expect(balancedAnthropicSpec.anthropic?.max_tokens).toBe(32768);
    });
  });

  describe("lightAnthropicSpec", () => {
    it("has name claude-haiku-4-5", async () => {
      const { lightAnthropicSpec } = await import("../src/model.anthropic");
      expect(lightAnthropicSpec.name).toBe("claude-haiku-4-5");
    });

    it("has thinking disabled", async () => {
      const { lightAnthropicSpec } = await import("../src/model.anthropic");
      expect(lightAnthropicSpec.anthropic?.thinking?.type).toBe("disabled");
    });
  });
});
