import {
  FetchHttpClient,
  FileSystem,
  Path,
  Error as PlatformError,
} from "@effect/platform";
import * as Effect from "effect";
import { ConfigProvider, Context, Layer } from "effect";
import { describe, expect, it, vi } from "vitest";

// Mock @effect/ai-anthropic modules before imports to avoid IdGenerator error.
vi.mock("@effect/ai-anthropic/AnthropicClient", () => ({
  AnthropicClient: Context.GenericTag("MockAnthropicClient"),
  make: vi.fn((_opts: unknown) =>
    Effect.Effect.succeed({ _tag: "MockClient" }),
  ),
}));

vi.mock("@effect/ai-anthropic/AnthropicLanguageModel", () => ({
  make: vi.fn((_opts: unknown) =>
    Effect.Effect.succeed({ _tag: "MockLanguageModel" }),
  ),
}));

import * as AnthropicLanguageModel from "@effect/ai-anthropic/AnthropicLanguageModel";
import { AiAuthError } from "../src/errors";
import { AiProvider } from "../src/provider";
import {
  AnthropicBearerProviderLayer,
  readAccessToken,
} from "../src/provider.anthropic.bearer";

const validAuthContent = JSON.stringify({
  anthropic: { access: "test-bearer-token" },
});

// Mock FileSystem that returns valid auth
const MockFileSystemSuccess = Layer.succeed(FileSystem.FileSystem, {
  readFileString: () => Effect.Effect.succeed(validAuthContent),
} as unknown as FileSystem.FileSystem);

// Mock FileSystem that fails with a SystemError (as FileSystem.readFileString would)
const MockFileSystemFailure = Layer.succeed(FileSystem.FileSystem, {
  readFileString: () =>
    Effect.Effect.fail(
      new PlatformError.SystemError({
        reason: "NotFound",
        module: "FileSystem",
        method: "readFileString",
        description: "ENOENT: no such file or directory",
      }),
    ),
} as unknown as FileSystem.FileSystem);

// Mock Path
const MockPath = Layer.succeed(Path.Path, {
  join: (...parts: string[]) => parts.join("/"),
} as unknown as Path.Path);

// Config layer providing HOME
const TestConfigLayer = Layer.setConfigProvider(
  ConfigProvider.fromMap(new Map([["HOME", "/home/testuser"]])),
);

