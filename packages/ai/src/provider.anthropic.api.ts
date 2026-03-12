import * as AnthropicClient from "@effect/ai-anthropic/AnthropicClient";
import * as AnthropicLanguageModel from "@effect/ai-anthropic/AnthropicLanguageModel";
import * as Effect from "effect";
import { AiAuthError } from "./errors";
import type { ModelSpec } from "./model";
import { AiProvider } from "./provider";

export const AnthropicApiProviderLayer = Effect.Layer.scoped(
  AiProvider,
  Effect.Effect.gen(function* () {
    const apiKey = yield* Effect.Config.redacted("ANTHROPIC_API_KEY");
    const client = yield* AnthropicClient.make({ apiKey });
    return {
      languageModel: (spec: ModelSpec) =>
        AnthropicLanguageModel.make({
          model: spec.name,
          config: spec.anthropic,
        }).pipe(
          Effect.Effect.provideService(AnthropicClient.AnthropicClient, client),
        ),
    };
  }).pipe(
    Effect.Effect.catchTag(
      "ConfigError",
      (cause) =>
        new AiAuthError({
          cause: `Missing ANTHROPIC_API_KEY: ${String(cause)}`,
        }),
    ),
  ),
);
