import * as AnthropicClient from "@effect/ai-anthropic/AnthropicClient";
import * as AnthropicLanguageModel from "@effect/ai-anthropic/AnthropicLanguageModel";
import {
  FileSystem,
  HttpClient,
  HttpClientRequest,
  Path,
} from "@effect/platform";
import * as Effect from "effect";
import { AiAuthError } from "./errors";
import type { ModelSpec } from "./model";
import { AiProvider } from "./provider";

const AuthSchema = Effect.Schema.Struct({
  anthropic: Effect.Schema.Struct({ access: Effect.Schema.String }),
});

export const readAccessToken = Effect.Effect.gen(function* () {
  const home = yield* Effect.Config.string("HOME").pipe(
    Effect.Config.orElse(() => Effect.Config.string("USERPROFILE")),
  );
  const path = yield* Path.Path;
  const fs = yield* FileSystem.FileSystem;
  const authFilePath = path.join(
    home,
    ".local",
    "share",
    "opencode",
    "auth.json",
  );
  const contents = yield* fs.readFileString(authFilePath, "utf8");
  const parsed = yield* Effect.Effect.try(
    () => JSON.parse(contents) as unknown,
  );
  const auth = yield* Effect.Schema.decodeUnknown(AuthSchema)(parsed);
  return auth.anthropic.access;
}).pipe(
  Effect.Effect.catchTags({
    ConfigError: (cause) =>
      new AiAuthError({ cause: `Cannot resolve home: ${cause}` }),
    SystemError: (cause) =>
      new AiAuthError({ cause: `Cannot read auth file: ${cause.message}` }),
    BadArgument: (cause) =>
      new AiAuthError({ cause: `Cannot read auth file: ${cause.message}` }),
    UnknownException: (cause) =>
      new AiAuthError({ cause: `Invalid JSON: ${cause.error}` }),
    ParseError: (cause) =>
      new AiAuthError({ cause: `Invalid auth structure: ${cause.message}` }),
  }),
);

const OAUTH_BETA = "oauth-2025-04-20";

const mergeOAuthBeta = (
  request: HttpClientRequest.HttpClientRequest,
): HttpClientRequest.HttpClientRequest => {
  const existing = request.headers["anthropic-beta"];
  if (!existing) {
    return HttpClientRequest.setHeader(request, "anthropic-beta", OAUTH_BETA);
  }
  const betas = existing.split(",").map((b) => b.trim());
  if (betas.includes(OAUTH_BETA)) {
    return request;
  }
  return HttpClientRequest.setHeader(
    request,
    "anthropic-beta",
    [...betas, OAUTH_BETA].join(","),
  );
};

export const AnthropicBearerProviderLayer = Effect.Layer.scoped(
  AiProvider,
  Effect.Effect.gen(function* () {
    const token = yield* readAccessToken;
    const client = yield* AnthropicClient.make({
      transformClient: (httpClient) =>
        httpClient.pipe(
          HttpClient.mapRequest((request) =>
            request.pipe(HttpClientRequest.bearerToken(token), mergeOAuthBeta),
          ),
        ),
    });
    return {
      languageModel: (spec: ModelSpec) =>
        AnthropicLanguageModel.make({
          model: spec.name,
          config: spec.anthropic,
        }).pipe(
          Effect.Effect.provideService(AnthropicClient.AnthropicClient, client),
        ),
    };
  }),
);
