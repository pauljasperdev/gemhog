import type * as LanguageModel from "@effect/ai/LanguageModel";
import * as Effect from "effect";

/**
 * Anthropic thinking configuration.
 * Compatible with @effect/ai-anthropic ThinkingConfigParam.
 */
export type ThinkingConfig =
  | { readonly type: "enabled"; readonly budget_tokens: number }
  | { readonly type: "disabled" };

/**
 * Anthropic-specific configuration for a model.
 * Compatible with Omit<Config.Service, "model"> from @effect/ai-anthropic/AnthropicLanguageModel.
 */
export interface AnthropicConfig {
  readonly thinking?: ThinkingConfig;
  readonly max_tokens?: number;
}

/**
 * Model specification with name and optional provider-specific config.
 */
export interface ModelSpec {
  readonly name: string;
  readonly anthropic?: AnthropicConfig;
}

interface ModelTypeShape {
  readonly heavy: ModelSpec;
  readonly balanced: ModelSpec;
  readonly light: ModelSpec;
}

export class ModelType extends Effect.Context.Tag("@gemhog/ai/ModelType")<
  ModelType,
  ModelTypeShape
>() {}

export class Model extends Effect.Context.Tag("@gemhog/ai/Model")<
  Model,
  LanguageModel.Service
>() {}
