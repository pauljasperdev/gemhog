import { FetchHttpClient } from "@effect/platform";
import * as NodeFileSystem from "@effect/platform-node/NodeFileSystem";
import * as NodePath from "@effect/platform-node/NodePath";
import * as Effect from "effect";
import { ModelType } from "./model";
import {
  balancedAnthropicSpec,
  heavyAnthropicSpec,
  lightAnthropicSpec,
} from "./model.anthropic";
import { AnthropicApiProviderLayer } from "./provider.anthropic.api";
import { AnthropicBearerProviderLayer } from "./provider.anthropic.bearer";

export const AnthropicModelTypeLayer = Effect.Layer.succeed(ModelType, {
  heavy: heavyAnthropicSpec,
  balanced: balancedAnthropicSpec,
  light: lightAnthropicSpec,
});

export const AnthropicBearerLayer = Effect.Layer.merge(
  AnthropicBearerProviderLayer.pipe(
    Effect.Layer.provide(NodeFileSystem.layer),
    Effect.Layer.provide(NodePath.layer),
    Effect.Layer.provide(FetchHttpClient.layer),
  ),
  AnthropicModelTypeLayer,
);

export const AntrhopicApiLayer = Effect.Layer.merge(
  AnthropicApiProviderLayer.pipe(Effect.Layer.provide(FetchHttpClient.layer)),
  AnthropicModelTypeLayer,
);

export const AiProviderLayer = AnthropicBearerProviderLayer;
