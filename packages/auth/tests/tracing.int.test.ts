import { ConfigLayerTest } from "@gemhog/env/test";
import { Config, Effect, Tracer } from "effect";
import { beforeAll, describe, expect, it } from "vitest";
import { sendOtpEmail } from "../src/send-otp";

// Config values are read from ConfigLayerTest in beforeAll

interface CapturedSpan {
  name: string;
  spanRef: object | null;
  parentRef: object | null;
}

function toSpanRef(span: unknown): object | null {
  if (typeof span === "object" && span !== null && "_tag" in span) {
    const tag = (span as { _tag: unknown })._tag;
    if (tag === "None") return null;
    if (tag === "Some" && "value" in span) {
      return toSpanRef((span as { value: unknown }).value);
    }
  }

  return typeof span === "object" && span !== null ? span : null;
}

function createCapturingTracer(
  defaultTracer: Tracer.Tracer,
  capturedSpans: CapturedSpan[],
): Tracer.Tracer {
  return Tracer.make({
    span(name, parent, context, links, startTime, kind, options) {
      const span = defaultTracer.span(
        name,
        parent,
        context,
        links,
        startTime,
        kind,
        options,
      );

      capturedSpans.push({
        name,
        spanRef: toSpanRef(span),
        parentRef: toSpanRef(parent),
      });

      return span;
    },
    context(f, fiber) {
      return defaultTracer.context(f, fiber);
    },
  });
}

describe("auth tracing integration", () => {
  beforeAll(async () => {
    const testConfig = await Effect.runPromise(
      Effect.gen(function* () {
        const databaseUrl = yield* Config.string("DATABASE_URL");
        const databaseUrlPooler = yield* Config.string("DATABASE_URL_POOLER");
        const betterAuthSecret = yield* Config.string("BETTER_AUTH_SECRET");
        const betterAuthUrl = yield* Config.string("BETTER_AUTH_URL");
        const appUrl = yield* Config.string("APP_URL");
        const googleApiKey = yield* Config.string(
          "GOOGLE_GENERATIVE_AI_API_KEY",
        );
        const sentryDsn = yield* Config.string("SENTRY_DSN");
        const resendApiKey = yield* Config.string("RESEND_API_KEY");
        return {
          LOCAL_ENV: "1",
          DATABASE_URL: databaseUrl,
          DATABASE_URL_POOLER: databaseUrlPooler,
          BETTER_AUTH_SECRET: betterAuthSecret,
          BETTER_AUTH_URL: betterAuthUrl,
          APP_URL: appUrl,
          GOOGLE_GENERATIVE_AI_API_KEY: googleApiKey,
          SENTRY_DSN: sentryDsn,
          RESEND_API_KEY: resendApiKey,
        };
      }).pipe(Effect.provide(ConfigLayerTest)),
    );
    Object.assign(process.env, testConfig);
  });

  it("verifies auth.sendOtp parent-child spans in auth flow", async () => {
    const capturedSpans: CapturedSpan[] = [];

    const program = Effect.gen(function* () {
      const defaultTracer = yield* Effect.tracer;
      const testTracer = createCapturingTracer(defaultTracer, capturedSpans);

      yield* sendOtpEmail("test@example.com", "123456").pipe(
        Effect.withSpan("test.auth.flow"),
        Effect.withTracer(testTracer),
      );
    });

    await Effect.runPromise(program);

    const outerSpan = capturedSpans.find(
      (span) => span.name === "test.auth.flow",
    );
    const authSpan = capturedSpans.find((span) => span.name === "auth.sendOtp");
    const emailSpan = capturedSpans.find(
      (span) =>
        span.name === "email.console.send" || span.name === "email.resend.send",
    );

    expect(outerSpan).toBeDefined();
    expect(authSpan).toBeDefined();
    expect(emailSpan).toBeDefined();

    if (!outerSpan || !authSpan || !emailSpan) {
      throw new Error("Expected outer, auth, and email spans to be captured");
    }

    expect(authSpan.parentRef).toBe(outerSpan.spanRef);
    expect(emailSpan.parentRef).toBe(authSpan.spanRef);
  });
});
