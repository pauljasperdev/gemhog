import * as Effect from "effect";
import { Model, ModelType } from "./model";
import { AiProvider } from "./provider";

export const HeavyModelLayer = Effect.Layer.effect(
  Model,
  Effect.Effect.gen(function* () {
    const provider = yield* AiProvider;
    const type = yield* ModelType;
    return yield* provider.languageModel(type.heavy);
  }),
);

export const BalancedModelLayer = Effect.Layer.effect(
  Model,
  Effect.Effect.gen(function* () {
    const provider = yield* AiProvider;
    const type = yield* ModelType;
    return yield* provider.languageModel(type.balanced);
  }),
);

export const LightModelLayer = Effect.Layer.effect(
  Model,
  Effect.Effect.gen(function* () {
    const provider = yield* AiProvider;
    const type = yield* ModelType;
    return yield* provider.languageModel(type.light);
  }),
);
