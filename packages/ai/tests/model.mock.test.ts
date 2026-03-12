import { it } from "@effect/vitest";
import * as Effect from "effect";
import * as Layer from "effect/Layer";
import * as Ref from "effect/Ref";
import { describe, expect } from "vitest";

import { Model } from "../src/model";
import {
  type GenerateTextCall,
  MockModelCalls,
  MockModelLayer,
  MockModelText,
} from "../src/model.mock";

describe("MockModelLayer", () => {
  it.effect("returns fixed text from generateText", () =>
    Effect.Effect.gen(function* () {
      const model = yield* Model;
      const result = yield* model.generateText({ prompt: "test prompt" });

      expect(result.text).toBe("fixed response");
    }).pipe(
      Effect.Effect.provide(
        MockModelLayer.pipe(
          Layer.provide(Layer.succeed(MockModelText, "fixed response")),
        ),
      ),
    ),
  );

  it.effect("returns configured text for different configurations", () =>
    Effect.Effect.gen(function* () {
      const model = yield* Model;
      const result = yield* model.generateText({ prompt: "any prompt" });

      expect(result.text).toBe("another response");
    }).pipe(
      Effect.Effect.provide(
        MockModelLayer.pipe(
          Layer.provide(Layer.succeed(MockModelText, "another response")),
        ),
      ),
    ),
  );

  it.effect("satisfies Model consumer that uses yield* Model", () =>
    Effect.Effect.gen(function* () {
      const model = yield* Model;

      expect(model).toBeDefined();
      expect(typeof model.generateText).toBe("function");
    }).pipe(
      Effect.Effect.provide(
        MockModelLayer.pipe(
          Layer.provide(Layer.succeed(MockModelText, "mock")),
        ),
      ),
    ),
  );
});

describe("MockModelLayer with call capture", () => {
  it.effect("captures generateText call inputs", () =>
    Effect.Effect.gen(function* () {
      const callsRef = yield* Ref.make<ReadonlyArray<GenerateTextCall>>([]);
      const TestLayer = MockModelLayer.pipe(
        Layer.provide(Layer.succeed(MockModelText, "spy response")),
        Layer.provide(Layer.succeed(MockModelCalls, callsRef)),
      );
      const result = yield* Effect.Effect.gen(function* () {
        const model = yield* Model;
        return yield* (
          model.generateText as unknown as (
            opts: unknown,
          ) => Effect.Effect.Effect<{ text: string }>
        )({
          prompt: "captured prompt",
          toolkit: { tool1: "handler1" },
          system: "system message",
        });
      }).pipe(Effect.Effect.provide(TestLayer));
      const calls = yield* Ref.get(callsRef);

      expect(result.text).toBe("spy response");
      expect(calls).toHaveLength(1);
      expect(calls[0]?.prompt).toBe("captured prompt");
      expect(calls[0]?.toolkit).toEqual({ tool1: "handler1" });
      expect(calls[0]?.system).toBe("system message");
    }),
  );

  it.effect("returns configured text while capturing inputs", () =>
    Effect.Effect.gen(function* () {
      const callsRef = yield* Ref.make<ReadonlyArray<GenerateTextCall>>([]);
      const TestLayer = MockModelLayer.pipe(
        Layer.provide(Layer.succeed(MockModelText, "configured text")),
        Layer.provide(Layer.succeed(MockModelCalls, callsRef)),
      );
      const result = yield* Effect.Effect.gen(function* () {
        const model = yield* Model;
        return yield* model.generateText({ prompt: "test" });
      }).pipe(Effect.Effect.provide(TestLayer));
      const calls = yield* Ref.get(callsRef);

      expect(result.text).toBe("configured text");
      expect(calls).toHaveLength(1);
    }),
  );

  it.effect("captures multiple generateText calls", () =>
    Effect.Effect.gen(function* () {
      const callsRef = yield* Ref.make<ReadonlyArray<GenerateTextCall>>([]);
      const TestLayer = MockModelLayer.pipe(
        Layer.provide(Layer.succeed(MockModelText, "response")),
        Layer.provide(Layer.succeed(MockModelCalls, callsRef)),
      );
      yield* Effect.Effect.gen(function* () {
        const model = yield* Model;
        yield* model.generateText({ prompt: "first" });
        yield* model.generateText({ prompt: "second" });
        yield* model.generateText({ prompt: "third" });
      }).pipe(Effect.Effect.provide(TestLayer));
      const calls = yield* Ref.get(callsRef);

      expect(calls).toHaveLength(3);
      expect(calls[0]?.prompt).toBe("first");
      expect(calls[1]?.prompt).toBe("second");
      expect(calls[2]?.prompt).toBe("third");
    }),
  );

  it.effect("captures full options object", () =>
    Effect.Effect.gen(function* () {
      const callsRef = yield* Ref.make<ReadonlyArray<GenerateTextCall>>([]);
      const TestLayer = MockModelLayer.pipe(
        Layer.provide(Layer.succeed(MockModelText, "response")),
        Layer.provide(Layer.succeed(MockModelCalls, callsRef)),
      );
      yield* Effect.Effect.gen(function* () {
        const model = yield* Model;
        yield* (
          model.generateText as unknown as (
            opts: unknown,
          ) => Effect.Effect.Effect<{ text: string }>
        )({
          prompt: "test",
          toolkit: "toolkit",
          system: "system",
        });
      }).pipe(Effect.Effect.provide(TestLayer));
      const calls = yield* Ref.get(callsRef);

      expect(calls[0]?.options).toMatchObject({
        prompt: "test",
        toolkit: "toolkit",
        system: "system",
      });
    }),
  );
});
