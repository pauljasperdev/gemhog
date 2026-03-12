import type * as LanguageModel from "@effect/ai/LanguageModel";
import * as Effect from "effect";
import type { AiAuthError } from "./errors";
import type { ModelSpec } from "./model";

interface AiProviderShape {
  readonly languageModel: (
    spec: ModelSpec,
  ) => Effect.Effect.Effect<LanguageModel.Service, AiAuthError, never>;
}

export class AiProvider extends Effect.Context.Tag("@gemhog/ai/AiProvider")<
  AiProvider,
  AiProviderShape
>() {}
