import * as LanguageModel from "@effect/ai/LanguageModel";
import * as Response from "@effect/ai/Response";
import * as Effect from "effect";
import * as Option from "effect/Option";
import * as Ref from "effect/Ref";
import * as Stream from "effect/Stream";
import { Model } from "./model";

export interface GenerateTextCall {
  readonly method: "generateText" | "generateObject";
  readonly prompt: unknown;
  readonly toolkit: unknown;
  readonly system: unknown;
  readonly options: unknown;
}

export type MockModelResponse =
  | string
  | {
      readonly text?: string;
      readonly value?: unknown;
    };

class MockModelGenerateObjectError extends Effect.Data.TaggedError(
  "MockModelGenerateObjectError",
)<{
  readonly cause: unknown;
}> {}

export class MockModelText extends Effect.Context.Tag(
  "@gemhog/ai/MockModelText",
)<MockModelText, MockModelResponse>() {}

export class MockModelCalls extends Effect.Context.Tag(
  "@gemhog/ai/MockModelCalls",
)<MockModelCalls, Ref.Ref<ReadonlyArray<GenerateTextCall>>>() {}

export const MockModelLayer = Effect.Layer.effect(
  Model,
  Effect.Effect.gen(function* () {
    const response = yield* MockModelText;
    const callsOption = yield* Effect.Effect.serviceOption(MockModelCalls);

    const getText = () =>
      typeof response === "string"
        ? response
        : (response.text ?? JSON.stringify(response.value));

    const getValue = (): Effect.Effect.Effect<unknown, unknown, never> =>
      typeof response === "string"
        ? Effect.Effect.suspend(() => {
            try {
              return Effect.Effect.succeed(JSON.parse(response) as unknown);
            } catch (cause) {
              return Effect.Effect.fail(
                new MockModelGenerateObjectError({ cause }),
              );
            }
          })
        : response.value === undefined
          ? Effect.Effect.suspend(() => {
              try {
                return Effect.Effect.succeed(JSON.parse(getText()) as unknown);
              } catch (cause) {
                return Effect.Effect.fail(
                  new MockModelGenerateObjectError({ cause }),
                );
              }
            })
          : Effect.Effect.succeed(response.value);

    const recordCall = (method: GenerateTextCall["method"], opts: unknown) =>
      Option.isSome(callsOption)
        ? Ref.update(callsOption.value, (calls) => {
            const typedOpts = opts as {
              prompt?: unknown;
              toolkit?: unknown;
              system?: unknown;
            };

            return [
              ...calls,
              {
                method,
                prompt: typedOpts.prompt,
                toolkit: typedOpts.toolkit,
                system: typedOpts.system,
                options: opts,
              },
            ];
          })
        : Effect.Effect.void;

    const generateObject = (
      opts: unknown,
    ): Effect.Effect.Effect<
      LanguageModel.GenerateObjectResponse<Record<string, never>, unknown>,
      unknown,
      never
    > =>
      recordCall("generateObject", opts).pipe(
        Effect.Effect.zipRight(getValue()),
        Effect.Effect.map(
          (value) =>
            new LanguageModel.GenerateObjectResponse(value, [
              Response.textPart({ text: getText() }),
            ]),
        ),
      );

    return Model.of({
      generateText: (opts: unknown) =>
        Effect.Effect.gen(function* () {
          yield* recordCall("generateText", opts);
          return new LanguageModel.GenerateTextResponse([
            Response.textPart({ text: getText() }),
          ]);
        }),
      generateObject: generateObject as LanguageModel.Service["generateObject"],
      streamText: () =>
        Stream.dieMessage("MockModelLayer does not support streamText"),
    } as LanguageModel.Service);
  }),
);
