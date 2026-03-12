import { FetchHttpClient, FileSystem, Path } from "@effect/platform";
import * as Effect from "effect";
import { ConfigProvider, Context, Layer } from "effect";
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
import {
  BalancedModelLayer,
  HeavyModelLayer,
  LightModelLayer,
} from "../src/model.layer";
import { AiProvider } from "../src/provider";
import { AnthropicApiProviderLayer } from "../src/provider.anthropic.api";
import {
  AnthropicBearerProviderLayer,
  readAccessToken,
} from "../src/provider.anthropic.bearer";
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

describe("Layer composition tests", () => {
  describe("AiLayer-equivalent composition (API auth for testability)", () => {
    it("yield* Model works when AiLayer-equivalent layers are provided", async () => {
      // AiLayer = AnthropicBalancedLayer = BalancedModelLayer.pipe(Layer.provide(AnthropicStack))
      // AnthropicStack uses bearer auth with NodeFileSystem/NodePath baked in.
      // For testability, we use an equivalent composition with API auth instead.
      const consumerProgram = Effect.Effect.gen(function* () {
        const model = yield* Model;
        return model;
      });

      // Equivalent to AiLayer but using API auth for testability.
      // BalancedModelLayer + AnthropicApiProviderLayer + AnthropicModelTypeLayer + config
      const TestAiLayer = BalancedModelLayer.pipe(
        Layer.provide(
          Layer.merge(AnthropicApiProviderLayer, AnthropicModelTypeLayer).pipe(
            Layer.provide(ApiKeyConfigLayer),
            Layer.provide(FetchHttpClient.layer),
          ),
        ),
      );

      const result = await Effect.Effect.runPromise(
        consumerProgram.pipe(Effect.Effect.provide(TestAiLayer)),
      );

      expect(result).toEqual(mockLanguageModelService);
    });
  });

  describe("HeavyModelLayer + decoupled bearer/model-type composition", () => {
    it("yield* Model works when composed separately with bearer deps", async () => {
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

  describe("BalancedModelLayer + API auth composition", () => {
    it("calls AnthropicLanguageModel.make with enabled thinking config", async () => {
      vi.mocked(AnthropicLanguageModel.make).mockClear();

      const consumerProgram = Effect.Effect.gen(function* () {
        const model = yield* Model;
        return model;
      });

      const TestAiLayer = BalancedModelLayer.pipe(
        Layer.provide(
          Layer.merge(AnthropicApiProviderLayer, AnthropicModelTypeLayer).pipe(
            Layer.provide(ApiKeyConfigLayer),
            Layer.provide(FetchHttpClient.layer),
          ),
        ),
      );

      await Effect.Effect.runPromise(
        consumerProgram.pipe(Effect.Effect.provide(TestAiLayer)),
      );

      expect(vi.mocked(AnthropicLanguageModel.make)).toHaveBeenCalledWith(
        expect.objectContaining({
          model: "claude-sonnet-4-6",
          config: expect.objectContaining({
            thinking: { type: "enabled", budget_tokens: 16000 },
            max_tokens: 32768,
          }),
        }),
      );
    });
  });

  describe("LightModelLayer + API auth composition", () => {
    it("calls AnthropicLanguageModel.make with disabled thinking config", async () => {
      vi.mocked(AnthropicLanguageModel.make).mockClear();

      const consumerProgram = Effect.Effect.gen(function* () {
        const model = yield* Model;
        return model;
      });

      const TestAiLayer = LightModelLayer.pipe(
        Layer.provide(
          Layer.merge(AnthropicApiProviderLayer, AnthropicModelTypeLayer).pipe(
            Layer.provide(ApiKeyConfigLayer),
            Layer.provide(FetchHttpClient.layer),
          ),
        ),
      );

      await Effect.Effect.runPromise(
        consumerProgram.pipe(Effect.Effect.provide(TestAiLayer)),
      );

      expect(vi.mocked(AnthropicLanguageModel.make)).toHaveBeenCalledWith(
        expect.objectContaining({
          model: "claude-haiku-4-5",
          config: expect.objectContaining({
            thinking: { type: "disabled" },
          }),
        }),
      );
    });
  });

  describe("Auth matrix - bearer success path", () => {
    it("readAccessToken succeeds with mocked FileSystem/Path/HOME", async () => {
      const result = await Effect.Effect.runPromise(
        readAccessToken.pipe(
          Effect.Effect.provide(MockFileSystem),
          Effect.Effect.provide(MockPath),
          Effect.Effect.provide(HomeConfigLayer),
        ),
      );

      expect(result).toBe("test-bearer-token");
    });
  });

  describe("Auth matrix - API key success path", () => {
    it("AnthropicApiProviderLayer builds and returns service when API key is provided", async () => {
      const result = await Effect.Effect.runPromise(
        Effect.Effect.gen(function* () {
          const provider = yield* AiProvider;
          const service = yield* provider.languageModel({
            name: "claude-sonnet-4-6",
          });
          return service;
        }).pipe(
          Effect.Effect.provide(
            Layer.merge(
              AnthropicApiProviderLayer,
              AnthropicModelTypeLayer,
            ).pipe(
              Layer.provide(ApiKeyConfigLayer),
              Layer.provide(FetchHttpClient.layer),
            ),
          ),
        ),
      );

      expect(result).toMatchObject({ _tag: "MockLanguageModel" });
    });
  });
});