describe("AnthropicBearerProviderLayer auth", () => {
  describe("readAccessToken - success path", () => {
    it("returns access token when auth file is valid", async () => {
      const result = await Effect.Effect.runPromise(
        readAccessToken.pipe(
          Effect.Effect.provide(MockFileSystemSuccess),
          Effect.Effect.provide(MockPath),
          Effect.Effect.provide(TestConfigLayer),
        ),
      );

      expect(result).toBe("test-bearer-token");
    });
  });

  describe("readAccessToken - failure paths", () => {
    it("fails with AiAuthError when auth file cannot be read", async () => {
      const result = await Effect.Effect.runPromise(
        readAccessToken.pipe(
          Effect.Effect.provide(MockFileSystemFailure),
          Effect.Effect.provide(MockPath),
          Effect.Effect.provide(TestConfigLayer),
          Effect.Effect.either,
        ),
      );

      expect(Effect.Either.isLeft(result)).toBe(true);
      if (Effect.Either.isLeft(result)) {
        expect(result.left).toBeInstanceOf(AiAuthError);
        expect((result.left as AiAuthError).cause).toContain(
          "Cannot read auth file",
        );
      }
    });

    it("fails with AiAuthError when JSON is invalid", async () => {
      const MockFileSystemInvalidJson = Layer.succeed(FileSystem.FileSystem, {
        readFileString: () => Effect.Effect.succeed("not valid json"),
      } as unknown as FileSystem.FileSystem);

      const result = await Effect.Effect.runPromise(
        readAccessToken.pipe(
          Effect.Effect.provide(MockFileSystemInvalidJson),
          Effect.Effect.provide(MockPath),
          Effect.Effect.provide(TestConfigLayer),
          Effect.Effect.either,
        ),
      );

      expect(Effect.Either.isLeft(result)).toBe(true);
      if (Effect.Either.isLeft(result)) {
        expect(result.left).toBeInstanceOf(AiAuthError);
        expect((result.left as AiAuthError).cause).toContain("Invalid JSON");
      }
    });

    it("fails with AiAuthError when auth structure is invalid", async () => {
      const MockFileSystemInvalidStructure = Layer.succeed(
        FileSystem.FileSystem,
        {
          readFileString: () =>
            Effect.Effect.succeed(JSON.stringify({ wrong: "structure" })),
        } as unknown as FileSystem.FileSystem,
      );

      const result = await Effect.Effect.runPromise(
        readAccessToken.pipe(
          Effect.Effect.provide(MockFileSystemInvalidStructure),
          Effect.Effect.provide(MockPath),
          Effect.Effect.provide(TestConfigLayer),
          Effect.Effect.either,
        ),
      );

      expect(Effect.Either.isLeft(result)).toBe(true);
      if (Effect.Either.isLeft(result)) {
        expect(result.left).toBeInstanceOf(AiAuthError);
        expect((result.left as AiAuthError).cause).toContain(
          "Invalid auth structure",
        );
      }
    });

    it("fails with AiAuthError when HOME is not set", async () => {
      const EmptyConfigLayer = Layer.setConfigProvider(
        ConfigProvider.fromMap(new Map()),
      );

      const result = await Effect.Effect.runPromise(
        readAccessToken.pipe(
          Effect.Effect.provide(MockFileSystemSuccess),
          Effect.Effect.provide(MockPath),
          Effect.Effect.provide(EmptyConfigLayer),
          Effect.Effect.either,
        ),
      );

      expect(Effect.Either.isLeft(result)).toBe(true);
      if (Effect.Either.isLeft(result)) {
        expect(result.left).toBeInstanceOf(AiAuthError);
        expect((result.left as AiAuthError).cause).toContain(
          "Cannot resolve home",
        );
      }
    });
  });

  describe("AnthropicBearerProviderLayer languageModel", () => {
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
            AnthropicBearerProviderLayer.pipe(
              Layer.provide(MockFileSystemSuccess),
              Layer.provide(MockPath),
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
            AnthropicBearerProviderLayer.pipe(
              Layer.provide(MockFileSystemSuccess),
              Layer.provide(MockPath),
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
});

describe("AnthropicBearerProviderLayer OAuth beta header", () => {
  // Helper: capture the transformClient arg passed to AnthropicClient.make
  // then apply it to a real-shaped HttpClient stub so HttpClient.mapRequest works.
  const captureTransformClient = async () => {
    const AnthropicClient = await import(
      "@effect/ai-anthropic/AnthropicClient"
    );
    vi.mocked(AnthropicClient.make).mockClear();

    await Effect.Effect.runPromise(
      Effect.Effect.gen(function* () {
        yield* AiProvider;
      }).pipe(
        Effect.Effect.provide(
          AnthropicBearerProviderLayer.pipe(
            Layer.provide(MockFileSystemSuccess),
            Layer.provide(MockPath),
            Layer.provide(TestConfigLayer),
            Layer.provide(FetchHttpClient.layer),
          ),
        ),
        Effect.Effect.either,
      ),
    );

    expect(vi.mocked(AnthropicClient.make)).toHaveBeenCalledOnce();
    const call = vi.mocked(AnthropicClient.make).mock.calls[0];
    if (!call) throw new Error("AnthropicClient.make was not called");
    return (call[0] as { transformClient: (c: unknown) => unknown })
      .transformClient;
  };

  // Helper: apply transformClient to a stub client and extract the request mapper.
  // HttpClient.mapRequest(f)(client) creates a new client whose preprocess = req => Effect.map(client.preprocess(req), f).
  // We stub preprocess as Effect.succeed so we can run it synchronously.
  const extractRequestMapper = async (
    transformClient: (c: unknown) => unknown,
  ) => {
    const Effect_ = await import("effect");

    // Stub client with identity preprocess and no-op postprocess
    const stubClient = {
      preprocess: (req: unknown) => Effect_.Effect.succeed(req),
      postprocess: (eff: unknown) => eff,
      pipe: (...fns: Array<(c: unknown) => unknown>) =>
        fns.reduce((acc, fn) => fn(acc), stubClient as unknown),
    };

    const transformed = transformClient(stubClient) as {
      preprocess: (req: unknown) => unknown;
    };

    return async (req: unknown) => {
      return Effect_.Effect.runPromise(
        transformed.preprocess(req) as import("effect").Effect.Effect<unknown>,
      );
    };
  };

  it("adds anthropic-beta oauth header to requests with no existing beta header", async () => {
    const { HttpClientRequest } = await import("@effect/platform");
    const transformClient = await captureTransformClient();
    const applyToRequest = await extractRequestMapper(transformClient);

    const baseRequest = HttpClientRequest.get(
      "https://api.anthropic.com/v1/messages",
    );
    const result = (await applyToRequest(baseRequest)) as typeof baseRequest;

    // Bearer token should be set
    expect(result.headers.authorization).toBe("Bearer test-bearer-token");
    // OAuth beta header should be set
    expect(result.headers["anthropic-beta"]).toBe("oauth-2025-04-20");
  });

  it("preserves existing anthropic-beta values when adding oauth header", async () => {
    const { HttpClientRequest } = await import("@effect/platform");
    const transformClient = await captureTransformClient();
    const applyToRequest = await extractRequestMapper(transformClient);

    const requestWithBeta = HttpClientRequest.setHeader(
      HttpClientRequest.get("https://api.anthropic.com/v1/messages"),
      "anthropic-beta",
      "existing-beta-flag",
    );
    const result = (await applyToRequest(
      requestWithBeta,
    )) as typeof requestWithBeta;

    expect(result.headers["anthropic-beta"]).toContain("existing-beta-flag");
    expect(result.headers["anthropic-beta"]).toContain("oauth-2025-04-20");
  });

  it("does not duplicate oauth-2025-04-20 when already present", async () => {
    const { HttpClientRequest } = await import("@effect/platform");
    const transformClient = await captureTransformClient();
    const applyToRequest = await extractRequestMapper(transformClient);

    const requestWithOAuth = HttpClientRequest.setHeader(
      HttpClientRequest.get("https://api.anthropic.com/v1/messages"),
      "anthropic-beta",
      "oauth-2025-04-20",
    );
    const result = (await applyToRequest(
      requestWithOAuth,
    )) as typeof requestWithOAuth;

    const betaHeader = result.headers["anthropic-beta"] as string;
    const occurrences = betaHeader.split("oauth-2025-04-20").length - 1;
    expect(occurrences).toBe(1);
  });
});
